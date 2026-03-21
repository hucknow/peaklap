export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <div style={{
      textAlign: 'center',
      padding: '12px 16px',
      fontFamily: 'Manrope, sans-serif',
      fontSize: '11px',
      color: 'rgba(255,255,255,0.25)',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      marginTop: 'auto'
    }}>
      © {year} PeakLap. All rights reserved.
      {' · '}
      <a
        href="/terms"
        style={{
          color: 'rgba(255,255,255,0.35)',
          textDecoration: 'none'
        }}
      >
        Terms
      </a>
      {' · '}
      <a
        href="/privacy"
        style={{
          color: 'rgba(255,255,255,0.35)',
          textDecoration: 'none'
        }}
      >
        Privacy
      </a>
    </div>
  );
}
