import { ref, watch } from "vue";
import { usePostRequest } from "@/composables/useApi";
import { useGeolocation } from "@/composables/useGeolocation";
import { sendNotification } from "@/composables/useNotification";

const emRisco = ref(false);
const areasAtuais = ref<string[]>([]);
const ultimaAreaNotificada = ref<string | null>(null);
const { latitude, longitude, startWatching } = useGeolocation();

export function useRiskWatcher() {
  async function verificarRisco() {
    if (!latitude.value || !longitude.value) return;

    try {
      const response = await usePostRequest("/check-risk-area", {
        latitude: latitude.value,
        longitude: longitude.value,
      });

      if (!response?.alert || response.areas.length === 0) {
        emRisco.value = false;
        areasAtuais.value = [];
        return;
      }

      // 🔥 Obtém o nome da área de risco
      const novasAreas = response.areas.map((area: any) => area.name);

      // 🚨 Notificar apenas se for uma nova área de risco
      if (novasAreas.toString() !== areasAtuais.value.toString()) {
        areasAtuais.value = novasAreas;
        emRisco.value = true;

        // 🔥 Dispara notificação apenas se for uma nova área e ainda não foi notificada
        if (ultimaAreaNotificada.value !== novasAreas.join(", ")) {
          sendNotification(novasAreas.join(", "));
          ultimaAreaNotificada.value = novasAreas.join(", ");
        }
      }
    } catch (error) {
      console.error("❌ Erro ao verificar risco:", error);
    }
  }

  // 🔥 Monitora a localização e verifica riscos
  watch([latitude, longitude], () => {
    verificarRisco();
  });

  return { emRisco, startWatching };
}
