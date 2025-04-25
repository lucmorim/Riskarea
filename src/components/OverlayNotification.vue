<template>
    <div
      v-if="visivel"
      class="overlay-notification"
      :style="{ backgroundColor: cor }"
    >
      <span class="overlay-text">{{ mensagem }}</span>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue';
  
  const visivel = ref(false);
  const mensagem = ref('');
  const cor = ref('rgba(255, 0, 0, 0.9)'); // padrão: vermelho
  
  function mostrarOverlay(msg: string, corHex = 'rgba(255, 0, 0, 0.9)', duracao = 5000) {
    mensagem.value = msg;
    cor.value = corHex;
    visivel.value = true;
  
    setTimeout(() => {
      visivel.value = false;
    }, duracao);
  }
  
  defineExpose({ mostrarOverlay });
  </script>
  
  <style scoped>
  .overlay-notification {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-weight: bold;
    font-size: 16px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
    max-width: 90%;
    text-align: center;
  }
  </style>
  