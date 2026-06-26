import { LEVEL_NAME } from '../config';

interface HUDProps {
  score: number;
  enemiesAlive: number;
  ammo: number;
  onPause: () => void;
  onRestart: () => void;
}

const STYLE_TOP_LEFT: React.CSSProperties = {
  position: 'absolute',
  left: '2.2%',
  top: '4.5%',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  pointerEvents: 'none',
};

const STYLE_LEVEL_BADGE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  background: '#2E2117',
  padding: '5px 13px 5px 7px',
  borderRadius: 999,
  alignSelf: 'flex-start',
};

const STYLE_STAR_ICON: React.CSSProperties = {
  display: 'inline-flex',
  width: 24,
  height: 24,
  alignItems: 'center',
  justifyContent: 'center',
  background: '#F2A93B',
  borderRadius: '50%',
};

const STYLE_LEVEL_TEXT: React.CSSProperties = {
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 900,
  fontSize: 13,
  letterSpacing: 1,
  color: '#FBF3DD',
};

const STYLE_SCORE_CARD: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  background: '#FBF3DD',
  border: '3px solid #2E2117',
  borderRadius: 12,
  boxShadow: '0 4px 0 #2E2117',
  padding: '6px 14px',
};

const STYLE_SCORE_LABEL: React.CSSProperties = {
  fontWeight: 800,
  fontSize: 10,
  letterSpacing: 1.5,
  color: '#8C8378',
  textTransform: 'uppercase',
};

const STYLE_SCORE_VAL: React.CSSProperties = {
  fontFamily: "'Grenze Gotisch', serif",
  fontWeight: 900,
  fontSize: 26,
  lineHeight: 0.9,
  color: '#2E2117',
};

const STYLE_TOP_CENTER: React.CSSProperties = {
  position: 'absolute',
  left: '50%',
  top: '4.5%',
  transform: 'translateX(-50%)',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  background: '#FBF3DD',
  border: '3px solid #2E2117',
  borderRadius: 999,
  boxShadow: '0 4px 0 #2E2117',
  padding: '5px 14px',
  pointerEvents: 'none',
};

const STYLE_ENEMIES_TEXT: React.CSSProperties = {
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 900,
  fontSize: 14,
  color: '#2E2117',
};

const STYLE_TOP_RIGHT: React.CSSProperties = {
  position: 'absolute',
  right: '2.2%',
  top: '4.5%',
  display: 'flex',
  gap: 9,
  pointerEvents: 'auto',
};

const STYLE_HUD_BTN: React.CSSProperties = {
  width: 46,
  height: 46,
  border: '3px solid #2E2117',
  borderRadius: 12,
  background: '#FBF3DD',
  boxShadow: '0 4px 0 #2E2117',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const STYLE_BOTTOM_LEFT: React.CSSProperties = {
  position: 'absolute',
  left: '2.2%',
  bottom: '4.5%',
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  background: '#FBF3DD',
  border: '3px solid #2E2117',
  borderRadius: 12,
  boxShadow: '0 4px 0 #2E2117',
  padding: '7px 14px',
  pointerEvents: 'none',
};

const STYLE_AMMO_LABEL: React.CSSProperties = {
  fontWeight: 800,
  fontSize: 10,
  letterSpacing: 1.5,
  color: '#8C8378',
  textTransform: 'uppercase',
};

const STYLE_AMMO_ICON: React.CSSProperties = {
  width: 20,
  height: 20,
};

const STYLE_AMMO_COUNT: React.CSSProperties = {
  fontFamily: "'Grenze Gotisch', serif",
  fontWeight: 900,
  fontSize: 22,
  color: '#2E2117',
};

export function HUD({ score, enemiesAlive, ammo, onPause, onRestart }: HUDProps) {
  return (
    <>
      {/* Top-left: level + score */}
      <div style={STYLE_TOP_LEFT}>
        <div style={STYLE_LEVEL_BADGE}>
          <span style={STYLE_STAR_ICON}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#2E2117">
              <path d="M5 8 L9 11 L12 5 L15 11 L19 8 L17 18 H7 Z" />
            </svg>
          </span>
          <span style={STYLE_LEVEL_TEXT}>{LEVEL_NAME}</span>
        </div>
        <div style={STYLE_SCORE_CARD}>
          <span style={STYLE_SCORE_LABEL}>Score</span>
          <span style={STYLE_SCORE_VAL}>{score.toLocaleString()}</span>
        </div>
      </div>

      {/* Top-center: enemies left */}
      <div style={STYLE_TOP_CENTER}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#E8533A" stroke="#2E2117" strokeWidth="1.6">
          <circle cx="12" cy="12" r="9" />
        </svg>
        <span style={STYLE_ENEMIES_TEXT}>{enemiesAlive} left</span>
      </div>

      {/* Top-right: pause + restart */}
      <div style={STYLE_TOP_RIGHT}>
        <button style={STYLE_HUD_BTN} onClick={onPause}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#2E2117">
            <rect x="6" y="5" width="4.5" height="14" rx="1.5" />
            <rect x="13.5" y="5" width="4.5" height="14" rx="1.5" />
          </svg>
        </button>
        <button style={STYLE_HUD_BTN} onClick={onRestart}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2E2117" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 11 a8 8 0 1 0 -2 5" />
            <path d="M20 5 V11 H14" />
          </svg>
        </button>
      </div>

      {/* Bottom-left: ammo */}
      <div style={STYLE_BOTTOM_LEFT}>
        <span style={STYLE_AMMO_LABEL}>Ammo</span>
        <svg style={STYLE_AMMO_ICON} viewBox="0 0 24 24" fill="#8C8378" stroke="#2E2117" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
        </svg>
        <span style={STYLE_AMMO_COUNT}>×{ammo}</span>
      </div>
    </>
  );
}
