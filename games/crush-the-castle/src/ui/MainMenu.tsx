interface MainMenuProps {
  onPlay: () => void;
  onHowToPlay: () => void;
}

const STYLE_OVERLAY: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 20,
  display: 'flex',
};

const STYLE_GRADIENT: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background:
    'radial-gradient(120% 95% at 50% 38%, rgba(239,226,196,.08) 50%, rgba(46,33,23,.18) 100%)',
  pointerEvents: 'none',
};

const STYLE_TITLE: React.CSSProperties = {
  position: 'absolute',
  top: '6%',
  left: 0,
  right: 0,
  textAlign: 'center',
  pointerEvents: 'none',
  fontFamily: "'Grenze Gotisch', serif",
  fontWeight: 900,
  fontSize: 'clamp(32px, 6.5vw, 62px)',
  lineHeight: 0.86,
  color: '#2E2117',
  textShadow: '0 2px 0 #FBF3DD',
};

const STYLE_TITLE_ACCENT: React.CSSProperties = {
  color: '#E8533A',
  WebkitTextStroke: '2px #2E2117',
  paintOrder: 'stroke fill',
};

const STYLE_BTN_AREA: React.CSSProperties = {
  position: 'absolute',
  left: '50%',
  bottom: '8%',
  transform: 'translateX(-50%)',
  width: '40%',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const STYLE_PLAY_BTN: React.CSSProperties = {
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 900,
  fontSize: 22,
  color: '#fff',
  textShadow: '0 2px 0 rgba(0,0,0,.3)',
  padding: 15,
  border: '3.5px solid #2E2117',
  borderRadius: 15,
  cursor: 'pointer',
  background: '#E8533A',
  boxShadow: '0 6px 0 #2E2117',
  letterSpacing: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
};

const STYLE_SEC_ROW: React.CSSProperties = {
  display: 'flex',
  gap: 12,
};

const STYLE_SEC_BTN: React.CSSProperties = {
  flex: 1,
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 900,
  fontSize: 14,
  color: '#2E2117',
  padding: 12,
  border: '3.5px solid #2E2117',
  borderRadius: 13,
  cursor: 'pointer',
  background: '#EAD9B0',
  boxShadow: '0 5px 0 #2E2117',
};

const STYLE_HOWTO: React.CSSProperties = {
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 600,
  fontSize: 14,
  color: '#5B4A36',
  marginTop: 16,
  lineHeight: 1.5,
};

const STYLE_HOWTO_BOLD: React.CSSProperties = {
  color: '#2E2117',
  fontWeight: 700,
};

export function MainMenu({ onPlay, onHowToPlay }: MainMenuProps) {
  return (
    <>
      <div style={STYLE_OVERLAY}>
        <div style={STYLE_GRADIENT} />
        <div style={STYLE_TITLE}>
          Crush<br />
          <span style={STYLE_TITLE_ACCENT}>the Castle</span>
        </div>
        <div style={STYLE_BTN_AREA}>
          <button style={STYLE_PLAY_BTN} onClick={onPlay}>
            <span>▶</span> PLAY
          </button>
          <div style={STYLE_SEC_ROW}>
            <button style={STYLE_SEC_BTN} onClick={onHowToPlay}>
              How to Play
            </button>
            <button style={STYLE_SEC_BTN}>Settings</button>
          </div>
        </div>
      </div>
      <p id="howto" style={STYLE_HOWTO}>
        <b style={STYLE_HOWTO_BOLD}>How to play:</b> Set the <b style={STYLE_HOWTO_BOLD}>Direction</b> (launch
        angle in degrees) and <b style={STYLE_HOWTO_BOLD}>Power</b> with the sliders, then press{' '}
        <b style={STYLE_HOWTO_BOLD}>FIRE</b> — or drag backward from the trebuchet. The counterweight
        drops, the arm whips over, and the sling hurls the boulder. Topple every guard and the golden
        king before you run out of ammo.
      </p>
    </>
  );
}
