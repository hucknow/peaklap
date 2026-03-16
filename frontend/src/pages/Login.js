import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { GlassCard } from '@/components/GlassCard';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, AlertCircle, Info, Coffee, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

// Consistent logo URL used across the app
const LOGO_URL = 'https://customer-assets.emergentagent.com/job_code-review-preview/artifacts/18r8cfx3_PeakLap_Logo_dark.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'error' | 'info' | 'success', text: string }
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!resetEmail.trim()) {
      setMessage({ type: 'error', text: 'Please enter your email address.' });
      return;
    }

    setResetLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setMessage({ 
          type: 'error', 
          text: error.message || 'Failed to send reset email. Please try again.' 
        });
        setResetLoading(false);
        return;
      }

      setResetSent(true);
      setResetLoading(false);
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: 'An unexpected error occurred. Please try again.' 
      });
      setResetLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setResetEmail('');
    setResetSent(false);
    setMessage(null);
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
              className="h-32 w-32 object-contain"
            />
          </Link>
        </div>

        <GlassCard className="p-8">
          <h1 className="text-3xl font-bold mb-2 text-white text-center" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Back for more laps?
          </h1>
          <p className="text-sm mb-6 text-center" style={{ color: 'rgba(255,255,255,0.6)' }}>
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
                <AlertCircle size={24} className="flex-shrink-0 mt-0.5" style={{ color: '#FF5252' }} />
              ) : (
                <Info size={24} className="flex-shrink-0 mt-0.5" style={{ color: '#00B4D8' }} />
              )}
              <div className="flex-1">
                <p 
                  className="text-sm font-medium"
                  style={{ 
                    color: message.type === 'error' ? '#FF5252' : '#00B4D8',
                    fontFamily: 'Manrope, sans-serif'
                  }}
                >
                  {message.text}
                </p>
                {message.type === 'error' && message.text.includes('verify') && (
                  <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
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
              <Info size={24} className="flex-shrink-0 mt-0.5" style={{ color: '#00E676' }} />
              <p 
                className="text-sm font-medium"
                style={{ 
                  color: '#00E676',
                  fontFamily: 'Manrope, sans-serif'
                }}
              >
                Account created! Please check your email to verify before signing in.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Email
              </label>
              <input
                data-testid="login-email"
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
                  data-testid="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setMessage(null); }}
                  required
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#00B4D8] pr-12"
                  style={{
                    backgroundColor: '#1A2126',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white'
                  }}
                  placeholder="••••••••"
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

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => { setShowForgotPassword(true); setResetEmail(email); }}
                className="text-sm font-medium transition-opacity hover:opacity-80"
                style={{ color: '#00B4D8', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Forgot password?
              </button>
            </div>

            <button
              data-testid="login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full font-semibold transition-all mt-2"
              style={{
                background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)',
                color: '#000000',
                fontFamily: 'Manrope, sans-serif',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 4px 20px rgba(0, 180, 216, 0.3)'
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
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
              style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}
            >
              <Coffee size={16} style={{ color: '#FFDD57' }} />
              <span>Support PeakLap</span>
            </a>
          </div>
        </GlassCard>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleBackToLogin}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div 
            className="relative w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <GlassCard className="p-8">
              {!resetSent ? (
                <>
                  {/* Header */}
                  <button
                    onClick={handleBackToLogin}
                    className="flex items-center gap-2 text-sm mb-6 transition-opacity hover:opacity-80"
                    style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <ArrowLeft size={18} />
                    Back to login
                  </button>

                  <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4" style={{ backgroundColor: 'rgba(0, 180, 216, 0.1)' }}>
                    <Mail size={32} style={{ color: '#00B4D8' }} />
                  </div>

                  <h2 className="text-2xl font-bold mb-2 text-white text-center" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    Reset Password
                  </h2>
                  <p className="text-sm mb-6 text-center" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    Enter your email and we'll send you a link to reset your password.
                  </p>

                  {/* Error Message */}
                  {message && message.type === 'error' && (
                    <div className="mb-6 p-4 rounded-xl flex items-start gap-3 bg-red-500/10 border border-red-500/30">
                      <AlertCircle size={20} className="flex-shrink-0 mt-0.5" style={{ color: '#FF5252' }} />
                      <p className="text-sm" style={{ color: '#FF5252', fontFamily: 'Manrope, sans-serif' }}>
                        {message.text}
                      </p>
                    </div>
                  )}

                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => { setResetEmail(e.target.value); setMessage(null); }}
                        required
                        className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                        style={{
                          backgroundColor: '#1A2126',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: 'white'
                        }}
                        placeholder="your.email@example.com"
                        autoFocus
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="w-full py-3 rounded-full font-semibold transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)',
                        color: '#000000',
                        fontFamily: 'Manrope, sans-serif',
                        opacity: resetLoading ? 0.7 : 1,
                        boxShadow: '0 4px 20px rgba(0, 180, 216, 0.3)'
                      }}
                    >
                      {resetLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </form>
                </>
              ) : (
                /* Success State */
                <>
                  <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4" style={{ backgroundColor: 'rgba(0, 230, 118, 0.1)' }}>
                    <CheckCircle size={32} style={{ color: '#00E676' }} />
                  </div>

                  <h2 className="text-2xl font-bold mb-2 text-white text-center" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    Check Your Email
                  </h2>
                  <p className="text-sm mb-2 text-center" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    We've sent a password reset link to:
                  </p>
                  <p className="text-base font-semibold mb-6 text-center" style={{ color: '#00B4D8' }}>
                    {resetEmail}
                  </p>
                  <p className="text-xs mb-6 text-center" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Click the link in the email to reset your password. If you don't see it, check your spam folder.
                  </p>

                  <button
                    onClick={handleBackToLogin}
                    className="w-full py-3 rounded-full font-semibold transition-all"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      fontFamily: 'Manrope, sans-serif'
                    }}
                  >
                    Back to Login
                  </button>
                </>
              )}
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}
