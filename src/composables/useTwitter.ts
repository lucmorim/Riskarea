import { ref } from "vue";
import { usePostRequest } from "@/composables/useApi"; // Ou ajuste para seu método de requisição

const tweets = ref<any[]>([]);
const carregando = ref(false);
const erro = ref("");

export function useTwitter() {
  async function buscarNoticias() {
    carregando.value = true;
    erro.value = "";

    try {
      // ⚠️ Troque a URL pela API que você usará para buscar tweets
      const response = await usePostRequest("/get-twitter-news", { pages: ["page1", "page2"] });

      if (response?.data) {
        tweets.value = response.data;
      } else {
        erro.value = "Nenhuma notícia encontrada.";
      }
    } catch (e) {
      console.error("Erro ao buscar notícias:", e);
      erro.value = "Falha ao carregar notícias.";
    } finally {
      carregando.value = false;
    }
  }

  return { tweets, carregando, erro, buscarNoticias };
}
