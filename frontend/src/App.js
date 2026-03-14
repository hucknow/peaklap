import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ResortProvider } from '@/contexts/ResortContext';
import { Toaster } from 'sonner';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Onboarding from '@/pages/Onboarding';
import Home from '@/pages/Home';
import Resorts from '@/pages/Resorts';
import RunDetail from '@/pages/RunDetail';
import LogRun from '@/pages/LogRun';
import History from '@/pages/History';
import Settings from '@/pages/Settings';
import '@/App.css';

// Loading spinner component
function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: '#12181B' }}>
      <img 
        src="https://customer-assets.emergentagent.com/job_run-sesh/artifacts/3n8ymt7j_PeakLap_Logo.png"
        alt="PeakLap Logo"
        className="h-16 w-16 mb-4 animate-pulse"
      />
      <div className="text-white text-sm" style={{ fontFamily: 'Manrope, sans-serif', color: 'rgba(255,255,255,0.6)' }}>
        Loading...
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if onboarding is needed
  if (profile && profile.onboarding_complete === false) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  // If user is logged in, redirect to home
  if (user) {
    return <Navigate to="/home" replace />;
  }

  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Public routes - redirect to home if logged in */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      
      {/* Onboarding - requires auth but not onboarding_complete */}
      <Route path="/onboarding" element={user ? <Onboarding /> : <Navigate to="/login" replace />} />
      
      {/* Protected routes */}
      <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/resorts" element={<ProtectedRoute><Resorts /></ProtectedRoute>} />
      <Route path="/runs/:id" element={<ProtectedRoute><RunDetail /></ProtectedRoute>} />
      <Route path="/log" element={<ProtectedRoute><LogRun /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      
      {/* Default route - always go to login first, let auth redirect if needed */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ResortProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster 
            position="top-center"
            toastOptions={{
              style: {
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderLeft: '3px solid #00E676',
                borderRadius: '12px',
                color: 'white',
                fontFamily: 'Manrope, sans-serif',
              },
            }}
          />
        </BrowserRouter>
      </ResortProvider>
    </AuthProvider>
  );
}

export default App;
