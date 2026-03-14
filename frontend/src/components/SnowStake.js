import { useEffect, useState } from 'react';

export function SnowStake({ daysLogged = 0, goalDays = 0, verticalLogged = 0, goalVertical = 0 }) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const targetPercentage = goalDays > 0 ? Math.min((daysLogged / goalDays) * 100, 100) : 0;
  const isGoalCrushed = targetPercentage >= 100;
  
  // Animate fill on load
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(targetPercentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [targetPercentage]);

  const getMessage = () => {
    if (goalDays === 0) return 'Set your season goals to unlock the Snow Stake';
    if (targetPercentage === 0) return 'Get out there — season starts now';
    if (isGoalCrushed) return 'Goal Crushed 🏔️';
    return `${Math.round(targetPercentage)}% to goal`;
  };

  // Tick marks with better labels
  const ticks = [
    { value: 100, label: '100%' },
    { value: 75, label: '75%' },
    { value: 50, label: '50%' },
    { value: 25, label: '25%' },
  ];

  return (
    <div data-testid="snow-stake" className="flex flex-col items-center gap-6 py-8">
      {/* Stake Container - Increased size */}
      <div className="relative">
        {/* Glow effect behind stake */}
        <div 
          className="absolute inset-0 rounded-full blur-xl transition-opacity duration-1000"
          style={{
            background: `radial-gradient(ellipse at center bottom, rgba(0, 180, 216, ${animatedPercentage * 0.005}) 0%, transparent 70%)`,
            transform: 'scale(1.5)',
          }}
        />
        
        {/* Main Stake */}
        <div 
          className="relative w-20 h-64 rounded-full overflow-hidden"
          style={{
            backgroundColor: '#1A2126',
            border: '2px solid rgba(255, 255, 255, 0.12)',
            boxShadow: `
              0 0 40px rgba(0, 180, 216, ${animatedPercentage * 0.003}),
              inset 0 0 20px rgba(0, 0, 0, 0.3)
            `
          }}
        >
          {/* Background texture */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 8px,
                rgba(255,255,255,0.03) 8px,
                rgba(255,255,255,0.03) 9px
              )`
            }}
          />

          {/* Tick marks - positioned on the left side */}
          <div className="absolute left-0 top-0 bottom-0 w-full flex flex-col justify-between py-3">
            {ticks.map((tick) => (
              <div 
                key={tick.value} 
                className="flex items-center"
                style={{ 
                  position: 'absolute',
                  top: `${100 - tick.value}%`,
                  left: 0,
                  right: 0,
                  transform: 'translateY(-50%)'
                }}
              >
                <div 
                  className="w-4 h-0.5 ml-1"
                  style={{ 
                    backgroundColor: animatedPercentage >= tick.value ? '#00B4D8' : 'rgba(255,255,255,0.25)'
                  }} 
                />
                <span 
                  className="text-[9px] ml-1 font-medium transition-colors duration-500"
                  style={{ 
                    fontFamily: 'JetBrains Mono, monospace',
                    color: animatedPercentage >= tick.value ? '#00B4D8' : 'rgba(255,255,255,0.4)'
                  }}
                >
                  {tick.label}
                </span>
              </div>
            ))}
          </div>

          {/* Fill with glow */}
          <div 
            className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out"
            style={{
              height: `${animatedPercentage}%`,
              background: isGoalCrushed 
                ? 'linear-gradient(to top, #B8860B, #FFD700, #FFF8DC)'
                : 'linear-gradient(to top, #005A87, #0077B6, #00B4D8, #48CAE4)',
              boxShadow: isGoalCrushed
                ? '0 0 30px rgba(255, 215, 0, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.3)'
                : '0 0 25px rgba(0, 180, 216, 0.5), inset 0 0 15px rgba(255, 255, 255, 0.2)',
            }}
          >
            {/* Animated shimmer effect */}
            <div 
              className="absolute inset-0 overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%, transparent 100%)',
                animation: 'shimmer 3s ease-in-out infinite',
              }}
            />
            
            {/* Bubble effect at top of fill */}
            {animatedPercentage > 5 && (
              <div 
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)',
                  animation: 'pulse 2s ease-in-out infinite'
                }}
              />
            )}
          </div>

          {/* Snow cap at top when goal crushed */}
          {isGoalCrushed && (
            <div 
              className="absolute top-0 left-0 right-0 h-4 rounded-t-full"
              style={{
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,0.3))',
              }}
            />
          )}
        </div>
      </div>

      {/* Stats with improved layout */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <p className="text-lg font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#00B4D8' }}>
              {daysLogged}
            </p>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>logged</p>
          </div>
          <div className="text-2xl" style={{ color: 'rgba(255,255,255,0.3)' }}>/</div>
          <div className="text-center">
            <p className="text-lg font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.8)' }}>
              {goalDays}
            </p>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>goal days</p>
          </div>
        </div>
        
        <p className="text-sm" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.6)' }}>
          {verticalLogged.toLocaleString()} / {goalVertical.toLocaleString()} ft
        </p>
        
        <p 
          className="text-sm font-semibold pt-1 transition-colors duration-500"
          style={{ 
            fontFamily: 'Manrope, sans-serif', 
            color: isGoalCrushed ? '#FFD700' : goalDays === 0 ? 'rgba(255,255,255,0.5)' : '#00B4D8',
          }}
        >
          {getMessage()}
        </p>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 0.6; transform: translateY(-10px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.8; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
        }
      `}</style>
    </div>
  );
}

