import { Link, useLocation } from 'react-router-dom';
import { Home, Mountain, History, Settings } from 'lucide-react';

// Custom Ski icon for the Log button
const SkiIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Ski poles crossed */}
    <line x1="6" y1="4" x2="18" y2="20" />
    <line x1="18" y1="4" x2="6" y2="20" />
    {/* Pole grips */}
    <circle cx="6" cy="4" r="1.5" fill="currentColor" />
    <circle cx="18" cy="4" r="1.5" fill="currentColor" />
    {/* Pole baskets */}
    <circle cx="18" cy="20" r="1" fill="currentColor" />
    <circle cx="6" cy="20" r="1" fill="currentColor" />
  </svg>
);

export function BottomNav() {
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;

  const NavItem = ({ to, icon: Icon, label, isLog = false }) => {
    const active = isActive(to);
    
    if (isLog) {
      return (
        <Link to={to} data-testid="nav-log" className="flex flex-col items-center justify-center -mt-6">
          <div 
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105"
            style={{ 
              background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)',
              boxShadow: '0 4px 20px rgba(0, 180, 216, 0.4)'
            }}
          >
            <SkiIcon size={24} />
          </div>
          <span className="text-[10px] mt-1 font-medium" style={{ 
            fontFamily: 'Manrope, sans-serif',
            color: 'rgba(255,255,255,0.8)'
          }}>
            {label}
          </span>
        </Link>
      );
    }

    return (
      <Link 
        to={to} 
        data-testid={`nav-${label.toLowerCase()}`} 
        className="flex flex-col items-center justify-center gap-1 transition-all"
      >
        <Icon 
          size={20} 
          style={{ 
            color: active ? '#00B4D8' : 'rgba(255,255,255,0.55)',
            transition: 'color 0.2s ease'
          }} 
        />
        <span 
          className="text-[10px] font-medium"
          style={{ 
            fontFamily: 'Manrope, sans-serif',
            color: active ? '#00B4D8' : 'rgba(255,255,255,0.55)',
            transition: 'color 0.2s ease'
          }}
        >
          {label}
        </span>
      </Link>
    );
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 h-20 flex items-center justify-around px-4 z-40"
      style={{
        backgroundColor: '#1A2126',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)'
      }}
      data-testid="bottom-nav"
    >
      <NavItem to="/home" icon={Home} label="Home" />
      <NavItem to="/resorts" icon={Mountain} label="Mountains" />
      <NavItem to="/log" icon={SkiIcon} label="Log" isLog />
      <NavItem to="/history" icon={History} label="History" />
      <NavItem to="/settings" icon={Settings} label="Settings" />
    </nav>
  );
}
