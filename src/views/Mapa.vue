<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Mapa</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <Toast ref="toastRef" />
      <div v-if="carregando" class="loading">📍 Obtendo localização...</div>
      <div id="map" class="map-container"></div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from "vue";
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from "@ionic/vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useGeolocation } from "@/composables/useGeolocation";
import { usePostRequest } from "@/composables/useApi";
import Toast from "@/components/Toast.vue";

const map = ref<L.Map>();
const carregando = ref(true);
const toastRef = ref<any>();
const userMarker = ref<L.Marker>();
const polygonsLayer = ref<L.LayerGroup>();
const ultimaPosicao = ref<{ lat: number; lng: number }>({ lat: 0, lng: 0 });
const ultimaRequisicao = ref<{ lat: number; lng: number }>({ lat: 0, lng: 0 });
const polygonsCarregados = ref<Set<string>>(new Set()); // Evita carregamento repetido

const { latitude, longitude, startWatching } = useGeolocation();

onMounted(async () => {
  console.log("RiskArea");
  await nextTick();
  await startWatching();
  await inicializarMapa();
});

// ✅ Inicializa o mapa
function inicializarMapa() {
  const mapElement = document.getElementById("map");
  if (!mapElement) {
    console.error("❌ ERRO: Elemento #map não encontrado!");
    return;
  }

  if (!map.value) {
    console.log("✅ Criando mapa...");
    map.value = L.map("map", {
      center: [-22.9068, -43.1729]
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors"
    }).addTo(map.value);

    polygonsLayer.value = L.layerGroup().addTo(map.value);
  } else {
    console.log("⚠️ Mapa já estava inicializado!");
  }
}

// ✅ Atualiza a posição do usuário e adiciona o marcador **(Evita loop)**
watch([latitude, longitude], async ([lat, lng]) => {
  if (lat && lng && map.value) {
    console.log(`📍 Atualizando posição: ${lat}, ${lng}`);

    if (ultimaPosicao.value.lat === lat && ultimaPosicao.value.lng === lng) {
      console.log("⏭️ Ignorando atualização repetida...");
      return;
    }

    ultimaPosicao.value = { lat, lng };
    carregando.value = false;

    map.value.setView([lat, lng], 15);

    if (userMarker.value) {
      map.value.removeLayer(userMarker.value);
    }

    userMarker.value = L.marker([lat, lng], {
      icon: L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/535/535239.png",
        iconSize: [32, 32]
      })
    })
      .addTo(map.value)
      .bindPopup("📍 Você está aqui")
      .openPopup();

    // 🚀 Buscar e exibir polígonos **(Evita requisições repetidas)**
    await carregarPoligonos(lat, lng);
  }
});

// ✅ Função para buscar e exibir polígonos no mapa
async function carregarPoligonos(latitude: number, longitude: number) {
  try {
    // 🛑 Evita requisições se a posição mudou pouco (menos de 100m)
    const distancia = calcularDistancia(ultimaRequisicao.value.lat, ultimaRequisicao.value.lng, latitude, longitude);
    if (distancia < 0.1) {
      console.log(`⏭️ Ignorando carregamento de polígonos - distância de apenas ${distancia.toFixed(3)} km.`);
      return;
    }
    ultimaRequisicao.value = { lat: latitude, lng: longitude };

    const response = await usePostRequest("/get-polygons", { latitude, longitude });

    if (!response?.polygons || response.polygons.length === 0) {
      toastRef.value?.mostrarToast?.("⚠️ Nenhum polígono encontrado!", "warning");
      return;
    }

    toastRef.value?.mostrarToast?.(`📌 ${response.polygons.length} polígonos carregados!`, "success");

    // Limpa camada anterior de polígonos
    if (polygonsLayer.value) {
      polygonsLayer.value.clearLayers();
    }

    let boundsArray: L.LatLngExpression[] = [];

    response.polygons.forEach((area: any) => {
      if (polygonsCarregados.value.has(area.id)) {
        console.log(`⏭️ Polígono ${area.nome} já carregado, ignorando...`);
        return;
      }

      console.log("Adicionando área:", area.nome);
      polygonsCarregados.value.add(area.id);

      const coordenadasConvertidas: [number, number][] = area.geometria.coordinates[0].map(
        ([lng, lat]: [number, number]) => [lat, lng]
      );

      const poligono = L.polygon(coordenadasConvertidas, {
        color: "red",
        fillColor: "red",
        fillOpacity: 0.4
      }).addTo(polygonsLayer.value!).bindPopup(`🔴 Área de Risco: ${area.nome}`);

      boundsArray = [...boundsArray, ...coordenadasConvertidas];
    });

    if (boundsArray.length > 0) {
      const bounds = L.latLngBounds(boundsArray);
      map.value!.fitBounds(bounds);
    }
  } catch (error) {
    console.error("❌ Erro ao buscar polígonos:", error);
    toastRef.value?.mostrarToast?.("❌ Erro ao carregar polígonos!", "danger");
  }
}

// ✅ Função para calcular distância entre dois pontos (Haversine Formula)
function calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distância em km
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