// Compact version for side-by-side layout
export function SnowStakeCompact({ daysLogged = 0, goalDays = 0, verticalLogged = 0, goalVertical = 0 }) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const targetPercentage = goalDays > 0 ? Math.min((daysLogged / goalDays) * 100, 100) : 0;
  const isGoalCrushed = targetPercentage >= 100;
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(targetPercentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [targetPercentage]);

  const getMessage = () => {
    if (goalDays === 0) return 'Set goals';
    if (isGoalCrushed) return 'Crushed! 🏔️';
    return `${Math.round(targetPercentage)}%`;
  };

  const ticks = [
    { value: 100, label: '100' },
    { value: 50, label: '50' },
  ];

  return (
    <div data-testid="snow-stake-compact" className="flex flex-col items-center gap-2 py-2">
      {/* Compact Stake */}
      <div className="relative">
        <div 
          className="absolute inset-0 rounded-full blur-lg transition-opacity duration-1000"
          style={{
            background: `radial-gradient(ellipse at center bottom, rgba(0, 180, 216, ${animatedPercentage * 0.004}) 0%, transparent 70%)`,
            transform: 'scale(1.3)',
          }}
        />
        
        <div 
          className="relative w-14 h-44 rounded-full overflow-hidden"
          style={{
            backgroundColor: '#1A2126',
            border: '2px solid rgba(255, 255, 255, 0.12)',
            boxShadow: `
              0 0 20px rgba(0, 180, 216, ${animatedPercentage * 0.002}),
              inset 0 0 15px rgba(0, 0, 0, 0.3)
            `
          }}
        >
          {/* Background texture */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 6px,
                rgba(255,255,255,0.03) 6px,
                rgba(255,255,255,0.03) 7px
              )`
            }}
          />

          {/* Tick marks */}
          <div className="absolute left-0 top-0 bottom-0 w-full">
            {ticks.map((tick) => (
              <div 
                key={tick.value} 
                className="flex items-center"
                style={{ 
                  position: 'absolute',
                  top: `${100 - tick.value}%`,
                  left: 0,
                  right: 0,
                  transform: 'translateY(-50%)'
                }}
              >
                <div 
                  className="w-3 h-0.5 ml-1"
                  style={{ 
                    backgroundColor: animatedPercentage >= tick.value ? '#00B4D8' : 'rgba(255,255,255,0.2)'
                  }} 
                />
              </div>
            ))}
          </div>

          {/* Fill */}
          <div 
            className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out"
            style={{
              height: `${animatedPercentage}%`,
              background: isGoalCrushed 
                ? 'linear-gradient(to top, #B8860B, #FFD700, #FFF8DC)'
                : 'linear-gradient(to top, #005A87, #0077B6, #00B4D8, #48CAE4)',
              boxShadow: isGoalCrushed
                ? '0 0 20px rgba(255, 215, 0, 0.5), inset 0 0 15px rgba(255, 255, 255, 0.3)'
                : '0 0 15px rgba(0, 180, 216, 0.4), inset 0 0 10px rgba(255, 255, 255, 0.2)',
            }}
          >
            <div 
              className="absolute inset-0 overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%)',
                animation: 'shimmer 3s ease-in-out infinite',
              }}
            />
          </div>

          {isGoalCrushed && (
            <div 
              className="absolute top-0 left-0 right-0 h-3 rounded-t-full"
              style={{
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,0.3))',
              }}
            />
          )}
        </div>
      </div>

      {/* Compact Stats */}
      <div className="text-center">
        <p className="text-sm font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#00B4D8' }}>
          {daysLogged}/{goalDays}
        </p>
        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>days</p>
        <p 
          className="text-xs font-semibold mt-1"
          style={{ 
            fontFamily: 'Manrope, sans-serif', 
            color: isGoalCrushed ? '#FFD700' : goalDays === 0 ? 'rgba(255,255,255,0.4)' : '#00B4D8',
          }}
        >
          {getMessage()}
        </p>
      </div>

      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 0.6; transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
