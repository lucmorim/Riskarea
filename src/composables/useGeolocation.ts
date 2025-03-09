import { ref, onMounted, onUnmounted } from "vue";
import { Geolocation, Position } from "@capacitor/geolocation";
// import { usePostRequest } from "@/composables/useApi";
// import { LocalNotifications } from "@capacitor/local-notifications";

const latitude = ref<number | null>(null);
const longitude = ref<number | null>(null);
const watchId = ref<string | null>(null);

export function useGeolocation() {
  // ✅ Função para iniciar a observação da localização do usuário
  async function startWatching() {
    watchId.value = await Geolocation.watchPosition(
      { enableHighAccuracy: true },
      async (position: Position | null, err) => {
        if (err) {
          console.error("❌ Erro ao obter geolocalização:", err);
          return;
        }

        if (position) {
          latitude.value = position.coords.latitude;
          longitude.value = position.coords.longitude;
          console.log(`📍 Nova localização: ${latitude.value}, ${longitude.value}`);

          // 🚀 Verificar se está próximo de uma área de risco
          // await verificarRisco(latitude.value, longitude.value);
        }
      }
    );
  }

  // ✅ Função para parar a observação da localização
  function stopWatching() {
    if (watchId.value) {
      Geolocation.clearWatch({ id: watchId.value });
      watchId.value = null;
    }
  }

  // ✅ Função para verificar se o usuário está dentro de uma área de risco
  // async function verificarRisco(lat: number, lng: number) {
  //   try {
  //     const response = await usePostRequest("/get-polygons", { latitude: lat, longitude: lng });

  //     if (response?.polygons?.length > 0) {
  //       console.log("⚠️ Área de risco detectada!");
  //       await enviarNotificacao("⚠️ Atenção!", "Você está próximo de uma área de risco!", lat, lng);
  //     }
  //   } catch (error) {
  //     console.error("❌ Erro ao buscar áreas de risco:", error);
  //   }
  // }

  // ✅ Função para exibir notificação quando estiver próximo de uma área de risco
  // async function enviarNotificacao(titulo: string, mensagem: string, lat: number, lng: number) {
  //   await LocalNotifications.requestPermissions();

  //   await LocalNotifications.schedule({
  //     notifications: [
  //       {
  //         id: new Date().getTime(),
  //         title: titulo,
  //         body: mensagem,
  //         actionTypeId: "abrir_mapa",
  //         extra: { latitude: lat, longitude: lng },
  //       },
  //     ],
  //   });
  // }

  // ✅ Iniciar e parar a geolocalização quando o composable for montado/desmontado
  onMounted(startWatching);
  onUnmounted(stopWatching);

  return {
    latitude,
    longitude,
    startWatching,
    stopWatching,
  };
}
