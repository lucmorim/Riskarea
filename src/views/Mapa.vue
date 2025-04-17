<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <Toast ref="toastRef" />
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

// Variáveis reativas
const carregando = ref(true);
const toastRef = ref<any>();

// Composables
const { createNotificationChannel } = useNotification();
const { latitude, longitude, startWatching, stopWatching } = useGeolocation();
const { initializeMap, updatePosition, clearMap, polygonsLayer } = useMap();

// Carrega polígonos de risco
const carregarPoligonos = async (lat: number, lng: number) => {
  try {
    const response = await usePostRequest("/get-polygons", { latitude: lat, longitude: lng });
    
    if (!response?.polygons?.length) return;

    polygonsLayer.value?.clearLayers();

    response.polygons.forEach((area: any) => {
      const coords = area.geometria.coordinates[0].map(([lng, lat]: [number, number]) => [lat, lng]);      
      // Agora usando L importado corretamente
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

// Ciclo de vida do componente
onMounted(async () => {
  await createNotificationChannel();
  
  initializeMap("map");
  
  const stopWatch = watch([latitude, longitude], ([lat, lng]) => {
    if (lat && lng) {
      carregando.value = false;
      updatePosition(lat, lng);
      carregarPoligonos(lat, lng);
    }
  });

  try {
    await startWatching({
      enableHighAccuracy: true,
      timeout: 15000
    });
  } catch (err) {
    // Tratar erro de inicialização
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