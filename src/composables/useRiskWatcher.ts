import { ref, watch } from "vue";
import { usePostRequest } from "@/composables/useApi";
import { useGeolocation } from "@/composables/useGeolocation";
import { useNotification } from "@/composables/useNotification";

const { sendNotification } = useNotification();

const emRisco = ref(false);
const ultimaMensagem = ref<string>(""); // Para evitar repetição de alerta
const { latitude, longitude, startWatching } = useGeolocation();

export function useRiskWatcher() {
  async function verificarRisco() {
    if (!latitude.value || !longitude.value) return;

    try {
      const response = await usePostRequest("/check-risk-area", {
        latitude: latitude.value,
        longitude: longitude.value,
      });

      if (response?.alert) {
        const mensagem = response.menssage || "Área de risco detectada!";
        
        if (mensagem !== ultimaMensagem.value) {
          sendNotification(`⚠️ ${mensagem}`);
          ultimaMensagem.value = mensagem;
        }
        
        emRisco.value = true;
      } else {
        emRisco.value = false;
      }
    
    } catch (error) {
      console.error("❌ Erro ao verificar risco:", error);
    }
  }

  watch([latitude, longitude], () => {
    verificarRisco();
  });

  return { emRisco, startWatching };
}
