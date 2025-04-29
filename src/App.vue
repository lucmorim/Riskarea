<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { useNotification } from '@/composables/useNotification';
import { useRiskWatcher } from '@/composables/useRiskWatcher';
import { useTermosAceitos } from '@/composables/useTermosAceitos';
import { useForegroundService } from '@/composables/useForegroundService';

const { initializeAdMob, showInterstitial, AD_INTERVAL } = useNotification();
const { startWatching } = useRiskWatcher();
const { createNotificationChannel, startForegroundService } = useForegroundService();

const adInterval = ref<NodeJS.Timeout>();

onMounted(async () => {
  const aceitou = await useTermosAceitos();
  if (!aceitou) return;

  try {
    await createNotificationChannel({
      id: 'riskarea_channel',
      name: 'Monitoramento',
      description: 'Canal para monitoramento de áreas de risco',
      importance: 4,
    });

    await startForegroundService({
      title: 'Monitoramento Ativo',
      body: 'Verificando áreas de risco...',
      channelId: 'riskarea_channel',
    });

    await initializeAdMob();
    await startWatching(); // <<< Apenas chama isso UMA VEZ, e o resto o useRiskWatcher resolve
    adInterval.value = setInterval(showInterstitial, AD_INTERVAL);
    setTimeout(showInterstitial, 5000);

    console.log('🚀 App inicializado com sucesso.');
  } catch (error) {
    console.error('❌ Erro ao iniciar serviços:', error);
  }
});

onBeforeUnmount(() => {
  if (adInterval.value) {
    clearInterval(adInterval.value);
  }
});
</script>
