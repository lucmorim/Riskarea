import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.riskalert.app',
  appName: 'RiskAlert',
  webDir: 'dist',
  plugins: {
    AdMob: {
      appId: 'ca-app-pub-4861242358977976~3407214777', // Substitua pelo seu App ID do AdMob
      trackingAuthorization: {
        description: 'Nós usamos identificadores para personalizar anúncios e análises' // Mensagem para solicitar permissão no iOS
      },
      // testingDevices: ['TEST_DEVICE_ID'], // Apenas para desenvolvimento
      // initializeForTesting: true // Mude para false em produção
    }
  }
};

export default config;
