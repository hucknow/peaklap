import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useResort } from '@/contexts/ResortContext';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { GlassCard } from '@/components/GlassCard';
import { RunChecklist } from '@/components/RunChecklist';
import { RunDetailSheet } from '@/components/RunDetailSheet';
import { OfflineBanner } from '@/components/OfflineBanner';
import { TrailMap } from '@/components/TrailMap';
import { supabase } from '@/lib/supabase';
import { useRunChecklist, useSyncQueue, useOnlineStatus } from '@/lib/hooks';
import { MapPin, Mountain, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function LogRun() {
  const { profile, user } = useAuth();
  const isOnline = useOnlineStatus();
  
  // Use user.id as the primary identifier (profile.id should match)
  const userId = user?.id || profile?.id;
  
  // Debug logging
  useEffect(() => {
    console.log('LogRun auth state:', { 
      userId, 
      profileId: profile?.id, 
      userAuthId: user?.id,
      hasProfile: !!profile 
    });
  }, [userId, profile, user]);
  
  // Use global resort context
  const { selectedResort, detectedResort, setSelectedResort } = useResort();

  // Run checklist
  const {
    runs,
    userLogs,
    isLoading,
    filter,
    setFilter,
    getRunStatus,
    isInBucketList,
    logRun,
    logLastRunAgain,
    getGroupedRuns,
    getTodayCount,
    refresh
  } = useRunChecklist(userId, selectedResort?.id);

  // Sync queue
  const { pendingCount, isSyncing, syncNow } = useSyncQueue(userId);

  // UI state
  const [showRunDetail, setShowRunDetail] = useState(false);
  const [selectedRun, setSelectedRun] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Get last logged run
  const lastLog = userLogs.length > 0 ? userLogs[0] : null;
  const lastRun = lastLog ? { ...lastLog, runs: runs.find(r => r.id === lastLog.run_id) } : null;

  // Filter runs by search query and return grouped
  const getSearchFilteredGroupedRuns = useMemo(() => {
    const baseGrouped = getGroupedRuns();
    
    if (!searchQuery.trim()) {
      return baseGrouped;
    }
    
    const query = searchQuery.toLowerCase();
    const filteredGrouped = {};
    
    Object.entries(baseGrouped).forEach(([zone, zoneRuns]) => {
      const matchingRuns = zoneRuns.filter(run => 
        run.name.toLowerCase().includes(query)
      );
      if (matchingRuns.length > 0) {
        filteredGrouped[zone] = matchingRuns;
      }
    });
    
    return filteredGrouped;
  }, [getGroupedRuns, searchQuery]);

  // Count total filtered runs
  const filteredRunCount = useMemo(() => {
    return Object.values(getSearchFilteredGroupedRuns).reduce((sum, zoneRuns) => sum + zoneRuns.length, 0);
  }, [getSearchFilteredGroupedRuns]);

  // Handle run tap (show detail)
  const handleRunTap = useCallback((run) => {
    setSelectedRun(run);
    setShowRunDetail(true);
  }, []);

  // Handle run log
  const handleLogRun = useCallback(async (runId) => {
    const run = runs.find(r => r.id === runId);
    console.log('handleLogRun called:', { 
      runName: run?.name, 
      runId, 
      userId,
      resortId: selectedResort?.id 
    });
    
    if (!userId) {
      toast.error('Please log in to log runs');
      return;
    }
    
    if (!selectedResort?.id) {
      toast.error('Please select a resort first');
      return;
    }
    
    const result = await logRun(runId);
    console.log('logRun result:', result);
    
    if (result.success) {
      // Show success toast with run name
      toast.success(`Logged: ${run?.name || 'Run'} ✓`, {
        style: {
          background: 'rgba(26, 33, 38, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderLeft: '3px solid #00E676',
          borderRadius: '12px',
          color: 'white',
          fontFamily: 'Manrope, sans-serif',
        },
      });
      
      // Show support message after a short delay
      setTimeout(() => {
        toast(
          <a 
            href="https://buymeacoffee.com/peaklap" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              textDecoration: 'none', 
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>Enjoying PeakLap?</span>
            <span style={{ color: '#FFDD57' }}>☕</span>
            <span style={{ textDecoration: 'underline' }}>Buy me a coffee</span>
          </a>,
          {
            duration: 5000,
            style: {
              background: 'rgba(26, 33, 38, 0.95)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 221, 87, 0.2)',
              borderRadius: '12px',
              color: 'white',
              fontFamily: 'Manrope, sans-serif',
            },
          }
        );
      }, 1500);
      
      if (result.queued) {
        toast.info('Saved offline — will sync when connected', {
          duration: 2000,
          style: {
            background: 'rgba(26, 33, 38, 0.95)',
            border: '1px solid rgba(255, 152, 0, 0.3)',
            borderRadius: '12px',
            color: '#FF9800',
            fontFamily: 'Manrope, sans-serif',
          },
        });
      }
    } else {
      toast.error(`Failed to log run: ${result.error || 'Unknown error'}`, {
        style: {
          background: 'rgba(26, 33, 38, 0.95)',
          border: '1px solid rgba(255, 23, 68, 0.3)',
          borderRadius: '12px',
          color: '#FF1744',
          fontFamily: 'Manrope, sans-serif',
        },
      });
    }
  }, [runs, logRun, userId, selectedResort?.id]);

  // Handle detailed log (with date, time, conditions, rating, notes)
  const handleLogDetailedRun = useCallback(async (runId, details) => {
    const run = runs.find(r => r.id === runId);
    
    if (!userId) {
      toast.error('Please log in to log runs');
      return;
    }
    
    if (!selectedResort?.id) {
      toast.error('Please select a resort first');
      return;
    }
    
    // Log with custom timestamp and details
    try {
      const { error } = await supabase
        .from('user_logs')
        .insert({
          user_id: userId,
          run_id: runId,
          ski_area_id: selectedResort.id,
          logged_at: details.logged_at || new Date().toISOString(),
          condition: details.condition || null,
          rating: details.rating || null,
          notes: details.notes || null
        });
      
      if (error) {
        toast.error(`Failed to log run: ${error.message}`);
        return;
      }
      
      toast.success(`Logged: ${run?.name || 'Run'} ✓`, {
        style: {
          background: 'rgba(26, 33, 38, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderLeft: '3px solid #00E676',
          borderRadius: '12px',
          color: 'white',
          fontFamily: 'Manrope, sans-serif',
        },
      });
      
      refresh();
    } catch (err) {
      console.error('Error logging detailed run:', err);
      toast.error('Failed to log run');
    }
  }, [runs, userId, selectedResort?.id, refresh]);

  // Handle log last run again
  const handleLogLastAgain = useCallback(async () => {
    const result = await logLastRunAgain();
    if (result.success && lastRun?.runs) {
      toast.success(`Logged: ${lastRun.runs.name} ✓`, {
        style: {
          background: 'rgba(26, 33, 38, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderLeft: '3px solid #00E676',
          borderRadius: '12px',
          color: 'white',
          fontFamily: 'Manrope, sans-serif',
        },
      });
    }
  }, [logLastRunAgain, lastRun]);

  // Handle bucket list toggle
  const handleToggleBucket = useCallback(async (runId) => {
    if (!profile?.id) return;
    
    const isIn = isInBucketList(runId);
    
    try {
      if (isIn) {
        // Use proper { data, error } destructuring
        // NEVER call .json() or .text() on Supabase responses
        const { error } = await supabase
          .from('bucket_list')
          .delete()
          .eq('user_id', profile.id)
          .eq('run_id', runId);
        
        if (error) {
          console.error('Error removing from bucket list:', error);
          toast.error('Failed to remove from bucket list');
          return;
        }
        toast.success('Removed from bucket list');
      } else {
        // Use proper { data, error } destructuring
        const { error } = await supabase
          .from('bucket_list')
          .insert({ user_id: profile.id, run_id: runId });
        
        if (error) {
          console.error('Error adding to bucket list:', error);
          toast.error('Failed to add to bucket list');
          return;
        }
        toast.success('Added to bucket list!');
      }
      
      refresh();
    } catch (err) {
      console.error('Error toggling bucket list:', err);
      toast.error('Failed to update bucket list');
    }
  }, [profile?.id, isInBucketList, refresh]);

  // Get user log count for a run
  const getUserLogCount = useCallback((runId) => {
    return userLogs.filter(log => log.run_id === runId).length;
  }, [userLogs]);

  // Get username for page title
  const userName = profile?.username || 'Rider';

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#12181B' }} data-testid="log-run-page">
      {/* Header with global resort selector */}
      <Header />
      
      {/* Offline Banner */}
      <OfflineBanner
        isOnline={isOnline}
        pendingCount={pendingCount}
        isSyncing={isSyncing}
        onSync={syncNow}
      />
      
      <div className="p-6">
        {/* Page Title */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
            <span style={{ color: '#00B4D8' }}>{userName}</span> — Hucked it, now log it. 🏆
          </h1>
          
          {/* GPS Detected Banner */}
          {detectedResort && selectedResort?.id !== detectedResort.id && (
            <button
              onClick={() => setSelectedResort(detectedResort)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all hover:bg-white/10"
              style={{
                backgroundColor: 'rgba(0, 180, 216, 0.1)',
                border: '1px solid rgba(0, 180, 216, 0.3)'
              }}
            >
              <MapPin size={12} style={{ color: '#00B4D8' }} />
              <span className="text-xs" style={{ color: '#00B4D8', fontFamily: 'Manrope, sans-serif' }}>
                {detectedResort.name}
              </span>
            </button>
          )}
        </div>

        {/* Scoutable Trail Map - Scout before selecting a run */}
        {selectedResort && (
          <div className="mb-6">
            <TrailMap 
              resort={selectedResort}
              minHeight={280}
              maxHeight={450}
              labelText="Scout the Mountain"
              scoutableMode={true}
              showLabel={true}
            />
          </div>
        )}

        {/* Search Runs */}
        {selectedResort && (
          <div className="relative mb-4">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.4)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search runs..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
              style={{ backgroundColor: '#1A2126', color: 'white', fontFamily: 'Manrope, sans-serif' }}
            />
          </div>
        )}

        {/* Run count */}
        {selectedResort && (
          <p className="text-sm font-medium text-white mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {searchQuery ? `${filteredRunCount} of ${runs.length}` : runs.length} runs {searchQuery ? 'found' : 'available'}
          </p>
        )}

        {/* Run Checklist */}
        {selectedResort && (
          <RunChecklist
            groupedRuns={getSearchFilteredGroupedRuns}
            getRunStatus={getRunStatus}
            isInBucketList={isInBucketList}
            getTodayCount={getTodayCount}
            onLogRun={handleLogRun}
            onRunTap={handleRunTap}
            onToggleBucket={handleToggleBucket}
            filter={filter}
            setFilter={setFilter}
            onLogLastAgain={handleLogLastAgain}
            lastRun={lastRun}
            region={profile?.difficulty_region}
            isLoading={isLoading}
          />
        )}

        {/* No Resort Selected */}
        {!selectedResort && !isLoading && (
          <GlassCard className="p-8 text-center">
            <Mountain size={48} className="mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.2)' }} />
            <h3 className="text-lg font-semibold text-white mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Select a Resort
            </h3>
            <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Tap the resort chip in the header to select a resort
            </p>
          </GlassCard>
        )}
      </div>

      {/* Run Detail Sheet */}
      <RunDetailSheet
        run={selectedRun}
        isOpen={showRunDetail}
        onClose={() => setShowRunDetail(false)}
        onLog={handleLogRun}
        onLogDetailed={handleLogDetailedRun}
        onToggleBucket={handleToggleBucket}
        isInBucket={selectedRun ? isInBucketList(selectedRun.id) : false}
        userLogCount={selectedRun ? getUserLogCount(selectedRun.id) : 0}
        status={selectedRun ? getRunStatus(selectedRun.id) : 'never'}
        region={profile?.difficulty_region}
      />

      <BottomNav />
    </div>
  );
}
