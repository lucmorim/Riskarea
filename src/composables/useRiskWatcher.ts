import { ref, onUnmounted } from 'vue';
import { Geolocation } from '@capacitor/geolocation';
import { usePostRequest } from './useApi';
import { useNotification } from './useNotification';
import { useTermosAceitos } from '@/composables/useTermosAceitos';
import { registerPlugin } from '@capacitor/core';

const WATCH_INTERVAL = 20000; // 20 segundos
interface RiskOverlayPlugin {
  showOverlay(options: { message: string; color?: string; duration?: number }): Promise<void>;
}
const RiskOverlay = registerPlugin<RiskOverlayPlugin>('RiskOverlay');

export function useRiskWatcher() {
  const { sendNotification, createNotificationChannel } = useNotification();
  const isWatching = ref(false);
  const lastNotifiedArea = ref<string | null>(null);
  let timeoutHandler: NodeJS.Timeout | null = null;

  const checkRiskArea = async () => {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      const response = await usePostRequest('/check-risk-area', {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      if (response?.alert && response.area) {
        if (lastNotifiedArea.value !== response.area) {
          const mensagem = response.menssage || `Nova área de risco: ${response.area}`;

          await sendNotification(mensagem);
          lastNotifiedArea.value = response.area;
          console.log('🔔 Notificação enviada para:', response.area);

          // 🔥 Chama o plugin nativo
          await RiskOverlay.showOverlay({
            message: mensagem,
            color: '#e53935',
            duration: 6000
          });

        } else {
          console.log('🚫 Área repetida:', response.area);
        }
      }
    } catch (error) {
      console.error('Erro na verificação:', error);
    }
  };

  const loopRiskArea = async () => {
    await checkRiskArea();
    if (isWatching.value) {
      timeoutHandler = setTimeout(loopRiskArea, WATCH_INTERVAL);
    }
  };

  const startWatching = async () => {
    const aceitou = await useTermosAceitos();
    if (!aceitou) {
      console.warn("❌ Termos ainda não aceitos. Monitoramento não iniciado.");
      return;
    }
    if (isWatching.value) return;

    await createNotificationChannel();
    isWatching.value = true;
    lastNotifiedArea.value = null;

    console.log('🛰️ Monitoramento iniciado');
    await loopRiskArea();
  };

  const stopWatching = () => {
    if (!isWatching.value) return;
    if (timeoutHandler) {
      clearTimeout(timeoutHandler);
      timeoutHandler = null;
    }
    isWatching.value = false;
    console.log('🛑 Monitoramento parado');
  };

  onUnmounted(stopWatching);

  return {
    startWatching,
    stopWatching,
    isWatching,
    lastNotifiedArea,
  };
}
