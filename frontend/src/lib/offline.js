import localforage from 'localforage';

// Initialize localForage stores
const runsStore = localforage.createInstance({ name: 'sendit', storeName: 'runs' });
const liftsStore = localforage.createInstance({ name: 'sendit', storeName: 'lifts' });
const logsStore = localforage.createInstance({ name: 'sendit', storeName: 'logs' });
const bucketStore = localforage.createInstance({ name: 'sendit', storeName: 'bucket' });
const syncQueue = localforage.createInstance({ name: 'sendit', storeName: 'syncQueue' });
const resortStore = localforage.createInstance({ name: 'sendit', storeName: 'resorts' });

// Storage keys
const LAST_RESORT_KEY = 'sendit_last_resort_id';
const VIEW_PREFERENCE_KEY = 'sendit_view_preference';
const LAST_SYNC_KEY = 'sendit_last_sync';

// Generate session ID for a given date
export const generateSessionId = (userId, date = new Date()) => {
  const dateStr = date.toISOString().split('T')[0];
  return `${userId}_${dateStr}`;
};

// Get current season date range (assume Nov 1 - Apr 30)
export const getCurrentSeasonRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  // If we're in Nov-Dec, season started this year
  // If we're in Jan-Oct, season started last year
  const seasonStartYear = month >= 10 ? year : year - 1;
  
  return {
    start: new Date(seasonStartYear, 10, 1), // Nov 1
    end: new Date(seasonStartYear + 1, 3, 30) // Apr 30
  };
};

// Check if a date is today
export const isToday = (date) => {
  const today = new Date();
  const checkDate = new Date(date);
  return checkDate.toDateString() === today.toDateString();
};

// Check if a date is in current season
export const isThisSeason = (date) => {
  const { start, end } = getCurrentSeasonRange();
  const checkDate = new Date(date);
  return checkDate >= start && checkDate <= end;
};

// Offline storage functions
export const offlineStorage = {
  // Runs
  async cacheRuns(resortId, runs) {
    await runsStore.setItem(`runs_${resortId}`, runs);
  },
  
  async getCachedRuns(resortId) {
    return await runsStore.getItem(`runs_${resortId}`);
  },
  
  // Lifts
  async cacheLifts(resortId, lifts) {
    await liftsStore.setItem(`lifts_${resortId}`, lifts);
  },
  
  async getCachedLifts(resortId) {
    return await liftsStore.getItem(`lifts_${resortId}`);
  },
  
  // User logs
  async cacheLogs(userId, logs) {
    await logsStore.setItem(`logs_${userId}`, logs);
    await logsStore.setItem(LAST_SYNC_KEY, new Date().toISOString());
  },
  
  async getCachedLogs(userId) {
    return await logsStore.getItem(`logs_${userId}`) || [];
  },
  
  // Bucket list
  async cacheBucketList(userId, items) {
    await bucketStore.setItem(`bucket_${userId}`, items);
  },
  
  async getCachedBucketList(userId) {
    return await bucketStore.getItem(`bucket_${userId}`) || [];
  },
  
  // Resorts
  async cacheResorts(resorts) {
    await resortStore.setItem('all_resorts', resorts);
  },
  
  async getCachedResorts() {
    return await resortStore.getItem('all_resorts') || [];
  },
  
  // Sync queue for offline logging
  async addToSyncQueue(logEntry) {
    const queue = await syncQueue.getItem('pending') || [];
    queue.push({ ...logEntry, queued_at: new Date().toISOString() });
    await syncQueue.setItem('pending', queue);
    return queue.length;
  },
  
  async getSyncQueue() {
    return await syncQueue.getItem('pending') || [];
  },
  
  async clearSyncQueue() {
    await syncQueue.setItem('pending', []);
  },
  
  async removeSyncedItems(ids) {
    const queue = await syncQueue.getItem('pending') || [];
    const remaining = queue.filter(item => !ids.includes(item.id));
    await syncQueue.setItem('pending', remaining);
  },
  
  // Last resort
  setLastResort(resortId) {
    localStorage.setItem(LAST_RESORT_KEY, resortId);
  },
  
  getLastResort() {
    return localStorage.getItem(LAST_RESORT_KEY);
  },
  
  // View preference (list/map)
  setViewPreference(preference) {
    localStorage.setItem(VIEW_PREFERENCE_KEY, preference);
  },
  
  getViewPreference() {
    return localStorage.getItem(VIEW_PREFERENCE_KEY) || 'list';
  },
  
  // Clear all cache
  async clearAll() {
    await runsStore.clear();
    await liftsStore.clear();
    await logsStore.clear();
    await bucketStore.clear();
    await resortStore.clear();
  }
};

// Online status hook helper
export const checkOnlineStatus = () => {
  return navigator.onLine;
};

// GPS location helper
export const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
};

export default offlineStorage;
