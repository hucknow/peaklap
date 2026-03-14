import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useResort } from '@/contexts/ResortContext';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { GlassCard } from '@/components/GlassCard';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import { DaySummary } from '@/components/DaySummary';
import { TrailMap } from '@/components/TrailMap';
import { supabase } from '@/lib/supabase';
import { useDaySummary } from '@/lib/hooks';
import { format, parseISO, isToday as checkIsToday } from 'date-fns';
import { Trash2, Calendar, TrendingUp, Mountain, ChevronRight, Star } from 'lucide-react';
import { toast } from 'sonner';

export default function History() {
  const { profile } = useAuth();
  const { selectedResort } = useResort();
  const [groupedLogs, setGroupedLogs] = useState({});
  const [daySummaries, setDaySummaries] = useState({});
  const [stats, setStats] = useState({ totalDays: 0, totalVertical: 0, totalRuns: 0 });
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDaySummary, setShowDaySummary] = useState(false);

  // Day summary hook for selected date
  const daySummaryData = useDaySummary(profile?.id, selectedDate || new Date());

  const loadLogs = useCallback(async () => {
    if (!profile) return;
    
    // Build query - optionally filter by selected resort
    let query = supabase
      .from('user_logs')
      .select('*, runs(name, difficulty, vertical_ft, zone), ski_areas(name)')
      .eq('user_id', profile.id)
      .order('logged_at', { ascending: false });
    
    if (selectedResort?.id) {
      query = query.eq('ski_area_id', selectedResort.id);
    }
    
    const { data } = await query;
    
    if (data) {
      // Group by date
      const grouped = {};
      data.forEach(log => {
        const dateKey = format(new Date(log.logged_at), 'yyyy-MM-dd');
        if (!grouped[dateKey]) {
          grouped[dateKey] = {
            date: dateKey,
            logs: [],
            totalVertical: 0,
            resortName: log.ski_areas?.name
          };
        }
        grouped[dateKey].logs.push(log);
        grouped[dateKey].totalVertical += log.runs?.vertical_ft || 0;
      });
      setGroupedLogs(grouped);
    }
  }, [profile, selectedResort?.id]);

  const loadDaySummaries = useCallback(async () => {
    if (!profile) return;
    
    try {
      const { data, error } = await supabase
        .from('day_summaries')
        .select('*')
        .eq('user_id', profile.id);
      
      // If table doesn't exist or other error, just continue with empty summaries
      if (error) {
        console.log('Day summaries not available:', error.message);
        return;
      }
      
      if (data) {
        const summaryMap = {};
        data.forEach(summary => {
          summaryMap[summary.session_date] = summary;
        });
        setDaySummaries(summaryMap);
      }
    } catch (err) {
      console.log('Error loading day summaries:', err);
    }
  }, [profile]);

  const calculateStats = useCallback(async () => {
    if (!profile) return;
    
    const { data } = await supabase
      .from('user_logs')
      .select('logged_at, runs(vertical_ft)')
      .eq('user_id', profile.id);

    if (data) {
      const uniqueDays = new Set(data.map(l => format(new Date(l.logged_at), 'yyyy-MM-dd'))).size;
      const totalVertical = data.reduce((sum, log) => sum + (log.runs?.vertical_ft || 0), 0);
      
      setStats({
        totalDays: uniqueDays,
        totalVertical,
        totalRuns: data.length
      });
    }
  }, [profile]);

  useEffect(() => {
    if (profile) {
      loadLogs();
      loadDaySummaries();
      calculateStats();
    }
  }, [profile, loadLogs, loadDaySummaries, calculateStats]);

  const deleteLog = async (logId) => {
    try {
      // Use proper { data, error } destructuring
      // NEVER call .json() or .text() on Supabase responses
      const { error } = await supabase
        .from('user_logs')
        .delete()
        .eq('id', logId);

      if (error) {
        console.error('Error deleting log:', error);
        toast.error('Failed to delete log');
      } else {
        toast.success('Log deleted');
        loadLogs();
        calculateStats();
      }
    } catch (err) {
      console.error('Error deleting log:', err);
      toast.error('Failed to delete log');
    }
  };

  const handleDayClick = (dateStr) => {
    setSelectedDate(parseISO(dateStr));
    setShowDaySummary(true);
  };

  const handleSaveDaySummary = async (title, notes) => {
    return await daySummaryData.saveSummary(title, notes);
  };

  const handleDeleteLog = async (logId) => {
    const result = await daySummaryData.deleteLog(logId);
    if (result.success) {
      loadLogs();
      calculateStats();
    }
    return result;
  };

  const dates = Object.keys(groupedLogs).sort((a, b) => b.localeCompare(a));
  const isPremiumLocked = dates.length > 20 && !profile?.is_premium;
  const visibleDates = isPremiumLocked ? dates.slice(0, 20) : dates;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#12181B' }} data-testid="history-page">
      <Header />
      
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: 'Manrope, sans-serif' }}>
          History
        </h1>

        {/* Season Summary */}
        <GlassCard className="p-6 mb-6" style={{ backgroundColor: '#1A2126' }}>
          <h2 className="text-sm font-medium mb-4 text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Season Summary
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Calendar size={18} style={{ color: '#00B4D8' }} />
              </div>
              <div className="text-2xl font-bold text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {stats.totalDays}
              </div>
              <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Days Out
              </div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <TrendingUp size={18} style={{ color: '#00B4D8' }} />
              </div>
              <div className="text-2xl font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#00B4D8' }}>
                {stats.totalVertical.toLocaleString()}
              </div>
              <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Vertical ft
              </div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Mountain size={18} style={{ color: '#00B4D8' }} />
              </div>
              <div className="text-2xl font-bold text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {stats.totalRuns}
              </div>
              <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Total Runs
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Trail Map */}
        {selectedResort && (
          <div className="mb-6">
            <TrailMap 
              resort={selectedResort}
              minHeight={250}
              maxHeight={400}
              labelText={selectedResort.name}
              showLabel={true}
            />
          </div>
        )}

        {/* Day Cards */}
        {visibleDates.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Calendar size={48} className="mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.2)' }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
              No runs logged yet. Get out there!
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {visibleDates.map((dateStr) => {
              const dayData = groupedLogs[dateStr];
              const summary = daySummaries[dateStr];
              const isCurrentDay = checkIsToday(parseISO(dateStr));
              
              return (
                <GlassCard 
                  key={dateStr}
                  className="p-4 cursor-pointer transition-all hover:bg-white/10"
                  onClick={() => handleDayClick(dateStr)}
                  data-testid={`day-card-${dateStr}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                          {summary?.title || format(parseISO(dateStr), 'EEEE, MMM d')}
                        </h3>
                        {isCurrentDay && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{
                            backgroundColor: 'rgba(0, 230, 118, 0.2)',
                            color: '#00E676'
                          }}>
                            Today
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        <span className="flex items-center gap-1">
                          <Mountain size={14} />
                          {dayData.logs.length} runs
                        </span>
                        <span className="flex items-center gap-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          <TrendingUp size={14} />
                          {dayData.totalVertical.toLocaleString()} ft
                        </span>
                      </div>
                      
                      {dayData.resortName && (
                        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          {dayData.resortName}
                        </p>
                      )}
                      
                      {summary?.notes && (
                        <p className="text-xs mt-2 line-clamp-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          {summary.notes}
                        </p>
                      )}
                    </div>
                    
                    <ChevronRight size={20} style={{ color: 'rgba(255,255,255,0.3)' }} />
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}

        {/* Support Section - Show after days list if user has logged runs */}
        {visibleDates.length > 0 && (
          <GlassCard 
            className="mt-6 p-6 text-center"
            style={{ 
              border: '1px solid rgba(255, 221, 87, 0.2)',
              background: 'rgba(255, 221, 87, 0.03)'
            }}
          >
            <div className="text-2xl mb-2">☕</div>
            <h3 className="text-base font-semibold text-white mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Enjoying PeakLap?
            </h3>
            <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Keep the stoke going and support the project
            </p>
            <a
              href="https://buymeacoffee.com/peaklap"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-2.5 rounded-full font-semibold transition-all hover:scale-105"
              style={{
                backgroundColor: '#FFDD57',
                color: '#000000',
                fontFamily: 'Manrope, sans-serif',
                textDecoration: 'none'
              }}
            >
              Buy Me a Coffee
            </a>
          </GlassCard>
        )}

        {/* Premium Lock */}
        {isPremiumLocked && (
          <GlassCard 
            className="mt-6 p-6 text-center"
            style={{ 
              border: '2px solid #FFD700',
              background: 'rgba(255, 215, 0, 0.05)'
            }}
          >
            <div className="text-3xl mb-2">🔒</div>
            <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              You're on a roll!
            </h3>
            <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>
              PeakLap Pro unlocks your full history.
            </p>
            <button
              className="px-6 py-2 rounded-full font-semibold"
              style={{
                backgroundColor: '#FFD700',
                color: '#000000',
                fontFamily: 'Manrope, sans-serif'
              }}
            >
              Upgrade to Pro
            </button>
          </GlassCard>
        )}
      </div>

      {/* Day Summary Modal */}
      <DaySummary
        date={selectedDate || new Date()}
        logs={daySummaryData.logs}
        stats={daySummaryData.stats}
        summary={daySummaryData.summary}
        photos={daySummaryData.photos}
        onSaveSummary={handleSaveDaySummary}
        onDeleteLog={handleDeleteLog}
        onAddRun={() => {}}
        region={profile?.difficulty_region}
        resortName={selectedDate ? groupedLogs[format(selectedDate, 'yyyy-MM-dd')]?.resortName : null}
        isOpen={showDaySummary}
        onClose={() => setShowDaySummary(false)}
      />

      <BottomNav />
    </div>
  );
}
