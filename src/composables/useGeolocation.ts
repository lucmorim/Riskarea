import { ref, onMounted, onUnmounted } from "vue";
import { Geolocation } from "@capacitor/geolocation";

const latitude = ref<number | null>(null);
const longitude = ref<number | null>(null);
let watchId: string | null = null;
let intervalId: NodeJS.Timeout | null = null; // Loop para atualizar a cada 2s

export function useGeolocation() {
  
  async function startWatching() {
    stopWatching(); // Evita múltiplas execuções

    watchId = await Geolocation.watchPosition(
      { enableHighAccuracy: true },
      async (position, err) => {
        if (err) {
          console.error("❌ Erro ao obter geolocalização:", err);
          return;
        }

        if (position) {
          latitude.value = position.coords.latitude;
          longitude.value = position.coords.longitude;
          console.log(`📍 Nova localização detectada: ${latitude.value}, ${longitude.value}`);
        }
      }
    );

    // 🚀 Atualiza manualmente a localização a cada 2 segundos
    intervalId = setInterval(async () => {
      try {
        const position = await Geolocation.getCurrentPosition();
        latitude.value = position.coords.latitude;
        longitude.value = position.coords.longitude;
        console.log(`⏳ Atualização manual: ${latitude.value}, ${longitude.value}`);
      } catch (error) {
        console.error("❌ Erro ao atualizar posição manualmente:", error);
      }
    }, 3000);
  }

  function stopWatching() {
    if (watchId) {
      Geolocation.clearWatch({ id: watchId });
      watchId = null;
    }
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  onMounted(startWatching);
  onUnmounted(stopWatching);

  return {
    latitude,
    longitude,
    startWatching,
    stopWatching,
  };
}
