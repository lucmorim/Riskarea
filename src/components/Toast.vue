<template>
    <ion-toast
      :is-open="isOpen"
      :message="mensagem"
      :color="cor"
      duration="2000"
      position="top"
      @didDismiss="isOpen = false"
    />
  </template>
  
  <script setup lang="ts">
  import { ref } from "vue";
  import { IonToast } from "@ionic/vue";
  
  const isOpen = ref(false);
  const mensagem = ref("");
  const cor = ref("success");
  
  // ✅ Função para abrir o Toast
  function mostrarToast(msg: string, tipo: "success" | "danger" | "warning" | "primary") {
    mensagem.value = msg;
    cor.value = tipo;
    isOpen.value = true;
  }
  
  defineExpose({ mostrarToast }); // 🔥 Permite chamar a função de fora
  </script>
  