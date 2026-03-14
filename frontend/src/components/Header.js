import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useResort } from '@/contexts/ResortContext';
import { Settings, LogOut, ChevronDown, MapPin, Coffee, Lightbulb, Bug } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { ResortSelector } from './ResortSelector';

// Consistent logo URL used across the app
const LOGO_URL = 'https://customer-assets.emergentagent.com/job_run-sesh/artifacts/3n8ymt7j_PeakLap_Logo.png';

export function Header() {
  const { user, profile, signOut } = useAuth();
  const { 
    selectedResort, 
    setSelectedResort, 
    allResorts, 
    recentResorts, 
    myResorts, 
    detectedResort 
  } = useResort();
  
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showSupportMenu, setShowSupportMenu] = useState(false);
  const [showResortSelector, setShowResortSelector] = useState(false);
  const menuRef = useRef(null);
  const supportMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
      if (supportMenuRef.current && !supportMenuRef.current.contains(event.target)) {
        setShowSupportMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getInitials = () => {
    if (profile?.username) {
      return profile.username.substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const handleResortSelect = (resort) => {
    setSelectedResort(resort);
    setShowResortSelector(false);
  };

  return (
    <>
      <header 
        className="sticky top-0 z-50 px-4 py-3 flex items-center justify-between"
        style={{ 
          backgroundColor: '#12181B',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}
        data-testid="app-header"
      >
        {/* Left side - Logo and Resort Chip */}
        <div className="flex items-center gap-3">
          <Link 
            to="/home" 
            className="transition-opacity hover:opacity-85"
            style={{ textDecoration: 'none', border: 'none' }}
          >
            <img 
              src={LOGO_URL}
              alt="PeakLap Logo"
              className="h-12 w-12 object-contain"
            />
          </Link>
          
          {/* Global Resort Chip - Always visible */}
          <button
            onClick={() => setShowResortSelector(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all hover:bg-white/10"
            style={{ 
              backgroundColor: 'rgba(0, 180, 216, 0.1)',
              border: '1px solid rgba(0, 180, 216, 0.3)'
            }}
            data-testid="header-resort-selector"
          >
            <MapPin size={16} style={{ color: '#00B4D8' }} />
            <span 
              className="text-sm font-medium max-w-[120px] truncate"
              style={{ color: '#00B4D8', fontFamily: 'Manrope, sans-serif' }}
            >
              {selectedResort?.name || 'Select Resort'}
            </span>
            <ChevronDown size={14} style={{ color: '#00B4D8' }} />
          </button>
        </div>

      {/* Right Side - Support Menu + User Profile */}
      <div className="flex items-center gap-2">
        {/* Support Menu - Coffee Icon */}
        <div className="relative" ref={supportMenuRef}>
          <button
            data-testid="support-menu-button"
            onClick={() => setShowSupportMenu(!showSupportMenu)}
            className="p-2 rounded-full transition-all hover:bg-white/10"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            title="Support & Feedback"
          >
            <Coffee size={20} style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
          </button>

          {/* Support Dropdown */}
          {showSupportMenu && (
            <div className="absolute right-0 mt-2 w-56">
              <GlassCard className="p-2">
                <a
                  href="https://buymeacoffee.com/peaklap"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowSupportMenu(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all"
                  style={{ 
                    backgroundColor: 'transparent',
                    color: 'rgba(255, 255, 255, 0.8)',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <Coffee size={18} style={{ color: '#FFDD57' }} />
                  <span style={{ fontFamily: 'Manrope, sans-serif' }}>Support PeakLap</span>
                </a>

                <a
                  href="mailto:info@peaklap.com?subject=Feature Request"
                  onClick={() => setShowSupportMenu(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all"
                  style={{ 
                    backgroundColor: 'transparent',
                    color: 'rgba(255, 255, 255, 0.8)',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <Lightbulb size={18} style={{ color: '#00B4D8' }} />
                  <span style={{ fontFamily: 'Manrope, sans-serif' }}>Request a Feature</span>
                </a>

                <a
                  href="mailto:info@peaklap.com?subject=Bug Report"
                  onClick={() => setShowSupportMenu(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all"
                  style={{ 
                    backgroundColor: 'transparent',
                    color: 'rgba(255, 255, 255, 0.8)',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <Bug size={18} style={{ color: '#FF5252' }} />
                  <span style={{ fontFamily: 'Manrope, sans-serif' }}>Report a Bug</span>
                </a>
              </GlassCard>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={menuRef}>
          <button
            data-testid="user-menu-button"
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 p-2 rounded-full transition-all"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          >
            {/* Avatar */}
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
              style={{ 
                backgroundColor: '#00B4D8',
                color: '#000000',
                fontFamily: 'Manrope, sans-serif'
              }}
            >
              {getInitials()}
            </div>
            <ChevronDown size={16} style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
          </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute right-0 mt-2 w-64">
            <GlassCard className="p-4">
              {/* User Info */}
              <div className="pb-3 mb-3" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                    style={{ 
                      backgroundColor: '#00B4D8',
                      color: '#000000',
                      fontFamily: 'Manrope, sans-serif'
                    }}
                  >
                    {getInitials()}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      {profile?.username || 'User'}
                    </div>
                    <div className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      {user?.email}
                    </div>
                  </div>
                </div>
                {profile?.sport && (
                  <div className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                    {profile.sport === 'skier' ? '⛷️ Skier' : profile.sport === 'snowboarder' ? '🏂 Snowboarder' : '♿ Adaptive'}
                  </div>
                )}
              </div>

              {/* Menu Items */}
              <div className="space-y-1">
                <button
                  data-testid="menu-settings"
                  onClick={() => {
                    setShowMenu(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all"
                  style={{ 
                    backgroundColor: 'transparent',
                    color: 'rgba(255, 255, 255, 0.8)'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <Settings size={18} />
                  <span style={{ fontFamily: 'Manrope, sans-serif' }}>Settings</span>
                </button>

                <button
                  data-testid="menu-logout"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all"
                  style={{ 
                    backgroundColor: 'transparent',
                    color: 'rgba(255, 255, 255, 0.8)'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <LogOut size={18} />
                  <span style={{ fontFamily: 'Manrope, sans-serif' }}>Sign Out</span>
                </button>
              </div>
            </GlassCard>
          </div>
        )}
        </div>
      </div>
    </header>

    {/* Resort Selector Bottom Sheet */}
    <ResortSelector
      isOpen={showResortSelector}
      onClose={() => setShowResortSelector(false)}
      onSelect={handleResortSelect}
      allResorts={allResorts}
      recentResorts={recentResorts}
      myResorts={myResorts}
      selectedResort={selectedResort}
      detectedResort={detectedResort}
    />
    </>
  );
}
