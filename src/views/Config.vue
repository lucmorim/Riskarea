<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="about-container">
        <div class="about-card">
          <p class="small-text2">
            As áreas indicadas neste aplicativo foram demarcadas com base em informações públicas disponíveis na
            internet e, portanto, podem não refletir com exatidão os limites reais ou estar completamente atualizadas.
            Não fazemos distinção entre facções, grupos criminosos ou milícias: todos os locais são apresentados de
            forma genérica e imparcial. Utilize esses dados apenas como referência e adote sempre medidas de segurança
            adicionais ao se deslocar.
          </p>

          <p class="small-text2">Para ficar por dentro das atualizações e novidades:</p>

          <ion-button expand="block" color="success" @click="openWhatsAppChannel" class="whatsapp-button">
            <ion-icon :icon="logoWhatsapp" slot="start"></ion-icon>
            Entrar no Canal do WhatsApp
          </ion-button>

          <p class="small-text">Sua experiência e feedback são importantes para melhorarmos o aplicativo.</p>
        </div>

        <div class="about-card">
          <p class="small-text2">
            Clique no botão abaixo para iniciar o rastreamento e ser avisado sempre que estiver próximo de uma área
            considerada de risco. Você pode pausar o rastreamento a qualquer momento. </p>
          <!-- 🔥 Botão de controle (Start/Stop) -->
          <ion-button expand="block" :color="isTracking ? 'danger' : 'success'" @click="toggleTracking"
            class="tracking-button">
            <ion-icon :icon="isTracking ? pause : play" slot="start"></ion-icon>
            {{ isTracking ? 'Parar Rastreamento' : 'Iniciar Rastreamento' }}
          </ion-button>
        </div>

        <div class="version-info">
          <p>Versão: 1.2.8</p>
          <p>© 2025 RiskAlert Team</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonContent, IonButton, IonIcon } from '@ionic/vue';
import { logoWhatsapp, play, pause } from 'ionicons/icons';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { onMounted, ref } from 'vue';

// Acesso ao plugin RiskOverlay
const RiskOverlay = (Capacitor as any).Plugins.RiskOverlay;

// Estado se está rastreando ou não
const isTracking = ref(false);

// Função de abrir canal do WhatsApp
const openWhatsAppChannel = async () => {
  try {
    await Browser.open({
      url: 'https://whatsapp.com/channel/0029Vb6XONJ4CrfYx74jaR3H',
      presentationStyle: 'popover'
    });
  } catch {
    window.open('https://whatsapp.com/channel/0029Vb6XONJ4CrfYx74jaR3H', '_blank');
  }
};

// Start/Stop do rastreamento
const toggleTracking = async () => {
  try {
    if (isTracking.value) {
      await RiskOverlay.stopTracking();
      isTracking.value = false;
    } else {
      await RiskOverlay.startTracking();
      isTracking.value = true;
    }
  } catch (err) {
    console.error('Erro ao controlar rastreamento:', err);
  }
};

onMounted(async () => {
  try {
    const result = await RiskOverlay.isTracking();
    isTracking.value = result.running;
  } catch (e) {
    console.error('Erro ao verificar se está rastreando:', e);
  }
});

</script>

<style scoped>
.about-container {
  max-width: 800px;
  margin: calc(env(safe-area-inset-top) + 18px) auto 0 auto;
  text-align: center;
}

.about-card {
  background: var(--ion-color-light);
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

p {
  color: var(--ion-color-dark);
  line-height: 1.6;
  margin-bottom: 15px;
}

.small-text {
  font-size: 0.9em;
  margin-top: 20px;
}

.small-text2 {
  font-size: 0.9em;
  margin-top: 20px;
}

.whatsapp-button {
  margin: 20px 0;
  --background: #25D366;
  --background-activated: #128C7E;
  --background-hover: #128C7E;
}

.tracking-button {
  margin: 10px 0;
  --background: var(--ion-color-success);
}

.tracking-button.ion-color-danger {
  --background: var(--ion-color-danger);
}

.version-info {
  margin-top: 30px;
  color: var(--ion-color-medium);
  font-size: 0.9em;
}
</style>
