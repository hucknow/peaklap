// Platform detection and network utilities for Capacitor

// Check if running as native app
export const isNative = () => {
  return window.Capacitor !== undefined;
};

// Check network status
export const getNetworkStatus = async () => {
  if (isNative()) {
    try {
      const { Network } = await import('@capacitor/network');
      const status = await Network.getStatus();
      return status.connected;
    } catch {
      return navigator.onLine;
    }
  }
  return navigator.onLine;
};

// Add network listener
export const addNetworkListener = (callback) => {
  if (isNative()) {
    // Capacitor network listener
    import('@capacitor/network').then(({ Network }) => {
      return Network.addListener('networkStatusChange', (status) => {
        callback(status.connected);
      });
    }).catch(() => {
      // Fallback to web APIs
      const handleOnline = () => callback(true);
      const handleOffline = () => callback(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return {
        remove: () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
        }
      };
    });
  } else {
    // Web APIs
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return {
      remove: () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }
};
