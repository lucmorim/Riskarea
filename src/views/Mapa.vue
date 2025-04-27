<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <Toast ref="toastRef" />

      <div class="search-bar" :style="{ top: searchBarTop }">
        <div class="search-input-container">
          <input v-model="searchQuery" placeholder="Digite um endereço..." @input="buscarSugestoes" />
          <button v-if="searchQuery" @click="limparBusca">✖️</button>
        </div>

        <ul v-if="sugestoes.length" class="sugestoes">
          <li v-for="(item, index) in sugestoes" :key="index" @click="selecionarSugestao(item)">
            <div class="linha-principal">{{ item.address.road || item.address.pedestrian || item.address.neighbourhood
              || 'Local desconhecido' }}</div>
            <div class="linha-secundaria">
              {{ item.address.city || item.address.town || item.address.village || item.address.county || '' }}
              <template v-if="item.address.state"> - {{ item.address.state }}</template>
            </div>
            <div class="linha-secundaria">{{ item.address.country }}</div>
          </li>
        </ul>
      </div>

      <div v-if="carregando" class="loading">📍 Obtendo localização...</div>
      <div id="map" class="map-container"></div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, onUnmounted } from "vue";
import { IonPage, IonContent } from "@ionic/vue";
import { useGeolocation } from "@/composables/useGeolocation";
import { usePostRequest } from "@/composables/useApi";
import { useNotification } from "@/composables/useNotification";
import { useMap } from "@/composables/useMapa";
import L from 'leaflet';
import Toast from "@/components/Toast.vue";
import { useTermosAceitos } from '@/composables/useTermosAceitos';

let debounceTimer: any = null;

// Variáveis reativas
const carregando = ref(true);
const toastRef = ref<any>();
const searchQuery = ref('');
const sugestoes = ref<any[]>([]);
const modoBusca = ref(false);

// Composables
const { createNotificationChannel } = useNotification();
const { latitude, longitude, startWatching, stopWatching } = useGeolocation();
const { initializeMap, updatePosition, clearMap, polygonsLayer } = useMap();

const searchBarTop = ref('50px');

// Carrega polígonos
const carregarPoligonos = async (lat: number, lng: number) => {
  try {
    const response = await usePostRequest("/get-polygons", { latitude: lat, longitude: lng });

    if (!response?.polygons?.length) return;

    polygonsLayer.value?.clearLayers();

    response.polygons.forEach((area: any) => {
      const coords = area.geometria.coordinates[0].map(([lng, lat]: [number, number]) => [lat, lng]);
      L.polygon(coords, {
        color: "red",
        fillColor: "#ff0000",
        fillOpacity: 0.4
      }).addTo(polygonsLayer.value!)
        .bindPopup(`🔴 ${area.nome}`);
    });
  } catch (error) {
    console.error("Erro ao carregar polígonos:", error);
  }
};

const buscarSugestoes = async () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    if (!searchQuery.value.trim()) { // 👈 importante: trim para pegar vazio real
      sugestoes.value = [];
      modoBusca.value = false; // 👈 volta para modo GPS
      return;
    }

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.value)}&addressdetails=1&limit=5`);
      const data = await response.json();
      sugestoes.value = data;
    } catch (error) {
      console.error('Erro ao buscar sugestões:', error);
    }
  }, 500);
};

// Selecionar sugestão
const selecionarSugestao = (item: any) => {
  const lat = parseFloat(item.lat);
  const lon = parseFloat(item.lon);

  modoBusca.value = true;
  carregando.value = false;

  updatePosition(lat, lon);
  carregarPoligonos(lat, lon);

  searchQuery.value = item.display_name; // coloca o endereço bonitinho no input
  sugestoes.value = []; // limpa as sugestões
};

// Limpar busca
const limparBusca = async () => {
  searchQuery.value = '';
  sugestoes.value = [];
  modoBusca.value = false;

  try {
    const position = await navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        carregando.value = false;
        updatePosition(lat, lng);
        carregarPoligonos(lat, lng);
      },
      (err) => {
        console.error("Erro ao pegar localização atual:", err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  } catch (error) {
    console.error('Erro ao tentar pegar localização:', error);
  }
};


let stopWatch: any;

onMounted(async () => {
  const aceitou = await useTermosAceitos();
  if (!aceitou) return;

  await createNotificationChannel();

  initializeMap("map");

  // Move o controle de zoom para baixo
  setTimeout(() => {
    const zoomControl = document.querySelector('.leaflet-control-zoom')?.parentElement as HTMLElement;
    if (zoomControl) {
      zoomControl.classList.remove('leaflet-top');
      zoomControl.classList.add('leaflet-bottom');
      zoomControl.style.top = 'auto';
      zoomControl.style.bottom = '70px';
      zoomControl.style.left = '10px';
      zoomControl.style.zIndex = '1100';
    }
  }, 500);


  stopWatch = watch([latitude, longitude], ([lat, lng]) => {
    if (!modoBusca.value) {
      if (lat && lng) {
        carregando.value = false;
        updatePosition(lat, lng);
        carregarPoligonos(lat, lng);
      }
    }
  });

  try {
    await startWatching({
      enableHighAccuracy: true,
      timeout: 15000
    });
  } catch (err) {
    console.error("Erro no startWatching:", err);
  }

  onBeforeUnmount(() => {
    stopWatch();
    clearMap();
  });
});

onUnmounted(() => {
  stopWatching();
});
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100vh;
  position: relative;
}

.search-bar {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1100;
  width: 90%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.search-input-container {
  width: 100%;
  display: flex;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.search-input-container input {
  padding: 10px;
  font-size: 16px;
  border: none;
  outline: none;
  flex: 1;
}

.search-input-container button {
  background: #f44336;
  border: none;
  color: white;
  padding: 0 15px;
  font-size: 18px;
  cursor: pointer;
}

.sugestoes {
  width: 100%;
  margin-top: 5px;
  list-style: none;
  padding: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  max-height: 300px;
  overflow-y: auto;
}

.sugestoes li {
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
  display: flex;
  flex-direction: column;
  text-align: left;
}

.sugestoes li:last-child {
  border-bottom: none;
}

.sugestoes li:hover {
  background-color: #f9f9f9;
}

.linha-principal {
  font-weight: bold;
}

.linha-secundaria {
  font-size: 0.85rem;
  color: #555;
}

.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.2rem;
  color: #007bff;
  background: rgba(255, 255, 255, 0.9);
  padding: 10px 20px;
  border-radius: 8px;
  z-index: 1000;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}
</style>
