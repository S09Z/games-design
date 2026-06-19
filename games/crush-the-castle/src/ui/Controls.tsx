import { AIM_MIN, AIM_MAX, POWER_MIN, POWER_MAX } from '../config';

interface ControlsProps {
  aimDeg: number;
  power: number;
  disabled: boolean;
  onAimChange: (deg: number) => void;
  onPowerChange: (pct: number) => void;
  onFire: () => void;
}

const STYLE_WRAPPER: React.CSSProperties = {
  position: 'absolute',
  left: '50%',
  bottom: '4.2%',
  transform: 'translateX(-50%)',
  display: 'flex',
  alignItems: 'stretch',
  gap: 12,
  background: '#FBF3DD',
  border: '3px solid #2E2117',
  borderRadius: 16,
  boxShadow: '0 5px 0 #2E2117',
  padding: '11px 13px',
  pointerEvents: 'auto',
};

const STYLE_SLIDER_ROW: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 9,
};

const STYLE_LABEL: React.CSSProperties = {
  width: 64,
  fontWeight: 800,
  fontSize: 9.5,
  letterSpacing: 1,
  color: '#8C8378',
  textTransform: 'uppercase' as const,
};

const STYLE_VALUE: React.CSSProperties = {
  width: 38,
  fontFamily: "'Grenze Gotisch', serif",
  fontWeight: 900,
  fontSize: 18,
  textAlign: 'right',
};

const STYLE_FIRE: React.CSSProperties = {
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 900,
  fontSize: 16,
  color: '#fff',
  textShadow: '0 2px 0 rgba(0,0,0,.3)',
  padding: '8px 18px',
  border: '3.5px solid #2E2117',
  borderRadius: 14,
  cursor: 'pointer',
  background: '#E8533A',
  boxShadow: '0 5px 0 #2E2117',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  letterSpacing: 0.5,
};

export function Controls({ aimDeg, power, disabled, onAimChange, onPowerChange, onFire }: ControlsProps) {
  return (
    <div style={STYLE_WRAPPER}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <div style={STYLE_SLIDER_ROW}>
          <span style={STYLE_LABEL}>Direction</span>
          <input
            className="ct"
            type="range"
            min={AIM_MIN}
            max={AIM_MAX}
            value={aimDeg}
            disabled={disabled}
            style={{ width: 128 }}
            onChange={(e) => onAimChange(Number(e.target.value))}
          />
          <span style={{ ...STYLE_VALUE, color: '#2E2117' }}>{aimDeg}°</span>
        </div>
        <div style={STYLE_SLIDER_ROW}>
          <span style={STYLE_LABEL}>Power</span>
          <input
            className="ct"
            type="range"
            min={POWER_MIN}
            max={POWER_MAX}
            value={power}
            disabled={disabled}
            style={{ width: 128 }}
            onChange={(e) => onPowerChange(Number(e.target.value))}
          />
          <span style={{ ...STYLE_VALUE, color: '#E8533A' }}>{power}%</span>
        </div>
      </div>
      <button
        onClick={onFire}
        disabled={disabled}
        style={{
          ...STYLE_FIRE,
          opacity: disabled ? 0.4 : 1,
          cursor: disabled ? 'default' : 'pointer',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M7 5 L19 12 L7 19 Z"/></svg>
        FIRE
      </button>
    </div>
  );
}
