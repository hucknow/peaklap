import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { GlassCard } from '@/components/GlassCard';
import Footer from '@/components/Footer';
import { Eye, EyeOff, CircleAlert as AlertCircle, Info, Coffee } from 'lucide-react';

// Consistent logo URL used across the app
const LOGO_URL = '/PeakLap_Logo.png';

// Static styles extracted outside component to prevent re-renders and garbage collection overhead
const PAGE_CONTAINER_STYLE = { backgroundColor: '#12181B' };
const LOGO_LINK_STYLE = { textDecoration: 'none', border: 'none' };
const HEADER_TEXT_STYLE = { fontFamily: 'Manrope, sans-serif' };
const SUB_TEXT_STYLE = { color: 'rgba(255,255,255,0.6)' };
const MSG_ICON_STYLE = { color: '#FF5252' };
const MSG_INFO_ICON_STYLE = { color: '#00B4D8' };
const MSG_INFO_TEXT_STYLE = { color: '#00B4D8', fontFamily: 'Manrope, sans-serif' };
const MSG_ERR_TEXT_STYLE = { color: '#FF5252', fontFamily: 'Manrope, sans-serif' };
const MSG_SUBTEXT_STYLE = { color: 'rgba(255,255,255,0.5)' };
const SUCCESS_ICON_STYLE = { color: '#00E676' };
const SUCCESS_TEXT_STYLE = { color: '#00E676', fontFamily: 'Manrope, sans-serif' };
const INPUT_STYLE = { backgroundColor: '#1A2126', border: '1px solid rgba(255,255,255,0.1)', color: 'white' };
const BUTTON_BASE_STYLE = { 
  background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)', 
  color: '#000000', 
  fontFamily: 'Manrope, sans-serif', 
  boxShadow: '0 4px 20px rgba(0, 180, 216, 0.3)' 
};
const SUPPORT_LINK_STYLE = { color: 'rgba(255,255,255,0.5)', textDecoration: 'none' };

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'error' | 'info', text: string }
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if redirected from signup
  const fromSignup = location.state?.fromSignup;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { data, error } = await signIn(email, password);
    
    if (error) {
      // Provide more helpful error messages
      let errorText = error.message || 'Login failed. Please try again.';
      
      // Check for common error types
      if (error.message?.toLowerCase().includes('invalid login credentials')) {
        errorText = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.message?.toLowerCase().includes('email not confirmed')) {
        errorText = 'Please verify your email before signing in. Check your inbox for the confirmation link.';
      }
      
      setMessage({ 
        type: 'error', 
        text: errorText 
      });
      setLoading(false);
      return;
    }
    
    // Success - navigate to home
    navigate('/home');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={PAGE_CONTAINER_STYLE}>
      <div className="w-full max-w-md">
        {/* Hero Logo */}
        <div className="flex justify-center mb-8">
          <Link 
            to="/home" 
            className="transition-opacity hover:opacity-85"
            style={LOGO_LINK_STYLE}
          >
            <img 
              src={LOGO_URL}
              alt="PeakLap Logo" 
              className="h-32 w-32 object-contain"
            />
          </Link>
        </div>

        <GlassCard className="p-8">
          <h1 className="text-3xl font-bold mb-2 text-white text-center" style={HEADER_TEXT_STYLE}>
            Back for more laps?
          </h1>
          <p className="text-sm mb-6 text-center" style={SUB_TEXT_STYLE}>
            Your mountain. Your laps. Your legacy.
          </p>

          {/* Persistent Message Banner */}
          {message && (
            <div 
              className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
                message.type === 'error' ? 'bg-red-500/10 border border-red-500/30' : 'bg-blue-500/10 border border-blue-500/30'
              }`}
              data-testid="auth-message"
            >
              {message.type === 'error' ? (
                <AlertCircle size={24} className="flex-shrink-0 mt-0.5" style={MSG_ICON_STYLE} />
              ) : (
                <Info size={24} className="flex-shrink-0 mt-0.5" style={MSG_INFO_ICON_STYLE} />
              )}
              <div className="flex-1">
                <p 
                  className="text-sm font-medium"
                  style={message.type === 'error' ? MSG_ERR_TEXT_STYLE : MSG_INFO_TEXT_STYLE}
                >
                  {message.text}
                </p>
                {message.type === 'error' && message.text.includes('verify') && (
                  <p className="text-xs mt-2" style={MSG_SUBTEXT_STYLE}>
                    Check your inbox and spam folder for the verification email.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Info banner if redirected from signup */}
          {fromSignup && !message && (
            <div 
              className="mb-6 p-4 rounded-xl flex items-start gap-3 bg-green-500/10 border border-green-500/30"
              data-testid="signup-success-banner"
            >
              <Info size={24} className="flex-shrink-0 mt-0.5" style={SUCCESS_ICON_STYLE} />
              <p 
                className="text-sm font-medium"
                style={SUCCESS_TEXT_STYLE}
              >
                Account created! Please check your email to verify before signing in.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white" style={HEADER_TEXT_STYLE}>
                Email
              </label>
              <input
                data-testid="login-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setMessage(null); }}
                required
                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                style={INPUT_STYLE}
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-white" style={HEADER_TEXT_STYLE}>
                Password
              </label>
              <div className="relative">
                <input
                  data-testid="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setMessage(null); }}
                  required
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#00B4D8] pr-12"
                  style={INPUT_STYLE}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={MSG_SUBTEXT_STYLE}
                  data-testid="toggle-password"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              data-testid="login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full font-semibold transition-all mt-2"
              style={{ ...BUTTON_BASE_STYLE, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm" style={SUB_TEXT_STYLE}>
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold" style={{ color: '#00B4D8' }}>
                Sign up
              </Link>
            </p>
          </div>

          {/* Support PeakLap Link */}
          <div className="mt-4 text-center">
            <a
              href="https://buymeacoffee.com/peaklap"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm transition-opacity hover:opacity-80"
              style={SUPPORT_LINK_STYLE}
            >
              <Coffee size={16} style={{ color: '#FFDD57' }} />
              <span>Support PeakLap</span>
            </a>
          </div>
        </GlassCard>
      </div>
      <Footer />
    </div>
  );
}
