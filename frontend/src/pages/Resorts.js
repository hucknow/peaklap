import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useResort } from '@/contexts/ResortContext';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { GlassCard } from '@/components/GlassCard';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import { TrailMap } from '@/components/TrailMap';
import { supabase } from '@/lib/supabase';
import { Search, Heart, Mountain, Check } from 'lucide-react';

// Status colors matching RunChecklist
const STATUS_COLORS = {
  today: '#00E676',     // Green - logged today
  season: '#FFD700',    // Gold - logged this season
  historical: '#6B7280', // Grey - logged before this season
  never: 'transparent'
};

// Status filter options (same as Log page)
const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'season', label: 'Season' },
  { key: 'lifetime', label: 'Lifetime' },
  { key: 'never', label: 'Never Skied' }
];

// Helper to check if date is today
const isToday = (date) => {
  const today = new Date();
  const checkDate = new Date(date);
  return today.toDateString() === checkDate.toDateString();
};

// Helper to check if date is this season (Oct 1 - Apr 30)
const isThisSeason = (date) => {
  const checkDate = new Date(date);
  const now = new Date();
  
  let seasonStart;
  if (now.getMonth() >= 9) {
    seasonStart = new Date(now.getFullYear(), 9, 1);
  } else {
    seasonStart = new Date(now.getFullYear() - 1, 9, 1);
  }
  
  return checkDate >= seasonStart;
};

