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

const { 
  initializeAdMob, 
  showInterstitial,
  setupForegroundService,
  AD_INTERVAL
} = useNotification();

const adInterval = ref<NodeJS.Timeout>();
const { requestPermissions } = useNotification();
const { startWatching } = useRiskWatcher();

onMounted(async () => { 
  const aceitou = await useTermosAceitos();
  if (!aceitou) return;
  await initializeAdMob();
  await requestPermissions();
  await setupForegroundService();

  startWatching();
  
  adInterval.value = setInterval(showInterstitial, AD_INTERVAL);
  
  setTimeout(showInterstitial, 5000);
});

onBeforeUnmount(() => {
  if (adInterval.value) {
    clearInterval(adInterval.value);
  }
});
</script>