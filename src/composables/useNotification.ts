import { LocalNotifications } from "@capacitor/local-notifications";
import { ref } from "vue";

const notificacaoAtiva = ref(false); // Indica se um alarme está ativo
const ultimaAreaAlarmada = ref<string | null>(null); // Salva a última área alarmada
let intervalId: NodeJS.Timeout | null = null; // ID do loop de alarmes

export function useNotification() {
  
  async function requestPermissions() {
    try {
      const status = await LocalNotifications.requestPermissions();
      return status.display === "granted"; // Confirma se foi permitido
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
        description: "Canal para alertas de risco próximos",
        importance: 5,
        visibility: 1,
        sound: "default",
      });
      console.log("✅ Canal de notificações criado!");
    } catch (error) {
      console.error(`❌ Erro ao criar canal: ${error}`);
    }
  }

  function listenNotificationEvents() {
    LocalNotifications.addListener("localNotificationActionPerformed", async (action) => {
      console.log("📲 Notificação clicada:", action);
      notificacaoAtiva.value = false; // Para novos alarmes
      ultimaAreaAlarmada.value = null; // Permite alarmes futuros
      if (intervalId) {
        clearInterval(intervalId); // Para o loop de notificações
        intervalId = null;
      }
    });
  }

  async function sendNotification(area: string) {
    try {
      if (!(await requestPermissions())) {
        console.warn("⚠️ Notificações não permitidas pelo usuário.");
        return;
      }

      if (notificacaoAtiva.value && ultimaAreaAlarmada.value === area) {
        console.log("⏭️ Alarme já ativo para esta área, aguardando clique...");
        return;
      }

      notificacaoAtiva.value = true;
      ultimaAreaAlarmada.value = area;

      async function agendarNotificacao() {
        const idNotificacao = Math.floor(Math.random() * 1000);
        await LocalNotifications.schedule({
          notifications: [
            {
              id: idNotificacao,
              title: "⚠️ ALERTA DE ATENÇÃO!",
              body: `🚨 Atenção! Você está próximo de: ${area}`,
              schedule: { at: new Date(Date.now() + 500) }, // Notificação instantânea
              channelId: "alerta",
              sound: "default",
              smallIcon: "ic_stat_icon",
              actionTypeId: "clique_alerta",
            },
          ],
        });
        console.log(`✅ Notificação enviada para ${area}`);
      }

      await agendarNotificacao();

      // 🔥 Continua enviando notificações a cada 5 segundos até que o usuário clique
      intervalId = setInterval(async () => {
        if (!notificacaoAtiva.value) {
          clearInterval(intervalId!);
          intervalId = null;
          return;
        }
        await agendarNotificacao();
      }, 60000);

    } catch (error) {
      console.error(`❌ Erro ao enviar notificação: ${error}`);
    }
  }

  return {
    requestPermissions,
    createNotificationChannel,
    listenNotificationEvents,
    sendNotification,
  };
}
