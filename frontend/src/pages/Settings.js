import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { GlassCard } from '@/components/GlassCard';
import { SnowStake } from '@/components/SnowStake';
import { Minus, Plus, LogOut, Coffee, Lightbulb, Bug, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { profile, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState(profile?.username || '');
  const [goalDays, setGoalDays] = useState(profile?.season_goal_days || 0);
  const [goalVertical, setGoalVertical] = useState(profile?.season_goal_vertical_ft || 0);
  const [region, setRegion] = useState(profile?.difficulty_region || 'NA');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setGoalDays(profile.season_goal_days || 0);
      setGoalVertical(profile.season_goal_vertical_ft || 0);
      setRegion(profile.difficulty_region || 'NA');
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    
    console.log('Saving settings:', { username, goalDays, goalVertical, region });
    
    const { data, error } = await updateProfile({
      username,
      season_goal_days: goalDays,
      season_goal_vertical_ft: goalVertical,
      difficulty_region: region,
    });

    console.log('updateProfile result:', { data, error });

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

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#12181B' }} data-testid="settings-page">
      <Header />
      
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Settings
        </h1>

        <div className="space-y-6">
          {/* Profile */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Profile
            </h2>
            <div className="space-y-4">
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
                  style={{
                    backgroundColor: '#1A2126',
                    color: 'white'
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Sport
                </label>
                <div className="text-base text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {profile?.sport ? profile.sport.charAt(0).toUpperCase() + profile.sport.slice(1) : 'Not set'}
                </div>
                <button
                  onClick={() => navigate('/onboarding')}
                  className="text-sm mt-1"
                  style={{ color: '#00B4D8' }}
                >
                  Update preferences
                </button>
              </div>
            </div>
          </GlassCard>

          {/* Season Goals */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Season Goals
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
                    onChange={(e) => setGoalDays(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-24 text-center text-3xl font-bold bg-transparent border-b-2 focus:outline-none focus:border-[#00B4D8] transition-colors"
                    style={{ 
                      fontFamily: 'JetBrains Mono, monospace',
                      color: 'white',
                      borderColor: 'rgba(255,255,255,0.2)'
                    }}
                    min="0"
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
              </div>
              
              {/* Mini Snow Stake Preview */}
              <div className="pt-2">
                <SnowStake
                  daysLogged={0}
                  goalDays={goalDays}
                  verticalLogged={0}
                  goalVertical={goalVertical}
                />
              </div>
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
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
