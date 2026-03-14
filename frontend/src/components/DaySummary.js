import { useState, useRef, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { DifficultyBadge } from './DifficultyBadge';
import { 
  X, Edit2, Save, Trash2, Plus, Image, Share2, 
  TrendingUp, Clock, Star, Mountain, Camera, Check
} from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import html2canvas from 'html2canvas';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function DaySummary({
  date,
  logs,
  stats,
  summary,
  photos,
  onSaveSummary,
  onDeleteLog,
  onAddRun,
  region,
  resortName,
  isOpen,
  onClose
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(summary?.title || '');
  const [notes, setNotes] = useState(summary?.notes || '');
  const [isUploading, setIsUploading] = useState(false);
  const summaryRef = useRef(null);

  // Update title/notes when summary changes
  useEffect(() => {
    setTitle(summary?.title || '');
    setNotes(summary?.notes || '');
  }, [summary]);

  if (!isOpen) return null;

  // Ensure date is valid
  const safeDate = date instanceof Date && !isNaN(date) ? date : new Date();
  const dateStr = format(safeDate, 'EEEE, MMMM d, yyyy');
  const timeSpanStr = stats?.timeSpan 
    ? `${format(new Date(stats.timeSpan.start), 'h:mm a')} - ${format(new Date(stats.timeSpan.end), 'h:mm a')}`
    : '';
  const durationMin = stats?.timeSpan 
    ? differenceInMinutes(new Date(stats.timeSpan.end), new Date(stats.timeSpan.start))
    : 0;
  const durationStr = durationMin > 0 
    ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`
    : '';

  const handleSave = async () => {
    const result = await onSaveSummary(title, notes);
    if (result.success) {
      setIsEditing(false);
      toast.success('Summary saved!');
    }
  };

  const handleShare = async () => {
    if (!summaryRef.current) return;

    try {
      const canvas = await html2canvas(summaryRef.current, {
        backgroundColor: '#12181B',
        scale: 2
      });
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `sendit-${format(safeDate, 'yyyy-MM-dd')}.png`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success('Summary image downloaded!');
        }
      });
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to generate image');
    }
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
        className="relative w-full max-w-lg max-h-[90vh] rounded-t-3xl overflow-hidden"
        style={{ backgroundColor: '#1A2126' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="px-6 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Day Summary
            </h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {dateStr}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <Share2 size={20} style={{ color: '#00B4D8' }} />
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <Edit2 size={20} style={{ color: 'rgba(255,255,255,0.6)' }} />
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={20} style={{ color: 'rgba(255,255,255,0.6)' }} />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto px-6 pb-8" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          {/* Summary Card for Sharing */}
          <div ref={summaryRef} className="pb-4">
            {/* Resort Header */}
            {resortName && (
              <div className="flex items-center gap-2 mb-4">
                <Mountain size={18} style={{ color: '#00B4D8' }} />
                <span className="text-sm font-medium" style={{ color: '#00B4D8', fontFamily: 'Manrope, sans-serif' }}>
                  {resortName}
                </span>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <GlassCard className="p-4 text-center">
                <Check size={18} className="mx-auto mb-1" style={{ color: '#00E676' }} />
                <div className="text-2xl font-bold text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {stats?.totalRuns || 0}
                </div>
                <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Runs
                </div>
              </GlassCard>
              <GlassCard className="p-4 text-center" style={{ 
                border: '1px solid rgba(0, 180, 216, 0.3)',
                background: 'linear-gradient(135deg, rgba(0, 180, 216, 0.1) 0%, transparent 100%)'
              }}>
                <TrendingUp size={18} className="mx-auto mb-1" style={{ color: '#00B4D8' }} />
                <div className="text-2xl font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#00B4D8' }}>
                  {(stats?.totalVertical || 0).toLocaleString()}
                </div>
                <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Vertical ft
                </div>
              </GlassCard>
              <GlassCard className="p-4 text-center">
                <Clock size={18} className="mx-auto mb-1" style={{ color: '#FFD700' }} />
                <div className="text-lg font-bold text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {durationStr || '--'}
                </div>
                <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Duration
                </div>
              </GlassCard>
            </div>

            {/* Highlights */}
            {(stats?.firstTimeRuns > 0) && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl" style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)' }}>
                <Star size={16} style={{ color: '#FFD700' }} />
                <span className="text-sm" style={{ color: '#FFD700', fontFamily: 'Manrope, sans-serif' }}>
                  {stats.firstTimeRuns} first-time run{stats.firstTimeRuns > 1 ? 's' : ''}!
                </span>
              </div>
            )}

            {/* Time Span */}
            {timeSpanStr && (
              <p className="text-xs text-center mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {timeSpanStr}
              </p>
            )}
          </div>

          {/* Title & Notes - Editable */}
          {isEditing ? (
            <div className="space-y-3 mb-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give this day a title..."
                className="w-full px-4 py-3 rounded-xl border-0 focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: '#12181B',
                  color: 'white',
                  fontFamily: 'Manrope, sans-serif'
                }}
              />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about your day..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-0 focus:outline-none focus:ring-2 resize-none"
                style={{
                  backgroundColor: '#12181B',
                  color: 'white',
                  fontFamily: 'Manrope, sans-serif'
                }}
              />
              <button
                onClick={handleSave}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-full font-semibold"
                style={{
                  backgroundColor: '#00B4D8',
                  color: '#000',
                  fontFamily: 'Manrope, sans-serif'
                }}
              >
                <Save size={18} />
                Save Summary
              </button>
            </div>
          ) : (
            (title || notes) && (
              <GlassCard className="p-4 mb-4">
                {title && (
                  <h3 className="text-lg font-semibold text-white mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    {title}
                  </h3>
                )}
                {notes && (
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {notes}
                  </p>
                )}
              </GlassCard>
            )
          )}

          {/* Photos */}
          {photos.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                PHOTOS
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {photos.map(photo => (
                  <img
                    key={photo.id}
                    src={photo.photo_url}
                    alt={photo.caption || 'Day photo'}
                    className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Run List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
                RUNS ({logs.length})
              </p>
              {isEditing && (
                <button
                  onClick={onAddRun}
                  className="flex items-center gap-1 text-xs"
                  style={{ color: '#00B4D8' }}
                >
                  <Plus size={14} />
                  Add Run
                </button>
              )}
            </div>
            <div className="space-y-2">
              {logs.map((log, index) => (
                <div
                  key={log.id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                >
                  <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.4)', width: '24px' }}>
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      {log.runs?.name || 'Unknown Run'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {log.runs?.difficulty && (
                        <DifficultyBadge difficulty={log.runs.difficulty} region={region} />
                      )}
                      <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono, monospace' }}>
                        {format(new Date(log.logged_at), 'h:mm a')}
                      </span>
                    </div>
                  </div>
                  {log.runs?.vertical_ft && (
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>
                      +{log.runs.vertical_ft.toLocaleString()} ft
                    </span>
                  )}
                  {isEditing && (
                    <button
                      onClick={() => onDeleteLog(log.id)}
                      className="p-1 rounded hover:bg-white/10"
                    >
                      <Trash2 size={14} style={{ color: '#FF1744' }} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
