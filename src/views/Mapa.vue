<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <Toast ref="toastRef" />

      <div class="search-bar" :style="{ top: searchBarTop }">
        <div class="search-input-container">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchQuery"
            placeholder="Digite um endereço..."
            @input="buscarSugestoes"
          />
          <button v-if="searchQuery" @click="limparBusca">✖️</button>
        </div>

        <div v-if="buscando" class="loading-card">
          <div class="spinner"></div>
          <span>Procurando endereços próximos...</span>
        </div>

        <ul v-if="!buscando && sugestoes.length" class="sugestoes">
          <li
            v-for="(item, index) in sugestoes"
            :key="index"
            class="fade-in"
            @click="selecionarSugestao(item)"
          >
            <div class="linha-principal">
              📍 {{
                item.address.road ||
                item.address.pedestrian ||
                item.address.neighbourhood ||
                'Local desconhecido'
              }}
            </div>
            <div v-if="item.address.neighbourhood" class="linha-secundaria-bairro">
              Bairro: {{ item.address.neighbourhood }}
            </div>
            <div v-if="item.address.postcode" class="linha-secundaria-cep">
              CEP: {{ item.address.postcode }}
            </div>
            <div class="linha-secundaria-cidade">
              {{ item.address.state || '' }}
              <template
                v-if="
                  item.address.state &&
                  (
                    item.address.city ||
                    item.address.town ||
                    item.address.village
                  )
                "
              >
                -
              </template>
              {{
                item.address.city ||
                item.address.town ||
                item.address.village ||
                item.address.county ||
                ''
              }}
            </div>
            <div class="linha-secundaria">
              {{ item.address.country }}
            </div>
          </li>
        </ul>

        <div
          v-if="!buscando && searchQuery && sugestoes.length === 0"
          class="nenhum-resultado"
        >
          Nenhum resultado encontrado.
        </div>
      </div>

      <div v-if="carregando" class="loading">📍 Obtendo localização...</div>
      <div id="map" class="map-container"></div>
      <button class="btn-recentralizar" @click="recentralizarNoUsuario">
        📍
      </button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue"
import { IonPage, IonContent } from "@ionic/vue"
import Toast from "@/components/Toast.vue"
import L from "leaflet"
import { useGeolocation } from "@/composables/useGeolocation"
import { usePostRequest } from "@/composables/useApi"
import { useMap } from "@/composables/useMapa"
import { useTermosAceitos } from "@/composables/useTermosAceitos"

type NominatimResult = {
  lat: string
  lon: string
  display_name: string
  address: {
    road?: string
    pedestrian?: string
    neighbourhood?: string
    city?: string
    town?: string
    village?: string
    county?: string
    state?: string
    postcode?: string
    country?: string
  }
}

const STORAGE_KEY = 'ultima_busca'
let debounceTimer: any = null

const carregando = ref(true)
const buscando = ref(false)
const toastRef = ref<any>()
const searchQuery = ref('')
const sugestoes = ref<NominatimResult[]>([])
const modoBusca = ref(false)
const searchBarTop = ref('50px')

const { getCurrentPosition, error: geoError } = useGeolocation()
const {
  initializeMap,
  updatePosition,
  atualizarMarcadorUsuario,
  clearMap,
  polygonsLayer
} = useMap()

let localizacaoInterval: NodeJS.Timeout | null = null

const carregarPoligonos = async (lat: number, lng: number) => {
  try {
    const response = await usePostRequest("/get-polygons", { latitude: lat, longitude: lng })
    if (!response?.polygons?.length) return

    polygonsLayer.value?.clearLayers()

    response.polygons.forEach((area: any) => {
      const coords = area.geometria.coordinates[0].map(
        ([lng, lat]: [number, number]) => [lat, lng]
      )
      L.polygon(coords, {
        color: "red",
        fillColor: "#ff0000",
        fillOpacity: 0.4
      })
        .addTo(polygonsLayer.value!)
        .bindPopup(`🔴 ${area.nome}`)
    })
  } catch (error) {
    console.error("Erro ao carregar polígonos:", error)
  }
}

