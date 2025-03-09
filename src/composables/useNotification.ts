import { LocalNotifications } from "@capacitor/local-notifications";
import { useLog } from "@/composables/useLog";
const { addLog } = useLog();

export async function sendNotification(message: string) {
  try {
    addLog(`🔔 Tentando enviar notificação: ${message}`);

    const permStatus = await LocalNotifications.requestPermissions();
    if (permStatus.display !== "granted") {
      addLog("⚠️ Permissão para notificação não concedida!");
      return;
    }

    addLog("✅ Permissão para notificação concedida!");

    await LocalNotifications.schedule({
      notifications: [
        {
          id: Math.floor(Math.random() * 1000),
          title: "⚠️ ALERTA DE RISCO!",
          body: message,
          schedule: { at: new Date(Date.now() + 1000) },
          channelId: "alerta",
          sound: "default",
          smallIcon: "ic_stat_icon",
        },
      ],
    });

    addLog("✅ Notificação enviada com sucesso!");
  } catch (error) {
    addLog(`❌ Erro ao enviar notificação: ${error}`);
  }
}