export default function Resorts() {
  const { profile } = useAuth();
  const { selectedResort } = useResort();
  const navigate = useNavigate();
  
  // View mode state
  const [viewMode, setViewMode] = useState('runs');
  
  // Runs state
  const [runs, setRuns] = useState([]);
  const [filteredRuns, setFilteredRuns] = useState([]);
  const [bucketListIds, setBucketListIds] = useState([]);
  const [userLogs, setUserLogs] = useState([]);
  
  // Lifts state
  const [lifts, setLifts] = useState([]);
  const [filteredLifts, setFilteredLifts] = useState([]);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [mountainFilter, setMountainFilter] = useState('');
  const [runTypeFilter, setRunTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Refs to prevent duplicate fetches
  const runsLoadedForRef = useRef(null);
  const liftsLoadedForRef = useRef(null);
  const bucketLoadedRef = useRef(false);
  const logsLoadedRef = useRef(false);

  // Get unique mountains/zones from runs
  const mountains = useMemo(() => {
    const zones = new Set();
    runs.forEach(run => {
      if (run.zone) {
        const zone = run.zone.toLowerCase();
        if (zone.includes('peak') || zone.includes('harmony') || zone.includes('symphony') || 
            zone.includes('west bowl') || zone.includes('flute')) {
          zones.add('Whistler');
        }
        else if (zone.includes('glacier') || zone.includes('7th heaven') || zone.includes('showcase') ||
                 zone.includes('crystal') || zone.includes('garbanzo') || zone.includes('jersey cream') ||
                 zone.includes('blackcomb')) {
          zones.add('Blackcomb');
        }
        else {
          const parts = run.zone.split(/[-–]/);
          if (parts.length > 1) {
            zones.add(parts[0].trim());
          }
        }
      }
    });
    return Array.from(zones).sort();
  }, [runs]);

  const hasMultipleMountains = mountains.length > 1;

  const loadRuns = useCallback(async () => {
    if (!selectedResort?.id) return;
    if (runsLoadedForRef.current === selectedResort.id) return;
    
    const { data } = await supabase
      .from('runs')
      .select('*')
      .eq('ski_area_id', selectedResort.id)
      .order('name');
    
    if (data) {
      setRuns(data);
      runsLoadedForRef.current = selectedResort.id;
    }
  }, [selectedResort?.id]);

  const loadLifts = useCallback(async () => {
    if (!selectedResort?.id) return;
    if (liftsLoadedForRef.current === selectedResort.id) return;
    
    const { data } = await supabase
      .from('lifts')
      .select('*')
      .eq('ski_area_id', selectedResort.id)
      .order('name');
    
    if (data) {
      setLifts(data);
      liftsLoadedForRef.current = selectedResort.id;
    }
  }, [selectedResort?.id]);

  const loadBucketList = useCallback(async () => {
    if (!profile?.id) return;
    if (bucketLoadedRef.current) return;
    
    const { data } = await supabase
      .from('bucket_list')
      .select('run_id')
      .eq('user_id', profile.id);
    
    if (data) {
      setBucketListIds(data.map(item => item.run_id));
      bucketLoadedRef.current = true;
    }
  }, [profile?.id]);

  const loadUserLogs = useCallback(async () => {
    if (!profile?.id) return;
    if (logsLoadedRef.current) return;
    
    const { data } = await supabase
      .from('user_logs')
      .select('run_id, logged_at')
      .eq('user_id', profile.id)
      .order('logged_at', { ascending: false });
    
    if (data) {
      setUserLogs(data);
      logsLoadedRef.current = true;
    }
  }, [profile?.id]);

  // Get run status based on user logs
  const getRunStatus = useCallback((runId) => {
    const runLogs = userLogs.filter(log => log.run_id === runId);
    
    if (runLogs.length === 0) return 'never';
    if (runLogs.some(log => isToday(log.logged_at))) return 'today';
    if (runLogs.some(log => isThisSeason(log.logged_at))) return 'season';
    return 'historical';
  }, [userLogs]);

  useEffect(() => {
    if (selectedResort?.id) {
      if (runsLoadedForRef.current !== selectedResort.id) {
        runsLoadedForRef.current = null;
        liftsLoadedForRef.current = null;
      }
      loadRuns();
      loadLifts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedResort?.id]);

  useEffect(() => {
    if (profile?.id) {
      loadBucketList();
      loadUserLogs();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  useEffect(() => {
    if (viewMode === 'runs') {
      filterRuns();
    } else {
      filterLifts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runs, lifts, searchQuery, difficultyFilter, mountainFilter, runTypeFilter, statusFilter, viewMode, userLogs]);

  const filterRuns = () => {
    let filtered = runs;

    if (searchQuery) {
      filtered = filtered.filter(run => 
        run.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (difficultyFilter) {
      filtered = filtered.filter(run => run.difficulty === difficultyFilter);
    }

    if (runTypeFilter) {
      filtered = filtered.filter(run => run.piste_type === runTypeFilter || run.run_type === runTypeFilter);
    }

    if (mountainFilter) {
      const whistlerZones = ['peak', 'harmony', 'symphony', 'west bowl', 'flute'];
      const blackcombZones = ['glacier', '7th heaven', 'showcase', 'crystal', 'garbanzo', 'jersey cream', 'blackcomb'];
      
      if (mountainFilter === 'Whistler') {
        filtered = filtered.filter(run => 
          run.zone && whistlerZones.some(z => run.zone.toLowerCase().includes(z))
        );
      } else if (mountainFilter === 'Blackcomb') {
        filtered = filtered.filter(run => 
          run.zone && blackcombZones.some(z => run.zone.toLowerCase().includes(z))
        );
      } else {
        filtered = filtered.filter(run => 
          run.zone && run.zone.toLowerCase().includes(mountainFilter.toLowerCase())
        );
      }
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(run => {
        const status = getRunStatus(run.id);
        if (statusFilter === 'today') return status === 'today';
        if (statusFilter === 'season') return status === 'season' || status === 'today';
        if (statusFilter === 'lifetime') return status !== 'never';
        if (statusFilter === 'never') return status === 'never';
        return true;
      });
    }

    setFilteredRuns(filtered);
  };

  const filterLifts = () => {
    let filtered = lifts;
    if (searchQuery) {
      filtered = filtered.filter(lift => 
        lift.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredLifts(filtered);
  };

  const toggleBucketList = async (runId) => {
    if (!profile) return;
    try {
      if (bucketListIds.includes(runId)) {
        const { error } = await supabase
          .from('bucket_list')
          .delete()
          .eq('user_id', profile.id)
          .eq('run_id', runId);
        if (!error) setBucketListIds(bucketListIds.filter(id => id !== runId));
      } else {
        const { error } = await supabase
          .from('bucket_list')
          .insert({ user_id: profile.id, run_id: runId });
        if (!error) setBucketListIds([...bucketListIds, runId]);
      }
    } catch (err) {
      console.error('Error toggling bucket list:', err);
    }
  };

  const StatusBadge = ({ status }) => {
    if (status === 'never') return null;
    const labels = { today: 'Today', season: 'This Season', historical: 'Past Season' };
    return (
      <span 
        className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
        style={{ 
          backgroundColor: `${STATUS_COLORS[status]}20`,
          color: STATUS_COLORS[status],
          border: `1px solid ${STATUS_COLORS[status]}40`
        }}
      >
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#12181B' }}>
      <Header />
      
      <div className="px-6 pt-4">
        {selectedResort && (
          <div className="mb-4">
            <GlassCard className="px-4 py-3">
              <div className="flex items-center gap-3">
                <Mountain size={24} style={{ color: '#00B4D8' }} />
                <div>
                  <div className="text-lg font-semibold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    {selectedResort.name}
                  </div>
                  {selectedResort.region && (
                    <div className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {selectedResort.region}, {selectedResort.country}
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {selectedResort && (
          <div className="mb-4">
            <TrailMap 
              resort={selectedResort}
              minHeight={300}
              maxHeight={500}
              labelText={selectedResort.name}
              showLabel={true}
            />
          </div>
        )}

        {!selectedResort && (
          <div className="text-center py-12">
            <Mountain size={48} className="mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.2)' }} />
            <p className="text-white/60" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Tap the resort chip in the header to select a resort
            </p>
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('runs')}
              className="flex-1 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                backgroundColor: viewMode === 'runs' ? '#00B4D8' : 'rgba(255,255,255,0.05)',
                color: viewMode === 'runs' ? '#000000' : 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(255,255,255,0.08)',
                fontFamily: 'Manrope, sans-serif'
              }}
            >
              Runs ({runs.length})
            </button>
            <button
              onClick={() => setViewMode('lifts')}
              className="flex-1 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                backgroundColor: viewMode === 'lifts' ? '#00B4D8' : 'rgba(255,255,255,0.05)',
                color: viewMode === 'lifts' ? '#000000' : 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(255,255,255,0.08)',
                fontFamily: 'Manrope, sans-serif'
              }}
            >
              Lifts ({lifts.length})
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.4)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${viewMode}...`}
            className="w-full pl-10 pr-4 py-3 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
            style={{ backgroundColor: '#1A2126', color: 'white' }}
          />
        </div>

        {/* Filters (only for runs view) */}
        {viewMode === 'runs' && (
        <div className="space-y-3 mb-4">
          {/* Row 1: Mountain, Difficulty, Type - all on one row */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {/* Mountain filters (if multiple) */}
            {hasMultipleMountains && mountains.map((mountain) => (
              <button
                key={mountain}
                onClick={() => setMountainFilter(mountainFilter === mountain ? '' : mountain)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1"
                style={{
                  backgroundColor: mountainFilter === mountain ? '#00B4D8' : 'rgba(255,255,255,0.05)',
                  color: mountainFilter === mountain ? '#000000' : 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  fontFamily: 'Manrope, sans-serif'
                }}
              >
                <Mountain size={10} />
                {mountain}
              </button>
            ))}
            
            {/* Divider if mountains exist */}
            {hasMultipleMountains && (
              <div className="w-px h-6 my-auto" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
            )}
            
            {/* Difficulty filters */}
            {['easy', 'intermediate', 'advanced', 'expert'].map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficultyFilter(difficultyFilter === diff ? '' : diff)}
                className={`transition-all ${difficultyFilter === diff ? 'ring-2 ring-white' : ''}`}
              >
                <DifficultyBadge difficulty={diff} region={profile?.difficulty_region || 'NA'} />
              </button>
            ))}
            
            {/* Divider */}
            <div className="w-px h-6 my-auto" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
            
            {/* Run type filters */}
            {['groomed', 'moguls', 'trees'].map((type) => (
              <button
                key={type}
                onClick={() => setRunTypeFilter(runTypeFilter === type ? '' : type)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
                style={{
                  backgroundColor: runTypeFilter === type ? '#00B4D8' : 'rgba(255,255,255,0.05)',
                  color: runTypeFilter === type ? '#000000' : 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  fontFamily: 'Manrope, sans-serif'
                }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          {/* Row 2: My Status filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
                style={{
                  backgroundColor: statusFilter === f.key ? '#00B4D8' : 'rgba(255,255,255,0.05)',
                  color: statusFilter === f.key ? '#000000' : 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  fontFamily: 'Manrope, sans-serif'
                }}
              >
                {f.label}
                {f.key === 'today' && statusFilter !== 'today' && (
                  <span className="ml-1.5 w-2 h-2 rounded-full inline-block" style={{ backgroundColor: STATUS_COLORS.today }} />
                )}
                {f.key === 'season' && statusFilter !== 'season' && (
                  <span className="ml-1.5 w-2 h-2 rounded-full inline-block" style={{ backgroundColor: STATUS_COLORS.season }} />
                )}
              </button>
            ))}
          </div>
        </div>
        )}
      </div>

      {/* Content List */}
      <div className="px-6 space-y-3">
        {viewMode === 'runs' ? (
          filteredRuns.length === 0 ? (
          <GlassCard className="p-6 text-center">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
              No runs found. Try adjusting your filters.
            </p>
          </GlassCard>
        ) : (
          filteredRuns.map((run) => {
            const status = getRunStatus(run.id);
            return (
            <GlassCard 
              key={run.id} 
              className="p-4 cursor-pointer transition-all hover:bg-white/10"
              onClick={() => navigate(`/runs/${run.id}`)}
              style={{
                borderLeft: status !== 'never' ? `3px solid ${STATUS_COLORS[status]}` : undefined
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-base font-semibold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      {run.name}
                    </h3>
                    <StatusBadge status={status} />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {run.difficulty && (
                      <DifficultyBadge difficulty={run.difficulty} region={profile?.difficulty_region} />
                    )}
                    {run.zone && (
                      <span className="px-2 py-1 rounded text-[10px]" style={{ 
                        backgroundColor: 'rgba(255,255,255,0.1)', 
                        color: 'rgba(255,255,255,0.7)' 
                      }}>
                        {run.zone}
                      </span>
                    )}
                  </div>
                  {run.vertical_ft && (
                    <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {run.vertical_ft.toLocaleString()} ft vertical
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {status !== 'never' && (
                    <div 
                      className="p-2 rounded-full"
                      style={{ backgroundColor: `${STATUS_COLORS[status]}20` }}
                    >
                      <Check size={20} style={{ color: STATUS_COLORS[status] }} />
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBucketList(run.id);
                    }}
                    className="p-2"
                  >
                    <Heart 
                      size={20} 
                      style={{ color: bucketListIds.includes(run.id) ? '#FF1744' : 'rgba(255,255,255,0.3)' }}
                      fill={bucketListIds.includes(run.id) ? '#FF1744' : 'none'}
                    />
                  </button>
                </div>
              </div>
            </GlassCard>
          )})
        )
        ) : (
          filteredLifts.length === 0 ? (
            <GlassCard className="p-6 text-center">
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>No lifts found.</p>
            </GlassCard>
          ) : (
            filteredLifts.map((lift) => (
              <GlassCard key={lift.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-white mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      {lift.name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      {lift.lift_type && (
                        <span className="px-2 py-1 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                          {lift.lift_type.replace('_', ' ').toUpperCase()}
                        </span>
                      )}
                      {lift.capacity && (
                        <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          {lift.capacity}/hr
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: lift.is_open ? '#00E676' : '#FF1744' }}
                      />
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        {lift.is_open ? 'Open' : 'Closed'}
                      </span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))
          )
        )}
      </div>

      <BottomNav />
    </div>
  );
}
