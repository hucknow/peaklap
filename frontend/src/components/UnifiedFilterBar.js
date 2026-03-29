import { useState, useCallback } from 'react';
import { GlassCard } from './GlassCard';
import { Search, Mountain, ListFilter as Filter } from 'lucide-react';

export function UnifiedFilterBar({
  searchQuery = '',
  onSearchChange,
  selectedMountain = 'all',
  onMountainChange,
  mountains = [],
  selectedDifficulty = 'all',
  onDifficultyChange,
  selectedType = 'all',
  onTypeChange,
  selectedHistoryTag = 'all',
  onHistoryTagChange,
  showMountainFilter = true,
  showDifficultyFilter = true,
  showTypeFilter = true,
  showHistoryFilter = false,
  region = 'NA',
  placeholder = 'Search runs or lifts...'
}) {
  const [showFilters, setShowFilters] = useState(false);

  const difficultyOptions = region === 'EU'
    ? [
        { value: 'all', label: 'All' },
        { value: 'green', label: 'Green' },
        { value: 'blue', label: 'Blue' },
        { value: 'red', label: 'Red' },
        { value: 'black', label: 'Black' }
      ]
    : [
        { value: 'all', label: 'All' },
        { value: 'green', label: 'Green' },
        { value: 'blue', label: 'Blue' },
        { value: 'black', label: 'Black' },
        { value: 'double-black', label: 'Double Black' }
      ];

  const typeOptions = [
    { value: 'all', label: 'All' },
    { value: 'runs', label: 'Runs' },
    { value: 'lifts', label: 'Lifts' },
    { value: 'groomed', label: 'Groomed' },
    { value: 'moguls', label: 'Moguls' },
    { value: 'trees', label: 'Trees' }
  ];

  const historyOptions = [
    { value: 'all', label: 'All' },
    { value: 'today', label: 'Today' },
    { value: 'season', label: 'Season' },
    { value: 'lifetime', label: 'Lifetime' },
    { value: 'never', label: 'Never Skied' }
  ];

  const hasActiveFilters = selectedMountain !== 'all' ||
                          selectedDifficulty !== 'all' ||
                          selectedType !== 'all' ||
                          (showHistoryFilter && selectedHistoryTag !== 'all');

  return (
    <div className="space-y-3">
      {/* Search Bar with Filter Toggle */}
      <GlassCard className="p-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2">
            <Search size={18} style={{ color: 'rgba(255,255,255,0.4)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-transparent border-none outline-none text-white text-sm"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            />
          </div>
          {(showMountainFilter || showDifficultyFilter || showTypeFilter || showHistoryFilter) && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 rounded-lg transition-all hover:bg-white/10"
              style={{
                backgroundColor: hasActiveFilters ? 'rgba(0, 180, 216, 0.15)' : 'transparent'
              }}
            >
              <Filter
                size={18}
                style={{ color: hasActiveFilters ? '#00B4D8' : 'rgba(255,255,255,0.4)' }}
              />
            </button>
          )}
        </div>
      </GlassCard>

      {/* Filter Options - Expanded */}
      {showFilters && (
        <GlassCard className="p-4 space-y-4 animate-in slide-in-from-top-2">
          {/* Mountain Filter */}
          {showMountainFilter && mountains.length > 1 && (
            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Mountain
              </label>
              <div className="flex flex-wrap gap-2">
                <FilterChip
                  label="All"
                  active={selectedMountain === 'all'}
                  onClick={() => onMountainChange?.('all')}
                />
                {mountains.map((mountain) => (
                  <FilterChip
                    key={mountain.value}
                    label={mountain.label}
                    active={selectedMountain === mountain.value}
                    onClick={() => onMountainChange?.(mountain.value)}
                    icon={<Mountain size={12} />}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Difficulty Filter */}
          {showDifficultyFilter && (
            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Difficulty
              </label>
              <div className="flex flex-wrap gap-2">
                {difficultyOptions.map((option) => (
                  <FilterChip
                    key={option.value}
                    label={option.label}
                    active={selectedDifficulty === option.value}
                    onClick={() => onDifficultyChange?.(option.value)}
                    color={getDifficultyColor(option.value)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Type Filter */}
          {showTypeFilter && (
            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Type
              </label>
              <div className="flex flex-wrap gap-2">
                {typeOptions.map((option) => (
                  <FilterChip
                    key={option.value}
                    label={option.label}
                    active={selectedType === option.value}
                    onClick={() => onTypeChange?.(option.value)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* History Tag Filter */}
          {showHistoryFilter && (
            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: 'rgba(255,255,255,0.6)' }}>
                History
              </label>
              <div className="flex flex-wrap gap-2">
                {historyOptions.map((option) => (
                  <FilterChip
                    key={option.value}
                    label={option.label}
                    active={selectedHistoryTag === option.value}
                    onClick={() => onHistoryTagChange?.(option.value)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Clear All Button */}
          {hasActiveFilters && (
            <button
              onClick={() => {
                onMountainChange?.('all');
                onDifficultyChange?.('all');
                onTypeChange?.('all');
                onHistoryTagChange?.('all');
              }}
              className="w-full py-2 rounded-lg text-sm font-medium transition-all hover:bg-white/10"
              style={{ color: '#00B4D8', fontFamily: 'Manrope, sans-serif' }}
            >
              Clear All Filters
            </button>
          )}
        </GlassCard>
      )}
    </div>
  );
}

function FilterChip({ label, active, onClick, icon, color }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105"
      style={{
        backgroundColor: active
          ? color || 'rgba(0, 180, 216, 0.2)'
          : 'rgba(255,255,255,0.05)',
        color: active
          ? color ? '#FFFFFF' : '#00B4D8'
          : 'rgba(255,255,255,0.6)',
        border: active
          ? `1px solid ${color || '#00B4D8'}`
          : '1px solid transparent',
        fontFamily: 'Manrope, sans-serif',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function getDifficultyColor(difficulty) {
  switch (difficulty) {
    case 'green':
      return 'rgba(76, 175, 80, 0.3)';
    case 'blue':
      return 'rgba(33, 150, 243, 0.3)';
    case 'red':
      return 'rgba(244, 67, 54, 0.3)';
    case 'black':
      return 'rgba(0, 0, 0, 0.5)';
    case 'double-black':
      return 'rgba(0, 0, 0, 0.7)';
    default:
      return null;
  }
}
