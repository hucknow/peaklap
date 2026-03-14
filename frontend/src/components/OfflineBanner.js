import { WifiOff, CloudUpload, Check } from 'lucide-react';

export function OfflineBanner({ isOnline, pendingCount, isSyncing, onSync }) {
  if (isOnline && pendingCount === 0) return null;

  return (
    <div 
      className="sticky top-0 z-40 px-4 py-2 flex items-center justify-between"
      style={{
        backgroundColor: isOnline ? 'rgba(0, 180, 216, 0.1)' : 'rgba(255, 152, 0, 0.1)',
        borderBottom: `1px solid ${isOnline ? 'rgba(0, 180, 216, 0.2)' : 'rgba(255, 152, 0, 0.2)'}`
      }}
    >
      <div className="flex items-center gap-2">
        {isOnline ? (
          <CloudUpload size={16} style={{ color: '#00B4D8' }} />
        ) : (
          <WifiOff size={16} style={{ color: '#FF9800' }} />
        )}
        <span className="text-xs font-medium" style={{ 
          color: isOnline ? '#00B4D8' : '#FF9800',
          fontFamily: 'Manrope, sans-serif'
        }}>
          {isOnline 
            ? `${pendingCount} run${pendingCount > 1 ? 's' : ''} ready to sync`
            : 'Offline — syncing when connected'
          }
        </span>
      </div>

      {isOnline && pendingCount > 0 && (
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all"
          style={{
            backgroundColor: '#00B4D8',
            color: '#000',
            opacity: isSyncing ? 0.7 : 1
          }}
        >
          {isSyncing ? (
            <>
              <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <Check size={12} />
              Sync Now
            </>
          )}
        </button>
      )}
    </div>
  );
}
