import { useEffect, useState } from 'react';
import { AIM_MIN, AIM_MAX, POWER_MIN, POWER_MAX, AMMO_TYPES } from '../config';
import type { AmmoType } from '../config';
import { events } from '../state/events';

interface CommandBarProps {
  aimDeg: number;
  power: number;
  selectedAmmo: AmmoType;
  disabled: boolean;
  onAimChange: (deg: number) => void;
  onPowerChange: (pct: number) => void;
  onAmmoSelect: (type: AmmoType) => void;
  onFire: () => void;
  onPause: () => void;
}

const BTN: React.CSSProperties = {
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 900,
  fontSize: 11,
  color: '#fff',
  padding: '6px 12px',
  border: '2px solid rgba(255,255,255,0.15)',
  borderRadius: 8,
  cursor: 'pointer',
  background: 'transparent',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 1,
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
};

const BTN_ACTIVE: React.CSSProperties = {
  ...BTN,
  border: '2px solid rgba(255,255,255,0.5)',
  background: 'rgba(255,255,255,0.1)',
};

export function CommandBar({ aimDeg, power, selectedAmmo, disabled, onAimChange, onPowerChange, onAmmoSelect, onFire, onPause }: CommandBarProps) {
  const [ammo, setAmmo] = useState(5);

  useEffect(() => {
    const onAmmoChanged = (n: unknown) => setAmmo(n as number);
    events.on('ammo-changed', onAmmoChanged);
    return () => events.off('ammo-changed', onAmmoChanged);
  }, []);

  return (
    <div style={{
      position: 'absolute',
      left: 0,
      bottom: 0,
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 12px',
      background: '#1a1a2e',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      pointerEvents: 'auto',
    }}>
      {/* Ammo type selector */}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {(Object.entries(AMMO_TYPES) as [AmmoType, typeof AMMO_TYPES['standard']][]).map(([key, cfg]) => (
          <button
            key={key}
            disabled={disabled}
            onClick={() => onAmmoSelect(key)}
            style={key === selectedAmmo ? BTN_ACTIVE : BTN}
          >
            <span>{cfg.label}</span>
            <span style={{ fontSize: 9, opacity: 0.5 }}>{cfg.sub}</span>
          </button>
        ))}
      </div>

      {/* Sliders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', width: 36, textAlign: 'right', flexShrink: 0 }}>DIR</span>
          <input
            type="range"
            min={AIM_MIN}
            max={AIM_MAX}
            value={aimDeg}
            disabled={disabled}
            style={{ flex: 1, height: 4, accentColor: '#E8533A' }}
            onChange={(e) => onAimChange(Number(e.target.value))}
          />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', width: 30, textAlign: 'right', fontFamily: "'Grenze Gotisch', serif" }}>{aimDeg}°</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', width: 36, textAlign: 'right', flexShrink: 0 }}>PWR</span>
          <input
            type="range"
            min={POWER_MIN}
            max={POWER_MAX}
            value={power}
            disabled={disabled}
            style={{ flex: 1, height: 4, accentColor: '#E8533A' }}
            onChange={(e) => onPowerChange(Number(e.target.value))}
          />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#E8533A', width: 30, textAlign: 'right', fontFamily: "'Grenze Gotisch', serif" }}>{power}%</span>
        </div>
      </div>

      {/* Fire button */}
      <button
        onClick={onFire}
        disabled={disabled}
        style={{
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 900,
          fontSize: 14,
          color: '#fff',
          padding: '8px 16px',
          border: 'none',
          borderRadius: 10,
          cursor: disabled ? 'default' : 'pointer',
          background: '#E8533A',
          opacity: disabled ? 0.4 : 1,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          flexShrink: 0,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M7 5 L19 12 L7 19 Z"/></svg>
        FIRE
      </button>

      {/* Ammo count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>AMMO</span>
        <span style={{ fontSize: 20, fontWeight: 900, color: '#fff', fontFamily: "'Grenze Gotisch', serif" }}>×{ammo}</span>
      </div>

      {/* Pause button */}
      <button
        onClick={onPause}
        style={{
          width: 36,
          height: 36,
          border: '2px solid rgba(255,255,255,0.15)',
          borderRadius: 8,
          background: 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(255,255,255,0.6)">
          <rect x="6" y="5" width="4.5" height="14" rx="1.5"/>
          <rect x="13.5" y="5" width="4.5" height="14" rx="1.5"/>
        </svg>
      </button>
    </div>
  );
}
