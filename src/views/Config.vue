<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Sobre o App</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="about-container">
        <h2>RiskArea Alert</h2>
        <div class="about-card">
          <p>Este aplicativo tem o objetivo de monitorar sua localização em segundo plano e alertar quando você se
            aproximar de áreas consideradas de risco.</p>

          <p>As notificações de alerta são disparadas periodicamente para manter você informado sobre sua segurança.</p>

          <p class="highlight">🚀 Estamos em constante evolução!</p>

          <p>Para ficar por dentro das atualizações e novidades:</p>

          <ion-button expand="block" color="success" @click="openWhatsAppChannel" class="whatsapp-button">
            <ion-icon :icon="logoWhatsapp" slot="start"></ion-icon>
            Entrar no Canal do WhatsApp
          </ion-button>

          <p class="small-text">Sua experiência e feedback são importantes para melhorarmos o aplicativo.</p>
        </div>

        <div class="version-info">
          <p>Versão: 1.2.1</p>
          <p>© 2025 RiskArea Team</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonIcon
} from '@ionic/vue';
import { logoWhatsapp } from 'ionicons/icons';
import { Browser } from '@capacitor/browser';

const openWhatsAppChannel = async () => {
  try {
    await Browser.open({
      url: 'https://whatsapp.com/channel/0029Vb6XONJ4CrfYx74jaR3H',
      presentationStyle: 'popover'
    });
  } catch (error) {
    console.error('Erro ao abrir o WhatsApp:', error);
    // Fallback para web caso o app não esteja instalado
    window.open('https://whatsapp.com/channel/0029Vb6XONJ4CrfYx74jaR3H', '_blank');
  }
};
</script>

<style scoped>
.about-container {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.about-card {
  background: var(--ion-color-light);
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

h2 {
  color: var(--ion-color-primary);
  font-size: 1.8em;
  margin-bottom: 10px;
}

p {
  color: var(--ion-color-dark);
  line-height: 1.6;
  margin-bottom: 15px;
}

.highlight {
  color: var(--ion-color-danger);
  font-weight: bold;
  margin: 20px 0;
}

.small-text {
  font-size: 0.9em;
  margin-top: 20px;
}

.whatsapp-button {
  margin: 20px 0;
  --background: #25D366;
  --background-activated: #128C7E;
  --background-hover: #128C7E;
}

.version-info {
  margin-top: 30px;
  color: var(--ion-color-medium);
  font-size: 0.9em;
}
</style>