<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Notícias</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="buscarNoticias" :disabled="carregando">
            <ion-icon :icon="refreshOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="carregando" class="loading">🔄 Carregando notícias...</div>
      <div v-if="erro" class="error">❌ {{ erro }}</div>

      <ion-list v-if="tweets.length">
        <ion-card v-for="tweet in tweets" :key="tweet.id">
          <ion-card-header>
            <ion-card-title>@{{ tweet.user }}</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>{{ tweet.text }}</p>
            <ion-button expand="full" fill="outline" color="primary" :href="tweet.link" target="_blank">
              Ver no Twitter
            </ion-button>
          </ion-card-content>
        </ion-card>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon, IonButtons } from "@ionic/vue";
import { refreshOutline } from "ionicons/icons";
import { useTwitter } from "@/composables/useTwitter";

const { tweets, carregando, erro, buscarNoticias } = useTwitter();

onMounted(() => {
  buscarNoticias();
});
</script>

<style scoped>
.loading {
  text-align: center;
  font-size: 1.2rem;
  padding: 10px;
  color: #007bff;
}

.error {
  text-align: center;
  color: red;
  font-size: 1.2rem;
  padding: 10px;
}
</style>
