import { ref } from "vue";
import { Geolocation, type Position, type GeolocationOptions } from "@capacitor/geolocation";

export function useGeolocation() {
  const error = ref<string | null>(null);

  type FullGeolocationOptions = GeolocationOptions & {
    maximumAge?: number;
  };

  const defaultOptions: FullGeolocationOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 3000
  };

  const getCurrentPosition = async (options: FullGeolocationOptions = defaultOptions) => {
    try {
      const position = await Geolocation.getCurrentPosition(options);
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: position.timestamp
      };
    } catch (err) {
      error.value = `Erro ao obter localização: ${err instanceof Error ? err.message : String(err)}`;
      console.error(error.value);
      throw err;
    }
  };

  return {
    getCurrentPosition,
    error
  };
}