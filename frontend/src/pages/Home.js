import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useResort } from '@/contexts/ResortContext';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import Footer from '@/components/Footer';
import { GlassCard } from '@/components/GlassCard';
import { SnowStake, SnowStakeCompact } from '@/components/SnowStake';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import CalendarView from '@/components/CalendarView';
import { StatsSection } from '@/components/StatsSection';
import { OfflineBanner } from '@/components/OfflineBanner';
import { supabase } from '@/lib/supabase';
import { offlineStorage, getCachedSeasonStats, cacheSeasonStats } from '@/lib/offline';
import { getNetworkStatus } from '@/lib/platform';
import { format, startOfDay } from 'date-fns';
import { Heart, Mountain, TrendingUp, MapPin, Snowflake, Plus } from 'lucide-react';

export default function Home() {
  const { profile } = useAuth();
  const { selectedResort, isBackgroundSyncing } = useResort();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ daysLogged: 0, verticalLogged: 0, completionPercent: 0, totalRuns: 0, completedRuns: 0 });
  const [bucketList, setBucketList] = useState([]);
  const [loggedDays, setLoggedDays] = useState(new Set());
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Refs to prevent duplicate fetches
  const statsLoadedRef = useRef(null); // Store resortId + profileId to detect changes
  const loadingRef = useRef(false);

  // Check if user has no goals set (empty state condition)
  const hasNoGoals = !profile?.season_goal_days && !profile?.season_goal_vertical_ft;
  const hasNoActivity = recentActivity.length === 0 && stats.daysLogged === 0;

  const loadStats = useCallback(async () => {
    if (!profile?.id) return;

    // Create a cache key based on profile and resort
    const cacheKey = `${profile.id}-${selectedResort?.id || 'all'}`;

    // Skip if already loading or already loaded for this combination
    if (loadingRef.current || statsLoadedRef.current === cacheKey) return;

    loadingRef.current = true;
    setIsLoading(true);

    const isOnline = await getNetworkStatus();

    try {
      if (isOnline) {
        // Build query - filter by selected resort if available
        let logsQuery = supabase
          .from('user_logs')
          .select('run_id, log_type, logged_at, runs(vertical_ft, ski_area_id), lifts(vertical_ft)')
          .eq('user_id', profile.id);

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
          // Populate loggedDays for calendar
          const uniqueDays = new Set(logs.map(log => format(startOfDay(new Date(log.logged_at)), 'yyyy-MM-dd')));
          setLoggedDays(uniqueDays);

          const uniqueRunIds = new Set(logs.filter(l => l.run_id).map(l => l.run_id));
          const totalVertical = logs.reduce((sum, log) => {
            if (log.log_type === 'lift') {
              return sum + (log.lifts?.vertical_ft || 0);
            }
            return sum;
          }, 0);
          const completedRuns = uniqueRunIds.size;
          const totalRuns = allRuns.length;
          const completionPercent = totalRuns > 0 ? Math.round((completedRuns / totalRuns) * 100) : 0;

          const statsData = {
            daysLogged: logs.length,
            verticalLogged: totalVertical,
            completionPercent,
            totalRuns,
            completedRuns
          };

          setStats(statsData);
          await cacheSeasonStats(statsData);
          statsLoadedRef.current = cacheKey;
        }
      } else {
        // Load from cache
        const cachedStats = await getCachedSeasonStats();
        if (cachedStats) {
          setStats(cachedStats);
        }
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [profile?.id, selectedResort?.id]);

  const loadBucketList = useCallback(async () => {
    if (!profile?.id) return;
    try {
      // Filter bucket list by selected resort if available
      let query = supabase
        .from('bucket_list')
        .select('*, runs(*)')
        .eq('user_id', profile.id)
        .eq('is_completed', false)
        .limit(5);
      
      if (selectedResort?.id) {
        query = query.eq('runs.ski_area_id', selectedResort.id);
      }

      const { data } = await query;
      if (data) setBucketList(data);
    } catch (error) {
      console.log('Error loading bucket list:', error);
    }
  }, [profile?.id, selectedResort?.id]);

  const loadRecentActivity = useCallback(async () => {
    if (!profile?.id) return;
    try {
      let query = supabase
        .from('user_logs')
        .select('*, runs(name, difficulty), lifts(name), log_type')
        .eq('user_id', profile.id)
        .order('logged_at', { ascending: false })
        .limit(5);
      
      if (selectedResort?.id) {
        query = query.eq('ski_area_id', selectedResort.id);
      }

      const { data } = await query;
      if (data) setRecentActivity(data);
    } catch (error) {
      console.log('Error loading recent activity:', error);
    }
  }, [profile?.id, selectedResort?.id]);

  // Reload data when profile or selected resort changes
  useEffect(() => {
    if (profile?.id) {
      // Reset cache when resort changes
      const cacheKey = `${profile.id}-${selectedResort?.id || 'all'}`;
      if (statsLoadedRef.current !== cacheKey) {
        statsLoadedRef.current = null;
      }
      loadStats();
      loadBucketList();
      loadRecentActivity();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, selectedResort?.id]); // Only depend on primitive ids

  // Handle calendar day click
  const handleCalendarDayClick = (date) => {
    navigate('/history', { state: { selectedDate: date.toISOString() } });
  };

  // Empty State Component
  const EmptyStateHero = () => (
    <div className="px-6 py-8">
      {/* Mountain Illustration */}
      <div className="relative flex justify-center mb-6">
        <div className="relative">
          {/* Stylized mountain SVG */}
          <svg width="200" height="120" viewBox="0 0 200 120" fill="none" className="opacity-60">
            <path d="M100 10L150 80H50L100 10Z" fill="url(#mountainGradient1)" />
            <path d="M60 40L100 100H20L60 40Z" fill="url(#mountainGradient2)" />
            <path d="M140 50L180 100H100L140 50Z" fill="url(#mountainGradient3)" />
            {/* Snow caps */}
            <path d="M100 10L115 35H85L100 10Z" fill="rgba(255,255,255,0.9)" />
            <path d="M60 40L70 55H50L60 40Z" fill="rgba(255,255,255,0.8)" />
            <path d="M140 50L150 65H130L140 50Z" fill="rgba(255,255,255,0.8)" />
            {/* Ski tracks */}
            <path d="M95 35 Q90 50 85 65 Q80 80 78 95" stroke="#00B4D8" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
            <path d="M105 35 Q110 50 115 65 Q120 80 122 95" stroke="#00B4D8" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
            <defs>
              <linearGradient id="mountainGradient1" x1="100" y1="10" x2="100" y2="80" gradientUnits="userSpaceOnUse">
                <stop stopColor="#2A3439" />
                <stop offset="1" stopColor="#1A2126" />
              </linearGradient>
              <linearGradient id="mountainGradient2" x1="60" y1="40" x2="60" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#232B30" />
                <stop offset="1" stopColor="#1A2126" />
              </linearGradient>
              <linearGradient id="mountainGradient3" x1="140" y1="50" x2="140" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#252D32" />
                <stop offset="1" stopColor="#1A2126" />
              </linearGradient>
            </defs>
          </svg>
          {/* Floating snowflakes */}
          <Snowflake 
            size={16} 
            className="absolute top-2 left-4 animate-pulse" 
            style={{ color: 'rgba(255,255,255,0.4)' }} 
          />
          <Snowflake 
            size={12} 
            className="absolute top-8 right-6 animate-pulse" 
            style={{ color: 'rgba(255,255,255,0.3)', animationDelay: '0.5s' }} 
          />
          <Snowflake 
            size={10} 
            className="absolute bottom-4 left-8 animate-pulse" 
            style={{ color: 'rgba(255,255,255,0.25)', animationDelay: '1s' }} 
          />
        </div>
      </div>

      {/* Hero CTA Card */}
      <GlassCard 
        className="p-6 text-center cursor-pointer transition-all hover:scale-[1.02]"
        style={{ 
          border: '2px solid rgba(0, 180, 216, 0.3)',
          background: 'linear-gradient(135deg, rgba(0, 180, 216, 0.1) 0%, rgba(26, 33, 38, 0.8) 100%)'
        }}
        onClick={() => navigate('/settings')}
        data-testid="empty-state-cta"
      >
        <div className="mb-4">
          <div 
            className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
            style={{ 
              background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)',
              boxShadow: '0 0 30px rgba(0, 180, 216, 0.4)'
            }}
          >
            <Mountain size={32} style={{ color: '#000000' }} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Set Your Season Goals
          </h2>
          <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Unlock the Snow Stake and track your progress all season long
          </p>
        </div>
        <button
          className="w-full py-3 rounded-full font-semibold transition-all"
          style={{
            background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)',
            color: '#000000',
            fontFamily: 'Manrope, sans-serif',
            boxShadow: '0 4px 20px rgba(0, 180, 216, 0.3)'
          }}
        >
          Set Goals Now
        </button>
      </GlassCard>
    </div>
  );

  // Get username for greeting
  const userName = profile?.username || 'Rider';

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#12181B' }} data-testid="home-page">
      <Header />
      <OfflineBanner />

      {/* Page Title */}
      <div className="p-6 pb-0">
        <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
          <span style={{ color: '#00B4D8' }}>{userName}</span> — The mountains are waiting, own it. ⛷️
        </h1>
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/history')}
            className="text-sm transition-all hover:opacity-80"
            style={{ color: 'rgba(255,255,255,0.6)' }}
            data-testid="date-link"
          >
            {format(new Date(), 'EEEE, MMMM d')} →
          </button>
          
          {isBackgroundSyncing && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(0, 180, 216, 0.1)', border: '1px solid rgba(0, 180, 216, 0.2)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] animate-pulse"></div>
              <span className="text-[10px] font-medium" style={{ color: '#00B4D8', fontFamily: 'Manrope, sans-serif' }}>Syncing offline data...</span>
            </div>
          )}
        </div>
      </div>

      {/* Show Empty State or Regular Content */}
      {hasNoGoals && hasNoActivity ? (
        <EmptyStateHero />
      ) : (
        <>
          {/* Stats Section with Toggle */}
          <div className="px-6 py-4">
            <StatsSection 
              profile={profile} 
              selectedResort={selectedResort} 
              showSnowStake={true}
            />
          </div>

          {/* Calendar View Section */}
          <div className="px-6 py-4">
            <h2 className="text-lg font-bold text-white mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Your Season
            </h2>
            <CalendarView loggedDays={loggedDays} onDayClick={handleCalendarDayClick} />
          </div>
        </>
      )}

      {/* Bucket List */}
      {bucketList.length > 0 && (
        <div className="px-6 py-4">
          <h2 className="text-lg font-bold text-white mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Bucket List
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {bucketList.map((item) => (
              <GlassCard
                key={item.id}
                className="flex-shrink-0 px-4 py-3 flex items-center gap-2 cursor-pointer hover:bg-white/10 transition-all"
                style={{ borderLeft: '3px solid #00B4D8' }}
                onClick={() => navigate(`/runs/${item.run_id}`)}
              >
                <Heart size={14} style={{ color: '#FF1744' }} fill="#FF1744" />
                <span className="text-sm text-white whitespace-nowrap" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {item.runs?.name}
                </span>
                {item.runs?.difficulty && (
                  <DifficultyBadge difficulty={item.runs.difficulty} region={profile?.difficulty_region} />
                )}
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="px-6 py-4">
        <h2 className="text-lg font-bold text-white mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Recent Activity
        </h2>
        {recentActivity.length === 0 && stats.daysLogged === 0 ? (
          <GlassCard 
            className="p-6 text-center cursor-pointer transition-all hover:scale-[1.01] hover:bg-white/10"
            onClick={() => navigate('/log')}
            data-testid="empty-activity-cta"
            style={{ border: '1px dashed rgba(255,255,255,0.2)' }}
          >
            <div className="flex justify-center mb-3">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(0, 180, 216, 0.1)' }}
              >
                <Plus size={24} style={{ color: '#00B4D8' }} />
              </div>
            </div>
            <p className="text-sm font-medium text-white mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
              No runs logged yet
            </p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Tap here to log your first run
            </p>
          </GlassCard>
        ) : recentActivity.length === 0 && stats.daysLogged > 0 ? (
          <GlassCard 
            className="p-4 text-center cursor-pointer transition-all hover:scale-[1.01] hover:bg-white/10"
            onClick={() => navigate('/history')}
            data-testid="view-history-cta"
          >
            <p className="text-sm font-medium text-white mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {stats.daysLogged} runs logged this season
            </p>
            <p className="text-xs" style={{ color: '#00B4D8' }}>
              View full history →
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((log) => (
              <GlassCard 
                key={log.id} 
                className="p-4 cursor-pointer transition-all hover:bg-white/10"
                onClick={() => navigate(`/runs/${log.run_id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      {log.log_type === 'lift' ? (log.lifts?.name || 'Unknown Lift') : (log.runs?.name || 'Unknown Run')}
                    </h3>
                    <div className="flex items-center gap-2">
                      {log.log_type === 'lift' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(0, 180, 216, 0.2)', color: '#00B4D8', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>LIFT</span>
                      )}
                      {log.log_type !== 'lift' && log.runs?.difficulty && (
                        <DifficultyBadge difficulty={log.runs.difficulty} region={profile?.difficulty_region} />
                      )}
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>
                        {format(new Date(log.logged_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    {log.snow_condition && (
                      <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        {log.snow_condition}
                      </p>
                    )}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      <Footer />
      <BottomNav />
    </div>
  );
}
