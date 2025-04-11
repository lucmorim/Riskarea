import { LocalNotifications } from "@capacitor/local-notifications";
import { ref } from "vue";
import { ForegroundService } from '@capawesome-team/capacitor-android-foreground-service';
import { AdMob } from '@capacitor-community/admob';
import { Preferences } from '@capacitor/preferences';

// Configurações
const AD_INTERVAL = 30 * 60 * 1000; // 30 minutos entre anúncios
const NOTIFICATION_INTERVAL = 30000; // 30 segundos entre notificações

// Estado reativo
const notificacaoAtiva = ref(false);
const ultimaAreaAlarmada = ref<string | null>(null);
let intervalId: NodeJS.Timeout | null = null;

export function useNotification() {
  // -- Funções de Notificação --
  async function requestPermissions() {
    try {
      const status = await LocalNotifications.requestPermissions();
      return status.display === "granted";
    } catch (error) {
      console.error(`Erro ao solicitar permissões: ${error}`);
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
    } catch (error) {
      console.error(`Erro ao criar canal: ${error}`);
    }
  }

  function listenNotificationEvents() {
    LocalNotifications.addListener("localNotificationActionPerformed", () => {
      stopNotifications();
    });
  }

  function stopNotifications() {
    notificacaoAtiva.value = false;
    ultimaAreaAlarmada.value = null;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  async function sendNotification(area: string) {
    try {
      if (!(await requestPermissions())) {
        console.warn("Notificações não permitidas");
        return;
      }

      if (notificacaoAtiva.value && ultimaAreaAlarmada.value === area) {
        return;
      }

      notificacaoAtiva.value = true;
      ultimaAreaAlarmada.value = area;

      const agendarNotificacao = async () => {
        await LocalNotifications.schedule({
          notifications: [{
            id: Math.floor(Math.random() * 1000),
            title: "⚠️ ALERTA DE ATENÇÃO!",
            body: `🚨 Atenção! Você está próximo de: ${area}`,
            schedule: { at: new Date(Date.now() + 500) },
            channelId: "alerta",
            sound: "default",
            smallIcon: "ic_stat_icon",
            actionTypeId: "clique_alerta",
          }],
        });
      };

      await agendarNotificacao();

      intervalId = setInterval(async () => {
        if (!notificacaoAtiva.value) {
          stopNotifications();
          return;
        }
        await agendarNotificacao();
      }, NOTIFICATION_INTERVAL);

    } catch (error) {
      console.error(`Erro ao enviar notificação: ${error}`);
      stopNotifications();
    }
  }

  const initializeAdMob = async () => {
    await AdMob.initialize({
      testingDevices: ['TEST_DEVICE_ID'],
      initializeForTesting: true
    });
  };

  const showInterstitial = async () => {
    try {
      const now = Date.now();
      const { value } = await Preferences.get({ key: 'lastAdShown' });

      if (!value || (now - Number(value)) > AD_INTERVAL) {
        await AdMob.prepareInterstitial({
          adId: 'ca-app-pub-3940256099942544/1033173712' // Substitua pelo seu ID real
        });
        await AdMob.showInterstitial();
        await Preferences.set({ key: 'lastAdShown', value: now.toString() });
      }
    } catch (error) {
      console.error("Erro no AdMob:", error);
    }
  };

  const setupForegroundService = async () => {
    try {
      await ForegroundService.createNotificationChannel({
        id: 'riskarea_channel',
        name: 'Monitoramento',
        description: 'Monitorando áreas de risco',
        importance: 4
      });

      await ForegroundService.startForegroundService({
        id: 1,
        title: 'Riskarea',
        body: 'Monitorando sua localização',
        smallIcon: 'ic_stat_icon_config_sample',
        notificationChannelId: 'riskarea_channel'
      });
    } catch (error) {
      console.error("Erro no foreground service:", error);
    }
  };

  return {
    notificacaoAtiva,
    ultimaAreaAlarmada,
    requestPermissions,
    createNotificationChannel,
    listenNotificationEvents,
    sendNotification,
    stopNotifications,
    initializeAdMob,
    showInterstitial,
    setupForegroundService,
    AD_INTERVAL,
  };
}