import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '@/components/GlassCard';
import { SnowStakeCompact } from '@/components/SnowStake';
import { supabase } from '@/lib/supabase';
import { MapPin, TrendingUp, Mountain } from 'lucide-react';
import { format, startOfDay, endOfDay, parseISO } from 'date-fns';

export function StatsSection({ profile, selectedResort, showSnowStake = true, period: controlledPeriod, onPeriodChange }) {
  const navigate = useNavigate();
  // Use controlled period if provided, otherwise use internal state
  const [internalPeriod, setInternalPeriod] = useState('season');
  const period = controlledPeriod !== undefined ? controlledPeriod : internalPeriod;
  
  const handlePeriodChange = (newPeriod) => {
    if (onPeriodChange) {
      onPeriodChange(newPeriod);
    } else {
      setInternalPeriod(newPeriod);
    }
  };
  
  const [stats, setStats] = useState({
    daysLogged: 0,
    verticalLogged: 0,
    completionPercent: 0,
    totalRuns: 0,
    completedRuns: 0,
    runsToday: 0,
    uniqueDaysThisSeason: 0,
    allLogs: [] // Store all logs for lifetime calculations
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = useCallback(async () => {
    if (!profile?.id) return;
    
    setIsLoading(true);
    
    try {
      // Build query based on period
      let logsQuery = supabase
        .from('user_logs')
        .select('run_id, logged_at, runs(vertical_ft, ski_area_id)')
        .eq('user_id', profile.id);
      
      // Filter by date based on period
      if (period === 'today') {
        const today = new Date();
        const startOfToday = startOfDay(today).toISOString();
        const endOfToday = endOfDay(today).toISOString();
        logsQuery = logsQuery.gte('logged_at', startOfToday).lte('logged_at', endOfToday);
      } else if (period === 'season') {
        // Assume season starts from November 1st of current or previous year
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        // If we're before November, season started last year
        const seasonStartYear = currentMonth < 10 ? currentYear - 1 : currentYear;
        const seasonStart = new Date(seasonStartYear, 10, 1).toISOString(); // November 1st
        logsQuery = logsQuery.gte('logged_at', seasonStart);
      }
      // 'lifetime' - no date filter
      
      // Filter by resort if selected
      if (selectedResort?.id) {
        logsQuery = logsQuery.eq('ski_area_id', selectedResort.id);
      }
      
      const { data: logs } = await logsQuery;

      // Get total runs for selected resort or all
      let runsQuery = supabase.from('runs').select('id, ski_area_id');
      if (selectedResort?.id) {
        runsQuery = runsQuery.eq('ski_area_id', selectedResort.id);
      }
      const { data: allRuns } = await runsQuery;

      if (logs && allRuns) {
        const uniqueRunIds = new Set(logs.map(l => l.run_id));
        const totalVertical = logs.reduce((sum, log) => sum + (log.runs?.vertical_ft || 0), 0);
        const completedRuns = uniqueRunIds.size;
        const totalRuns = allRuns.length;
        const completionPercent = totalRuns > 0 ? Math.round((completedRuns / totalRuns) * 100) : 0;

        // Calculate runs today
        const today = new Date();
        const startOfToday = startOfDay(today);
        const endOfToday = endOfDay(today);
        const runsToday = logs.filter(log => {
          const logDate = parseISO(log.logged_at);
          return logDate >= startOfToday && logDate <= endOfToday;
        }).length;

        // Calculate unique days this season
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const seasonStartYear = currentMonth < 10 ? currentYear - 1 : currentYear;
        const seasonStart = new Date(seasonStartYear, 10, 1);

        const seasonLogs = logs.filter(log => parseISO(log.logged_at) >= seasonStart);
        const uniqueDays = new Set(
          seasonLogs.map(log => format(parseISO(log.logged_at), 'yyyy-MM-dd'))
        );
        const uniqueDaysThisSeason = uniqueDays.size;

        // Fetch all logs for lifetime calculation (not filtered by period)
        let allLogsQuery = supabase
          .from('user_logs')
          .select('logged_at')
          .eq('user_id', profile.id);

        if (selectedResort?.id) {
          allLogsQuery = allLogsQuery.eq('ski_area_id', selectedResort.id);
        }

        const { data: allLogsData } = await allLogsQuery;

        setStats({
          daysLogged: logs.length,
          verticalLogged: totalVertical,
          completionPercent,
          totalRuns,
          completedRuns,
          runsToday,
          uniqueDaysThisSeason,
          allLogs: allLogsData || []
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id, selectedResort?.id, period]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Calculate average days per season for lifetime view
  const avgDaysPerSeason = useMemo(() => {
    if (!stats.allLogs || stats.allLogs.length === 0) return 0;

    // Group logs by season and count unique days per season
    const seasonDays = {};
    stats.allLogs.forEach(log => {
      const logDate = parseISO(log.logged_at);
      const year = logDate.getFullYear();
      const month = logDate.getMonth();
      const seasonYear = month < 10 ? year - 1 : year; // Season starts Nov 1
      const dateKey = format(logDate, 'yyyy-MM-dd');

      if (!seasonDays[seasonYear]) {
        seasonDays[seasonYear] = new Set();
      }
      seasonDays[seasonYear].add(dateKey);
    });

    // Calculate average
    const seasons = Object.keys(seasonDays);
    if (seasons.length === 0) return 0;

    const totalDays = seasons.reduce((sum, season) => sum + seasonDays[season].size, 0);
    return totalDays / seasons.length;
  }, [stats.allLogs]);

  const periodLabels = {
    today: 'Today',
    season: 'Season',
    lifetime: 'Lifetime'
  };

  return (
    <div className="space-y-4">
      {/* Period Toggle */}
      <div className="flex justify-center">
        <div 
          className="inline-flex rounded-full p-1"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
        >
          {['today', 'season', 'lifetime'].map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                backgroundColor: period === p ? '#00B4D8' : 'transparent',
                color: period === p ? '#000000' : 'rgba(255,255,255,0.6)',
                fontFamily: 'Manrope, sans-serif'
              }}
              data-testid={`period-toggle-${p}`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="flex gap-4">
        {/* Snow Stake - Left Side (compact) - Only show on home page */}
        {showSnowStake && (
          <div className="flex-shrink-0">
            <SnowStakeCompact
              daysLogged={stats.daysLogged}
              goalDays={profile?.season_goal_days || 0}
              verticalLogged={stats.verticalLogged}
              goalVertical={profile?.season_goal_vertical_ft || 0}
              filter={period}
              dailyRunGoal={profile?.daily_run_goal || 3}
              runsToday={stats.runsToday}
              uniqueDaysThisSeason={stats.uniqueDaysThisSeason}
              avgDaysPerSeason={avgDaysPerSeason}
            />
          </div>
        )}

        {/* Stats - Right Side (vertical stack) */}
        <div className={`${showSnowStake ? 'flex-1' : 'w-full'} flex flex-col gap-2`}>
          {/* Runs Card */}
          <GlassCard 
            className="p-3 cursor-pointer transition-all hover:scale-[1.02] hover:bg-white/10"
            onClick={() => navigate('/history')}
            data-testid="stat-runs"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(0, 180, 216, 0.1)' }}>
                <MapPin size={18} style={{ color: '#00B4D8' }} />
              </div>
              <div className="flex-1">
                <div className="text-lg font-bold text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {isLoading ? '...' : stats.daysLogged}
                </div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Manrope, sans-serif' }}>
                  Runs Logged
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Vertical Card - Prominent */}
          <GlassCard 
            className="p-3 cursor-pointer transition-all hover:scale-[1.02] hover:bg-white/10"
            style={{ 
              border: '1px solid rgba(0, 180, 216, 0.3)',
              background: 'linear-gradient(135deg, rgba(0, 180, 216, 0.08) 0%, rgba(26, 33, 38, 0.5) 100%)'
            }}
            onClick={() => navigate('/history')}
            data-testid="stat-vertical"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(0, 180, 216, 0.15)' }}>
                <TrendingUp size={18} style={{ color: '#00B4D8' }} />
              </div>
              <div className="flex-1">
                <div className="text-lg font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#00B4D8' }}>
                  {isLoading ? '...' : stats.verticalLogged.toLocaleString()}
                  <span className="text-xs ml-1" style={{ color: 'rgba(255,255,255,0.5)' }}>ft</span>
                </div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'Manrope, sans-serif' }}>
                  Vertical Skied
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Mountain Progress Card */}
          <GlassCard 
            className="p-3 cursor-pointer transition-all hover:scale-[1.02] hover:bg-white/10"
            onClick={() => navigate('/resorts')}
            data-testid="stat-resort"
          >
            <div className="flex items-center gap-3">
              <div className="relative p-2 rounded-lg" style={{ backgroundColor: 'rgba(0, 180, 216, 0.1)' }}>
                {/* Mini Progress Ring */}
                <svg className="w-5 h-5 -rotate-90" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="8" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                  <circle 
                    cx="10" cy="10" r="8" fill="none" 
                    stroke="#00B4D8" strokeWidth="2" 
                    strokeDasharray={`${stats.completionPercent * 0.5} 50`}
                    strokeLinecap="round"
                  />
                </svg>
                <Mountain size={10} className="absolute inset-0 m-auto" style={{ color: '#00B4D8' }} />
              </div>
              <div className="flex-1">
                <div className="text-lg font-bold text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {isLoading ? '...' : `${stats.completionPercent}%`}
                  <span className="text-xs ml-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    ({stats.completedRuns}/{stats.totalRuns})
                  </span>
                </div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Manrope, sans-serif' }}>
                  Mountain Progress
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
