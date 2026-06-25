interface HintProps {
  visible: boolean;
}

const STYLE: React.CSSProperties = {
  position: 'absolute',
  left: '50%',
  top: '22%',
  transform: 'translateX(-50%)',
  background: 'rgba(46,33,23,.82)',
  color: '#FBF3DD',
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 800,
  fontSize: 14,
  padding: '9px 18px',
  borderRadius: 999,
  pointerEvents: 'none',
  whiteSpace: 'nowrap',
  transition: 'opacity 0.5s',
};

export function Hint({ visible }: HintProps) {
  return (
    <div style={{ ...STYLE, opacity: visible ? 1 : 0 }}>
      Set direction &amp; power, then press FIRE — or drag from the trebuchet
    </div>
  );
}
