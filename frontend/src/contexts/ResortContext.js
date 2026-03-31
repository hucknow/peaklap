import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import { offlineStorage, checkOnlineStatus, getCurrentPosition } from '@/lib/offline';

const ResortContext = createContext({});

export const useResort = () => useContext(ResortContext);

export function ResortProvider({ children }) {
  const { user, profile, updateProfile } = useAuth();
  const userId = user?.id;

  // Core state
  const [selectedResort, setSelectedResortState] = useState(null);
  const [primaryResort, setPrimaryResort] = useState(null);
  const [detectedResort, setDetectedResort] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Resort lists
  const [allResorts, setAllResorts] = useState([]);
  const [recentResorts, setRecentResorts] = useState([]);
  const [myResorts, setMyResorts] = useState([]);

  // Refs to prevent duplicate fetches
  const resortsLoadedRef = useRef(false);
  const userResortsLoadedRef = useRef(false);
  const initializingRef = useRef(false);
  const gpsDetectionAttemptedRef = useRef(false);
  const profileResortSetRef = useRef(false);

  // Load all resorts from Supabase - ONLY ONCE
  const loadResorts = useCallback(async (force = false) => {
    // Prevent duplicate fetches
    if (resortsLoadedRef.current && !force) {
      return allResorts;
    }
    
    try {
      // Try cache first for instant load
      const cached = await offlineStorage.getCachedResorts();
      if (cached && cached.length > 0) {
        setAllResorts(cached);
      }

      // Fetch fresh data if online
      if (checkOnlineStatus()) {
        const { data, error } = await supabase
          .from('ski_areas')
          .select('*')
          .eq('is_published', true)
          .eq('is_active', true)
          .order('display_order')
          .order('name');

        if (!error && data) {
          setAllResorts(data);
          resortsLoadedRef.current = true;
          await offlineStorage.cacheResorts(data);
          return data;
        }
      }
      resortsLoadedRef.current = true;
      return cached || [];
    } catch (error) {
      console.error('Error loading resorts:', error);
      return [];
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load user's recent resorts from logs
  const loadUserResorts = useCallback(async (force = false) => {
    if (!userId) return;
    
    // Prevent duplicate fetches
    if (userResortsLoadedRef.current && !force) {
      return;
    }

    try {
      const { data: recentData } = await supabase
        .from('user_logs')
        .select('ski_area_id, ski_areas(id, name, region, country), logged_at')
        .eq('user_id', userId)
        .order('logged_at', { ascending: false })
        .limit(50);

      if (recentData) {
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

  // Detect resort by GPS coordinates - silent, non-blocking, NEVER retries
  const detectResortByGPS = useCallback(async (lat, lng, resorts) => {
    try {
      const { data, error } = await supabase.rpc('find_resort_by_location', { 
        lat, 
        lng 
      });

      // Silent fallback on any error or null result - do NOT retry
      if (error || !data) {
        return null;
      }
      
      // data is a UUID, find the resort in our list
      const detected = resorts.find(r => r.id === data);
      return detected || null;
    } catch {
      // Never throw, never retry
      return null;
    }
  }, []);

  // GPS detection - runs ONCE on mount, never in a loop
  const detectResort = useCallback(async (resorts) => {
    // Prevent multiple GPS detection attempts
    if (gpsDetectionAttemptedRef.current) return null;
    gpsDetectionAttemptedRef.current = true;
    
    const resortsToSearch = resorts || allResorts;
    if (resortsToSearch.length === 0) return null;

    setIsDetecting(true);
    
    try {
      const position = await getCurrentPosition();
      const detected = await detectResortByGPS(
        position.lat, 
        position.lng, 
        resortsToSearch
      );
      
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectResortByGPS]);

  // Set selected resort (current_resort_id) with persistence to localStorage AND Supabase
  // This is the "current" resort - where user is skiing right now
  const setSelectedResort = useCallback(async (resort) => {
    setSelectedResortState(resort);

    if (resort?.id) {
      // Persist to localStorage immediately
      offlineStorage.setLastResort(resort.id);

      // Persist to Supabase profiles.current_resort_id
      if (userId && checkOnlineStatus()) {
        try {
          const { error } = await supabase
            .from('profiles')
            .update({ current_resort_id: resort.id })
            .eq('id', userId);

          if (error) {
            console.error('Error saving current_resort_id:', error);
          }
        } catch (err) {
          console.error('Error persisting current resort to profile:', err);
        }
      }
    }
  }, [userId]);

  // Initialize: load resorts, then restore selection - RUNS ONCE
  // Priority: current_resort_id > primary_resort_id > localStorage > first resort
  useEffect(() => {
    // Prevent multiple initializations
    if (initializingRef.current) return;
    initializingRef.current = true;
    
    const initialize = async () => {
      setLoading(true);

      // Load all resorts first
      const resorts = await loadResorts();
      
      let restoredResort = null;

      // 1. Try to restore from profile.current_resort_id (where user is currently skiing)
      if (profile?.current_resort_id && resorts.length > 0) {
        restoredResort = resorts.find(r => r.id === profile.current_resort_id);
        if (restoredResort) {
          console.log('Init: Setting resort from current_resort_id:', restoredResort.name);
          setSelectedResortState(restoredResort);
          offlineStorage.setLastResort(restoredResort.id);
          profileResortSetRef.current = true;
        }
      }

      // 2. If no current resort, fall back to profile.primary_resort_id (home mountain)
      if (!restoredResort && profile?.primary_resort_id && resorts.length > 0) {
        restoredResort = resorts.find(r => r.id === profile.primary_resort_id);
        if (restoredResort) {
          console.log('Init: Setting resort from primary_resort_id:', restoredResort.name);
          setSelectedResortState(restoredResort);
          offlineStorage.setLastResort(restoredResort.id);
          profileResortSetRef.current = true;
        }
        // Also set primary resort state
        setPrimaryResort(restoredResort);
      }

      // 3. If still nothing, try localStorage (for offline support)
      if (!restoredResort) {
        const lastResortId = offlineStorage.getLastResort();
        if (lastResortId && resorts.length > 0) {
          restoredResort = resorts.find(r => r.id === lastResortId);
          if (restoredResort) {
            console.log('Init: Setting resort from localStorage:', restoredResort.name);
            setSelectedResortState(restoredResort);
          }
        }
      }

      // 4. Legacy fallback: try home_resort_id (old field)
      if (!restoredResort && profile?.home_resort_id && resorts.length > 0) {
        restoredResort = resorts.find(r => r.id === profile.home_resort_id);
        if (restoredResort) {
          console.log('Init: Setting resort from home_resort_id:', restoredResort.name);
          setSelectedResortState(restoredResort);
          offlineStorage.setLastResort(restoredResort.id);
        }
      }

      // 5. If still no resort and we have resorts, select the first one
      if (!restoredResort && resorts.length > 0) {
        console.log('Init: Falling back to first resort:', resorts[0].name);
        setSelectedResortState(resorts[0]);
        offlineStorage.setLastResort(resorts[0].id);
      }

      // Load primary resort separately for display purposes
      if (profile?.primary_resort_id && resorts.length > 0) {
        const primary = resorts.find(r => r.id === profile.primary_resort_id);
        if (primary) {
          setPrimaryResort(primary);
        }
      }

      setLoading(false);

      // GPS detection in background (non-blocking)
      detectResort(resorts);
    };

    initialize();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - run ONCE on mount

  // Update primary resort when profile changes
  useEffect(() => {
    if (profile?.primary_resort_id && allResorts.length > 0) {
      const primary = allResorts.find(r => r.id === profile.primary_resort_id);
      if (primary) {
        setPrimaryResort(primary);
      }
    }
  }, [profile?.primary_resort_id, allResorts]);

  // CRITICAL: Update selected resort when profile loads with current_resort_id or primary_resort_id
  // This handles the case where profile loads AFTER initial mount
  useEffect(() => {
    // Skip if already set from profile or no data available
    if (profileResortSetRef.current || !profile || allResorts.length === 0) return;
    
    // Priority 1: current_resort_id
    if (profile.current_resort_id) {
      const currentResort = allResorts.find(r => r.id === profile.current_resort_id);
      if (currentResort) {
        console.log('Setting resort from current_resort_id:', currentResort.name);
        setSelectedResortState(currentResort);
        offlineStorage.setLastResort(currentResort.id);
        profileResortSetRef.current = true;
        return;
      }
    }
    
    // Priority 2: primary_resort_id
    if (profile.primary_resort_id) {
      const primaryResortData = allResorts.find(r => r.id === profile.primary_resort_id);
      if (primaryResortData) {
        console.log('Setting resort from primary_resort_id:', primaryResortData.name);
        setSelectedResortState(primaryResortData);
        offlineStorage.setLastResort(primaryResortData.id);
        profileResortSetRef.current = true;
        return;
      }
    }
  }, [profile, allResorts]);

  // Load user resorts when userId changes (separate from initialization)
  useEffect(() => {
    if (userId) {
      loadUserResorts();
    } else {
      // Reset refs when user logs out
      profileResortSetRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // Only depend on userId primitive

  // Clear current resort (reset to primary)
  const clearCurrentResort = useCallback(async () => {
    if (primaryResort) {
      setSelectedResortState(primaryResort);
      offlineStorage.setLastResort(primaryResort.id);
      
      // Clear current_resort_id in database
      if (userId && checkOnlineStatus()) {
        try {
          const { error } = await supabase
            .from('profiles')
            .update({ current_resort_id: null })
            .eq('id', userId);

          if (error) {
            console.error('Error clearing current_resort_id:', error);
          }
        } catch (err) {
          console.error('Error clearing current resort:', err);
        }
      }
    }
  }, [primaryResort, userId]);

  // Check if user is at a different resort than their primary
  const isAtDifferentResort = selectedResort?.id && primaryResort?.id && selectedResort.id !== primaryResort.id;

  const contextValue = useMemo(() => ({
    // Core state
    selectedResort,        // Current resort (where user is skiing now)
    setSelectedResort,     // Set current resort
    primaryResort,         // Home mountain (user's preference)
    loading,

    // GPS detection
    detectedResort,
    isDetecting,
    detectResort,

    // Resort lists
    allResorts,
    recentResorts,
    myResorts,

    // Utility
    isAtDifferentResort,   // True if user is at a different resort than primary
    clearCurrentResort,    // Reset to primary resort

    // Refresh functions
    loadResorts,
    loadUserResorts
  }), [
    selectedResort, primaryResort, loading, detectedResort, isDetecting, 
    allResorts, recentResorts, myResorts, isAtDifferentResort, 
    setSelectedResort, detectResort, clearCurrentResort, loadResorts, loadUserResorts
  ]);

  return (
    <ResortContext.Provider value={contextValue}>
      {children}
    </ResortContext.Provider>
  );
}
