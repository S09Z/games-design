interface ResultModalProps {
  score: number;
  won: boolean;
  enemiesLeft: number;
  onPlayAgain: () => void;
}

export function ResultModal({ score, won, enemiesLeft, onPlayAgain }: ResultModalProps) {
  const title = won ? 'Victory!' : 'Defeat';
  const accent = won ? '#E8533A' : '#5B4A36';
  const msg = won ? 'Castle captured! Ammo bonus earned.' : `Out of ammo — ${enemiesLeft} still standing.`;

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 10,
      background: 'rgba(58,42,28,.32)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        position: 'relative', width: '48%', minWidth: 300,
        background: '#FBF3DD', border: '4px solid #2E2117', borderRadius: 22,
        boxShadow: '0 8px 0 #2E2117, 0 26px 44px rgba(0,0,0,.45)',
        padding: '48px 30px 26px', textAlign: 'center',
      }}>
        <div style={{
          position: 'absolute', top: -26, left: '50%', transform: 'translateX(-50%)',
          background: accent, color: '#fff',
          fontFamily: "'Grenze Gotisch', serif", fontWeight: 900, fontSize: 30, letterSpacing: 1,
          padding: '7px 36px', borderRadius: 13, border: '3.5px solid #2E2117',
          boxShadow: '0 5px 0 #2E2117', whiteSpace: 'nowrap', textShadow: '0 2px 0 rgba(0,0,0,.3)',
        }}>
          {title}
        </div>
        <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 15, color: '#5B4A36', marginBottom: 8 }}>
          {msg}
        </p>
        <div style={{ fontFamily: "'Grenze Gotisch', serif", fontWeight: 900, fontSize: 38, color: '#2E2117', marginBottom: 20 }}>
          {score.toLocaleString()}
        </div>
        <button
          onClick={onPlayAgain}
          style={{
            fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 19, color: '#fff',
            textShadow: '0 2px 0 rgba(0,0,0,.3)', padding: '13px 30px',
            border: '3.5px solid #2E2117', borderRadius: 14, cursor: 'pointer',
            background: '#E8533A', boxShadow: '0 5px 0 #2E2117',
            display: 'inline-flex', alignItems: 'center', gap: 9,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 11 a8 8 0 1 0 -2 5" /><path d="M20 5 V11 H14" />
          </svg>
          Play Again
        </button>
      </div>
    </div>
  );
}
