import { useState, useEffect } from 'react';
import { addNetworkListener, getNetworkStatus } from '@/lib/platform';
import { offlineStorage } from '@/lib/offline';
import localforage from 'localforage';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [pending, setPending] = useState(0);
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    // Check initial status
    getNetworkStatus().then(online => setIsOffline(!online));

    // Get last sync time
    localforage.getItem('peaklap_last_sync').then(time => {
      if (time) {
        const date = new Date(time);
        setLastSync(date.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        }));
      }
    });

    // Get pending count
    offlineStorage.getSyncQueue().then(queue => setPending(queue.length));

    // Listen for network changes
    const listener = addNetworkListener(async (connected) => {
      setIsOffline(!connected);
      if (!connected) {
        const queue = await offlineStorage.getSyncQueue();
        setPending(queue.length);
      } else {
        setPending(0);
      }
    });

    return () => listener?.remove();
  }, []);

  if (!isOffline) return null;

  return (
    <div style={{
      background: 'rgba(255,165,0,0.12)',
      borderBottom: '1px solid rgba(255,165,0,0.25)',
      padding: '8px 16px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '8px',
      fontFamily: 'Manrope, sans-serif',
      fontSize: '12px',
      color: 'rgba(255,165,0,0.9)',
      letterSpacing: '0.01em'
    }}>
      <span>⚡ Offline</span>
      {lastSync && (
        <span style={{ color: 'rgba(255,165,0,0.6)' }}>
          · Last sync: {lastSync}
        </span>
      )}
      {pending > 0 && (
        <span style={{ color: 'rgba(255,165,0,0.6)' }}>
          · {pending} run{pending > 1 ? 's' : ''} pending
        </span>
      )}
    </div>
  );
}

export default OfflineBanner;
