interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
}

const STYLE_OVERLAY: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(58,42,28,.34)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10,
};

const STYLE_MODAL: React.CSSProperties = {
  position: 'relative',
  width: '42%',
  minWidth: 260,
  background: '#FBF3DD',
  border: '4px solid #2E2117',
  borderRadius: 24,
  boxShadow: '0 8px 0 #2E2117, 0 30px 50px rgba(0,0,0,.45)',
  padding: '46px 28px 26px',
};

const STYLE_RIBBON: React.CSSProperties = {
  position: 'absolute',
  top: -24,
  left: '50%',
  transform: 'translateX(-50%)',
  background: '#2E2117',
  color: '#FBF3DD',
  fontFamily: "'Grenze Gotisch', serif",
  fontWeight: 900,
  fontSize: 28,
  letterSpacing: 1,
  padding: '7px 30px',
  borderRadius: 13,
  border: '3px solid #F2A93B',
  boxShadow: '0 5px 0 rgba(0,0,0,.35)',
  whiteSpace: 'nowrap',
};

const STYLE_BTN_GROUP: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 11,
};

const STYLE_PRIMARY_BTN: React.CSSProperties = {
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 900,
  fontSize: 18,
  color: '#fff',
  textShadow: '0 2px 0 rgba(0,0,0,.3)',
  padding: 13,
  border: '3.5px solid #2E2117',
  borderRadius: 14,
  cursor: 'pointer',
  background: '#E8533A',
  boxShadow: '0 6px 0 #2E2117',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 9,
};

const STYLE_SEC_BTN: React.CSSProperties = {
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 900,
  fontSize: 16,
  color: '#2E2117',
  padding: 12,
  border: '3.5px solid #2E2117',
  borderRadius: 14,
  cursor: 'pointer',
  background: '#EAD9B0',
  boxShadow: '0 5px 0 #2E2117',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 9,
};

const STYLE_TOGGLES_ROW: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  marginTop: 3,
};

const STYLE_TOGGLE: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: '#EFE2C4',
  border: '3px solid #2E2117',
  borderRadius: 11,
  padding: '7px 11px',
};

const STYLE_TOGGLE_LABEL: React.CSSProperties = {
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 800,
  fontSize: 12,
  color: '#2E2117',
};

const STYLE_TOGGLE_TRACK: React.CSSProperties = {
  width: 42,
  height: 22,
  borderRadius: 999,
  background: '#6E8B5A',
  border: '2.5px solid #2E2117',
  position: 'relative',
  cursor: 'pointer',
};

const STYLE_TOGGLE_THUMB: React.CSSProperties = {
  position: 'absolute',
  right: 2,
  top: '50%',
  transform: 'translateY(-50%)',
  width: 15,
  height: 15,
  borderRadius: '50%',
  background: '#FBF3DD',
  border: '2px solid #2E2117',
};

export function PauseModal({ onResume, onRestart, onQuit }: PauseModalProps) {
  return (
    <div style={STYLE_OVERLAY}>
      <div style={STYLE_MODAL}>
        <div style={STYLE_RIBBON}>Paused</div>
        <div style={STYLE_BTN_GROUP}>
          <button style={STYLE_PRIMARY_BTN} onClick={onResume}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
              <path d="M7 5 L19 12 L7 19 Z" />
            </svg>
            RESUME
          </button>
          <button style={STYLE_SEC_BTN} onClick={onRestart}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2E2117" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 11 a8 8 0 1 0 -2 5" />
              <path d="M20 5 V11 H14" />
            </svg>
            Restart
          </button>
          <button style={STYLE_SEC_BTN} onClick={onQuit}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2E2117" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 4 H6 a2 2 0 0 0 -2 2 V18 a2 2 0 0 0 2 2 H14" />
              <path d="M17 8 L21 12 L17 16 M21 12 H10" />
            </svg>
            Quit to Menu
          </button>
          <div style={STYLE_TOGGLES_ROW}>
            <div style={STYLE_TOGGLE}>
              <span style={STYLE_TOGGLE_LABEL}>Music</span>
              <div style={STYLE_TOGGLE_TRACK}>
                <div style={STYLE_TOGGLE_THUMB} />
              </div>
            </div>
            <div style={STYLE_TOGGLE}>
              <span style={STYLE_TOGGLE_LABEL}>Sound</span>
              <div style={STYLE_TOGGLE_TRACK}>
                <div style={STYLE_TOGGLE_THUMB} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
