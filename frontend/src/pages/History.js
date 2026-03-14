import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useResort } from '@/contexts/ResortContext';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { GlassCard } from '@/components/GlassCard';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import { DaySummary } from '@/components/DaySummary';
import { TrailMap } from '@/components/TrailMap';
import { StatsSection } from '@/components/StatsSection';
import { supabase } from '@/lib/supabase';
import { useDaySummary } from '@/lib/hooks';
import { format, parseISO, isToday as checkIsToday, startOfDay, endOfDay } from 'date-fns';
import { Trash2, Calendar, TrendingUp, Mountain, ChevronRight, Star, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

export default function History() {
  const { profile } = useAuth();
  const { selectedResort } = useResort();
  const [period, setPeriod] = useState('season'); // Controls both KPIs and history list
  const [groupedLogs, setGroupedLogs] = useState({});
  const [todayLogs, setTodayLogs] = useState([]);
  const [lifetimeRuns, setLifetimeRuns] = useState([]);
  const [daySummaries, setDaySummaries] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDaySummary, setShowDaySummary] = useState(false);
  const [expandedDays, setExpandedDays] = useState({});

  // Day summary hook for selected date
  const daySummaryData = useDaySummary(profile?.id, selectedDate || new Date());

  // Load logs grouped by date (for Season view)
  const loadGroupedLogs = useCallback(async () => {
    if (!profile) return;
    
    // Build query - optionally filter by selected resort
    let query = supabase
      .from('user_logs')
      .select('*, runs(name, difficulty, vertical_ft, zone), ski_areas(name)')
      .eq('user_id', profile.id)
      .order('logged_at', { ascending: false });
    
    // Filter by season (November 1st)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const seasonStartYear = currentMonth < 10 ? currentYear - 1 : currentYear;
    const seasonStart = new Date(seasonStartYear, 10, 1).toISOString();
    query = query.gte('logged_at', seasonStart);
    
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

  // Load today's logs
  const loadTodayLogs = useCallback(async () => {
    if (!profile) return;
    
    const today = new Date();
    const startOfToday = startOfDay(today).toISOString();
    const endOfToday = endOfDay(today).toISOString();
    
    let query = supabase
      .from('user_logs')
      .select('*, runs(name, difficulty, vertical_ft, zone), ski_areas(name)')
      .eq('user_id', profile.id)
      .gte('logged_at', startOfToday)
      .lte('logged_at', endOfToday)
      .order('logged_at', { ascending: false });
    
    if (selectedResort?.id) {
      query = query.eq('ski_area_id', selectedResort.id);
    }
    
    const { data } = await query;
    if (data) {
      setTodayLogs(data);
    }
  }, [profile, selectedResort?.id]);

  // Load lifetime runs grouped by run frequency
  const loadLifetimeRuns = useCallback(async () => {
    if (!profile) return;
    
    let query = supabase
      .from('user_logs')
      .select('run_id, runs(id, name, difficulty, vertical_ft, zone), ski_areas(name)')
      .eq('user_id', profile.id);
    
    if (selectedResort?.id) {
      query = query.eq('ski_area_id', selectedResort.id);
    }
    
    const { data } = await query;
    
    if (data) {
      // Group by run and count occurrences
      const runCounts = {};
      data.forEach(log => {
        const runId = log.run_id;
        if (!runCounts[runId]) {
          runCounts[runId] = {
            run: log.runs,
            resortName: log.ski_areas?.name,
            count: 0,
            totalVertical: 0
          };
        }
        runCounts[runId].count += 1;
        runCounts[runId].totalVertical += log.runs?.vertical_ft || 0;
      });
      
      // Convert to array and sort by count (descending)
      const sortedRuns = Object.values(runCounts).sort((a, b) => b.count - a.count);
      setLifetimeRuns(sortedRuns);
    }
  }, [profile, selectedResort?.id]);

  const loadDaySummaries = useCallback(async () => {
    if (!profile) return;
    
    try {
      const { data, error } = await supabase
        .from('day_summaries')
        .select('*')
        .eq('user_id', profile.id);
      
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

  useEffect(() => {
    if (profile) {
      loadGroupedLogs();
      loadTodayLogs();
      loadLifetimeRuns();
      loadDaySummaries();
    }
  }, [profile, loadGroupedLogs, loadTodayLogs, loadLifetimeRuns, loadDaySummaries]);

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
      loadGroupedLogs();
      loadTodayLogs();
      loadLifetimeRuns();
    }
    return result;
  };

  const toggleDayExpansion = (dateStr) => {
    setExpandedDays(prev => ({
      ...prev,
      [dateStr]: !prev[dateStr]
    }));
  };

  const dates = Object.keys(groupedLogs).sort((a, b) => b.localeCompare(a));
  const isPremiumLocked = dates.length > 20 && !profile?.is_premium;
  const visibleDates = isPremiumLocked ? dates.slice(0, 20) : dates;

  // Render Today's Runs
  const renderTodayView = () => {
    if (todayLogs.length === 0) {
      return (
        <GlassCard className="p-8 text-center">
          <Calendar size={48} className="mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.2)' }} />
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            No runs logged today. Get out there!
          </p>
        </GlassCard>
      );
    }

    const totalVertical = todayLogs.reduce((sum, log) => sum + (log.runs?.vertical_ft || 0), 0);

    return (
      <div className="space-y-3">
        {/* Today's Summary Header */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Today's Runs
          </h2>
          <div className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            <span>{todayLogs.length} runs</span>
            <span>•</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{totalVertical.toLocaleString()} ft</span>
          </div>
        </div>

        {/* Individual Runs */}
        {todayLogs.map((log) => (
          <GlassCard 
            key={log.id}
            className="p-4 transition-all hover:bg-white/10"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-semibold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    {log.runs?.name || 'Unknown Run'}
                  </h3>
                  {log.runs?.difficulty && (
                    <DifficultyBadge difficulty={log.runs.difficulty} region={profile?.difficulty_region} />
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  <span className="flex items-center gap-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    <TrendingUp size={14} />
                    {(log.runs?.vertical_ft || 0).toLocaleString()} ft
                  </span>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {format(new Date(log.logged_at), 'h:mm a')}
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    );
  };

  // Render Season View (grouped by date with expansion)
  const renderSeasonView = () => {
    if (visibleDates.length === 0) {
      return (
        <GlassCard className="p-8 text-center">
          <Calendar size={48} className="mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.2)' }} />
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            No runs logged this season. Get out there!
          </p>
        </GlassCard>
      );
    }

    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Season Runs
        </h2>
        
        {visibleDates.map((dateStr) => {
          const dayData = groupedLogs[dateStr];
          const summary = daySummaries[dateStr];
          const isCurrentDay = checkIsToday(parseISO(dateStr));
          const isExpanded = expandedDays[dateStr];
          
          return (
            <GlassCard 
              key={dateStr}
              className="overflow-hidden"
              data-testid={`day-card-${dateStr}`}
            >
              {/* Day Header - Always visible */}
              <div 
                className="p-4 cursor-pointer transition-all hover:bg-white/10 flex items-center justify-between"
                onClick={() => toggleDayExpansion(dateStr)}
              >
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
                </div>
                
                <ChevronDown 
                  size={20} 
                  style={{ 
                    color: 'rgba(255,255,255,0.3)',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }} 
                />
              </div>

              {/* Expanded Runs List */}
              {isExpanded && (
                <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  {dayData.logs.map((log, idx) => (
                    <div 
                      key={log.id}
                      className="px-4 py-3 flex items-center justify-between"
                      style={{ 
                        backgroundColor: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                            {log.runs?.name || 'Unknown Run'}
                          </span>
                          {log.runs?.difficulty && (
                            <DifficultyBadge difficulty={log.runs.difficulty} region={profile?.difficulty_region} size="sm" />
                          )}
                        </div>
                      </div>
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>
                        {(log.runs?.vertical_ft || 0).toLocaleString()} ft
                      </span>
                    </div>
                  ))}
                  
                  {/* View Day Summary Button */}
                  <div 
                    className="px-4 py-3 text-center cursor-pointer transition-all hover:bg-white/10"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDayClick(dateStr);
                    }}
                  >
                    <span className="text-sm font-medium" style={{ color: '#00B4D8' }}>
                      View Day Summary →
                    </span>
                  </div>
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>
    );
  };

  // Render Lifetime View (runs sorted by frequency)
  const renderLifetimeView = () => {
    if (lifetimeRuns.length === 0) {
      return (
        <GlassCard className="p-8 text-center">
          <Mountain size={48} className="mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.2)' }} />
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            No runs logged yet. Start tracking your laps!
          </p>
        </GlassCard>
      );
    }

    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Most Skied Runs
        </h2>
        
        {lifetimeRuns.map((item, index) => (
          <GlassCard 
            key={item.run?.id || index}
            className="p-4 transition-all hover:bg-white/10"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Rank Badge */}
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ 
                    backgroundColor: index < 3 ? 'rgba(0, 180, 216, 0.2)' : 'rgba(255,255,255,0.05)',
                    color: index < 3 ? '#00B4D8' : 'rgba(255,255,255,0.5)',
                    fontFamily: 'JetBrains Mono, monospace'
                  }}
                >
                  {index + 1}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      {item.run?.name || 'Unknown Run'}
                    </h3>
                    {item.run?.difficulty && (
                      <DifficultyBadge difficulty={item.run.difficulty} region={profile?.difficulty_region} />
                    )}
                  </div>
                  {item.resortName && (
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {item.resortName}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-bold" style={{ color: '#00B4D8', fontFamily: 'JetBrains Mono, monospace' }}>
                  {item.count}x
                </div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {item.totalVertical.toLocaleString()} ft
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    );
  };

  // Get username for page title
  const userName = profile?.username || 'Rider';

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#12181B' }} data-testid="history-page">
      <Header />
      
      <div className="p-6">
        {/* Page Title */}
        <h1 className="text-xl font-bold text-white mb-6" style={{ fontFamily: 'Manrope, sans-serif' }}>
          <span style={{ color: '#00B4D8' }}>{userName}</span> — Your mountain legacy. 🧭
        </h1>

        {/* Stats Section with Toggle (controlled by History page) */}
        <div className="mb-6">
          <StatsSection 
            profile={profile} 
            selectedResort={selectedResort} 
            showSnowStake={false}
            period={period}
            onPeriodChange={setPeriod}
          />
        </div>

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

        {/* History List - Changes based on period */}
        {period === 'today' && renderTodayView()}
        {period === 'season' && renderSeasonView()}
        {period === 'lifetime' && renderLifetimeView()}

        {/* Support Section - Show after list if user has logged runs */}
        {(todayLogs.length > 0 || visibleDates.length > 0 || lifetimeRuns.length > 0) && (
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

        {/* Premium Lock - Only show in Season view */}
        {period === 'season' && isPremiumLocked && (
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
