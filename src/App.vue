<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { useNotification } from '@/composables/useNotification';

const { 
  initializeAdMob, 
  showInterstitial,
  setupForegroundService,
  AD_INTERVAL
} = useNotification();

const adInterval = ref<NodeJS.Timeout>();

onMounted(async () => { 
  await initializeAdMob();
  await setupForegroundService();
  
  adInterval.value = setInterval(showInterstitial, AD_INTERVAL);
  
  setTimeout(showInterstitial, 5000);
});

onBeforeUnmount(() => {
  if (adInterval.value) {
    clearInterval(adInterval.value);
  }
});
</script>