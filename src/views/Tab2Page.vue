<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Logs</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list>
        <ion-item v-for="(log, index) in logs" :key="index">
          {{ log }}
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { useLog } from "@/composables/useLog";

const { logs, addLog } = useLog();

// Teste para garantir que os logs funcionam
addLog("🛠️ Log de inicialização da Tab2 carregado!");
</script>

<style scoped>
ion-item {
  font-size: 0.9rem;
}
</style>
