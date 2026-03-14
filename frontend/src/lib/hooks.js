import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, getSupabaseErrorMessage } from './supabase';
import { offlineStorage, checkOnlineStatus, getCurrentPosition, generateSessionId, isToday, isThisSeason } from './offline';

// Hook for online status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(checkOnlineStatus());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Hook for resort detection and selection
export function useResortDetection(userId) {
  const [selectedResort, setSelectedResort] = useState(null);
  const [detectedResort, setDetectedResort] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [allResorts, setAllResorts] = useState([]);
  const [recentResorts, setRecentResorts] = useState([]);
  const [myResorts, setMyResorts] = useState([]);

  // Refs to prevent duplicate fetches and track initialization
  const resortsLoadedRef = useRef(false);
  const userResortsLoadedRef = useRef(false);
  const initializedRef = useRef(false);
  const gpsAttemptedRef = useRef(false);

  // Load all resorts - ONCE
  const loadResorts = useCallback(async () => {
    if (resortsLoadedRef.current) return;
    
    try {
      // Try cache first
      const cached = await offlineStorage.getCachedResorts();
      if (cached.length > 0) {
        setAllResorts(cached);
      }

      // Fetch fresh data if online
      if (checkOnlineStatus()) {
        const { data } = await supabase
          .from('ski_areas')
          .select('*')
          .order('name');
        
        if (data) {
          setAllResorts(data);
          resortsLoadedRef.current = true;
          await offlineStorage.cacheResorts(data);
        }
      }
    } catch (error) {
      console.error('Error loading resorts:', error);
    }
  }, []);

  // Load user's recent and personal resorts
  const loadUserResorts = useCallback(async () => {
    if (!userId || userResortsLoadedRef.current) return;

    try {
      // Get recent resorts from user_logs
      const { data: recentData } = await supabase
        .from('user_logs')
        .select('ski_area_id, ski_areas(id, name, region, country), logged_at')
        .eq('user_id', userId)
        .order('logged_at', { ascending: false })
        .limit(50);

      if (recentData) {
        // Get unique resorts with most recent visit
        const resortMap = new Map();
        recentData.forEach(log => {
          if (log.ski_areas && !resortMap.has(log.ski_area_id)) {
            resortMap.set(log.ski_area_id, {
              ...log.ski_areas,
              last_visit: log.logged_at,
              visit_count: 0
            });
          }
          if (resortMap.has(log.ski_area_id)) {
            resortMap.get(log.ski_area_id).visit_count++;
          }
        });

        const recent = Array.from(resortMap.values()).slice(0, 5);
        setRecentResorts(recent);
        setMyResorts(Array.from(resortMap.values()));
        userResortsLoadedRef.current = true;
      }
    } catch (error) {
      console.error('Error loading user resorts:', error);
    }
  }, [userId]);

  // Detect resort via GPS - silent, non-blocking, NEVER retries
  const detectResort = useCallback(async (resortsToSearch) => {
    // Prevent multiple GPS attempts
    if (gpsAttemptedRef.current) return null;
    gpsAttemptedRef.current = true;
    
    setIsDetecting(true);
    try {
      const position = await getCurrentPosition();
      
      // Call Supabase RPC to find nearest resort
      const { data, error } = await supabase.rpc('find_resort_by_location', {
        lat: position.lat,
        lng: position.lng
      });

      // Silent fallback on any error or null result - do NOT retry
      if (error || !data) {
        return null;
      }
      
      // data is a UUID, find the resort in our list
      const detected = resortsToSearch.find(r => r.id === data);
      if (detected) {
        setDetectedResort(detected);
        return detected;
      }
    } catch (error) {
      // Silent fail - GPS not available or denied
      console.log('GPS detection skipped:', error.message);
    } finally {
      setIsDetecting(false);
    }
    return null;
  }, []);

  // Select a resort
  const selectResort = useCallback((resort) => {
    setSelectedResort(resort);
    if (resort?.id) {
      offlineStorage.setLastResort(resort.id);
    }
  }, []);

  // Initialize resort selection - RUNS ONCE
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    const initResort = async () => {
      await loadResorts();
      
      // Use a callback to get fresh allResorts value
      setAllResorts(currentResorts => {
        if (currentResorts.length > 0) {
          // Try to load last used resort first
          const lastResortId = offlineStorage.getLastResort();
          if (lastResortId) {
            const lastResort = currentResorts.find(r => r.id === lastResortId);
            if (lastResort) {
              setSelectedResort(lastResort);
            }
          }

          // Try GPS detection in background
          detectResort(currentResorts);
        }
        return currentResorts;
      });
    };

    initResort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency - run ONCE

  // Load user resorts when userId becomes available
  useEffect(() => {
    if (userId) {
      loadUserResorts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps  
  }, [userId]); // Only depend on userId primitive

  return {
    selectedResort,
    setSelectedResort: selectResort,
    detectedResort,
    isDetecting,
    allResorts,
    recentResorts,
    myResorts,
    loadResorts,
    detectResort
  };
}

// Hook for run logging checklist
export function useRunChecklist(userId, resortId) {
  const [runs, setRuns] = useState([]);
  const [userLogs, setUserLogs] = useState([]);
  const [bucketList, setBucketList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'today', 'season', 'lifetime', 'never'
  const isOnline = useOnlineStatus();
  
  // Refs to prevent duplicate fetches
  const runsLoadedForRef = useRef(null);
  const logsLoadedRef = useRef(false);
  const bucketLoadedRef = useRef(false);

  // Load runs for resort
  const loadRuns = useCallback(async () => {
    if (!resortId) return;
    
    // Skip if already loaded for this resort
    if (runsLoadedForRef.current === resortId) return;
    
    setIsLoading(true);
    try {
      // Try cache first
      const cached = await offlineStorage.getCachedRuns(resortId);
      if (cached) {
        setRuns(cached);
      }

      // Fetch fresh if online
      if (isOnline) {
        const { data } = await supabase
          .from('runs')
          .select('*')
          .eq('ski_area_id', resortId)
          .order('zone, name');
        
        if (data) {
          setRuns(data);
          runsLoadedForRef.current = resortId;
          await offlineStorage.cacheRuns(resortId, data);
        }
      }
    } catch (error) {
      console.error('Error loading runs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [resortId, isOnline]);

  // Load user's logs
  const loadUserLogs = useCallback(async () => {
    if (!userId) return;
    
    // Skip if already loaded
    if (logsLoadedRef.current) return;

    try {
      const cached = await offlineStorage.getCachedLogs(userId);
      if (cached.length > 0) {
        setUserLogs(cached);
      }

      if (isOnline) {
        const { data } = await supabase
          .from('user_logs')
          .select('*')
          .eq('user_id', userId)
          .order('logged_at', { ascending: false });
        
        if (data) {
          setUserLogs(data);
          logsLoadedRef.current = true;
          await offlineStorage.cacheLogs(userId, data);
        }
      }
    } catch (error) {
      console.error('Error loading user logs:', error);
    }
  }, [userId, isOnline]);

  // Load bucket list
  const loadBucketList = useCallback(async () => {
    if (!userId) return;
    
    // Skip if already loaded
    if (bucketLoadedRef.current) return;

    try {
      const cached = await offlineStorage.getCachedBucketList(userId);
      if (cached.length > 0) {
        setBucketList(cached);
      }

      if (isOnline) {
        const { data } = await supabase
          .from('bucket_list')
          .select('*')
          .eq('user_id', userId)
          .eq('is_completed', false);
        
        if (data) {
          setBucketList(data);
          bucketLoadedRef.current = true;
          await offlineStorage.cacheBucketList(userId, data);
        }
      }
    } catch (error) {
      console.error('Error loading bucket list:', error);
    }
  }, [userId, isOnline]);

  // Get run status
  const getRunStatus = useCallback((runId) => {
    const runLogs = userLogs.filter(log => log.run_id === runId);
    
    if (runLogs.length === 0) return 'never';
    
    const hasToday = runLogs.some(log => isToday(log.logged_at));
    if (hasToday) return 'today';
    
    const hasSeason = runLogs.some(log => isThisSeason(log.logged_at));
    if (hasSeason) return 'season';
    
    return 'historical';
  }, [userLogs]);

  // Check if run is in bucket list
  const isInBucketList = useCallback((runId) => {
    return bucketList.some(item => item.run_id === runId);
  }, [bucketList]);

  // Log a run
  const logRun = useCallback(async (runId) => {
    if (!userId || !resortId) {
      console.error('Missing userId or resortId:', { userId, resortId });
      return { success: false, error: 'Missing user or resort' };
    }

    const sessionId = generateSessionId(userId);
    const logEntry = {
      user_id: userId,
      run_id: runId,
      ski_area_id: resortId,
      logged_at: new Date().toISOString(),
      session_id: sessionId
    };

    console.log('Attempting to log run:', logEntry);

    if (isOnline) {
      try {
        // Use proper Supabase { data, error } destructuring
        // IMPORTANT: Never call .json() or .text() on Supabase responses
        const { data, error } = await supabase
          .from('user_logs')
          .insert({
            user_id: logEntry.user_id,
            run_id: logEntry.run_id,
            ski_area_id: logEntry.ski_area_id,
            logged_at: logEntry.logged_at,
            session_id: logEntry.session_id
          })
          .select()
          .single();
        
        if (error) {
          console.error('Supabase error logging run:', error);
          // Use safe error message extractor
          const errorMessage = getSupabaseErrorMessage(error);
          return { success: false, error: errorMessage };
        }
        
        console.log('Run logged successfully:', data);
        // Update local state with the returned data (includes generated id)
        setUserLogs(prev => [data, ...prev]);
        return { success: true };
      } catch (err) {
        console.error('Error logging run:', err);
        // Safely extract error message
        const errorMessage = err instanceof Error 
          ? err.message 
          : getSupabaseErrorMessage(err);
        return { success: false, error: errorMessage };
      }
    } else {
      // Offline: add to sync queue with temporary id
      const tempEntry = { ...logEntry, id: `temp_${Date.now()}` };
      setUserLogs(prev => [tempEntry, ...prev]);
      await offlineStorage.addToSyncQueue(logEntry);
      return { success: true, queued: true };
    }
  }, [userId, resortId, isOnline]);

  // Log last run again
  const logLastRunAgain = useCallback(async () => {
    if (userLogs.length === 0) return { success: false, error: 'No previous runs' };
    const lastLog = userLogs[0];
    return await logRun(lastLog.run_id);
  }, [userLogs, logRun]);

  // Get filtered runs
  const getFilteredRuns = useCallback(() => {
    if (filter === 'all') return runs;

    return runs.filter(run => {
      const status = getRunStatus(run.id);
      switch (filter) {
        case 'today': return status === 'today';
        case 'season': return status === 'today' || status === 'season';
        case 'lifetime': return status !== 'never';
        case 'never': return status === 'never';
        default: return true;
      }
    });
  }, [runs, filter, getRunStatus]);

  // Group runs by zone
  const getGroupedRuns = useCallback(() => {
    const filtered = getFilteredRuns();
    const grouped = {};
    
    filtered.forEach(run => {
      const zone = run.zone || 'Other';
      if (!grouped[zone]) grouped[zone] = [];
      grouped[zone].push(run);
    });
    
    return grouped;
  }, [getFilteredRuns]);

  // Get today's log count for a run
  const getTodayCount = useCallback((runId) => {
    return userLogs.filter(log => 
      log.run_id === runId && isToday(log.logged_at)
    ).length;
  }, [userLogs]);

  // Load data when resortId changes (runs depend on resort)
  useEffect(() => {
    if (resortId) {
      // Reset runs loaded ref when resort changes
      if (runsLoadedForRef.current !== resortId) {
        runsLoadedForRef.current = null;
      }
      loadRuns();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resortId]); // Only depend on resortId primitive

  // Load user data when userId becomes available - ONCE
  useEffect(() => {
    if (userId) {
      loadUserLogs();
      loadBucketList();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // Only depend on userId primitive

  return {
    runs,
    userLogs,
    bucketList,
    isLoading,
    filter,
    setFilter,
    getRunStatus,
    isInBucketList,
    logRun,
    logLastRunAgain,
    getFilteredRuns,
    getGroupedRuns,
    getTodayCount,
    refresh: () => {
      // Force refresh by resetting refs
      runsLoadedForRef.current = null;
      logsLoadedRef.current = false;
      bucketLoadedRef.current = false;
      loadRuns();
      loadUserLogs();
      loadBucketList();
    }
  };
}

// Hook for syncing offline data
export function useSyncQueue(userId) {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const isOnline = useOnlineStatus();
  
  // Ref to prevent duplicate syncs
  const syncingRef = useRef(false);
  const checkedRef = useRef(false);

  const checkPending = useCallback(async () => {
    const queue = await offlineStorage.getSyncQueue();
    setPendingCount(queue.length);
  }, []);

  const syncNow = useCallback(async () => {
    if (!isOnline || syncingRef.current) return;
    
    syncingRef.current = true;
    setIsSyncing(true);
    try {
      const queue = await offlineStorage.getSyncQueue();
      if (queue.length === 0) {
        setIsSyncing(false);
        syncingRef.current = false;
        return;
      }

      // Batch insert - use proper { data, error } destructuring
      // NEVER call .json() or .text() on Supabase responses
      const { data, error } = await supabase
        .from('user_logs')
        .insert(queue.map(item => ({
          user_id: item.user_id,
          run_id: item.run_id,
          ski_area_id: item.ski_area_id,
          logged_at: item.logged_at,
          session_id: item.session_id
        })))
        .select();

      if (error) {
        console.error('Sync error:', error);
        return { synced: 0, error: getSupabaseErrorMessage(error) };
      }
      
      await offlineStorage.clearSyncQueue();
      setPendingCount(0);
      return { synced: queue.length };
    } catch (err) {
      console.error('Sync error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown sync error';
      return { synced: 0, error: errorMessage };
    } finally {
      setIsSyncing(false);
      syncingRef.current = false;
    }
  }, [isOnline]);

  // Auto-sync when coming online - ONCE per online state change
  useEffect(() => {
    if (isOnline && !syncingRef.current) {
      syncNow();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]); // Only depend on isOnline

  // Check pending on mount - ONCE
  useEffect(() => {
    if (!checkedRef.current) {
      checkedRef.current = true;
      checkPending();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency - run ONCE

  return {
    pendingCount,
    isSyncing,
    syncNow,
    checkPending
  };
}

// Hook for day summary
export function useDaySummary(userId, date = new Date()) {
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Ref to track loaded date
  const loadedDateRef = useRef(null);

  // Ensure date is valid
  const safeDate = date instanceof Date && !isNaN(date) ? date : new Date();
  const dateStr = safeDate.toISOString().split('T')[0];

  const loadDaySummary = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    
    // Skip if already loaded for this date
    if (loadedDateRef.current === dateStr) return;

    setIsLoading(true);
    try {
      // Get logs for the day
      const { data: logsData } = await supabase
        .from('user_logs')
        .select('*, runs(name, difficulty, vertical_ft, zone)')
        .eq('user_id', userId)
        .gte('logged_at', `${dateStr}T00:00:00`)
        .lt('logged_at', `${dateStr}T23:59:59`)
        .order('logged_at');

      if (logsData) {
        setLogs(logsData);
        loadedDateRef.current = dateStr;

        // Calculate stats
        const totalRuns = logsData.length;
        const totalVertical = logsData.reduce((sum, log) => 
          sum + (log.runs?.vertical_ft || 0), 0
        );
        const timeSpan = logsData.length > 0 ? {
          start: logsData[0].logged_at,
          end: logsData[logsData.length - 1].logged_at
        } : null;

        // Find first-time runs (only if there are logs)
        let firstTimeRunsCount = 0;
        if (logsData.length > 0) {
          const runIds = logsData.map(l => l.run_id).filter(Boolean);
          if (runIds.length > 0) {
            const { data: priorLogs } = await supabase
              .from('user_logs')
              .select('run_id')
              .eq('user_id', userId)
              .in('run_id', runIds)
              .lt('logged_at', `${dateStr}T00:00:00`);

            const priorRunIds = new Set(priorLogs?.map(l => l.run_id) || []);
            firstTimeRunsCount = logsData.filter(l => !priorRunIds.has(l.run_id)).length;
          }
        }

        setStats({
          totalRuns,
          totalVertical,
          timeSpan,
          firstTimeRuns: firstTimeRunsCount,
          uniqueRuns: new Set(logsData.map(l => l.run_id)).size
        });
      }

      // Get day summary if exists (table may not exist yet)
      try {
        const { data: summaryData, error: summaryError } = await supabase
          .from('day_summaries')
          .select('*')
          .eq('user_id', userId)
          .eq('session_date', dateStr)
          .single();

        if (!summaryError && summaryData) {
          setSummary(summaryData);

          // Get photos
          const { data: photosData } = await supabase
            .from('day_photos')
            .select('*')
            .eq('day_summary_id', summaryData.id)
            .order('created_at');

          if (photosData) setPhotos(photosData);
        }
      } catch (summaryErr) {
        // Table may not exist, that's ok
        console.log('Day summaries not available');
      }
    } catch (error) {
      console.error('Error loading day summary:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, dateStr]);

  const saveSummary = useCallback(async (title, notes) => {
    if (!userId) return { success: false, error: 'Not logged in' };

    try {
      // Use proper { data, error } destructuring
      // NEVER call .json() or .text() on Supabase responses
      const { data, error } = await supabase
        .from('day_summaries')
        .upsert({
          user_id: userId,
          session_date: dateStr,
          title,
          notes,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,session_date' })
        .select()
        .single();

      if (error) {
        console.error('Error saving summary:', error);
        return { success: false, error: getSupabaseErrorMessage(error) };
      }
      
      setSummary(data);
      return { success: true, data };
    } catch (err) {
      console.error('Error saving summary:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }, [userId, dateStr]);

  const deleteLog = useCallback(async (logId) => {
    try {
      // Use proper { data, error } destructuring
      // NEVER call .json() or .text() on Supabase responses
      const { error } = await supabase
        .from('user_logs')
        .delete()
        .eq('id', logId);

      if (error) {
        console.error('Error deleting log:', error);
        return { success: false, error: getSupabaseErrorMessage(error) };
      }
      
      setLogs(prev => prev.filter(l => l.id !== logId));
      loadDaySummary(); // Refresh stats
      return { success: true };
    } catch (err) {
      console.error('Error deleting log:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }, [loadDaySummary]);

  // Load day summary when userId or dateStr changes
  useEffect(() => {
    // Reset loaded ref when date changes
    if (loadedDateRef.current !== dateStr) {
      loadedDateRef.current = null;
    }
    loadDaySummary();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, dateStr]); // Only depend on primitives

  return {
    summary,
    logs,
    photos,
    stats,
    isLoading,
    saveSummary,
    deleteLog,
    refresh: () => {
      loadedDateRef.current = null;
      loadDaySummary();
    }
  };
}
