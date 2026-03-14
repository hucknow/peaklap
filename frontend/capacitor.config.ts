import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.peaklap.app',
  appName: 'PeakLap',
  webDir: 'build',
  server: {
    androidScheme: 'https',
    cleartext: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#12181B',
      showSpinner: false,
      androidShowSpinner: false
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#12181B',
      overlaysWebView: false
    }
  }
};

export default config;
