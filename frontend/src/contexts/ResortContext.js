import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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

  // Set selected resort with persistence to localStorage AND Supabase
  const setSelectedResort = useCallback(async (resort) => {
    setSelectedResortState(resort);

    if (resort?.id) {
      // Persist to localStorage immediately
      offlineStorage.setLastResort(resort.id);

      // Persist to Supabase profiles.home_resort_id
      if (userId && checkOnlineStatus()) {
        try {
          const { error } = await supabase
            .from('profiles')
            .update({ home_resort_id: resort.id })
            .eq('id', userId);

          if (error) {
            console.error('Error saving home_resort_id:', error);
          }
        } catch (err) {
          console.error('Error persisting resort to profile:', err);
        }
      }
    }
  }, [userId]);

  // Initialize: load resorts, then restore selection - RUNS ONCE
  useEffect(() => {
    // Prevent multiple initializations
    if (initializingRef.current) return;
    initializingRef.current = true;
    
    const initialize = async () => {
      setLoading(true);

      // Load all resorts first
      const resorts = await loadResorts();

      // Try to restore from localStorage first (instant)
      const lastResortId = offlineStorage.getLastResort();
      let restoredResort = null;

      if (lastResortId && resorts.length > 0) {
        restoredResort = resorts.find(r => r.id === lastResortId);
        if (restoredResort) {
          setSelectedResortState(restoredResort);
        }
      }

      // If no localStorage, try profile.home_resort_id
      if (!restoredResort && profile?.home_resort_id && resorts.length > 0) {
        restoredResort = resorts.find(r => r.id === profile.home_resort_id);
        if (restoredResort) {
          setSelectedResortState(restoredResort);
          // Sync to localStorage
          offlineStorage.setLastResort(restoredResort.id);
        }
      }

      // If still no resort and we have resorts, select the first one
      if (!restoredResort && resorts.length > 0) {
        setSelectedResortState(resorts[0]);
        offlineStorage.setLastResort(resorts[0].id);
      }

      setLoading(false);

      // GPS detection in background (non-blocking)
      detectResort(resorts);
    };

    initialize();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - run ONCE on mount

  // Load user resorts when userId changes (separate from initialization)
  useEffect(() => {
    if (userId) {
      loadUserResorts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // Only depend on userId primitive

  return (
    <ResortContext.Provider value={{
      // Core state
      selectedResort,
      setSelectedResort,
      loading,

      // GPS detection
      detectedResort,
      isDetecting,
      detectResort,

      // Resort lists
      allResorts,
      recentResorts,
      myResorts,

      // Refresh functions
      loadResorts,
      loadUserResorts
    }}>
      {children}
    </ResortContext.Provider>
  );
}
