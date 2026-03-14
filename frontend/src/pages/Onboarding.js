import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { GlassCard } from '@/components/GlassCard';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import { supabase } from '@/lib/supabase';
import { Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [sport, setSport] = useState('');
  const [difficultyPreference, setDifficultyPreference] = useState('');
  const [shredStyle, setShredStyle] = useState('');
  const [goalDays, setGoalDays] = useState(20);
  const [goalVertical, setGoalVertical] = useState(100000);
  const [bucketList, setBucketList] = useState([]);
  const [preferredTime, setPreferredTime] = useState('');
  const [socialStyle, setSocialStyle] = useState('');
  const [wantsNotifications, setWantsNotifications] = useState(false);
  const [runs, setRuns] = useState([]);
  
  const { profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  
  // Ref to prevent duplicate fetches
  const runsLoadedRef = useRef(false);

  const loadRuns = useCallback(async () => {
    if (runsLoadedRef.current) return;
    
    const { data } = await supabase.from('runs').select('*').limit(10);
    if (data) {
      setRuns(data);
      runsLoadedRef.current = true;
    }
  }, []);

  // Load runs ONCE on mount
  useEffect(() => {
    loadRuns();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency - run ONCE

  const handleSkip = async () => {
    await updateProfile({ onboarding_complete: true });
    navigate('/home');
  };

  const handleComplete = async () => {
    await updateProfile({
      sport,
      difficulty_preference: difficultyPreference,
      shred_style: shredStyle,
      season_goal_days: goalDays,
      season_goal_vertical_ft: goalVertical,
      preferred_time: preferredTime,
      social_style: socialStyle,
      wants_notifications: wantsNotifications,
      onboarding_complete: true,
    });

    // Save bucket list items with proper error handling
    // Use proper { data, error } destructuring
    // NEVER call .json() or .text() on Supabase responses
    if (bucketList.length > 0 && profile?.id) {
      try {
        const { error } = await supabase
          .from('bucket_list')
          .insert(
            bucketList.map(runId => ({ user_id: profile.id, run_id: runId }))
          );
        
        if (error) {
          console.error('Error saving bucket list:', error);
          // Non-blocking error - continue with navigation
        }
      } catch (err) {
        console.error('Error saving bucket list:', err);
      }
    }

    toast.success('Profile complete! 🏔️');
    navigate('/home');
  };

  const progress = (step / 4) * 100;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#12181B' }}>
      {/* Progress bar */}
      <div className="w-full h-1" style={{ backgroundColor: '#1A2126' }}>
        <div 
          className="h-full transition-all duration-300"
          style={{ width: `${progress}%`, backgroundColor: '#00B4D8' }}
        />
      </div>

      <div className="flex-1 p-6 pb-24 overflow-y-auto">
        <div className="max-w-md mx-auto">
          {/* Skip button */}
          <button
            onClick={handleSkip}
            className="text-sm mb-8"
            style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Manrope, sans-serif' }}
          >
            Skip for now
          </button>

          {/* Step 1: Sport Selection */}
          {step === 1 && (
            <div data-testid="onboarding-step-1">
              <h1 className="text-3xl font-bold mb-2 text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                How do you ride?
              </h1>
              <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Choose your preferred style
              </p>

              <div className="space-y-4">
                {[
                  { value: 'skier', label: 'Skier', emoji: '⛷️' },
                  { value: 'snowboarder', label: 'Snowboarder', emoji: '🏂' },
                  { value: 'adaptive', label: 'Adaptive', emoji: '♿' },
                ].map((option) => (
                  <GlassCard
                    key={option.value}
                    data-testid={`sport-${option.value}`}
                    onClick={() => setSport(option.value)}
                    className="p-6 cursor-pointer transition-all"
                    style={{
                      border: sport === option.value ? '2px solid #00B4D8' : '1px solid rgba(255,255,255,0.08)'
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">{option.emoji}</span>
                      <span className="text-xl font-semibold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                        {option.label}
                      </span>
                    </div>
                  </GlassCard>
                ))}
              </div>

              {sport && (
                <button
                  data-testid="onboarding-next-1"
                  onClick={() => setStep(2)}
                  className="w-full mt-8 py-3 rounded-full font-semibold"
                  style={{ backgroundColor: '#00B4D8', color: '#000000', fontFamily: 'Manrope, sans-serif' }}
                >
                  Continue
                </button>
              )}
            </div>
          )}

          {/* Step 2: Difficulty & Terrain */}
          {step === 2 && (
            <div data-testid="onboarding-step-2">
              <h1 className="text-3xl font-bold mb-2 text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                What's your level?
              </h1>
              <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Help us personalize your experience
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3 text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    Difficulty Preference
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['novice', 'easy', 'intermediate', 'advanced', 'expert'].map((diff) => (
                      <button
                        key={diff}
                        data-testid={`difficulty-${diff}`}
                        onClick={() => setDifficultyPreference(diff)}
                        className={difficultyPreference === diff ? 'ring-2 ring-white' : ''}
                      >
                        <DifficultyBadge difficulty={diff} region={profile?.difficulty_region || 'NA'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3 text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    Terrain Style
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'groomers', label: 'Groomers' },
                      { value: 'trees', label: 'Trees' },
                      { value: 'powder', label: 'Powder' },
                      { value: 'park', label: 'Park' },
                      { value: 'backcountry', label: 'Backcountry' },
                    ].map((terrain) => (
                      <button
                        key={terrain.value}
                        data-testid={`terrain-${terrain.value}`}
                        onClick={() => setShredStyle(terrain.value)}
                        className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                        style={{
                          backgroundColor: shredStyle === terrain.value ? '#00B4D8' : 'rgba(255,255,255,0.05)',
                          color: shredStyle === terrain.value ? '#000000' : 'rgba(255,255,255,0.7)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          fontFamily: 'Manrope, sans-serif'
                        }}
                      >
                        {terrain.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {difficultyPreference && shredStyle && (
                <button
                  data-testid="onboarding-next-2"
                  onClick={() => setStep(3)}
                  className="w-full mt-8 py-3 rounded-full font-semibold"
                  style={{ backgroundColor: '#00B4D8', color: '#000000', fontFamily: 'Manrope, sans-serif' }}
                >
                  Continue
                </button>
              )}
            </div>
          )}

          {/* Step 3: Goals & Bucket List */}
          {step === 3 && (
            <div data-testid="onboarding-step-3">
              <h1 className="text-3xl font-bold mb-2 text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Set your goals
              </h1>
              <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Track your progress throughout the season
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3 text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    Days This Season
                  </label>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => setGoalDays(Math.max(1, goalDays - 1))}
                      className="p-3 rounded-full transition-all active:scale-95 hover:bg-white/20"
                      style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                    >
                      <Minus size={24} style={{ color: 'white' }} />
                    </button>
                    <input
                      type="number"
                      value={goalDays}
                      onChange={(e) => setGoalDays(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-24 text-center text-3xl font-bold bg-transparent border-b-2 focus:outline-none focus:border-[#00B4D8] transition-colors"
                      style={{ 
                        fontFamily: 'JetBrains Mono, monospace',
                        color: 'white',
                        borderColor: 'rgba(255,255,255,0.2)'
                      }}
                      min="1"
                    />
                    <button
                      onClick={() => setGoalDays(goalDays + 1)}
                      className="p-3 rounded-full transition-all active:scale-95 hover:bg-white/20"
                      style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                    >
                      <Plus size={24} style={{ color: 'white' }} />
                    </button>
                  </div>
                  <p className="text-xs text-center mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Tap the number to edit directly
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3 text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    Vertical Feet Goal
                  </label>
                  <input
                    data-testid="goal-vertical-input"
                    type="number"
                    value={goalVertical}
                    onChange={(e) => setGoalVertical(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: '#1A2126',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'white',
                      fontFamily: 'JetBrains Mono, monospace'
                    }}
                  />
                </div>

                {runs.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-3 text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      Add to Bucket List (optional)
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {runs.map((run) => (
                        <GlassCard
                          key={run.id}
                          onClick={() => {
                            if (bucketList.includes(run.id)) {
                              setBucketList(bucketList.filter(id => id !== run.id));
                            } else {
                              setBucketList([...bucketList, run.id]);
                            }
                          }}
                          className="p-3 cursor-pointer"
                          style={{
                            border: bucketList.includes(run.id) ? '2px solid #00B4D8' : '1px solid rgba(255,255,255,0.08)'
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                              {run.name}
                            </span>
                            {run.difficulty && (
                              <DifficultyBadge difficulty={run.difficulty} region={profile?.difficulty_region || 'NA'} />
                            )}
                          </div>
                        </GlassCard>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                data-testid="onboarding-next-3"
                onClick={() => setStep(4)}
                className="w-full mt-8 py-3 rounded-full font-semibold"
                style={{ backgroundColor: '#00B4D8', color: '#000000', fontFamily: 'Manrope, sans-serif' }}
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 4: Preferences */}
          {step === 4 && (
            <div data-testid="onboarding-step-4">
              <h1 className="text-3xl font-bold mb-2 text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Almost there!
              </h1>
              <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Just a few more preferences
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3 text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    When do you usually ride?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'morning', label: 'Morning' },
                      { value: 'afternoon', label: 'Afternoon' },
                      { value: 'all_day', label: 'All Day' },
                    ].map((time) => (
                      <button
                        key={time.value}
                        onClick={() => setPreferredTime(time.value)}
                        className="px-4 py-2 rounded-full text-sm font-semibold"
                        style={{
                          backgroundColor: preferredTime === time.value ? '#00B4D8' : 'rgba(255,255,255,0.05)',
                          color: preferredTime === time.value ? '#000000' : 'rgba(255,255,255,0.7)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          fontFamily: 'Manrope, sans-serif'
                        }}
                      >
                        {time.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3 text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    How do you like to ride?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'solo', label: 'Solo' },
                      { value: 'crew', label: 'With Crew' },
                      { value: 'both', label: 'Both' },
                    ].map((style) => (
                      <button
                        key={style.value}
                        onClick={() => setSocialStyle(style.value)}
                        className="px-4 py-2 rounded-full text-sm font-semibold"
                        style={{
                          backgroundColor: socialStyle === style.value ? '#00B4D8' : 'rgba(255,255,255,0.05)',
                          color: socialStyle === style.value ? '#000000' : 'rgba(255,255,255,0.7)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          fontFamily: 'Manrope, sans-serif'
                        }}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                <GlassCard className="p-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      Enable notifications
                    </span>
                    <input
                      type="checkbox"
                      checked={wantsNotifications}
                      onChange={(e) => setWantsNotifications(e.target.checked)}
                      className="w-5 h-5 rounded"
                      style={{ accentColor: '#00B4D8' }}
                    />
                  </label>
                </GlassCard>
              </div>

              {preferredTime && socialStyle && (
                <button
                  data-testid="onboarding-complete"
                  onClick={handleComplete}
                  className="w-full mt-8 py-3 rounded-full font-semibold"
                  style={{ backgroundColor: '#00B4D8', color: '#000000', fontFamily: 'Manrope, sans-serif' }}
                >
                  Complete Setup
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
