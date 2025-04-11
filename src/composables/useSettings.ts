import { ref } from 'vue';
import { Preferences } from '@capacitor/preferences';

// Valores padrão
const defaultSettings = {
  alarmInterval: 20, // Valor padrão de 20 segundos
  gpsAccuracy: 'high',
  notificationSound: true
};

// Estado reativo global
const settings = ref({...defaultSettings});

export function useSettings() {
  /**
   * Carrega configurações salvas no dispositivo
   */
  const loadSettings = async () => {
    try {
      const { value } = await Preferences.get({ key: 'userSettings' });
      if (value) {
        const savedSettings = JSON.parse(value);
        settings.value = { 
          ...defaultSettings,
          ...savedSettings,
          // Garante que alarmInterval nunca seja menor que 15
          alarmInterval: Math.max(savedSettings.alarmInterval || defaultSettings.alarmInterval, 15)
        };
        console.log('Configurações carregadas:', settings.value);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
    return settings.value;
  };

  /**
   * Salva configurações no dispositivo
   * @param newSettings - Objeto com as novas configurações
   */
  const saveSettings = async (newSettings: Partial<typeof defaultSettings>) => {
    try {
      // Atualiza as configurações garantindo valores válidos
      settings.value = { 
        ...settings.value, 
        ...newSettings,
        alarmInterval: Math.max(newSettings.alarmInterval || settings.value.alarmInterval, 15)
      };
      
      await Preferences.set({
        key: 'userSettings',
        value: JSON.stringify(settings.value)
      });
      
      console.log('Configurações salvas com sucesso:', settings.value);
      return true;
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      return false;
    }
  };

  return {
    settings,
    loadSettings,
    saveSettings
  };
}