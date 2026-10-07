import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tineghir.city',
  appName: 'Tineghir City',
  webDir: 'public',
  backgroundColor: '#1c1917',
  android: {
    allowMixedContent: false,
  },
};

export default config;
