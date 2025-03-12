import { LocalNotifications } from "@capacitor/local-notifications";

export function useNotification() {
  
  async function requestPermissions() {
    try {
      const status = await LocalNotifications.requestPermissions();
      return status.display === "granted"; 
    } catch (error) {
      console.error(`❌ Erro ao solicitar permissões: ${error}`);
      return false;
    }
  }

  async function createNotificationChannel() {
    try {
      await LocalNotifications.createChannel({
        id: "alerta",
        name: "Alertas de Risco",
        description: "Canal para alertas de risco contínuos",
        importance: 5, // IMPORTANCE_HIGH
        visibility: 1, // PUBLIC
        sound: "default",
      });
      console.log("✅ Canal de notificações criado!");
    } catch (error) {
      console.error(`❌ Erro ao criar canal: ${error}`);
    }
  }

  async function sendNotification(message: string) {
    try {
      if (!(await requestPermissions())) {
        console.warn("⚠️ Notificações não permitidas pelo usuário.");
        return;
      }

      const idNotificacao = Math.floor(Math.random() * 1000); // 🔥 Garante um número menor para Android

      await LocalNotifications.schedule({
        notifications: [
          {
            id: idNotificacao, // Agora é um número pequeno e válido
            title: "⚠️ ALERTA DE ATENÇÃO!",
            body: `🚨 ${message}`,
            schedule: { at: new Date(Date.now() + 1000) },
            channelId: "alerta",
            sound: "default",
            smallIcon: "ic_stat_icon",
            actionTypeId: "clique_alerta", // Para detectar cliques
          },
        ],
      });

      console.log("✅ Notificação enviada!");
    } catch (error) {
      console.error(`❌ Erro ao enviar notificação: ${error}`);
    }
  }

  return {
    requestPermissions,
    createNotificationChannel,
    sendNotification,
  };
}
