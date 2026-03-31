export default function Footer() {
  const appVersion = 'v0.6.0';

  return (
    <div style={{
      textAlign: 'center',
      padding: '12px 16px',
      fontFamily: 'Manrope, sans-serif',
      fontSize: '11px',
      color: 'rgba(255,255,255,0.25)',
      marginTop: 'auto'
    }}>
      <p style={{ margin: 0, padding: 0 }}>
        © 2026 PeakLap. All rights reserved.
        {' · '}
        <a href="/terms" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Terms</a>
        {' · '}
        <a href="/privacy" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Privacy</a>
      </p>
      <p style={{ margin: '4px 0 0', padding: 0, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.3)' }}>
        {appVersion}
      </p>
    </div>
  );
}