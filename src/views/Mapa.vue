<template>
  <ion-page>
    <!-- <ion-header>
      <ion-toolbar>
        <ion-title>Mapa</ion-title>
      </ion-toolbar>
    </ion-header> -->

    <ion-content :fullscreen="true">
      <Toast ref="toastRef" />
      <div v-if="carregando" class="loading">📍 Obtendo localização...</div>
      <div id="map" class="map-container"></div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, onActivated, nextTick } from "vue";
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from "@ionic/vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useGeolocation } from "@/composables/useGeolocation";
import { usePostRequest } from "@/composables/useApi";
import { useNotification } from "@/composables/useNotification";
import { ForegroundService } from '@capawesome-team/capacitor-android-foreground-service';
import Toast from "@/components/Toast.vue";

const map = ref<L.Map>(); // Mapa
const carregando = ref(true);
const toastRef = ref<any>();
const userMarker = ref<L.Marker>();
const polygonsLayer = ref<L.LayerGroup>(); // Camada para polígonos
const ultimaAreaNotificada = ref<string>("");

const { sendNotification, requestPermissions, createNotificationChannel, listenNotificationEvents } = useNotification();
const { latitude, longitude, startWatching } = useGeolocation();

const startForegroundService =  async () => {
  console.log("foreground")
  await ForegroundService.startForegroundService({
    id: 1,
    title: 'Riskarea',
    body: 'Body',
    smallIcon: 'ic_stat_icon_config_sample',
    buttons: [
      {
        title: 'Button 1',
        id: 1
      }
    ],
    silent: false,
    notificationChannelId: 'default',
  })
}

// const updateForegroundService = async () => {
//   await ForegroundService.updateForegroundService({
//     id: 1,
//     title: 'Title',
//     body: 'Body',
//     smallIcon: 'ic_stat_icon_config_sample',
//   });
// };

// const stopForegroundService = async () => {
//   await ForegroundService.stopForegroundService();
// };


// const deleteNotificationChannel = async () => {
//   await ForegroundService.deleteNotificationChannel({
//     id: 'default',
//   });
// };

const createNotificationChannel2 = async () => {
  await ForegroundService.createNotificationChannel({
    id: 'default',
    name: 'Default',
    description: 'Default channel',
    importance: 1,
  });
};

onMounted(async () => {
  console.log("📍 Iniciando Mapa...");
  await createNotificationChannel2
  await nextTick();
  await createNotificationChannel();
  await requestPermissions();
  await listenNotificationEvents(); // 🔥 Adicionando ouvintes
  await startWatching();
  setTimeout(() => {
    inicializarMapa();
  }, 500); 
  startForegroundService();
});

onActivated(() => {
  console.log("🟢 Aba do mapa ativada");
  setTimeout(() => {
    if (!map.value) {
      console.log("🔄 Reinicializando mapa...");
      inicializarMapa();
    } else {
      // Atualiza a posição atual para garantir que o usuário seja centralizado corretamente
      if (latitude.value && longitude.value) {
        map.value.setView([latitude.value, longitude.value], 15);
      }
    }
  }, 300);
});

// 🚀 Remove o mapa da DOM ao sair da aba para evitar problemas
onBeforeUnmount(() => {
  if (map.value) {
    map.value.remove();
    map.value = undefined;
  }
});

// ✅ Inicializa o mapa corretamente
function inicializarMapa() {
  if (!document.getElementById("map")) {
    console.error("❌ ERRO: Elemento #map não encontrado!");
    return;
  }

  console.log("✅ Criando novo mapa...");
  map.value = L.map("map", {
    center: [-22.9068, -43.1729], // 📍 Posição padrão
    zoom: 13,
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map.value);

  polygonsLayer.value = L.layerGroup().addTo(map.value);

  // Se já temos uma localização válida, move o mapa para lá
  if (latitude.value && longitude.value) {
    map.value.setView([latitude.value, longitude.value], 15);
    adicionarMarcador(latitude.value, longitude.value);
    carregarPoligonos(latitude.value, longitude.value);
  }
}

// ✅ Adiciona o marcador da localização do usuário
function adicionarMarcador(lat: number, lng: number) {
  if (!map.value) return;

  if (userMarker.value) {
    userMarker.value.setLatLng([lat, lng]);
  } else {
    userMarker.value = L.marker([lat, lng], {
      icon: L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/535/535239.png",
        iconSize: [32, 32],
      }),
    })
      .addTo(map.value)
      .bindPopup("📍 Você está aqui")
      .openPopup();
  }
}

// ✅ Atualiza a posição do usuário e adiciona o marcador
watch([latitude, longitude], async ([lat, lng]) => {
  if (!lat || !lng || !map.value) return;

  console.log(`📍 Atualizando posição: ${lat}, ${lng}`);
  carregando.value = false;

  map.value.setView([lat, lng], 15);
  adicionarMarcador(lat, lng);
  await verificarRisco(lat, lng);
});

// ✅ Verifica se o usuário está dentro de uma área de risco
async function verificarRisco(latitude: number, longitude: number) {
  try {
    console.log("🔍 Verificando risco...");
    const response = await usePostRequest("/check-risk-area", { latitude, longitude });

    if (!response?.alert) return;

    const mensagem = response.menssage || "Área de risco detectada!";
    console.log(`🚨 ALERTA: ${mensagem}`);

    if (ultimaAreaNotificada.value !== mensagem) {
      sendNotification(`🚨 Atenção! ${mensagem}`);
      ultimaAreaNotificada.value = mensagem;
    }

    await carregarPoligonos(latitude, longitude);
  } catch (error) {
    console.error("❌ Erro ao verificar risco:", error);
  }
}

// ✅ Busca e exibe polígonos no mapa
async function carregarPoligonos(latitude: number, longitude: number) {
  try {
    console.log("📡 Carregando polígonos...");
    const response = await usePostRequest("/get-polygons", { latitude, longitude });

    if (!response?.polygons || response.polygons.length === 0) return;

    polygonsLayer.value?.clearLayers();

    response.polygons.forEach((area: any) => {
      console.log(`📌 Adicionando polígono: ${area.nome}`);

      const coordenadasConvertidas = area.geometria.coordinates[0].map(([lng, lat]: [number, number]) => [lat, lng]);

      L.polygon(coordenadasConvertidas, {
        color: "red",
        fillColor: "red",
        fillOpacity: 0.4,
      })
        .addTo(polygonsLayer.value!)
        .bindPopup(`🔴 Área de Risco: ${area.nome}`);
    });
  } catch (error) {
    console.error("❌ Erro ao carregar polígonos:", error);
  }
}
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100vh;
}

/* Estilização do texto de carregamento */
.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.2rem;
  color: #007bff;
  background: rgba(255, 255, 255, 0.9);
  padding: 10px;
  border-radius: 8px;
}
</style>
