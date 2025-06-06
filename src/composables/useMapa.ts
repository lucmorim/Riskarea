// src/composables/useMapa.ts
import { ref, onUnmounted, nextTick } from 'vue'
import L from 'leaflet'
import { Filesystem, Directory } from '@capacitor/filesystem'
import 'leaflet/dist/leaflet.css'

// TileLayer personalizado para cache de tiles no filesystem do dispositivo
class MobileTileLayer extends L.TileLayer {
  constructor(url: string, options?: L.TileLayerOptions) {
    super(url, options)
  }

  createTile(coords: L.Coords, done: L.DoneCallback): HTMLImageElement {
    const tile = document.createElement('img')
    const url = this.getTileUrl(coords)
    const filePath = `tiles/${coords.z}/${coords.x}/${coords.y}.png`

    // Tenta ler do filesystem
    Filesystem.readFile({ path: filePath, directory: Directory.Data })
      .then(result => {
        tile.src = `data:image/png;base64,${result.data}`
        done(undefined, tile)
      })
      .catch(() => {
        // Se não existir, baixa e salva
        fetch(url)
          .then(response => response.blob())
          .then(blob => {
            const reader = new FileReader()
            reader.onloadend = () => {
              const base64 = (reader.result as string).split(',')[1]
              Filesystem.writeFile({
                path: filePath,
                data: base64,
                directory: Directory.Data,
                recursive: true
              })
            }
            reader.readAsDataURL(blob)
            tile.src = URL.createObjectURL(blob)
            done(undefined, tile)
          })
          .catch(() => {
            tile.src = ''
            done(undefined, tile)
          })
      })

    return tile
  }
}

export function useMap() {
  const map = ref<L.Map>()
  const userMarker = ref<L.Marker>()
  const polygonsLayer = ref<L.LayerGroup>()

  // Inicializa o mapa e adiciona o layer offline com zoom máximo ajustado
  function initializeMap(elementId: string): L.Map {
    if (map.value) return map.value

    map.value = L.map(elementId, {
      center: [-22.9068, -43.1729],
      zoom: 13,
      minZoom: 10,
      maxZoom: 14,
      zoomControl: false
    })

    // Adiciona o controle de zoom no canto inferior esquerdo
    const zoomControl = L.control.zoom({ position: 'bottomleft' })
    zoomControl.addTo(map.value)

    // Ajusta a posição para ficar mais acima
    nextTick(() => {
      const container = map.value!.getContainer()
      const zoomEl = container.querySelector<HTMLElement>('.leaflet-control-zoom')
      if (zoomEl) {
        // Exemplo: desloca 80px acima do rodapé
        zoomEl.style.bottom = '80px'
      }
    })

    new MobileTileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        subdomains: ['a', 'b', 'c'],
        minZoom: 10,
        maxZoom: 14, // corrige também no layer
        attribution: '&copy; OpenStreetMap contributors'
      }
    ).addTo(map.value)

    polygonsLayer.value = L.layerGroup().addTo(map.value)
    return map.value
  }

  function updatePosition(lat: number, lng: number): void {
    if (!map.value) return
    map.value.setView([lat, lng], Math.min(map.value.getZoom(), 14))
    if (userMarker.value) {
      userMarker.value.setLatLng([lat, lng])
    } else {
      userMarker.value = L.marker([lat, lng], {
        icon: L.icon({
          iconUrl: 'https://cdn-icons-png.flaticon.com/512/535/535239.png',
          iconSize: [32, 32]
        })
      })
        .addTo(map.value)
        .bindPopup('📍 Você está aqui')
        .openPopup()
    }
  }

  function atualizarMarcadorUsuario(lat: number, lng: number): void {
    if (userMarker.value) userMarker.value.setLatLng([lat, lng])
  }

  function clearMap(): void {
    if (map.value) {
      map.value.remove()
      map.value = undefined
    }
    userMarker.value = undefined
    polygonsLayer.value = undefined
  }

  onUnmounted(clearMap)

  return {
    map,
    userMarker,
    polygonsLayer,
    initializeMap,
    updatePosition,
    atualizarMarcadorUsuario,
    clearMap
  }
}
