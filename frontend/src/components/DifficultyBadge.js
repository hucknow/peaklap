import { getDifficultyDisplay } from '@/lib/difficulty-system';

export function DifficultyBadge({ difficulty, region = 'NA', className = '' }) {
  const display = getDifficultyDisplay(difficulty, region);
  
  if (!display) return null;

  const bgColor = display.color === '#1C1C1C' 
    ? display.color 
    : `${display.color}26`; // 15% opacity for non-black

  const textColor = display.textDark ? '#000000' : '#FFFFFF';

  return (
    <span
      data-testid={`difficulty-badge-${difficulty}`}
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${className}`}
      style={{
        backgroundColor: bgColor,
        color: textColor,
        border: display.border ? `1px solid ${display.border}` : `1px solid ${display.color}`,
        fontFamily: 'Manrope, sans-serif',
      }}
    >
      {display.label}
      {display.icon && <span className="ml-0.5">{display.icon}</span>}
    </span>
  );
}
