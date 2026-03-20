import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.peaklap.app',
  appName: 'PeakLap',
  webDir: 'build',
  bundledWebRuntime: false,
  plugins: {
    Filesystem: {
      androidDisplayName: 'PeakLap'
    },
    Network: {}
  }
};

export default config;
