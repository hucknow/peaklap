import { useState } from 'react';
import { GlassCard } from './GlassCard';
import { DifficultyBadge } from './DifficultyBadge';
import { X, TrendingUp, Ruler, Target, Heart, Check, MapPin, Calendar, Clock, Star, Cloud, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

// Run condition options
const CONDITIONS = [
  { value: 'powder', label: 'Powder', emoji: '❄️' },
  { value: 'groomed', label: 'Groomed', emoji: '✨' },
  { value: 'packed', label: 'Packed', emoji: '🏔️' },
  { value: 'icy', label: 'Icy', emoji: '🧊' },
  { value: 'slushy', label: 'Slushy', emoji: '💧' },
  { value: 'variable', label: 'Variable', emoji: '🌤️' },
];

export function RunDetailSheet({
  run,
  isOpen,
  onClose,
  onLog,
  onLogDetailed,
  onToggleBucket,
  isInBucket,
  userLogCount,
  status,
  region
}) {
  // Detailed logging state
  const [showDetailedLog, setShowDetailedLog] = useState(false);
  const [logDate, setLogDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [logTime, setLogTime] = useState(format(new Date(), 'HH:mm'));
  const [condition, setCondition] = useState('');
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');

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

  const handleQuickLog = () => {
    onLog(run.id);
    onClose();
  };

  const handleDetailedLog = () => {
    // Combine date and time
    const loggedAt = `${logDate}T${logTime}:00`;
    
    if (onLogDetailed) {
      onLogDetailed(run.id, {
        logged_at: loggedAt,
        condition,
        rating,
        notes
      });
    } else {
      // Fallback to simple log if detailed handler not provided
      onLog(run.id);
    }
    
    // Reset form
    setShowDetailedLog(false);
    setLogDate(format(new Date(), 'yyyy-MM-dd'));
    setLogTime(format(new Date(), 'HH:mm'));
    setCondition('');
    setRating(0);
    setNotes('');
    onClose();
  };

  const handleClose = () => {
    setShowDetailedLog(false);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Bottom Sheet */}
      <div 
        className="relative w-full max-w-lg rounded-t-3xl overflow-hidden animate-slide-up max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: '#1A2126' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 sticky top-0" style={{ backgroundColor: '#1A2126' }}>
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
              onClick={handleClose}
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

        {/* Detailed Log Expansion */}
        <div className="px-6 pb-4">
          <button
            onClick={() => setShowDetailedLog(!showDetailedLog)}
            className="w-full flex items-center justify-between p-3 rounded-xl transition-all hover:bg-white/5"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Manrope, sans-serif' }}>
              Add details (date, conditions, notes)
            </span>
            {showDetailedLog ? (
              <ChevronUp size={18} style={{ color: '#00B4D8' }} />
            ) : (
              <ChevronDown size={18} style={{ color: 'rgba(255,255,255,0.5)' }} />
            )}
          </button>
        </div>

        {/* Detailed Log Form */}
        {showDetailedLog && (
          <div className="px-6 pb-4 space-y-4">
            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  <Calendar size={12} className="inline mr-1" /> Date
                </label>
                <input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ 
                    backgroundColor: '#12181B', 
                    color: 'white', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    colorScheme: 'dark'
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  <Clock size={12} className="inline mr-1" /> Time
                </label>
                <input
                  type="time"
                  value={logTime}
                  onChange={(e) => setLogTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ 
                    backgroundColor: '#12181B', 
                    color: 'white', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    colorScheme: 'dark'
                  }}
                />
              </div>
            </div>

            {/* Conditions */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                <Cloud size={12} className="inline mr-1" /> Conditions
              </label>
              <div className="flex flex-wrap gap-2">
                {CONDITIONS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setCondition(condition === c.value ? '' : c.value)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{
                      backgroundColor: condition === c.value ? '#00B4D8' : 'rgba(255,255,255,0.05)',
                      color: condition === c.value ? '#000' : 'rgba(255,255,255,0.7)',
                      border: '1px solid rgba(255,255,255,0.08)'
                    }}
                  >
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Star Rating */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                <Star size={12} className="inline mr-1" /> Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(rating === star ? 0 : star)}
                    className="p-2 transition-all hover:scale-110"
                  >
                    <Star 
                      size={24} 
                      fill={star <= rating ? '#FFD700' : 'transparent'}
                      style={{ color: star <= rating ? '#FFD700' : 'rgba(255,255,255,0.3)' }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                <FileText size={12} className="inline mr-1" /> Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How was the run? Any memorable moments?"
                rows={2}
                className="w-full px-3 py-2 rounded-lg text-sm resize-none"
                style={{ 
                  backgroundColor: '#12181B', 
                  color: 'white', 
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 pb-8 flex gap-3">
          {showDetailedLog ? (
            <button
              onClick={handleDetailedLog}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-full font-semibold transition-all hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)',
                color: '#000',
                fontFamily: 'Manrope, sans-serif',
                boxShadow: '0 4px 20px rgba(0, 180, 216, 0.3)'
              }}
            >
              <Check size={20} />
              Log with Details
            </button>
          ) : (
            <button
              onClick={handleQuickLog}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-full font-semibold transition-all hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)',
                color: '#000',
                fontFamily: 'Manrope, sans-serif',
                boxShadow: '0 4px 20px rgba(0, 180, 216, 0.3)'
              }}
            >
              <Check size={20} />
              Quick Log
            </button>
          )}
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
