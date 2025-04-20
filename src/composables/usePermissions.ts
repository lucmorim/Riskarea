import { LocalNotifications } from "@capacitor/local-notifications";
import { Geolocation } from "@capacitor/geolocation";

/**
 * Verifica se o usuário já aceitou as permissões de notificações e geolocalização.
 * @returns boolean (true = aceitou, false = não aceitou)
 */
export const usePermissions = async (): Promise<boolean> => {
    try {
        // Verifica permissões de notificações
        const currentNotifStatus = await LocalNotifications.checkPermissions();
        let hasNotificationPermission = currentNotifStatus.display === "granted";

        if (!hasNotificationPermission) {
            const notifStatus = await LocalNotifications.requestPermissions();
            hasNotificationPermission = notifStatus.display === "granted";
        }

        // Verifica permissões de geolocalização
        const currentGeoStatus = await Geolocation.checkPermissions();
        let hasGeoPermission = currentGeoStatus.location === "granted";

        if (!hasGeoPermission) {
            const geoStatus = await Geolocation.requestPermissions();
            hasGeoPermission = geoStatus.location === "granted";
        }

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
