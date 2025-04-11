import { ref, onUnmounted } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export function useMap() {
  const map = ref<L.Map>();
  const userMarker = ref<L.Marker>();
  const polygonsLayer = ref<L.LayerGroup>();
  
  const initializeMap = (elementId: string) => {
    if (map.value) return map.value;
    
    map.value = L.map(elementId, {
      center: [-22.9068, -43.1729],
      zoom: 13
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors"
    }).addTo(map.value);

    polygonsLayer.value = L.layerGroup().addTo(map.value);
    
    return map.value;
  };

  const updatePosition = (lat: number, lng: number) => {
    if (!map.value) return;

    map.value.setView([lat, lng], 15);
    
    if (userMarker.value) {
      userMarker.value.setLatLng([lat, lng]);
    } else {
      userMarker.value = L.marker([lat, lng], {
        icon: L.icon({
          iconUrl: "https://cdn-icons-png.flaticon.com/512/535/535239.png",
          iconSize: [32, 32]
        })
      }).addTo(map.value)
        .bindPopup("📍 Você está aqui")
        .openPopup();
    }
  };

  const clearMap = () => {
    if (map.value) {
      map.value.remove();
      map.value = undefined;
    }
    userMarker.value = undefined;
    polygonsLayer.value = undefined;
  };

  onUnmounted(() => {
    clearMap();
  });

  return {
    map,
    userMarker,
    polygonsLayer,
    initializeMap,
    updatePosition,
    clearMap
  };
}