const buscarSugestoes = async () => {
  clearTimeout(debounceTimer)
  buscando.value = true

  debounceTimer = setTimeout(async () => {
    if (!searchQuery.value.trim()) {
      sugestoes.value = []
      modoBusca.value = false
      buscando.value = false
      localStorage.removeItem(STORAGE_KEY)
      return
    }

    localStorage.setItem(STORAGE_KEY, searchQuery.value)

    let lat = 0
    let lon = 0

    try {
      const pos = await getCurrentPosition()
      lat = pos.latitude
      lon = pos.longitude
    } catch (err) {
      console.warn("Sem localização, busca global será feita")
    }

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        searchQuery.value
      )}&addressdetails=1&limit=20&viewbox=${lon - 0.1},${lat + 0.1},${lon + 0.1},${lat - 0.1}&bounded=1`
      const data: NominatimResult[] = await fetch(url).then(res => res.json())

      if (lat && lon) {
        data.sort((a, b) => {
          const distA = Math.hypot(lat - +a.lat, lon - +a.lon)
          const distB = Math.hypot(lat - +b.lat, lon - +b.lon)
          return distA - distB
        })
      }

      const textoBusca = searchQuery.value
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()

      sugestoes.value = data.filter(item => {
        const nome = (item.display_name ?? '')
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
          .toLowerCase()
        return nome.includes(textoBusca)
      })
    } catch (error) {
      console.error("Erro ao buscar sugestões:", error)
    } finally {
      buscando.value = false
    }
  }, 300)
}

const selecionarSugestao = (item: NominatimResult) => {
  const lat = parseFloat(item.lat)
  const lon = parseFloat(item.lon)

  modoBusca.value = true
  carregando.value = false

  updatePosition(lat, lon)
  carregarPoligonos(lat, lon)

  searchQuery.value = item.display_name
  sugestoes.value = []
}

const limparBusca = async () => {
  searchQuery.value = ''
  sugestoes.value = []
  modoBusca.value = false
  localStorage.removeItem(STORAGE_KEY)

  try {
    const position = await getCurrentPosition()
    if (position) {
      carregando.value = false
      updatePosition(position.latitude, position.longitude)
      carregarPoligonos(position.latitude, position.longitude)
    }
  } catch (error) {
    console.error("Erro ao tentar pegar localização:", error)
    if (geoError.value) {
      toastRef.value?.show(geoError.value)
    }
  }
}

const recentralizarNoUsuario = async () => {
  try {
    const pos = await getCurrentPosition()
    if (pos) {
      updatePosition(pos.latitude, pos.longitude)
    }
  } catch (e) {
    console.error("Erro ao recentralizar no usuário:", e)
    if (geoError.value) toastRef.value?.show(geoError.value)
  }
}

onMounted(async () => {
  const aceitou = await useTermosAceitos()
  if (!aceitou) return

  initializeMap("map")

  const ultimaBusca = localStorage.getItem(STORAGE_KEY)
  if (ultimaBusca) {
    searchQuery.value = ultimaBusca
    buscarSugestoes()
  }

  setTimeout(() => {
    const zoomControl =
      document.querySelector(".leaflet-control-zoom")?.parentElement as HTMLElement
    if (zoomControl) {
      zoomControl.classList.remove("leaflet-top")
      zoomControl.classList.add("leaflet-bottom")
      zoomControl.style.top = "auto"
      zoomControl.style.bottom = "70px"
      zoomControl.style.left = "10px"
      zoomControl.style.zIndex = "1100"
    }
  }, 500)

  try {
    const position = await getCurrentPosition()
    if (position) {
      carregando.value = false
      updatePosition(position.latitude, position.longitude)
      carregarPoligonos(position.latitude, position.longitude)
    }
  } catch (error) {
    console.error("Erro ao obter localização inicial:", error)
  }

  localizacaoInterval = setInterval(async () => {
    if (!searchQuery.value && !sugestoes.value.length) {
      try {
        const pos = await getCurrentPosition()
        if (pos) {
          atualizarMarcadorUsuario(pos.latitude, pos.longitude)
        }
      } catch (e) {
        console.error("Erro ao atualizar localização periódica:", e)
      }
    }
  }, 15000)
})

onBeforeUnmount(() => {
  if (localizacaoInterval) clearInterval(localizacaoInterval)
  clearMap()
})
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100vh;
  position: relative;
}

.search-bar {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1100;
  width: 90%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.search-input-container {
  width: 100%;
  display: flex;
  align-items: center;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  position: relative;
}

.search-input-container input {
  padding: 10px 10px 10px 35px;
  font-size: 16px;
  border: none;
  outline: none;
  flex: 1;
}

.search-input-container button {
  background: #f44336;
  border: none;
  color: white;
  padding: 0 15px;
  font-size: 18px;
  cursor: pointer;
}

.search-icon {
  position: absolute;
  left: 10px;
  font-size: 18px;
  color: #888;
}

.loading-card {
  width: 100%;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 20px;
  text-align: center;
  color: #555;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 3px solid #ddd;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.nenhum-resultado {
  font-size: 0.85rem;
  color: #999;
  margin-top: 5px;
}

.sugestoes {
  width: 100%;
  margin-top: 5px;
  list-style: none;
  padding: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  max-height: 300px;
  overflow-y: auto;
}

.sugestoes li {
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
  display: flex;
  flex-direction: column;
  text-align: left;
  opacity: 0;
  transform: translateY(10px);
  animation: fadeInUp 0.4s ease forwards;
}

.sugestoes li:last-child {
  border-bottom: none;
}

@keyframes fadeInUp {
  to { opacity: 1; transform: translateY(0); }
}

.linha-principal {
  font-weight: bold;
  color: #007bff;
}

.linha-secundaria-cidade {
  font-weight: bold;
  font-size: 0.7rem;
  color: #333;
}

.linha-secundaria-bairro {
  font-weight: bold;
  font-size: 0.7rem;
  color: #000000;
}

.linha-secundaria-cep {
  font-weight: bold;
  font-size: 0.7rem;
  color: #000000;
}

.linha-secundaria {
  font-size: 0.7rem;
  color: #555;
}

.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.2rem;
  color: #007bff;
  background: rgba(255, 255, 255, 0.9);
  padding: 10px 20px;
  border-radius: 8px;
  z-index: 1000;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.btn-recentralizar {
  position: absolute;
  bottom: 90px;
  right: 20px;
  z-index: 1100;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  font-size: 22px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: background 0.3s;
}

.btn-recentralizar:hover {
  background: #0056b3;
}
</style>
