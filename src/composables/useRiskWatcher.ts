// src/composables/useRiskWatcher.ts
import { ref, onUnmounted } from 'vue';
import { Geolocation } from '@capacitor/geolocation';
import { usePostRequest } from './useApi';
import { useNotification } from './useNotification';
import { useTermosAceitos } from '@/composables/useTermosAceitos';

const WATCH_INTERVAL = 20000; // 20 segundos

export function useRiskWatcher() {
  const { sendNotification, createNotificationChannel } = useNotification();
  const isWatching = ref(false);
  const lastNotifiedArea = ref<string | null>(null); // Armazena APENAS a última área
  
  let watchInterval: NodeJS.Timeout | null = null;

  // Verificação principal
  const checkRiskArea = async () => {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      const response = await usePostRequest('/check-risk-area', {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });

      if (response?.alert && response.area) {
        // Notifica APENAS se a área for diferente da última
        console.log('last '+lastNotifiedArea.value);
        console.log('response '+response.area);
        if (lastNotifiedArea.value != response.area) {
          console.warn("passou")
          await sendNotification(response.menssage || `Nova área de risco: ${response.area}`);
          lastNotifiedArea.value = response.area; // Atualiza o registro
          console.log('🔔 Notificação enviada para:', response.area);
        } else {
          console.log('🚫 Área repetida:', response.area);
        }
      }
    } catch (error) {
      console.error('Erro na verificação:', error);
    }
  };

  // Inicia o monitoramento
  const startWatching = async () => {
    const aceitou = await useTermosAceitos();
    if (!aceitou) {
      console.warn("❌ Termos ainda não aceitos. Monitoramento não iniciado.");
      return;
    }
    if (isWatching.value) return;
    
    await createNotificationChannel();
    isWatching.value = true;
    lastNotifiedArea.value = null; // Reseta ao iniciar
    
    // Primeira verificação imediata
    await checkRiskArea();
    
    // Configura intervalo
    watchInterval = setInterval(checkRiskArea, WATCH_INTERVAL);
    console.log('🛰️ Monitoramento iniciado');
  };

  // Para o monitoramento
  const stopWatching = () => {
    if (!isWatching.value) return;
    
    if (watchInterval) {
      clearInterval(watchInterval);
      watchInterval = null;
    }
    
    isWatching.value = false;
    console.log('🛑 Monitoramento parado');
  };

  // Limpeza automática
  onUnmounted(stopWatching);

  return {
    startWatching,
    stopWatching,
    isWatching,
    lastNotifiedArea // Opcional: expor para debug
  };
}