import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useResort } from '@/contexts/ResortContext';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import Footer from '@/components/Footer';
import { GlassCard } from '@/components/GlassCard';
import { RunChecklist } from '@/components/RunChecklist';
import { RunDetailSheet } from '@/components/RunDetailSheet';
import { OfflineBanner } from '@/components/OfflineBanner';
import { TrailMap } from '@/components/TrailMap';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import { supabase } from '@/lib/supabase';
import { useRunChecklist, useSyncQueue, useOnlineStatus } from '@/lib/hooks';
import { offlineStorage } from '@/lib/offline';
import { getNetworkStatus } from '@/lib/platform';
import { MapPin, Mountain, Check, Search } from 'lucide-react';
import { toast } from 'sonner';

function FilterChip({ label, active, onClick, color }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
      style={{
        backgroundColor: active ? (color || '#00B4D8') : 'rgba(255,255,255,0.05)',
        color: active ? (color === '#000000' ? '#FFFFFF' : '#000000') : 'rgba(255,255,255,0.7)',
        border: `1px solid ${active ? (color || '#00B4D8') : 'rgba(255,255,255,0.08)'}`,
        fontFamily: 'Manrope, sans-serif'
      }}
    >
      {label}
    </button>
  );
}

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
  const [logMode, setLogMode] = useState('run'); // 'run' or 'lift'
  const [lifts, setLifts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  // Get last logged run
  const lastLog = userLogs.length > 0 ? userLogs[0] : null;
  const lastRun = lastLog ? { ...lastLog, runs: runs.find(r => r.id === lastLog.run_id) } : null;

  // Load lifts when resort changes
  useEffect(() => {
    const loadLifts = async () => {
      if (!selectedResort?.id) {
        setLifts([]);
        return;
      }

      try {
        // 1. Try to load from local cache first
        const cachedLifts = await offlineStorage.getCachedLifts(selectedResort.id);
        if (cachedLifts && cachedLifts.length > 0) {
          setLifts(cachedLifts);
        }

        // 2. Fetch fresh data from Supabase if online and update cache
        if (isOnline) {
          const { data, error } = await supabase
            .from('lifts')
            .select('*')
            .eq('ski_area_id', selectedResort.id)
            .order('name');

          if (error) throw error;
          if (data) {
            setLifts(data);
            await offlineStorage.cacheLifts(selectedResort.id, data);
          }
        }
      } catch (err) {
        console.error('Error loading lifts:', err);
        // If we fail but already have cached data, don't clear it
        setLifts(prev => prev.length > 0 ? prev : []);
      }
    };

    loadLifts();
  }, [selectedResort?.id, isOnline]);

  // Handle lift logging
  const handleLogLift = useCallback(async (liftId) => {
    const lift = lifts.find(l => l.id === liftId);

    if (!userId) {
      toast.error('Please log in to log lifts');
      return;
    }

    if (!selectedResort?.id) {
      toast.error('Please select a resort first');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_logs')
        .insert({
          user_id: userId,
          lift_id: liftId,
          ski_area_id: selectedResort.id,
          log_type: 'lift',
          logged_at: new Date().toISOString()
        });

      if (error) {
        toast.error(`Failed to log lift: ${error.message}`);
        return;
      }

      toast.success(`Logged: ${lift?.name || 'Lift'} ✓`, {
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
      console.error('Error logging lift:', err);
      toast.error('Failed to log lift');
    }
  }, [lifts, userId, selectedResort?.id, refresh]);

  // Filter runs/lifts based on search and type
  const filteredRuns = runs.filter(run => {
    if (searchQuery && !run.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filter && run.difficulty !== filter) {
      return false;
    }
    if (selectedType === 'groomed' && run.grooming !== 'groomed') {
      return false;
    }
    if (selectedType === 'moguls' && !run.name.toLowerCase().includes('mogul')) {
      return false;
    }
    if (selectedType === 'trees' && !run.name.toLowerCase().includes('tree') && !run.name.toLowerCase().includes('glade')) {
      return false;
    }

    // History tag filtering
    if (selectedType === 'today' || selectedType === 'season' || selectedType === 'lifetime' || selectedType === 'never') {
      const status = getRunStatus(run.id);
      if (selectedType === 'today' && status !== 'today') return false;
      if (selectedType === 'season' && status !== 'season' && status !== 'today') return false;
      if (selectedType === 'lifetime' && status === 'never') return false;
      if (selectedType === 'never' && status !== 'never') return false;
    }

    return true;
  });

  const filteredLifts = lifts.filter(lift => {
    if (searchQuery && !lift.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

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
          <div className="mb-4">
            <h2 className="text-lg font-bold text-white mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Trail Map
            </h2>
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

        {/* Run/Lift Toggle */}
        {selectedResort && (
          <div className="mb-4">
            <div className="flex gap-2">
              <button
                onClick={() => setLogMode('run')}
                className="flex-1 py-2 rounded-full text-sm font-semibold transition-all"
                style={{
                  backgroundColor: logMode === 'run' ? '#00B4D8' : 'rgba(255,255,255,0.05)',
                  color: logMode === 'run' ? '#000000' : 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  fontFamily: 'Manrope, sans-serif'
                }}
              >
                Runs ({filteredRuns.length})
              </button>
              <button
                onClick={() => setLogMode('lift')}
                className="flex-1 py-2 rounded-full text-sm font-semibold transition-all"
                style={{
                  backgroundColor: logMode === 'lift' ? '#00B4D8' : 'rgba(255,255,255,0.05)',
                  color: logMode === 'lift' ? '#000000' : 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  fontFamily: 'Manrope, sans-serif'
                }}
              >
                Lifts ({filteredLifts.length})
              </button>
            </div>
          </div>
        )}

        {/* Search Bar */}
        {selectedResort && (
          <div className="relative mb-4">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.4)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={logMode === 'run' ? 'Search runs...' : 'Search lifts...'}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white border-0 outline-none"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                fontFamily: 'Manrope, sans-serif',
                border: '1px solid rgba(255,255,255,0.08)'
              }}
            />
          </div>
        )}

        {/* Filter Chips - Difficulty */}
        {selectedResort && logMode === 'run' && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-2">
              <FilterChip
                label="Green"
                active={filter === 'green'}
                onClick={() => setFilter(filter === 'green' ? '' : 'green')}
                color="#4CAF50"
              />
              <FilterChip
                label="Blue"
                active={filter === 'blue'}
                onClick={() => setFilter(filter === 'blue' ? '' : 'blue')}
                color="#2196F3"
              />
              <FilterChip
                label="Black"
                active={filter === 'black'}
                onClick={() => setFilter(filter === 'black' ? '' : 'black')}
                color="#000000"
              />
              <FilterChip
                label="Double Black ◆◆"
                active={filter === 'double-black'}
                onClick={() => setFilter(filter === 'double-black' ? '' : 'double-black')}
                color="#000000"
              />
            </div>
          </div>
        )}

        {/* Filter Chips - Type */}
        {selectedResort && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              <FilterChip
                label="All"
                active={selectedType === 'all'}
                onClick={() => setSelectedType('all')}
              />
              <FilterChip
                label="Today"
                active={selectedType === 'today'}
                onClick={() => setSelectedType(selectedType === 'today' ? 'all' : 'today')}
              />
              <FilterChip
                label="Season"
                active={selectedType === 'season'}
                onClick={() => setSelectedType(selectedType === 'season' ? 'all' : 'season')}
              />
              <FilterChip
                label="Lifetime"
                active={selectedType === 'lifetime'}
                onClick={() => setSelectedType(selectedType === 'lifetime' ? 'all' : 'lifetime')}
              />
              <FilterChip
                label="Never Skied"
                active={selectedType === 'never'}
                onClick={() => setSelectedType(selectedType === 'never' ? 'all' : 'never')}
              />
            </div>
          </div>
        )}

        {/* Run Checklist */}
        {selectedResort && logMode === 'run' && (
          <RunChecklist
            groupedRuns={getGroupedRuns()}
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

        {/* Lift List */}
        {selectedResort && logMode === 'lift' && (
          <div className="space-y-2">
            {filteredLifts.length === 0 && (
              <GlassCard className="p-8 text-center">
                <Mountain size={48} className="mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.2)' }} />
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  No lifts found
                </p>
              </GlassCard>
            )}
            {filteredLifts.map((lift) => (
              <GlassCard
                key={lift.id}
                className="p-4 transition-all hover:bg-white/10 cursor-pointer"
                onClick={() => handleLogLift(lift.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-white mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      {lift.name}
                    </h3>
                    <div className="flex items-center gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {lift.lift_type && (
                        <span className="px-2 py-0.5 rounded text-xs" style={{
                          backgroundColor: 'rgba(0, 180, 216, 0.1)',
                          color: '#00B4D8',
                          fontFamily: 'JetBrains Mono, monospace'
                        }}>
                          {lift.lift_type.replace('_', ' ')}
                        </span>
                      )}
                      {lift.capacity && (
                        <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          Capacity: {lift.capacity}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className="p-2 rounded-full transition-all hover:scale-110"
                    style={{
                      backgroundColor: 'rgba(0, 230, 118, 0.1)',
                      color: '#00E676'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLogLift(lift.id);
                    }}
                  >
                    <Check size={20} />
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
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

      <Footer />
      <BottomNav />
    </div>
  );
}
