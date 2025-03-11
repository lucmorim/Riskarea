import { LocalNotifications } from "@capacitor/local-notifications";
import { ref } from "vue";

const notificacoesEnviadas = ref(new Set<number>()); // Evita notificações repetidas

export function useNotification() {
  
  // ✅ Solicita permissão para notificações
  async function requestPermissions() {
    try {
      const status = await LocalNotifications.requestPermissions();
      return status.display === "granted"; // Confirma se foi permitido
    } catch (error) {
      console.error(`❌ Erro ao solicitar permissões: ${error}`);
      return false;
    }
  }

  // ✅ Criação do canal de notificações (importante no Android)
  async function createNotificationChannel() {
    try {
      await LocalNotifications.createChannel({
        id: "alerta",
        name: "Alertas de Risco",
        description: "Canal para alertas de risco próximos",
        importance: 5, // IMPORTANCE_HIGH para exibir imediatamente
        visibility: 1, // PUBLIC
        sound: "default",
      });
      console.log("✅ Canal de notificações criado!");
    } catch (error) {
      console.error(`❌ Erro ao criar canal: ${error}`);
    }
  }

  // ✅ Dispara uma notificação local
  async function sendNotification(message: string) {
    try {
      if (!(await requestPermissions())) {
        console.warn("⚠️ Notificações não permitidas pelo usuário.");
        return;
      }

      const idNotificacao = Math.floor(Math.random() * 1000);

      if (notificacoesEnviadas.value.has(idNotificacao)) {
        console.warn("⏭️ Notificação já enviada recentemente, ignorando...");
        return;
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: idNotificacao,
            title: "⚠️ ALERTA DE RISCO!",
            body: `🚨 ${message}`,
            schedule: { at: new Date(Date.now() + 1000) },
            channelId: "alerta",
            sound: "default",
            smallIcon: "ic_stat_icon",
          },
        ],
      });

      notificacoesEnviadas.value.add(idNotificacao);
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
