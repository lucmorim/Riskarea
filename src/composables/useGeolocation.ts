import { ref, onUnmounted } from "vue";
import { Geolocation, type Position, type GeolocationOptions } from "@capacitor/geolocation";

export function useGeolocation() {
  const latitude = ref<number | null>(null);
  const longitude = ref<number | null>(null);
  const error = ref<string | null>(null);
  const isActive = ref(false);
  
  let watchId: string | null = null;
  let intervalId: NodeJS.Timeout | null = null;

  // Definindo o tipo completo para as opções
  type FullGeolocationOptions = GeolocationOptions & {
    maximumAge?: number;
  };

  const defaultOptions: FullGeolocationOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 3000
  };

  // Função para atualizar posição
  const updatePosition = (coords: Position['coords']) => {
    latitude.value = coords.latitude;
    longitude.value = coords.longitude;
    error.value = null;
  };

  const getCurrentPosition = async (options: FullGeolocationOptions = defaultOptions) => {
    try {
      const position = await Geolocation.getCurrentPosition(options);
      updatePosition(position.coords);
      return position.coords;
    } catch (err) {
      error.value = `Erro ao obter localização: ${err instanceof Error ? err.message : String(err)}`;
      console.error(error.value);
      throw err;
    }
  };

  const startWatching = async (options: FullGeolocationOptions = defaultOptions) => {
    stopWatching();

    try {
      await getCurrentPosition(options);
      
      watchId = await Geolocation.watchPosition(options, (position, err) => {
        if (err) {
          error.value = `Erro no monitoramento: ${err instanceof Error ? err.message : String(err)}`;
          console.error(error.value);
          return;
        }
        if (position) {
          updatePosition(position.coords);
        }
      });

      intervalId = setInterval(async () => {
        try {
          await getCurrentPosition(options);
        } catch (err) {
          console.error("Erro no fallback interval:", err instanceof Error ? err.message : String(err));
        }
      }, 3000);

      isActive.value = true;
      
    } catch (err) {
      error.value = `Erro ao iniciar monitoramento: ${err instanceof Error ? err.message : String(err)}`;
      console.error(error.value);
      throw err;
    }
  };

  const stopWatching = () => {
    if (watchId) {
      Geolocation.clearWatch({ id: watchId });
      watchId = null;
    }
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    isActive.value = false;
  };

  onUnmounted(stopWatching);

  return {
    latitude,
    longitude,
    error,
    isActive,
    getCurrentPosition,
    startWatching,
    stopWatching
  };
}