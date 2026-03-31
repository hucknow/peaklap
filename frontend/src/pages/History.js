import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useResort } from '@/contexts/ResortContext';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import Footer from '@/components/Footer';
import { GlassCard } from '@/components/GlassCard';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import { DaySummary } from '@/components/DaySummary';
import { TrailMap } from '@/components/TrailMap';
import { StatsSection } from '@/components/StatsSection';
import { OfflineBanner } from '@/components/OfflineBanner';
import { supabase } from '@/lib/supabase';
import { useDaySummary } from '@/lib/hooks';
import { offlineStorage } from '@/lib/offline';
import { getNetworkStatus } from '@/lib/platform';
import { format, parseISO, isToday as checkIsToday, startOfDay, endOfDay } from 'date-fns';
import { Trash2, Calendar, TrendingUp, Mountain, ChevronRight, Star, ChevronDown, CreditCard as Edit, CreditCard as Edit2, X, GripVertical, Search } from 'lucide-react';
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

export default function History() {
  const { profile } = useAuth();
  const { selectedResort } = useResort();
  const location = useLocation();
  const navigate = useNavigate();
  const incomingDate = location.state?.selectedDate;
  const [period, setPeriod] = useState('season'); // Controls both KPIs and history list
  const [groupedLogs, setGroupedLogs] = useState({});
  const [todayLogs, setTodayLogs] = useState([]);
  const [lifetimeRuns, setLifetimeRuns] = useState([]);
  const [daySummaries, setDaySummaries] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDaySummary, setShowDaySummary] = useState(false);
  const [expandedDays, setExpandedDays] = useState({});
  const [isShowingCached, setIsShowingCached] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [editingLog, setEditingLog] = useState(null);
  const [editFormData, setEditFormData] = useState({
    logged_at: '',
    snow_condition: '',
    notes: ''
  });
  const [draggedRunLog, setDraggedRunLog] = useState(null);
  const [dragOverLiftId, setDragOverLiftId] = useState(null);

  // Day summary hook for selected date
  const daySummaryData = useDaySummary(profile?.id, selectedDate || new Date());

  // Load logs grouped by date (for Season view)
  const loadGroupedLogs = useCallback(async () => {
    if (!profile) return;

    const isOnline = await getNetworkStatus();

    if (isOnline) {
      // Build query - optionally filter by selected resort
      // NEW: Include lift data and parent_log_id for hierarchy
      let query = supabase
        .from('user_logs')
        .select('*, runs(name, difficulty, vertical_ft, zone), lifts(name, vertical_ft), ski_areas(name), parent_log_id, log_type')
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
        await offlineStorage.cacheLogs(profile.id, data);

        // NEW: Build parent-child hierarchy
        // First, create a map of all logs by ID
        const logsById = new Map(data.map(log => [log.id, { ...log, children: [] }]));

        // Then, assign children to their parents
        const topLevelLogs = [];
        logsById.forEach(log => {
          if (log.parent_log_id && logsById.has(log.parent_log_id)) {
            logsById.get(log.parent_log_id).children.push(log);
          } else {
            topLevelLogs.push(log);
          }
        });

        // Group by date with hierarchy
        const grouped = {};
        topLevelLogs.forEach(log => {
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
          // NEW: Calculate vertical from LIFT logs only
          if (log.log_type === 'lift') {
            grouped[dateKey].totalVertical += log.lifts?.vertical_ft || 0;
          }
        });
        setGroupedLogs(grouped);
        setIsShowingCached(false);
      }
    } else {
      // Load from cache
      const cached = await offlineStorage.getCachedLogs(profile.id);
      if (cached && cached.length > 0) {
        const grouped = {};
        cached.forEach(log => {
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
          // Calculate vertical from lift logs only
          if (log.log_type === 'lift') {
            grouped[dateKey].totalVertical += log.lifts?.vertical_ft || 0;
          }
        });
        setGroupedLogs(grouped);
        setIsShowingCached(true);
      }
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
      .select('*, runs(name, difficulty, vertical_ft, zone), lifts(name, vertical_ft), ski_areas(name), log_type')
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

  const handleDayClick = useCallback((dateStr) => {
    setSelectedDate(parseISO(dateStr));
    setShowDaySummary(true);
  }, []);

  useEffect(() => {
    loadDaySummaries();
  }, [loadDaySummaries]);

  useEffect(() => {
    if (profile) {
      loadGroupedLogs();
      loadTodayLogs();
      loadLifetimeRuns();
      loadDaySummaries();
    }
  }, [profile, loadGroupedLogs, loadTodayLogs, loadLifetimeRuns, loadDaySummaries]);
  
  useEffect(() => {
    if (incomingDate) {
      handleDayClick(incomingDate);
      // Clear the state so it doesn't re-trigger on navigation
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [incomingDate, handleDayClick, navigate, location.pathname]);

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

  const handleBulkDeleteDay = async (dateStr) => {
    if (!profile?.id) return;

    const confirmDelete = window.confirm(
      `Delete all ${groupedLogs[dateStr]?.logs.length} logs from ${format(parseISO(dateStr), 'MMM d, yyyy')}?`
    );

    if (!confirmDelete) return;

    try {
      const logIds = groupedLogs[dateStr].logs.map(log => log.id);

      const { error } = await supabase
        .from('user_logs')
        .delete()
        .in('id', logIds);

      if (error) throw error;

      toast.success('Day deleted successfully');
      loadGroupedLogs();
      loadTodayLogs();
      loadLifetimeRuns();
    } catch (err) {
      console.error('Error deleting day:', err);
      toast.error('Failed to delete day');
    }
  };

  const handleDeleteSingleLog = async (logId, logName) => {
    const confirmDelete = window.confirm(`Delete "${logName}" from your history?`);

    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('user_logs')
        .delete()
        .eq('id', logId);

      if (error) throw error;

      toast.success('Log deleted successfully');
      loadGroupedLogs();
      loadTodayLogs();
      loadLifetimeRuns();
    } catch (err) {
      console.error('Error deleting log:', err);
      toast.error('Failed to delete log');
    }
  };

  const handleEditLog = (log) => {
    setEditingLog(log);
    setEditFormData({
      logged_at: log.logged_at ? format(parseISO(log.logged_at), "yyyy-MM-dd'T'HH:mm") : '',
      snow_condition: log.snow_condition || '',
      notes: log.notes || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingLog) return;

    try {
      const { error } = await supabase
        .from('user_logs')
        .update({
          logged_at: editFormData.logged_at ? new Date(editFormData.logged_at).toISOString() : editingLog.logged_at,
          snow_condition: editFormData.snow_condition || null,
          notes: editFormData.notes || null
        })
        .eq('id', editingLog.id);

      if (error) throw error;

      toast.success('Log updated successfully');
      setEditingLog(null);
      loadGroupedLogs();
      loadTodayLogs();
      loadLifetimeRuns();
    } catch (err) {
      console.error('Error updating log:', err);
      toast.error('Failed to update log');
    }
  };

  // Drag-and-drop handlers for reassigning runs to lifts
  const handleDragStart = (e, runLog) => {
    if (runLog.log_type !== 'run') return; // Only runs can be dragged
    setDraggedRunLog(runLog);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, liftLog) => {
    e.preventDefault();
    if (liftLog.log_type === 'lift') {
      e.dataTransfer.dropEffect = 'move';
      setDragOverLiftId(liftLog.id);
    }
  };

  const handleDragLeave = () => {
    setDragOverLiftId(null);
  };

  const handleDrop = async (e, targetLiftLog) => {
    e.preventDefault();
    setDragOverLiftId(null);

    if (!draggedRunLog || targetLiftLog.log_type !== 'lift') return;
    if (draggedRunLog.parent_log_id === targetLiftLog.id) {
      toast.info('Run is already assigned to this lift');
      setDraggedRunLog(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('user_logs')
        .update({ parent_log_id: targetLiftLog.id })
        .eq('id', draggedRunLog.id);

      if (error) throw error;

      toast.success(`Reassigned "${draggedRunLog.runs?.name}" to "${targetLiftLog.lifts?.name}"`);
      loadGroupedLogs();
    } catch (err) {
      console.error('Error reassigning run:', err);
      toast.error('Failed to reassign run');
    } finally {
      setDraggedRunLog(null);
    }
  };

  const handleUnlinkRun = async (runLog) => {
    try {
      const { error } = await supabase
        .from('user_logs')
        .update({ parent_log_id: null })
        .eq('id', runLog.id);

      if (error) throw error;

      toast.success('Run unlinked from lift');
      loadGroupedLogs();
    } catch (err) {
      console.error('Error unlinking run:', err);
      toast.error('Failed to unlink run');
    }
  };

  // Filter logs based on search and filters
  const filterLogs = (logs) => {
    return logs.filter(log => {
      if (searchQuery && !log.runs?.name?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (selectedDifficulty !== 'all' && log.runs?.difficulty !== selectedDifficulty) {
        return false;
      }
      if (selectedType === 'groomed' && log.runs?.grooming !== 'groomed') {
        return false;
      }
      if (selectedType === 'moguls' && !log.runs?.name?.toLowerCase().includes('mogul')) {
        return false;
      }
      if (selectedType === 'trees' && !log.runs?.name?.toLowerCase().includes('tree') && !log.runs?.name?.toLowerCase().includes('glade')) {
        return false;
      }
      return true;
    });
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

    const totalVertical = todayLogs.reduce((sum, log) => {
      if (log.log_type === 'lift') {
        return sum + (log.lifts?.vertical_ft || 0);
      }
      return sum;
    }, 0);

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
        {todayLogs.map((log) => {
          const isLift = log.log_type === 'lift';
          return (
            <GlassCard
              key={log.id}
              className="p-4 transition-all hover:bg-white/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {isLift && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{
                        backgroundColor: 'rgba(0, 180, 216, 0.2)',
                        color: '#00B4D8',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontWeight: 600
                      }}>
                        LIFT
                      </span>
                    )}
                    <h3 className="text-base font-semibold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      {isLift ? (log.lifts?.name || 'Unknown Lift') : (log.runs?.name || 'Unknown Run')}
                    </h3>
                    {!isLift && log.runs?.difficulty && (
                      <DifficultyBadge difficulty={log.runs.difficulty} region={profile?.difficulty_region} />
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    <span className="flex items-center gap-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      <TrendingUp size={14} />
                      {isLift
                        ? `+${(log.lifts?.vertical_ft || 0).toLocaleString()} ft`
                        : `${(log.runs?.vertical_ft || 0).toLocaleString()} ft`
                      }
                    </span>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {format(new Date(log.logged_at), 'h:mm a')}
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>
          );
        })}
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
          const filteredDayLogs = filterLogs(dayData.logs);

          if (filteredDayLogs.length === 0 && (searchQuery || selectedDifficulty !== 'all' || selectedType !== 'all')) {
            return null;
          }

          return (
            <GlassCard
              key={dateStr}
              className="overflow-hidden"
              data-testid={`day-card-${dateStr}`}
            >
              {/* Day Header - Always visible */}
              <div
                className="p-4 transition-all hover:bg-white/10 flex items-center justify-between"
              >
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => toggleDayExpansion(dateStr)}
                >
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
                      {filteredDayLogs.length} runs
                    </span>
                    <span className="flex items-center gap-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      <TrendingUp size={14} />
                      {filteredDayLogs.reduce((sum, log) => {
                        if (log.log_type === 'lift') {
                          return sum + (log.lifts?.vertical_ft || 0);
                        }
                        return sum;
                      }, 0).toLocaleString()} ft
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Delete Day Button (Edit Mode) */}
                  {isEditMode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBulkDeleteDay(dateStr);
                      }}
                      className="p-2 rounded-lg transition-all hover:scale-110"
                      style={{
                        backgroundColor: 'rgba(255, 23, 68, 0.1)',
                        color: '#FF1744'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}

                  <button
                    onClick={() => toggleDayExpansion(dateStr)}
                    className="p-2"
                  >
                    <ChevronDown
                      size={20}
                      style={{
                        color: 'rgba(255,255,255,0.3)',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease'
                      }}
                    />
                  </button>
                </div>
              </div>

              {/* Expanded Logs List - NEW: Hierarchical Display */}
              {isExpanded && (
                <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  {filteredDayLogs.map((log, idx) => {
                    const isLift = log.log_type === 'lift';
                    const hasChildren = log.children && log.children.length > 0;

                    return (
                      <div key={log.id}>
                        {/* Parent Log (Lift or Orphaned Run) */}
                        <div
                          className="px-4 py-3 flex items-center justify-between"
                          draggable={!isLift && isEditMode}
                          onDragStart={(e) => handleDragStart(e, log)}
                          onDragOver={(e) => isLift && handleDragOver(e, log)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => isLift && handleDrop(e, log)}
                          style={{
                            backgroundColor: isLift
                              ? (dragOverLiftId === log.id ? 'rgba(0, 180, 216, 0.15)' : 'rgba(0, 180, 216, 0.05)')
                              : (idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'),
                            borderLeft: isLift ? '3px solid #00B4D8' : 'none',
                            paddingLeft: isLift ? '13px' : '16px',
                            cursor: !isLift && isEditMode ? 'grab' : 'default',
                            transition: 'background-color 0.2s ease',
                            border: dragOverLiftId === log.id ? '2px dashed #00B4D8' : undefined
                          }}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex items-center gap-2">
                              {!isLift && isEditMode && (
                                <GripVertical size={16} style={{ color: 'rgba(255,255,255,0.3)', cursor: 'grab' }} />
                              )}
                              {isLift && (
                                <span className="text-xs px-2 py-0.5 rounded-full" style={{
                                  backgroundColor: 'rgba(0, 180, 216, 0.2)',
                                  color: '#00B4D8',
                                  fontFamily: 'JetBrains Mono, monospace',
                                  fontWeight: 600
                                }}>
                                  LIFT
                                </span>
                              )}
                              <span className={`text-sm ${isLift ? 'font-semibold' : ''}`} style={{
                                color: isLift ? '#00B4D8' : '#FFFFFF',
                                fontFamily: 'Manrope, sans-serif'
                              }}>
                                {isLift ? (log.lifts?.name || 'Unknown Lift') : (log.runs?.name || 'Unknown Run')}
                              </span>
                              {!isLift && log.runs?.difficulty && (
                                <DifficultyBadge difficulty={log.runs.difficulty} region={profile?.difficulty_region} size="sm" />
                              )}
                              {hasChildren && (
                                <span className="text-xs" style={{
                                  color: 'rgba(255,255,255,0.5)',
                                  fontFamily: 'JetBrains Mono, monospace'
                                }}>
                                  • {log.children.length} run{log.children.length !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold" style={{
                              color: isLift ? '#00B4D8' : 'rgba(255,255,255,0.5)',
                              fontFamily: 'JetBrains Mono, monospace'
                            }}>
                              {isLift
                                ? `+${(log.lifts?.vertical_ft || 0).toLocaleString()} ft`
                                : `${(log.runs?.vertical_ft || 0).toLocaleString()} ft`
                              }
                            </span>
                            {/* Edit/Delete Controls (Edit Mode) */}
                            {isEditMode && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleEditLog(log)}
                                  className="p-1.5 rounded-lg transition-all hover:scale-110"
                                  style={{
                                    backgroundColor: 'rgba(0, 180, 216, 0.1)',
                                    color: '#00B4D8'
                                  }}
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteSingleLog(log.id, isLift ? (log.lifts?.name || 'lift') : (log.runs?.name || 'run'))}
                                  className="p-1.5 rounded-lg transition-all hover:scale-110"
                                  style={{
                                    backgroundColor: 'rgba(255, 23, 68, 0.1)',
                                    color: '#FF1744'
                                  }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Child Runs (nested under lift) */}
                        {hasChildren && log.children.map((childLog) => (
                          <div
                            key={childLog.id}
                            className="px-4 py-2.5 flex items-center justify-between"
                            draggable={isEditMode}
                            onDragStart={(e) => handleDragStart(e, childLog)}
                            style={{
                              backgroundColor: 'rgba(255,255,255,0.02)',
                              borderLeft: '3px solid rgba(0, 180, 216, 0.3)',
                              marginLeft: '20px',
                              paddingLeft: '20px',
                              cursor: isEditMode ? 'grab' : 'default'
                            }}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="flex items-center gap-2">
                                {isEditMode && (
                                  <GripVertical size={14} style={{ color: 'rgba(255,255,255,0.25)', cursor: 'grab' }} />
                                )}
                                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>└</span>
                                <span className="text-sm" style={{
                                  color: 'rgba(255,255,255,0.8)',
                                  fontFamily: 'Manrope, sans-serif'
                                }}>
                                  {childLog.runs?.name || 'Unknown Run'}
                                </span>
                                {childLog.runs?.difficulty && (
                                  <DifficultyBadge difficulty={childLog.runs.difficulty} region={profile?.difficulty_region} size="sm" />
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs" style={{
                                color: 'rgba(255,255,255,0.4)',
                                fontFamily: 'JetBrains Mono, monospace'
                              }}>
                                {(childLog.runs?.vertical_ft || 0).toLocaleString()} ft
                              </span>
                              {/* Edit/Delete Controls for child runs */}
                              {isEditMode && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleEditLog(childLog)}
                                    className="p-1.5 rounded-lg transition-all hover:scale-110"
                                    style={{
                                      backgroundColor: 'rgba(0, 180, 216, 0.1)',
                                      color: '#00B4D8'
                                    }}
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSingleLog(childLog.id, childLog.runs?.name || 'run')}
                                    className="p-1.5 rounded-lg transition-all hover:scale-110"
                                    style={{
                                      backgroundColor: 'rgba(255, 23, 68, 0.1)',
                                      color: '#FF1744'
                                    }}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}

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
      <OfflineBanner />

      <div className="p-6">
        {/* Cached data banner */}
        {isShowingCached && (
          <div style={{
            background: 'rgba(255,165,0,0.1)',
            border: '1px solid rgba(255,165,0,0.2)',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '12px',
            color: 'rgba(255,165,0,0.8)',
            marginBottom: '16px',
            fontFamily: 'Manrope, sans-serif'
          }}>
            ⚡ Showing last synced data
          </div>
        )}
        {/* Page Title with Edit Button */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
            <span style={{ color: '#00B4D8' }}>{userName}</span> — Your mountain legacy. 🧭
          </h1>
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105"
            style={{
              backgroundColor: isEditMode ? 'rgba(255, 23, 68, 0.1)' : 'rgba(0, 180, 216, 0.1)',
              color: isEditMode ? '#FF1744' : '#00B4D8',
              border: `1px solid ${isEditMode ? '#FF1744' : '#00B4D8'}`,
              fontFamily: 'Manrope, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isEditMode ? (
              <>
                <X size={14} />
                Done
              </>
            ) : (
              <>
                <Edit2 size={14} />
                Edit
              </>
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.4)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search runs..."
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white border-0 outline-none"
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              fontFamily: 'Manrope, sans-serif',
              border: '1px solid rgba(255,255,255,0.08)'
            }}
          />
        </div>

        {/* Filter Chips - Difficulty */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-2">
            <FilterChip label="All" active={selectedDifficulty === 'all'} onClick={() => setSelectedDifficulty('all')} />
            <FilterChip label="Green" active={selectedDifficulty === 'green'} onClick={() => setSelectedDifficulty(selectedDifficulty === 'green' ? 'all' : 'green')} color="#4CAF50" />
            <FilterChip label="Blue" active={selectedDifficulty === 'blue'} onClick={() => setSelectedDifficulty(selectedDifficulty === 'blue' ? 'all' : 'blue')} color="#2196F3" />
            <FilterChip label="Black" active={selectedDifficulty === 'black'} onClick={() => setSelectedDifficulty(selectedDifficulty === 'black' ? 'all' : 'black')} color="#000000" />
            <FilterChip label="Double Black ◆◆" active={selectedDifficulty === 'double-black'} onClick={() => setSelectedDifficulty(selectedDifficulty === 'double-black' ? 'all' : 'double-black')} color="#000000" />
          </div>
        </div>

        {/* Filter Chips - Type */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            <FilterChip label="All" active={selectedType === 'all'} onClick={() => setSelectedType('all')} />
            <FilterChip label="Groomed" active={selectedType === 'groomed'} onClick={() => setSelectedType(selectedType === 'groomed' ? 'all' : 'groomed')} />
            <FilterChip label="Moguls" active={selectedType === 'moguls'} onClick={() => setSelectedType(selectedType === 'moguls' ? 'all' : 'moguls')} />
            <FilterChip label="Trees" active={selectedType === 'trees'} onClick={() => setSelectedType(selectedType === 'trees' ? 'all' : 'trees')} />
          </div>
        </div>

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
            <h2 className="text-lg font-bold text-white mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Trail Map
            </h2>
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

      {/* Edit Log Modal */}
      {editingLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setEditingLog(null)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <GlassCard
            className="relative w-full max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Edit Log: {editingLog.runs?.name || 'Run'}
              </h3>
              <button
                onClick={() => setEditingLog(null)}
                className="p-1 rounded-lg transition-all hover:bg-white/10"
              >
                <X size={20} style={{ color: 'rgba(255,255,255,0.6)' }} />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Date/Time */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={editFormData.logged_at}
                  onChange={(e) => setEditFormData({ ...editFormData, logged_at: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-white border-0 outline-none"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    fontFamily: 'Manrope, sans-serif',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}
                />
              </div>

              {/* Snow Condition */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Snow Condition
                </label>
                <select
                  value={editFormData.snow_condition}
                  onChange={(e) => setEditFormData({ ...editFormData, snow_condition: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-white border-0 outline-none"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    fontFamily: 'Manrope, sans-serif',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}
                >
                  <option value="">Select condition...</option>
                  <option value="powder">Powder</option>
                  <option value="packed">Packed</option>
                  <option value="icy">Icy</option>
                  <option value="slush">Slush</option>
                  <option value="groomed">Groomed</option>
                  <option value="crud">Crud</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Notes
                </label>
                <textarea
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="Add notes about this run..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg text-white border-0 outline-none resize-none"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    fontFamily: 'Manrope, sans-serif',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingLog(null)}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all hover:bg-white/10"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.7)',
                  fontFamily: 'Manrope, sans-serif'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
                style={{
                  backgroundColor: '#00B4D8',
                  color: '#000000',
                  fontFamily: 'Manrope, sans-serif'
                }}
              >
                Save Changes
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      <Footer />
      <BottomNav />
    </div>
  );
}
