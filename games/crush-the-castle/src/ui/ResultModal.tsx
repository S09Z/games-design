interface ResultModalProps {
  result: 'victory' | 'defeat';
  score: number;
  bestScore: number;
  starsEarned: number;
  onHome: () => void;
  onRetry: () => void;
  onNext: (() => void) | null;
}

const STYLE_OVERLAY: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(58,42,28,.32)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10,
};

const STYLE_MODAL: React.CSSProperties = {
  position: 'relative',
  width: '48%',
  minWidth: 280,
  background: '#FBF3DD',
  border: '4px solid #2E2117',
  borderRadius: 22,
  boxShadow: '0 8px 0 #2E2117, 0 26px 44px rgba(0,0,0,.45)',
  padding: '48px 28px 24px',
  textAlign: 'center',
};

function ribbonStyle(isVictory: boolean): React.CSSProperties {
  return {
    position: 'absolute',
    top: -26,
    left: '50%',
    transform: 'translateX(-50%)',
    background: isVictory ? '#E8533A' : '#2E2117',
    color: '#fff',
    fontFamily: "'Grenze Gotisch', serif",
    fontWeight: 900,
    fontSize: 28,
    letterSpacing: 1,
    padding: '7px 32px',
    borderRadius: 13,
    border: isVictory ? '3.5px solid #2E2117' : '3.5px solid #8C8378',
    boxShadow: '0 5px 0 #2E2117',
    whiteSpace: 'nowrap',
    textShadow: '0 2px 0 rgba(0,0,0,.3)',
  };
}

const STYLE_STARS: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-end',
  gap: 8,
  marginBottom: 12,
};

function starStyle(size: number): React.CSSProperties {
  return {
    fontSize: size,
    WebkitTextStroke: '2.5px #2E2117',
    lineHeight: 1,
  };
}

const STYLE_SCORE_ROW: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: 22,
  marginBottom: 18,
};

const STYLE_SCORE_COL: React.CSSProperties = {
  textAlign: 'center',
};

const STYLE_SCORE_LABEL: React.CSSProperties = {
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 800,
  fontSize: 10,
  letterSpacing: 1.5,
  color: '#8C8378',
  textTransform: 'uppercase',
  marginBottom: 2,
};

const STYLE_SCORE_VAL: React.CSSProperties = {
  fontFamily: "'Grenze Gotisch', serif",
  fontWeight: 900,
  fontSize: 28,
  lineHeight: 1,
};

const STYLE_DIVIDER: React.CSSProperties = {
  width: 2,
  background: '#E4DCC8',
  borderRadius: 2,
};

const STYLE_BTN_ROW: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  alignItems: 'stretch',
};

const STYLE_ICON_BTN: React.CSSProperties = {
  width: 50,
  padding: 0,
  border: '3.5px solid #2E2117',
  borderRadius: 14,
  cursor: 'pointer',
  background: '#EAD9B0',
  boxShadow: '0 5px 0 #2E2117',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const STYLE_RETRY_BTN: React.CSSProperties = {
  flex: 1,
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 900,
  fontSize: 15,
  color: '#2E2117',
  padding: 11,
  border: '3.5px solid #2E2117',
  borderRadius: 14,
  cursor: 'pointer',
  background: '#EAD9B0',
  boxShadow: '0 5px 0 #2E2117',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
};

const STYLE_NEXT_BTN: React.CSSProperties = {
  flex: 1.4,
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 900,
  fontSize: 17,
  color: '#fff',
  textShadow: '0 2px 0 rgba(0,0,0,.3)',
  padding: 11,
  border: '3.5px solid #2E2117',
  borderRadius: 14,
  cursor: 'pointer',
  background: '#E8533A',
  boxShadow: '0 5px 0 #2E2117',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
};

const STYLE_TRYAGAIN_BTN: React.CSSProperties = {
  flex: 1.4,
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 900,
  fontSize: 17,
  color: '#fff',
  textShadow: '0 2px 0 rgba(0,0,0,.3)',
  padding: 11,
  border: '3.5px solid #2E2117',
  borderRadius: 14,
  cursor: 'pointer',
  background: '#E8533A',
  boxShadow: '0 5px 0 #2E2117',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
};

const STYLE_MENU_BTN: React.CSSProperties = {
  flex: 1,
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 900,
  fontSize: 15,
  color: '#2E2117',
  padding: 11,
  border: '3.5px solid #2E2117',
  borderRadius: 14,
  cursor: 'pointer',
  background: '#EAD9B0',
  boxShadow: '0 5px 0 #2E2117',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
};

export function ResultModal({ result, score, bestScore, starsEarned, onHome, onRetry, onNext }: ResultModalProps) {
  const isVictory = result === 'victory';
  const starFill = '#F2A93B';
  const starEmpty = '#E4DCC8';

  return (
    <div style={STYLE_OVERLAY}>
      <div style={STYLE_MODAL}>
        <div style={ribbonStyle(isVictory)}>{isVictory ? 'Victory!' : 'Defeat'}</div>

        {isVictory && (
          <div style={STYLE_STARS}>
            <span style={{ ...starStyle(46), color: starsEarned >= 1 ? starFill : starEmpty }}>★</span>
            <span style={{ ...starStyle(60), color: starsEarned >= 2 ? starFill : starEmpty, marginBottom: 5 }}>★</span>
            <span style={{ ...starStyle(46), color: starsEarned >= 3 ? starFill : starEmpty }}>★</span>
          </div>
        )}

        <div style={STYLE_SCORE_ROW}>
          <div style={STYLE_SCORE_COL}>
            <div style={STYLE_SCORE_LABEL}>Score</div>
            <div style={STYLE_SCORE_VAL}>{score.toLocaleString()}</div>
          </div>
          <div style={STYLE_DIVIDER} />
          <div style={STYLE_SCORE_COL}>
            <div style={STYLE_SCORE_LABEL}>Best</div>
            <div style={{ ...STYLE_SCORE_VAL, color: '#C9851E' }}>{bestScore.toLocaleString()}</div>
          </div>
        </div>

        {isVictory ? (
          <div style={STYLE_BTN_ROW}>
            <button style={STYLE_ICON_BTN} onClick={onHome}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2E2117" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 11 L12 4 L20 11" />
                <path d="M6 10 V19 H18 V10" fill="#EAD9B0" />
                <rect x="10" y="13" width="4" height="6" fill="#2E2117" stroke="none" />
              </svg>
            </button>
            <button style={STYLE_RETRY_BTN} onClick={onRetry}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2E2117" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 11 a8 8 0 1 0 -2 5" />
                <path d="M20 5 V11 H14" />
              </svg>
              Retry
            </button>
            {onNext ? (
              <button style={STYLE_NEXT_BTN} onClick={onNext}>
                NEXT{' '}
                <svg width="19" height="19" viewBox="0 0 24 24" fill="#fff">
                  <path d="M7 5 L17 12 L7 19 Z" />
                </svg>
              </button>
            ) : null}
          </div>
        ) : (
          <div style={STYLE_BTN_ROW}>
            <button style={STYLE_MENU_BTN} onClick={onHome}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2E2117" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 4 H6 a2 2 0 0 0 -2 2 V18 a2 2 0 0 0 2 2 H14" />
                <path d="M17 8 L21 12 L17 16 M21 12 H10" />
              </svg>
              Menu
            </button>
            <button style={STYLE_TRYAGAIN_BTN} onClick={onRetry}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 11 a8 8 0 1 0 -2 5" />
                <path d="M20 5 V11 H14" />
              </svg>
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
