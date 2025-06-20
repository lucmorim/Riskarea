import { ForegroundService } from '@capawesome-team/capacitor-android-foreground-service';

export function useForegroundService() {
  const createNotificationChannel = async (options: {
    id: string;
    name: string;
    description?: string;
    importance?: number;
  }) => {
    await ForegroundService.createNotificationChannel({
      id: options.id,
      name: options.name,
      description: options.description || '',
      importance: options.importance || 4
    });
  };

  const startForegroundService = async (options: {
    title: string;
    body: string;
    channelId: string;
  }) => {
    await ForegroundService.startForegroundService({
      id: 1,
      title: options.title,
      body: options.body,
      smallIcon: 'ic_stat_icon_config_sample',
      notificationChannelId: options.channelId
    });
  };

  const updateForegroundService = async (options: {
    title: string;
    body: string;
  }) => {
    await ForegroundService.updateForegroundService({
      id: 1,
      title: options.title,
      body: options.body,
      smallIcon: 'ic_stat_icon_config_sample'
    });
  };

  const stopForegroundService = async () => {
    await ForegroundService.stopForegroundService();
  };

  return {
    createNotificationChannel,
    startForegroundService,
    updateForegroundService,
    stopForegroundService
  };
}