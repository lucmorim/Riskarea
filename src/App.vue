<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { useNotification } from '@/composables/useNotification';
import { useTermosAceitos } from '@/composables/useTermosAceitos';

const { initializeAdMob, showInterstitial, AD_INTERVAL } = useNotification();

const adInterval = ref<NodeJS.Timeout>();

onMounted(async () => {
  const aceitou = await useTermosAceitos();
  if (!aceitou) return;

  try {

    await initializeAdMob();
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
