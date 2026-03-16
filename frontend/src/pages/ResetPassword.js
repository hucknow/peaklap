import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { GlassCard } from '@/components/GlassCard';
import { Eye, EyeOff, AlertCircle, CheckCircle, Lock, ArrowLeft } from 'lucide-react';

// Consistent logo URL used across the app
const LOGO_URL = 'https://customer-assets.emergentagent.com/job_code-review-preview/artifacts/18r8cfx3_PeakLap_Logo_dark.png';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();

  // Check if we have a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session check error:', error);
          setValidSession(false);
          setCheckingSession(false);
          return;
        }

        // Check if this is a recovery session (user clicked password reset link)
        if (session) {
          setValidSession(true);
        } else {
          // Listen for auth state change (recovery link handling)
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
              setValidSession(true);
            } else if (event === 'SIGNED_IN' && session) {
              setValidSession(true);
            }
          });

          // Give it a moment for the auth state to settle
          setTimeout(() => {
            setCheckingSession(false);
          }, 1000);

          return () => {
            subscription?.unsubscribe();
          };
        }
        
        setCheckingSession(false);
      } catch (err) {
        console.error('Session check exception:', err);
        setValidSession(false);
        setCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    // Validate passwords
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setMessage({ 
          type: 'error', 
          text: error.message || 'Failed to reset password. Please try again.' 
        });
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: 'An unexpected error occurred. Please try again.' 
      });
      setLoading(false);
    }
  };

  // Loading state while checking session
  if (checkingSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: '#12181B' }}>
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <img 
              src={LOGO_URL}
              alt="PeakLap Logo" 
              className="h-32 w-32 object-contain"
            />
          </div>
          <GlassCard className="p-8 text-center">
            <div className="animate-pulse">
              <div className="w-16 h-16 rounded-full mx-auto mb-4" style={{ backgroundColor: 'rgba(0, 180, 216, 0.1)' }} />
              <div className="h-6 w-48 mx-auto rounded" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
            </div>
            <p className="text-sm mt-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Verifying reset link...
            </p>
          </GlassCard>
        </div>
      </div>
    );
  }

  // Invalid or expired link
  if (!validSession && !checkingSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: '#12181B' }}>
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Link to="/login">
              <img 
                src={LOGO_URL}
                alt="PeakLap Logo" 
                className="h-32 w-32 object-contain"
              />
            </Link>
          </div>
          <GlassCard className="p-8">
            <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4" style={{ backgroundColor: 'rgba(255, 82, 82, 0.1)' }}>
              <AlertCircle size={32} style={{ color: '#FF5252' }} />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-white text-center" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Invalid or Expired Link
            </h2>
            <p className="text-sm mb-6 text-center" style={{ color: 'rgba(255,255,255,0.6)' }}>
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link
              to="/login"
              className="block w-full py-3 rounded-full font-semibold transition-all text-center"
              style={{
                background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)',
                color: '#000000',
                fontFamily: 'Manrope, sans-serif',
                textDecoration: 'none',
                boxShadow: '0 4px 20px rgba(0, 180, 216, 0.3)'
              }}
            >
              Back to Login
            </Link>
          </GlassCard>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: '#12181B' }}>
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <img 
              src={LOGO_URL}
              alt="PeakLap Logo" 
              className="h-32 w-32 object-contain"
            />
          </div>
          <GlassCard className="p-8">
            <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4" style={{ backgroundColor: 'rgba(0, 230, 118, 0.1)' }}>
              <CheckCircle size={32} style={{ color: '#00E676' }} />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-white text-center" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Password Reset!
            </h2>
            <p className="text-sm mb-6 text-center" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Your password has been successfully reset. You'll be redirected to login in a moment...
            </p>
            <Link
              to="/login"
              className="block w-full py-3 rounded-full font-semibold transition-all text-center"
              style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontFamily: 'Manrope, sans-serif',
                textDecoration: 'none'
              }}
            >
              Go to Login Now
            </Link>
          </GlassCard>
        </div>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: '#12181B' }}>
      <div className="w-full max-w-md">
        {/* Hero Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/login">
            <img 
              src={LOGO_URL}
              alt="PeakLap Logo" 
              className="h-32 w-32 object-contain"
            />
          </Link>
        </div>

        <GlassCard className="p-8">
          <Link
            to="/login"
            className="flex items-center gap-2 text-sm mb-6 transition-opacity hover:opacity-80"
            style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}
          >
            <ArrowLeft size={18} />
            Back to login
          </Link>

          <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4" style={{ backgroundColor: 'rgba(0, 180, 216, 0.1)' }}>
            <Lock size={32} style={{ color: '#00B4D8' }} />
          </div>

          <h1 className="text-2xl font-bold mb-2 text-white text-center" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Create New Password
          </h1>
          <p className="text-sm mb-6 text-center" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Your new password must be at least 6 characters long.
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                New Password
              </label>
              <div className="relative">
                <input
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
                  placeholder="••••••••"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setMessage(null); }}
                  required
                  minLength={6}
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
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
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
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
