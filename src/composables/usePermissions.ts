import { LocalNotifications } from "@capacitor/local-notifications";
import { Geolocation } from "@capacitor/geolocation";
import { registerPlugin } from "@capacitor/core";

const RiskOverlay = registerPlugin<{
  checkPermission(): Promise<{ granted: boolean }>;
  requestPermission(): Promise<void>;
}>("RiskOverlay");

/**
 * Verifica se o usuário já aceitou as permissões de notificações, geolocalização e overlay.
 * @returns boolean (true = aceitou tudo, false = recusou algo)
 */
export const usePermissions = async (): Promise<boolean> => {
  try {
    // 🔔 Notificações
    const currentNotifStatus = await LocalNotifications.checkPermissions();
    let hasNotificationPermission = currentNotifStatus.display === "granted";

    if (!hasNotificationPermission) {
      const notifStatus = await LocalNotifications.requestPermissions();
      hasNotificationPermission = notifStatus.display === "granted";
    }

    // 📍 Geolocalização
    const currentGeoStatus = await Geolocation.checkPermissions();
    let hasGeoPermission = currentGeoStatus.location === "granted";

    if (!hasGeoPermission) {
      const geoStatus = await Geolocation.requestPermissions();
      hasGeoPermission = geoStatus.location === "granted";
    }

    // 🧱 Overlay (plugin nativo)
    let hasOverlayPermission = false;
    try {
      const overlay = await RiskOverlay.checkPermission();
      hasOverlayPermission = overlay.granted;

      if (!hasOverlayPermission) {
        await RiskOverlay.requestPermission();
        // O usuário será redirecionado para a tela de configurações, então podemos aguardar manualmente ou reiniciar depois
        return false;
      }
    } catch (error) {
      console.warn("Overlay permission check falhou:", error);
    }

    // const allGranted = hasNotificationPermission && hasGeoPermission && hasOverlayPermission;
    const allGranted = hasNotificationPermission && hasGeoPermission;

    if (allGranted) {
      setTimeout(() => location.reload(), 500);
    }

    return allGranted;
  } catch (error) {
    console.error(`Erro ao solicitar permissões: ${error}`);
    return false;
  }
};
