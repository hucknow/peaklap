import { Capacitor } from '@capacitor/core';

// Platform detection
export const isNative = () => Capacitor.isNativePlatform();
export const isAndroid = () => Capacitor.getPlatform() === 'android';
export const isIOS = () => Capacitor.getPlatform() === 'ios';
export const isWeb = () => Capacitor.getPlatform() === 'web';

// Network status — works on both web and Android
export const getNetworkStatus = async () => {
  try {
    if (isNative()) {
      const { Network } = await import('@capacitor/network');
      const status = await Network.getStatus();
      return status.connected;
    }
    return navigator.onLine;
  } catch {
    return navigator.onLine;
  }
};

// Network change listener — works on both
export const addNetworkListener = (callback) => {
  if (isNative()) {
    let listener = null;
    import('@capacitor/network').then(({ Network }) => {
      Network.addListener('networkStatusChange', (status) => {
        callback(status.connected);
      }).then(l => { listener = l; });
    });
    return { 
      remove: () => {
        if (listener) listener.remove();
      }
    };
  }
  
  // Web fallback
  const onOnline = () => callback(true);
  const onOffline = () => callback(false);
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  return {
    remove: () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    }
  };
};

// Haptic feedback — Android only, silent on web
export const hapticSuccess = async () => {
  try {
    if (isNative()) {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      await Haptics.impact({ style: ImpactStyle.Medium });
    }
  } catch {
    // Silent fail on web
  }
};

export const hapticLight = async () => {
  try {
    if (isNative()) {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      await Haptics.impact({ style: ImpactStyle.Light });
    }
  } catch {
    // Silent fail on web
  }
};

export const hapticError = async () => {
  try {
    if (isNative()) {
      const { Haptics, NotificationType } = await import('@capacitor/haptics');
      await Haptics.notification({ type: NotificationType.Error });
    }
  } catch {
    // Silent fail on web
  }
};

// Status bar control — Android only
export const setStatusBarStyle = async (style = 'dark') => {
  try {
    if (isNative()) {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await StatusBar.setStyle({ style: style === 'dark' ? Style.Dark : Style.Light });
      await StatusBar.setBackgroundColor({ color: '#12181B' });
    }
  } catch {
    // Silent fail on web
  }
};

// Hide splash screen — Android only
export const hideSplashScreen = async () => {
  try {
    if (isNative()) {
      const { SplashScreen } = await import('@capacitor/splash-screen');
      await SplashScreen.hide();
    }
  } catch {
    // Silent fail on web
  }
};

// Android back button handler setup
export const setupBackButton = (onBack) => {
  if (!isNative()) return { remove: () => {} };
  
  let listener = null;
  import('@capacitor/app').then(({ App }) => {
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else if (onBack) {
        onBack();
      } else {
        App.exitApp();
      }
    }).then(l => { listener = l; });
  });
  
  return {
    remove: () => {
      if (listener) listener.remove();
    }
  };
};
