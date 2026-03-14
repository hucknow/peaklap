import { useState, useEffect, useRef } from 'react';
import { GlassCard } from './GlassCard';
import { DifficultyBadge } from './DifficultyBadge';
import { Check, Target, ChevronDown, ChevronRight, TrendingUp, RotateCcw } from 'lucide-react';

// Status colors
const STATUS_COLORS = {
  today: '#00E676',     // Green - logged today
  season: '#FFD700',    // Gold - logged this season
  historical: '#6B7280', // Grey - logged before this season
  never: '#FFFFFF'      // White - never logged
};

// Filter options
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'season', label: 'Season' },
  { key: 'lifetime', label: 'Lifetime' },
  { key: 'never', label: 'Never Skied' }
];

export function RunChecklist({
  groupedRuns,
  getRunStatus,
  isInBucketList,
  getTodayCount,
  onLogRun,
  onRunTap,
  filter,
  setFilter,
  onLogLastAgain,
  lastRun,
  region,
  isLoading
}) {
  const [collapsedZones, setCollapsedZones] = useState(new Set());
  const initializedRef = useRef(false);
  const prevZonesRef = useRef('');
  
  // Collapse all zones on initial load or when zones change (e.g., resort change)
  useEffect(() => {
    const zones = Object.keys(groupedRuns);
    const zonesKey = zones.sort().join(',');
    
    // Only reset if zones have actually changed (different resort) or first load
    if (!initializedRef.current || zonesKey !== prevZonesRef.current) {
      setCollapsedZones(new Set(zones));
      prevZonesRef.current = zonesKey;
      initializedRef.current = true;
    }
  }, [groupedRuns]);

  const toggleZone = (zone) => {
    setCollapsedZones(prev => {
      const next = new Set(prev);
      if (next.has(zone)) {
        next.delete(zone);
      } else {
        next.add(zone);
      }
      return next;
    });
  };

  const getStatusDot = (status) => {
    return (
      <div 
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ 
          backgroundColor: STATUS_COLORS[status],
          boxShadow: status === 'today' ? '0 0 8px #00E676' : 
                     status === 'season' ? '0 0 8px #FFD700' : 'none'
        }}
      />
    );
  };

  const zones = Object.keys(groupedRuns);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-12 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all"
            style={{
              backgroundColor: filter === f.key ? '#00B4D8' : 'rgba(255,255,255,0.05)',
              color: filter === f.key ? '#000' : 'rgba(255,255,255,0.7)',
              fontFamily: 'Manrope, sans-serif'
            }}
            data-testid={`filter-${f.key}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Log Last Run Again */}
      {lastRun && (
        <button
          onClick={onLogLastAgain}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-all hover:bg-white/10"
          style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px dashed rgba(255,255,255,0.2)'
          }}
          data-testid="log-last-again"
        >
          <RotateCcw size={16} style={{ color: '#00B4D8' }} />
          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'Manrope, sans-serif' }}>
            Log "{lastRun.runs?.name || 'Last Run'}" Again
          </span>
        </button>
      )}

      {/* Status Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          {getStatusDot('today')}
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Today</span>
        </div>
        <div className="flex items-center gap-1.5">
          {getStatusDot('season')}
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>This Season</span>
        </div>
        <div className="flex items-center gap-1.5">
          {getStatusDot('historical')}
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Past Season</span>
        </div>
        <div className="flex items-center gap-1.5">
          {getStatusDot('never')}
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Never</span>
        </div>
      </div>

      {/* Run List by Zone */}
      {zones.length === 0 ? (
        <GlassCard className="p-6 text-center">
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            No runs match your filter
          </p>
        </GlassCard>
      ) : (
        zones.map(zone => (
          <div key={zone}>
            {/* Zone Header */}
            <button
              onClick={() => toggleZone(zone)}
              className="w-full flex items-center justify-between p-3 rounded-xl mb-2 transition-all hover:bg-white/10"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {zone}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ 
                  backgroundColor: 'rgba(0, 180, 216, 0.2)',
                  color: '#00B4D8'
                }}>
                  {groupedRuns[zone].length}
                </span>
              </div>
              {collapsedZones.has(zone) ? (
                <ChevronRight size={18} style={{ color: 'rgba(255,255,255,0.5)' }} />
              ) : (
                <ChevronDown size={18} style={{ color: '#00B4D8' }} />
              )}
            </button>

            {/* Runs in Zone */}
            {!collapsedZones.has(zone) && (
              <div className="space-y-2 pl-2">
                {groupedRuns[zone].map(run => {
                  const status = getRunStatus(run.id);
                  const inBucket = isInBucketList(run.id);
                  const todayCount = getTodayCount(run.id);

                  return (
                    <div
                      key={run.id}
                      className="flex items-center gap-3 p-3 rounded-xl transition-all"
                      style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                      data-testid={`run-item-${run.id}`}
                    >
                      {/* Status Indicator */}
                      {getStatusDot(status)}

                      {/* Run Info - Tappable */}
                      <button
                        onClick={() => onRunTap(run)}
                        className="flex-1 text-left min-w-0"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-white truncate" style={{ fontFamily: 'Manrope, sans-serif' }}>
                            {run.name}
                          </span>
                          {inBucket && (
                            <Target size={14} style={{ color: '#FF1744' }} />
                          )}
                          {todayCount > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ 
                              backgroundColor: 'rgba(0, 230, 118, 0.2)',
                              color: '#00E676'
                            }}>
                              ×{todayCount}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {run.difficulty && (
                            <DifficultyBadge difficulty={run.difficulty} region={region} />
                          )}
                          {run.vertical_ft && (
                            <span className="text-[10px] flex items-center gap-1" style={{ 
                              color: 'rgba(255,255,255,0.5)',
                              fontFamily: 'JetBrains Mono, monospace'
                            }}>
                              <TrendingUp size={10} />
                              {run.vertical_ft.toLocaleString()} ft
                            </span>
                          )}
                        </div>
                      </button>

                      {/* Log Button */}
                      <button
                        onClick={() => onLogRun(run.id)}
                        className="p-3 rounded-full transition-all hover:scale-110"
                        style={{
                          backgroundColor: status === 'today' ? 'rgba(0, 230, 118, 0.2)' : 'rgba(0, 180, 216, 0.15)',
                          border: status === 'today' ? '2px solid #00E676' : '2px solid #00B4D8'
                        }}
                        data-testid={`log-run-${run.id}`}
                      >
                        <Check 
                          size={18} 
                          style={{ 
                            color: status === 'today' ? '#00E676' : '#00B4D8'
                          }} 
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
