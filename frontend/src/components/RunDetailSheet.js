import { GlassCard } from './GlassCard';
import { DifficultyBadge } from './DifficultyBadge';
import { X, TrendingUp, Ruler, Target, Heart, Check, MapPin } from 'lucide-react';

export function RunDetailSheet({
  run,
  isOpen,
  onClose,
  onLog,
  onToggleBucket,
  isInBucket,
  userLogCount,
  status,
  region
}) {
  if (!isOpen || !run) return null;

  const statusLabels = {
    today: 'Logged Today',
    season: 'Logged This Season',
    historical: 'Logged Before',
    never: 'Never Logged'
  };

  const statusColors = {
    today: '#00E676',
    season: '#FFD700',
    historical: '#6B7280',
    never: 'rgba(255,255,255,0.3)'
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Bottom Sheet */}
      <div 
        className="relative w-full max-w-lg rounded-t-3xl overflow-hidden animate-slide-up"
        style={{ backgroundColor: '#1A2126' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="px-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {run.name}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                {run.difficulty && (
                  <DifficultyBadge difficulty={run.difficulty} region={region} className="text-sm px-4 py-1.5" />
                )}
                {run.zone && (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs" style={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.7)'
                  }}>
                    <MapPin size={12} />
                    {run.zone}
                  </span>
                )}
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={20} style={{ color: 'rgba(255,255,255,0.6)' }} />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-3 gap-3">
            {run.vertical_ft && (
              <GlassCard className="p-3 text-center">
                <TrendingUp size={18} className="mx-auto mb-1" style={{ color: '#00B4D8' }} />
                <div className="text-lg font-bold text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {run.vertical_ft.toLocaleString()}
                </div>
                <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Vertical ft
                </div>
              </GlassCard>
            )}
            {run.length_m && (
              <GlassCard className="p-3 text-center">
                <Ruler size={18} className="mx-auto mb-1" style={{ color: '#00B4D8' }} />
                <div className="text-lg font-bold text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {run.length_m.toLocaleString()}
                </div>
                <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Length (m)
                </div>
              </GlassCard>
            )}
            <GlassCard className="p-3 text-center">
              <Check size={18} className="mx-auto mb-1" style={{ color: statusColors[status] }} />
              <div className="text-lg font-bold text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {userLogCount}
              </div>
              <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Times Logged
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Status */}
        <div className="px-6 pb-4">
          <div 
            className="flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{ backgroundColor: `${statusColors[status]}15` }}
          >
            <div 
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: statusColors[status] }}
            />
            <span className="text-sm" style={{ color: statusColors[status], fontFamily: 'Manrope, sans-serif' }}>
              {statusLabels[status]}
            </span>
          </div>
        </div>

        {/* Description */}
        {run.description && (
          <div className="px-6 pb-4">
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {run.description}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 pb-8 flex gap-3">
          <button
            onClick={() => onLog(run.id)}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-full font-semibold transition-all hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)',
              color: '#000',
              fontFamily: 'Manrope, sans-serif',
              boxShadow: '0 4px 20px rgba(0, 180, 216, 0.3)'
            }}
          >
            <Check size={20} />
            Log This Run
          </button>
          <button
            onClick={() => onToggleBucket(run.id)}
            className="p-4 rounded-full transition-all"
            style={{
              backgroundColor: isInBucket ? '#FF1744' : 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {isInBucket ? (
              <Heart size={20} fill="white" style={{ color: 'white' }} />
            ) : (
              <Target size={20} style={{ color: 'rgba(255,255,255,0.7)' }} />
            )}
          </button>
        </div>

        {/* Animation styles */}
        <style>{`
          @keyframes slide-up {
            from {
              transform: translateY(100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          .animate-slide-up {
            animation: slide-up 0.3s ease-out;
          }
        `}</style>
      </div>
    </div>
  );
}
