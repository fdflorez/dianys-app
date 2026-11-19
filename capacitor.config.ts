import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dianystech.app',
  appName: 'Dianys Technology',
  webDir: 'www',
  android: {
    // Permite que la app (https://localhost) consuma la API local por http (XAMPP)
    allowMixedContent: true,
  },
};

export default config;
