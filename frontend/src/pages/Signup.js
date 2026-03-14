import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { GlassCard } from '@/components/GlassCard';
import { Eye, EyeOff, CheckCircle, AlertCircle, Mail } from 'lucide-react';

// Consistent logo URL used across the app
const LOGO_URL = 'https://customer-assets.emergentagent.com/job_run-sesh/artifacts/3n8ymt7j_PeakLap_Logo.png';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { data, error } = await signUp(email, password);
    
    if (error) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Signup failed. Please try again.' 
      });
      setLoading(false);
      return;
    }
    
    // Success - show persistent message
    setMessage({ 
      type: 'success', 
      text: 'Account created! Check your email to verify your account before signing in.',
      showEmailHint: true
    });
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: '#12181B' }}>
      <div className="w-full max-w-md">
        {/* Hero Logo */}
        <div className="flex justify-center mb-8">
          <Link 
            to="/home" 
            className="transition-opacity hover:opacity-85"
            style={{ textDecoration: 'none', border: 'none' }}
          >
            <img 
              src={LOGO_URL}
              alt="PeakLap Logo" 
              className="h-24 w-24 object-contain"
            />
            <p className="text-center text-xl font-bold mt-2" style={{ color: 'white', fontFamily: 'Manrope, sans-serif' }}>
              PeakLap
            </p>
          </Link>
        </div>

        <GlassCard className="p-8">
          <h1 className="text-3xl font-bold mb-2 text-white text-center" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Join PeakLap
          </h1>
          <p className="text-sm mb-6 text-center" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Every lap. Every peak. Every season.
          </p>

          {/* Persistent Message Banner */}
          {message && (
            <div 
              className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
                message.type === 'success' ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
              }`}
              data-testid="auth-message"
            >
              {message.type === 'success' ? (
                <CheckCircle size={24} className="flex-shrink-0 mt-0.5" style={{ color: '#00E676' }} />
              ) : (
                <AlertCircle size={24} className="flex-shrink-0 mt-0.5" style={{ color: '#FF5252' }} />
              )}
              <div className="flex-1">
                <p 
                  className="text-sm font-medium"
                  style={{ 
                    color: message.type === 'success' ? '#00E676' : '#FF5252',
                    fontFamily: 'Manrope, sans-serif'
                  }}
                >
                  {message.text}
                </p>
                {message.showEmailHint && (
                  <div className="mt-3 flex items-center gap-2">
                    <Mail size={16} style={{ color: 'rgba(255,255,255,0.6)' }} />
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      Check your inbox and spam folder
                    </p>
                  </div>
                )}
                {message.type === 'success' && (
                  <Link 
                    to="/login" 
                    className="inline-block mt-3 text-sm font-semibold px-4 py-2 rounded-full transition-all hover:opacity-80"
                    style={{ 
                      backgroundColor: '#00B4D8',
                      color: '#000000'
                    }}
                  >
                    Go to Sign In →
                  </Link>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Email
              </label>
              <input
                data-testid="signup-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setMessage(null); }}
                required
                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                style={{
                  backgroundColor: '#1A2126',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white'
                }}
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Password
              </label>
              <div className="relative">
                <input
                  data-testid="signup-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setMessage(null); }}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#00B4D8] pr-12"
                  style={{
                    backgroundColor: '#1A2126',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white'
                  }}
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                  data-testid="toggle-password"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              data-testid="signup-submit"
              type="submit"
              disabled={loading || message?.type === 'success'}
              className="w-full py-3 rounded-full font-semibold transition-all mt-2"
              style={{
                backgroundColor: '#00B4D8',
                color: '#000000',
                fontFamily: 'Manrope, sans-serif',
                opacity: (loading || message?.type === 'success') ? 0.5 : 1,
                cursor: message?.type === 'success' ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Already have an account?{' '}
              <Link to="/login" className="font-semibold" style={{ color: '#00B4D8' }}>
                Sign in
              </Link>
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
