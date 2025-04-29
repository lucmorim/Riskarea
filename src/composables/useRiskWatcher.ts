import { ref, onUnmounted } from 'vue';
import { usePostRequest } from './useApi';
import { useForegroundService } from './useForegroundService';
import { useTermosAceitos } from '@/composables/useTermosAceitos';
import { registerPlugin } from '@capacitor/core';
import { useGeolocation } from './useGeolocation';

const WATCH_INTERVAL = 30000; // 30 segundos
const REPEAT_ALERT_INTERVAL = 10 * 60 * 1000; // 10 minutos

const RiskOverlay = registerPlugin<any>('RiskOverlay');

export function useRiskWatcher() {
  const { getCurrentPosition, error: geoError } = useGeolocation();
  const { 
    startForegroundService, 
    updateForegroundService, 
    stopForegroundService,
    createNotificationChannel
  } = useForegroundService();
  
  const isWatching = ref(false);
  const lastNotificationCoords = ref<{ latitude: number, longitude: number } | null>(null);
  const lastNotificationTime = ref<number>(0);
  let watchTimeout: NodeJS.Timeout | null = null;

  // Função para calcular distância entre duas coordenadas
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Raio da Terra em metros
    const toRad = (x: number) => x * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Retorna distância em metros
  };

  const checkRiskArea = async () => {
    try {
      const location = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      });

      if (!location) {
        console.warn('📍 Localização não disponível');
        return;
      }

      const response = await usePostRequest('/check-risk-area', {
        latitude: location.latitude,
        longitude: location.longitude,
      });

      console.log('🔄 Verificação de área de risco executada.');

      const now = Date.now();
      const timeSinceLastNotification = now - lastNotificationTime.value;

      let movedEnough = false;

      if (lastNotificationCoords.value) {
        const distance = calculateDistance(
          location.latitude, location.longitude,
          lastNotificationCoords.value.latitude, lastNotificationCoords.value.longitude
        );
        console.log('📏 Distância da última notificação:', distance.toFixed(2), 'metros');

        movedEnough = distance > 200; // Só considera mudança se andou mais de 200 metros
      } else {
        movedEnough = true; // Primeira vez permite disparar
      }

      if (response?.alert) {
        const timeExceeded = timeSinceLastNotification > REPEAT_ALERT_INTERVAL; // passou 10min?

        if (movedEnough || timeExceeded) {
          const message = response.menssage || `Área de risco: ${response.area}`;

          await RiskOverlay.showOverlay({
            message,
            color: '#e53935',
            duration: 6000
          });

          lastNotificationCoords.value = {
            latitude: location.latitude,
            longitude: location.longitude
          };
          lastNotificationTime.value = now;

          await updateForegroundService({
            title: 'Monitoramento Ativo',
            body: `Área de risco: ${response.area}`
          });

          console.log('🚨 Overlay disparado:', message);
        } else {
          console.log('ℹ️ Sem mudança relevante, sem disparar overlay.');
        }
      }
    } catch (error) {
      console.error('❌ Erro na verificação de risco:', geoError.value || error);
    }
  };

  const loopRiskArea = async () => {
    await checkRiskArea();
    if (isWatching.value) {
      watchTimeout = setTimeout(loopRiskArea, WATCH_INTERVAL);
    }
  };

  const startWatching = async () => {
    if (isWatching.value) return;

    const aceitou = await useTermosAceitos();
    if (!aceitou) {
      console.warn("❌ Termos não aceitos.");
      return;
    }

    try {
      await createNotificationChannel({
        id: 'riskarea_channel',
        name: 'Monitoramento',
        description: 'Monitorando áreas de risco',
        importance: 4
      });

      await startForegroundService({
        title: 'Monitoramento Ativo',
        body: 'Verificando áreas de risco...',
        channelId: 'riskarea_channel'
      });

      isWatching.value = true;
      lastNotificationCoords.value = null;
      lastNotificationTime.value = 0;

      console.log('🛰️ Iniciando monitoramento de áreas de risco.');

      await loopRiskArea();
      
    } catch (error) {
      console.error("❌ Erro ao iniciar monitoramento:", geoError.value || error);
      stopWatching();
    }
  };

  const stopWatching = () => {
    if (!isWatching.value) return;

    if (watchTimeout) {
      clearTimeout(watchTimeout);
      watchTimeout = null;
    }

    stopForegroundService();
    isWatching.value = false;

    console.log('🛑 Monitoramento parado.');
  };

  onUnmounted(stopWatching);

  return {
    startWatching,
    stopWatching,
    isWatching,
  };
}
