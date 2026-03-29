import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useResort } from '@/contexts/ResortContext';
import { useRevenueCat } from '@/contexts/RevenueCatContext';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import Footer from '@/components/Footer';
import { GlassCard } from '@/components/GlassCard';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import { SubscriptionStatus } from '@/components/SubscriptionStatus';
import { supabase } from '@/lib/supabase';
import { isPlatform } from '@/lib/platform';
import { Minus, Plus, LogOut, Coffee, Lightbulb, Bug, ExternalLink, ChevronRight, Check, Mountain, Search, X, Heart, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// Difficulty options (without duplicate greens)
const DIFFICULTY_OPTIONS = [
  { value: 'novice', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
];

// Terrain style options (multi-select)
const TERRAIN_STYLE_OPTIONS = [
  { value: 'groomers', label: 'Groomers' },
  { value: 'trees', label: 'Trees' },
  { value: 'off-piste', label: 'Off-Piste/Bowls' },
  { value: 'park', label: 'Park' },
];

// Terrain area options (multi-select)
const TERRAIN_AREA_OPTIONS = [
  { value: 'inbounds', label: 'Inbounds' },
  { value: 'sidecountry', label: 'Side-country' },
  { value: 'backcountry', label: 'Backcountry' },
];

export default function Settings() {
  const { profile, updateProfile, signOut } = useAuth();
  const { selectedResort, setSelectedResort, primaryResort: contextPrimaryResort, clearCurrentResort } = useResort();
  const { isProUser, showCustomerCenter } = useRevenueCat();
  const navigate = useNavigate();
  const isMobile = isPlatform(['android', 'ios']);
  
  // Profile state
  const [username, setUsername] = useState(profile?.username || '');
  const [sport, setSport] = useState(profile?.sport || '');
  const [difficultyPreference, setDifficultyPreference] = useState(profile?.difficulty_preference || '');
  const [terrainStyles, setTerrainStyles] = useState([]);
  const [terrainAreas, setTerrainAreas] = useState([]);
  const [primaryResort, setPrimaryResort] = useState(null);
  
  // Goals state
  const [goalDays, setGoalDays] = useState(profile?.season_goal_days || 0);
  const [goalVertical, setGoalVertical] = useState(profile?.season_goal_vertical_ft || 0);
  const [region, setRegion] = useState(profile?.difficulty_region || 'NA');
  
  // UI state
  const [saving, setSaving] = useState(false);
  const [showResortPicker, setShowResortPicker] = useState(false);
  const [showBucketListPicker, setShowBucketListPicker] = useState(false);
  const [resorts, setResorts] = useState([]);
  const [resortSearchQuery, setResortSearchQuery] = useState('');
  const [suggestedRuns, setSuggestedRuns] = useState([]);
  const [bucketListIds, setBucketListIds] = useState([]);
  const [loadingRuns, setLoadingRuns] = useState(false);
  
  // Refs
  const resortsLoadedRef = useRef(false);
  const longPressTimerRef = useRef(null);
  const [longPressCount, setLongPressCount] = useState(0);

  // Parse terrain styles and areas from profile
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setSport(profile.sport || '');
      setDifficultyPreference(profile.difficulty_preference || '');
      setGoalDays(profile.season_goal_days || 0);
      setGoalVertical(profile.season_goal_vertical_ft || 0);
      setRegion(profile.difficulty_region || 'NA');
      
      // Parse terrain styles (stored as comma-separated or single value)
      if (profile.shred_style) {
        const styles = profile.shred_style.split(',').map(s => s.trim());
        // Map old values to new
        const mappedStyles = styles.map(s => {
          if (s === 'powder') return 'off-piste';
          if (s === 'backcountry') return null; // Remove backcountry from styles
          return s;
        }).filter(Boolean);
        setTerrainStyles(mappedStyles);
      }
      
      // Parse terrain areas
      if (profile.terrain_areas) {
        setTerrainAreas(profile.terrain_areas.split(',').map(s => s.trim()));
      }
      
      // Load primary resort from profile if not already loaded from context
      if (profile.primary_resort_id && !primaryResort) {
        loadPrimaryResort(profile.primary_resort_id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // Sync primary resort from context
  useEffect(() => {
    if (contextPrimaryResort && !primaryResort) {
      setPrimaryResort(contextPrimaryResort);
    }
  }, [contextPrimaryResort, primaryResort]);

  // Auto-calculate vertical goal based on days
  useEffect(() => {
    if (goalDays > 0 && goalVertical === 0) {
      setGoalVertical(goalDays * 8000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalDays]);

  const loadPrimaryResort = async (resortId) => {
    const { data } = await supabase
      .from('ski_areas')
      .select('*')
      .eq('id', resortId)
      .single();
    if (data) {
      setPrimaryResort(data);
    }
  };

  const loadResorts = useCallback(async () => {
    if (resortsLoadedRef.current) return;
    
    const { data } = await supabase
      .from('ski_areas')
      .select('*')
      .order('name');
    
    if (data) {
      setResorts(data);
      resortsLoadedRef.current = true;
    }
  }, []);

  const loadBucketList = useCallback(async () => {
    if (!profile?.id) return;
    
    const { data } = await supabase
      .from('bucket_list')
      .select('run_id')
      .eq('user_id', profile.id);
    
    if (data) {
      setBucketListIds(data.map(item => item.run_id));
    }
  }, [profile?.id]);

  const loadSuggestedRuns = useCallback(async () => {
    if (!primaryResort?.id) return;
    
    setLoadingRuns(true);
    
    // Build query for runs at primary resort
    let query = supabase
      .from('runs')
      .select('*, ski_areas(name)')
      .eq('ski_area_id', primaryResort.id)
      .limit(20);
    
    // Filter by difficulty preference if set
    if (difficultyPreference) {
      // Include the selected difficulty and one level below/above
      const difficultyMap = {
        'novice': ['novice', 'easy'],
        'intermediate': ['easy', 'intermediate'],
        'advanced': ['intermediate', 'advanced'],
        'expert': ['advanced', 'expert', 'freeride']
      };
      const difficulties = difficultyMap[difficultyPreference] || [difficultyPreference];
      query = query.in('difficulty', difficulties);
    }
    
    const { data } = await query;
    
    if (data) {
      // Sort by popularity (could be based on log count in a real app)
      setSuggestedRuns(data);
    }
    
    setLoadingRuns(false);
  }, [primaryResort?.id, difficultyPreference]);

  useEffect(() => {
    loadResorts();
    loadBucketList();
  }, [loadResorts, loadBucketList]);

  useEffect(() => {
    if (showBucketListPicker && primaryResort) {
      loadSuggestedRuns();
    }
  }, [showBucketListPicker, primaryResort, loadSuggestedRuns]);

  const toggleTerrainStyle = (value) => {
    setTerrainStyles(prev => 
      prev.includes(value) 
        ? prev.filter(s => s !== value)
        : [...prev, value]
    );
  };

  const toggleTerrainArea = (value) => {
    setTerrainAreas(prev => 
      prev.includes(value) 
        ? prev.filter(s => s !== value)
        : [...prev, value]
    );
  };

  const toggleBucketList = async (runId) => {
    if (!profile?.id) return;
    
    const isIn = bucketListIds.includes(runId);
    
    try {
      if (isIn) {
        const { error } = await supabase
          .from('bucket_list')
          .delete()
          .eq('user_id', profile.id)
          .eq('run_id', runId);
        
        if (!error) {
          setBucketListIds(prev => prev.filter(id => id !== runId));
        }
      } else {
        const { error } = await supabase
          .from('bucket_list')
          .insert({ user_id: profile.id, run_id: runId });
        
        if (!error) {
          setBucketListIds(prev => [...prev, runId]);
        }
      }
    } catch (err) {
      console.error('Error toggling bucket list:', err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    const { data, error } = await updateProfile({
      username,
      sport,
      difficulty_preference: difficultyPreference,
      shred_style: terrainStyles.join(','),
      terrain_areas: terrainAreas.join(','),
      primary_resort_id: primaryResort?.id || null,
      season_goal_days: goalDays,
      season_goal_vertical_ft: goalVertical,
      difficulty_region: region,
    });

    setSaving(false);

    if (error) {
      console.error('Failed to update settings:', error);
      toast.error(`Failed to update settings: ${error.message || error}`);
    } else {
      toast.success('Settings saved!');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleVersionPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    longPressTimerRef.current = setTimeout(() => {
      navigate('/admin/resort-loader');
    }, 3000);
  };

  const handleVersionRelease = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const filteredResorts = resorts.filter(resort =>
    resort.name.toLowerCase().includes(resortSearchQuery.toLowerCase())
  );

  // Get username for page title
  const userName = profile?.username || username || 'Rider';

  // Format preferences for display
  const getPreferenceSummary = () => {
    const parts = [];
    if (sport) parts.push(sport.charAt(0).toUpperCase() + sport.slice(1));
    if (difficultyPreference) {
      const diffLabel = DIFFICULTY_OPTIONS.find(d => d.value === difficultyPreference)?.label;
      if (diffLabel) parts.push(diffLabel);
    }
    if (terrainStyles.length > 0) {
      parts.push(terrainStyles.map(s => 
        TERRAIN_STYLE_OPTIONS.find(t => t.value === s)?.label || s
      ).join(', '));
    }
    return parts.length > 0 ? parts.join(' • ') : 'Not set';
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#12181B' }} data-testid="settings-page">
      <Header />
      
      <div className="p-6">
        {/* Page Title */}
        <h1 className="text-xl font-bold text-white mb-6" style={{ fontFamily: 'Manrope, sans-serif' }}>
          <span style={{ color: '#00B4D8' }}>{userName}</span> — Your mountain, Your setup, Your PeakLap. ⚙️
        </h1>

        <div className="space-y-6">
          {/* Profile Summary Card */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Profile
            </h2>
            <div className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium mb-2 text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Username
                </label>
                <input
                  data-testid="username-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your username"
                  className="w-full px-4 py-3 rounded-xl border-0 focus:outline-none focus:ring-2"
                  style={{ backgroundColor: '#1A2126', color: 'white' }}
                />
              </div>
              
              {/* Preferences Summary */}
              <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(0, 180, 216, 0.05)', border: '1px solid rgba(0, 180, 216, 0.2)' }}>
                <div className="text-sm font-medium text-white mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Your Preferences
                </div>
                <div className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {getPreferenceSummary()}
                </div>
                {primaryResort && (
                  <div className="flex items-center gap-2 mt-2">
                    <Mountain size={14} style={{ color: '#00B4D8' }} />
                    <span className="text-sm" style={{ color: '#00B4D8' }}>{primaryResort.name}</span>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>

          {/* How do you ride */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
              How do you ride?
            </h2>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'skier', label: 'Skier', emoji: '⛷️' },
                { value: 'snowboarder', label: 'Snowboarder', emoji: '🏂' },
                { value: 'adaptive', label: 'Adaptive', emoji: '♿' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSport(option.value)}
                  className="px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2"
                  style={{
                    backgroundColor: sport === option.value ? '#00B4D8' : 'rgba(255,255,255,0.05)',
                    color: sport === option.value ? '#000000' : 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    fontFamily: 'Manrope, sans-serif'
                  }}
                >
                  <span>{option.emoji}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Where do you ride (Primary Resort) */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Where do you ride?
            </h2>
            <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Your home mountain. When you open the app, it defaults here unless you're at another resort.
            </p>
            
            {/* Primary Resort (Home Mountain) */}
            <div className="mb-3">
              <label className="block text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Home Mountain
              </label>
              <button
                onClick={() => { loadResorts(); setShowResortPicker(true); }}
                className="w-full p-4 rounded-xl flex items-center justify-between transition-all hover:bg-white/5"
                style={{ backgroundColor: '#1A2126', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <div className="flex items-center gap-3">
                  <Mountain size={20} style={{ color: '#00B4D8' }} />
                  <span className="text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    {primaryResort ? primaryResort.name : 'Select your home mountain'}
                  </span>
                </div>
                <ChevronRight size={20} style={{ color: 'rgba(255,255,255,0.5)' }} />
              </button>
            </div>

            {/* Current Resort (if different from primary) */}
            {selectedResort && primaryResort && selectedResort.id !== primaryResort.id && (
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(255, 152, 0, 0.1)', border: '1px solid rgba(255, 152, 0, 0.3)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'rgba(255, 152, 0, 0.9)' }}>Currently at:</span>
                    <span className="text-sm font-medium text-white">{selectedResort.name}</span>
                  </div>
                  <button
                    onClick={clearCurrentResort}
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
                  >
                    Reset to home
                  </button>
                </div>
              </div>
            )}
          </GlassCard>

          {/* What's your level - Difficulty */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
              What's your level?
            </h2>
            
            <div className="space-y-4">
              {/* Difficulty Preference */}
              <div>
                <label className="block text-sm font-medium mb-3 text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Difficulty Preference
                </label>
                <div className="flex flex-wrap gap-2">
                  {DIFFICULTY_OPTIONS.map((diff) => (
                    <button
                      key={diff.value}
                      onClick={() => setDifficultyPreference(diff.value)}
                      className={`transition-all ${difficultyPreference === diff.value ? 'ring-2 ring-white' : ''}`}
                    >
                      <DifficultyBadge difficulty={diff.value} region={region} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Terrain Style (multi-select) */}
              <div>
                <label className="block text-sm font-medium mb-3 text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Terrain Style <span style={{ color: 'rgba(255,255,255,0.5)' }}>(select all that apply)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {TERRAIN_STYLE_OPTIONS.map((terrain) => (
                    <button
                      key={terrain.value}
                      onClick={() => toggleTerrainStyle(terrain.value)}
                      className="px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2"
                      style={{
                        backgroundColor: terrainStyles.includes(terrain.value) ? '#00B4D8' : 'rgba(255,255,255,0.05)',
                        color: terrainStyles.includes(terrain.value) ? '#000000' : 'rgba(255,255,255,0.7)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        fontFamily: 'Manrope, sans-serif'
                      }}
                    >
                      {terrainStyles.includes(terrain.value) && <Check size={14} />}
                      {terrain.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Terrain Area (multi-select) */}
              <div>
                <label className="block text-sm font-medium mb-3 text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Terrain Area <span style={{ color: 'rgba(255,255,255,0.5)' }}>(select all that apply)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {TERRAIN_AREA_OPTIONS.map((area) => (
                    <button
                      key={area.value}
                      onClick={() => toggleTerrainArea(area.value)}
                      className="px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2"
                      style={{
                        backgroundColor: terrainAreas.includes(area.value) ? '#00B4D8' : 'rgba(255,255,255,0.05)',
                        color: terrainAreas.includes(area.value) ? '#000000' : 'rgba(255,255,255,0.7)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        fontFamily: 'Manrope, sans-serif'
                      }}
                    >
                      {terrainAreas.includes(area.value) && <Check size={14} />}
                      {area.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Season Goals */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Set Your Goals
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-3 text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Days This Season
                </label>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setGoalDays(Math.max(0, goalDays - 1))}
                    className="p-3 rounded-full transition-all active:scale-95 hover:bg-white/20"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  >
                    <Minus size={24} style={{ color: 'white' }} />
                  </button>
                  <input
                    type="number"
                    value={goalDays}
                    onChange={(e) => {
                      const newDays = Math.max(0, parseInt(e.target.value) || 0);
                      setGoalDays(newDays);
                      // Auto-update vertical goal
                      if (goalVertical === 0 || goalVertical === (goalDays * 8000)) {
                        setGoalVertical(newDays * 8000);
                      }
                    }}
                    className="w-24 text-center text-3xl font-bold bg-transparent border-b-2 focus:outline-none focus:border-[#00B4D8] transition-colors"
                    style={{ 
                      fontFamily: 'JetBrains Mono, monospace',
                      color: 'white',
                      borderColor: 'rgba(255,255,255,0.2)'
                    }}
                    min="0"
                  />
                  <button
                    onClick={() => {
                      const newDays = goalDays + 1;
                      setGoalDays(newDays);
                      // Auto-update vertical goal
                      if (goalVertical === 0 || goalVertical === (goalDays * 8000)) {
                        setGoalVertical(newDays * 8000);
                      }
                    }}
                    className="p-3 rounded-full transition-all active:scale-95 hover:bg-white/20"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  >
                    <Plus size={24} style={{ color: 'white' }} />
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Vertical Feet Goal
                </label>
                <input
                  data-testid="vertical-goal-input"
                  type="number"
                  value={goalVertical}
                  onChange={(e) => setGoalVertical(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 rounded-xl border-0 focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: '#1A2126',
                    color: 'white',
                    fontFamily: 'JetBrains Mono, monospace'
                  }}
                />
                <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Default: {goalDays * 8000} ft ({goalDays} days × 8,000 ft/day)
                </p>
              </div>
              
              {/* Bucket List */}
              {primaryResort && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    Add to Bucket List
                  </label>
                  <button
                    onClick={() => setShowBucketListPicker(true)}
                    className="w-full p-4 rounded-xl flex items-center justify-between transition-all hover:bg-white/5"
                    style={{ backgroundColor: '#1A2126', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <div className="flex items-center gap-3">
                      <Heart size={20} style={{ color: '#FF1744' }} />
                      <span className="text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                        {bucketListIds.length > 0 ? `${bucketListIds.length} runs on bucket list` : 'Add runs to your bucket list'}
                      </span>
                    </div>
                    <ChevronRight size={20} style={{ color: 'rgba(255,255,255,0.5)' }} />
                  </button>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Region */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Region
            </h2>
            <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Difficulty colors match the convention used at resorts in your region.
            </p>
            <div className="flex gap-2">
              {['NA', 'EU', 'JP', 'AU'].map((r) => (
                <button
                  key={r}
                  data-testid={`region-${r}`}
                  onClick={() => setRegion(r)}
                  className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: region === r ? '#00B4D8' : 'rgba(255,255,255,0.05)',
                    color: region === r ? '#000000' : 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    fontFamily: 'Manrope, sans-serif'
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Subscription Status */}
          {isMobile && (
            <div>
              <SubscriptionStatus showManageButton={true} />
              {!isProUser && (
                <button
                  onClick={() => navigate('/subscription')}
                  className="w-full mt-4 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(to right, #f59e0b, #eab308)',
                    color: 'white',
                    fontFamily: 'Manrope, sans-serif'
                  }}
                >
                  <Crown size={20} />
                  Upgrade to Pro
                </button>
              )}
            </div>
          )}

          {/* Support PeakLap Section */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Support PeakLap
            </h2>
            <div className="space-y-3">
              <a
                href="https://buymeacoffee.com/peaklap"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg transition-all"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)'}
              >
                <div className="flex items-center gap-3">
                  <Coffee size={20} style={{ color: '#FFDD57' }} />
                  <div>
                    <div className="text-sm font-semibold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      Buy Me a Coffee
                    </div>
                    <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      Keep PeakLap running
                    </div>
                  </div>
                </div>
                <ExternalLink size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
              </a>

              <a
                href="mailto:info@peaklap.com?subject=Feature Request"
                className="flex items-center justify-between p-3 rounded-lg transition-all"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)'}
              >
                <div className="flex items-center gap-3">
                  <Lightbulb size={20} style={{ color: '#00B4D8' }} />
                  <div>
                    <div className="text-sm font-semibold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      Request a Feature
                    </div>
                    <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      Shape what gets built next
                    </div>
                  </div>
                </div>
              </a>

              <a
                href="mailto:info@peaklap.com?subject=Bug Report"
                className="flex items-center justify-between p-3 rounded-lg transition-all"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)'}
              >
                <div className="flex items-center gap-3">
                  <Bug size={20} style={{ color: '#FF5252' }} />
                  <div>
                    <div className="text-sm font-semibold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      Report a Bug
                    </div>
                    <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      Help us fix it fast
                    </div>
                  </div>
                </div>
              </a>
            </div>
          </GlassCard>

          {/* Save Button */}
          <button
            data-testid="save-settings"
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-full font-semibold transition-all"
            style={{
              backgroundColor: '#00B4D8',
              color: '#000000',
              fontFamily: 'Manrope, sans-serif',
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

          {/* Sign Out */}
          <button
            data-testid="sign-out"
            onClick={handleSignOut}
            className="w-full py-3 rounded-full font-semibold flex items-center justify-center gap-2"
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.08)',
              fontFamily: 'Manrope, sans-serif'
            }}
          >
            <LogOut size={18} />
            Sign Out
          </button>

          {/* App Version (long-press to access admin) */}
          <div
            className="text-center py-4"
            onMouseDown={handleVersionPress}
            onMouseUp={handleVersionRelease}
            onMouseLeave={handleVersionRelease}
            onTouchStart={handleVersionPress}
            onTouchEnd={handleVersionRelease}
            style={{ userSelect: 'none' }}
          >
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono, monospace' }}>
              PeakLap v0.1.0
            </p>
          </div>
        </div>
      </div>

      {/* Resort Picker Modal */}
      {showResortPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div 
            className="w-full max-w-lg rounded-t-3xl p-6 max-h-[80vh] overflow-hidden flex flex-col"
            style={{ backgroundColor: '#1A2126' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Select Primary Resort
              </h3>
              <button onClick={() => setShowResortPicker(false)}>
                <X size={24} style={{ color: 'rgba(255,255,255,0.5)' }} />
              </button>
            </div>
            
            {/* Search */}
            <div className="relative mb-4">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.4)' }} />
              <input
                type="text"
                value={resortSearchQuery}
                onChange={(e) => setResortSearchQuery(e.target.value)}
                placeholder="Search resorts..."
                className="w-full pl-10 pr-4 py-3 rounded-xl"
                style={{ backgroundColor: '#12181B', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
            
            {/* Resort List */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredResorts.map((resort) => (
                <button
                  key={resort.id}
                  onClick={() => {
                    setPrimaryResort(resort);
                    setShowResortPicker(false);
                  }}
                  className="w-full p-4 rounded-xl flex items-center justify-between transition-all hover:bg-white/5"
                  style={{ 
                    backgroundColor: primaryResort?.id === resort.id ? 'rgba(0, 180, 216, 0.1)' : 'transparent',
                    border: primaryResort?.id === resort.id ? '1px solid rgba(0, 180, 216, 0.3)' : '1px solid rgba(255,255,255,0.05)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Mountain size={18} style={{ color: primaryResort?.id === resort.id ? '#00B4D8' : 'rgba(255,255,255,0.5)' }} />
                    <span className="text-white text-left" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      {resort.name}
                    </span>
                  </div>
                  {primaryResort?.id === resort.id && (
                    <Check size={18} style={{ color: '#00B4D8' }} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bucket List Picker Modal */}
      {showBucketListPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div 
            className="w-full max-w-lg rounded-t-3xl p-6 max-h-[80vh] overflow-hidden flex flex-col"
            style={{ backgroundColor: '#1A2126' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Add to Bucket List
              </h3>
              <button onClick={() => setShowBucketListPicker(false)}>
                <X size={24} style={{ color: 'rgba(255,255,255,0.5)' }} />
              </button>
            </div>
            
            <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Popular runs at {primaryResort?.name} matching your level
            </p>
            
            {/* Run List */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {loadingRuns ? (
                <div className="text-center py-8">
                  <div className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Loading runs...</div>
                </div>
              ) : suggestedRuns.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>No runs found</div>
                </div>
              ) : (
                suggestedRuns.map((run) => (
                  <button
                    key={run.id}
                    onClick={() => toggleBucketList(run.id)}
                    className="w-full p-4 rounded-xl flex items-center justify-between transition-all hover:bg-white/5"
                    style={{ 
                      backgroundColor: bucketListIds.includes(run.id) ? 'rgba(255, 23, 68, 0.1)' : 'transparent',
                      border: bucketListIds.includes(run.id) ? '1px solid rgba(255, 23, 68, 0.3)' : '1px solid rgba(255,255,255,0.05)'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Heart 
                        size={18} 
                        style={{ color: bucketListIds.includes(run.id) ? '#FF1744' : 'rgba(255,255,255,0.3)' }}
                        fill={bucketListIds.includes(run.id) ? '#FF1744' : 'transparent'}
                      />
                      <span className="text-white text-left" style={{ fontFamily: 'Manrope, sans-serif' }}>
                        {run.name}
                      </span>
                    </div>
                    {run.difficulty && (
                      <DifficultyBadge difficulty={run.difficulty} region={region} />
                    )}
                  </button>
                ))
              )}
            </div>
            
            <button
              onClick={() => setShowBucketListPicker(false)}
              className="w-full mt-4 py-3 rounded-full font-semibold"
              style={{ backgroundColor: '#00B4D8', color: '#000000', fontFamily: 'Manrope, sans-serif' }}
            >
              Done ({bucketListIds.length} selected)
            </button>
          </div>
        </div>
      )}

      <Footer />
      <BottomNav />
    </div>
  );
}
