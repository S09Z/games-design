interface ResultModalProps {
  score: number;
  won: boolean;
  onPlayAgain: () => void;
}

const OVERLAY: React.CSSProperties = {
  position: 'absolute', inset: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(0,0,0,0.6)',
  zIndex: 10,
};

const BOX: React.CSSProperties = {
  background: '#1a1a2e',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 16,
  padding: '32px 48px',
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
};

const TITLE: React.CSSProperties = {
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 900, fontSize: 28, letterSpacing: 3,
  color: '#fff',
};

const SCORE: React.CSSProperties = {
  fontFamily: "'Grenze Gotisch', serif",
  fontWeight: 900, fontSize: 48,
  color: '#E8533A',
};

const BTN: React.CSSProperties = {
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 800, fontSize: 14, letterSpacing: 1,
  color: '#fff', padding: '10px 32px',
  border: '2px solid rgba(255,255,255,0.2)',
  borderRadius: 10,
  cursor: 'pointer', background: 'transparent',
  width: 180,
};

export function ResultModal({ score, won, onPlayAgain }: ResultModalProps) {
  return (
    <div style={OVERLAY}>
      <div style={BOX}>
        <div style={TITLE}>{won ? 'VICTORY' : 'DEFEAT'}</div>
        <div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', letterSpacing: 1 }}>SCORE</div>
          <div style={SCORE}>{score.toLocaleString()}</div>
        </div>
        <button style={BTN} onClick={onPlayAgain}>PLAY AGAIN</button>
      </div>
    </div>
  );
}
