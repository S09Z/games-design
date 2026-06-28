import { useEffect, useRef, useState } from 'react';
import { AIM_MIN, AIM_MAX, POWER_MIN } from '../config';
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
}

// Arc dial geometry (SVG viewBox 96×88)
const OX = 8;
const OY = 78;
const R = 66;
const CHARGE_MS = 4000; // 20% → 100% ramp duration

const AMMO_CHIPS: { type: AmmoType; label: string }[] = [
  { type: 'standard', label: '● Std' },
  { type: 'spread', label: '●● Spr' },
  { type: 'heavy', label: '⬤ Hvy' },
];

const CHIP_BASE: React.CSSProperties = {
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 800,
  fontSize: 10,
  padding: '4px 9px',
  borderRadius: 5,
  cursor: 'pointer',
  letterSpacing: 0.2,
  flex: 1,
  whiteSpace: 'nowrap',
};
const CHIP_SEL: React.CSSProperties = { ...CHIP_BASE, background: 'rgba(232,83,58,.22)', border: '1.5px solid #E8533A', color: '#FBF3DD' };
const CHIP_UNSEL: React.CSSProperties = { ...CHIP_BASE, background: 'rgba(255,255,255,.05)', border: '1.5px solid rgba(255,255,255,.13)', color: '#6E6862' };

function toPt(d: number) {
  return { x: OX + R * Math.cos((d * Math.PI) / 180), y: OY - R * Math.sin((d * Math.PI) / 180) };
}

export function CommandBar({ aimDeg, power, selectedAmmo, disabled, onAimChange, onPowerChange, onAmmoSelect, onFire }: CommandBarProps) {
  const [ammo, setAmmo] = useState(5);
  const [charging, setCharging] = useState(false);
  const angleDragging = useRef(false);
  const chargeTimer = useRef<number | null>(null);
  const chargeStart = useRef(0);

  useEffect(() => {
    const onAmmoChanged = (n: unknown) => setAmmo(n as number);
    events.on('ammo-changed', onAmmoChanged);
    return () => {
      events.off('ammo-changed', onAmmoChanged);
      if (chargeTimer.current !== null) clearInterval(chargeTimer.current);
    };
  }, []);

  // ── Arc dial drag → aim ──
  function updateAngle(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = (e.clientX - rect.left) * (96 / rect.width);
    const svgY = (e.clientY - rect.top) * (88 / rect.height);
    const dx = svgX - OX;
    const dy = OY - svgY;
    if (dx <= 0) return;
    let d = (Math.atan2(Math.max(0, dy), dx) * 180) / Math.PI;
    d = Math.max(AIM_MIN, Math.min(AIM_MAX, Math.round(d)));
    onAimChange(d);
  }
  const onAngleDown = (e: React.PointerEvent<SVGSVGElement>) => { e.stopPropagation(); angleDragging.current = true; updateAngle(e); };
  const onAngleMove = (e: React.PointerEvent<SVGSVGElement>) => { if (angleDragging.current) updateAngle(e); };
  const onAngleUp = () => { angleDragging.current = false; };

  // ── Hold-to-charge fire ──
  const stopCharge = () => {
    if (chargeTimer.current !== null) { clearInterval(chargeTimer.current); chargeTimer.current = null; }
  };
  const onChargeDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (disabled || chargeTimer.current !== null) return;
    chargeStart.current = Date.now();
    setCharging(true);
    onPowerChange(POWER_MIN);
    chargeTimer.current = window.setInterval(() => {
      const pct = Math.round(Math.min(100, POWER_MIN + ((Date.now() - chargeStart.current) / CHARGE_MS) * (100 - POWER_MIN)));
      onPowerChange(pct);
      if (pct >= 100) { stopCharge(); setCharging(false); onFire(); }
    }, 40);
  };
  const onChargeUp = () => {
    if (chargeTimer.current === null) return;
    stopCharge();
    setCharging(false);
    onFire();
  };

  // ── Derived dial geometry ──
  const aRad = (aimDeg * Math.PI) / 180;
  const tip = toPt(aimDeg);
  const p8 = toPt(AIM_MIN);
  const p62 = toPt(AIM_MAX);
  const sectorPath = `M ${OX} ${OY} L ${OX + R} ${OY} A ${R} ${R} 0 0 1 ${tip.x.toFixed(1)} ${tip.y.toFixed(1)} Z`;
  const arcPath = `M ${p8.x.toFixed(1)} ${p8.y.toFixed(1)} A ${R} ${R} 0 0 1 ${p62.x.toFixed(1)} ${p62.y.toFixed(1)}`;
  const ahR = R - 10;
  const ax = OX + ahR * Math.cos(aRad);
  const ay = OY - ahR * Math.sin(aRad);
  const apx = Math.sin(aRad) * 5;
  const apy = Math.cos(aRad) * 5;
  const arrowHeadPath = `M ${tip.x.toFixed(1)} ${tip.y.toFixed(1)} L ${(ax + apx).toFixed(1)} ${(ay + apy).toFixed(1)} L ${(ax - apx).toFixed(1)} ${(ay - apy).toFixed(1)} Z`;
  const tickPaths = [15, 30, 45, 60]
    .map((d) => {
      const c = Math.cos((d * Math.PI) / 180), s = Math.sin((d * Math.PI) / 180);
      return `M${(OX + (R - 5) * c).toFixed(1)} ${(OY - (R - 5) * s).toFixed(1)} L${(OX + (R + 4) * c).toFixed(1)} ${(OY - (R + 4) * s).toFixed(1)}`;
    })
    .join(' ');
  const lR = R + 13;
  const degLabelX = (OX + lR * Math.cos(aRad)).toFixed(1);
  const degLabelY = (OY - lR * Math.sin(aRad) + 3.5).toFixed(1);

  const chargeBarH = Math.round(((power - POWER_MIN) / (100 - POWER_MIN)) * 100);
  const fireLabel = charging ? `${power}%` : 'FIRE';
  const fireHint = charging ? 'release' : 'hold';

  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(16,8,2,.96)', borderTop: '1.5px solid rgba(242,169,59,.18)', zIndex: 5, padding: '5px 10px 6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Ammo count */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingRight: 8, borderRight: '1px solid rgba(255,255,255,.1)', flexShrink: 0 }}>
          <span style={{ fontWeight: 800, fontSize: 6, letterSpacing: 1.2, color: '#8C8378', textTransform: 'uppercase', lineHeight: 1.6 }}>Ammo</span>
          <span style={{ fontFamily: "'Grenze Gotisch', serif", fontWeight: 900, fontSize: 22, lineHeight: 1, color: '#F2A93B' }}>{ammo}</span>
        </div>

        {/* Arc dial */}
        <div style={{ flexShrink: 0 }}>
          <svg viewBox="0 0 96 88" width="60" height="55" style={{ cursor: 'crosshair', touchAction: 'none', display: 'block' }}
            onPointerDown={onAngleDown} onPointerMove={onAngleMove} onPointerUp={onAngleUp} onPointerLeave={onAngleUp}>
            <line x1="8" y1="78" x2="91" y2="78" stroke="rgba(255,255,255,.18)" strokeWidth="1.2" />
            <line x1="8" y1="78" x2="8" y2="5" stroke="rgba(255,255,255,.18)" strokeWidth="1.2" />
            <polygon points="91,78 86,75.5 86,80.5" fill="rgba(255,255,255,.22)" />
            <polygon points="8,5 5.5,10 10.5,10" fill="rgba(255,255,255,.22)" />
            <text x="91" y="76" fontSize="7" fill="rgba(255,255,255,.35)" fontFamily="Nunito,sans-serif" fontWeight="800">X</text>
            <text x="3" y="5" fontSize="7" fill="rgba(255,255,255,.35)" fontFamily="Nunito,sans-serif" fontWeight="800">Y</text>
            <path d={arcPath} fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="1.2" strokeDasharray="3,2.5" />
            <path d={sectorPath} fill="rgba(232,83,58,.18)" stroke="none" />
            <path d={tickPaths} fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="8" y1="78" x2={tip.x.toFixed(1)} y2={tip.y.toFixed(1)} stroke="#E8533A" strokeWidth="2.5" strokeLinecap="round" />
            <path d={arrowHeadPath} fill="#E8533A" />
            <circle cx="8" cy="78" r="3" fill="#E8533A" />
            <text x={degLabelX} y={degLabelY} fontSize="9" fill="#FBF3DD" fontFamily="Grenze Gotisch,serif" fontWeight="900" textAnchor="middle">{aimDeg}°</text>
          </svg>
        </div>

        {/* Power bar + ammo chips */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontWeight: 800, fontSize: 6, color: '#8C8378', textTransform: 'uppercase', letterSpacing: 1, flexShrink: 0 }}>PWR</span>
            <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,.1)', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: '0 auto 0 0', width: `${chargeBarH}%`, background: 'linear-gradient(to right,#8C2010,#E8533A,#F27040)' }} />
            </div>
            <span style={{ fontFamily: "'Grenze Gotisch', serif", fontWeight: 900, fontSize: 12, color: '#FBF3DD', minWidth: 26, textAlign: 'right', flexShrink: 0 }}>{power}%</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {AMMO_CHIPS.map(({ type, label }) => (
              <button key={type} disabled={disabled} onClick={() => onAmmoSelect(type)} style={type === selectedAmmo ? CHIP_SEL : CHIP_UNSEL}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Hold-to-fire gauge */}
        <div style={{ position: 'relative', width: 68, height: 56, border: '1.5px solid rgba(255,255,255,.2)', borderRadius: 8, overflow: 'hidden', cursor: disabled ? 'default' : 'pointer', touchAction: 'none', userSelect: 'none', flexShrink: 0, opacity: disabled ? 0.45 : 1 }}
          onPointerDown={onChargeDown} onPointerUp={onChargeUp} onPointerLeave={onChargeUp}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,8,2,.88)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${chargeBarH}%`, background: 'linear-gradient(to top,#8C2010,#C83828,#E8533A)' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, pointerEvents: 'none' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M7 5 L19 12 L7 19 Z" /></svg>
            <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 12, color: '#fff', letterSpacing: 0.5 }}>{fireLabel}</span>
            <span style={{ fontWeight: 800, fontSize: 6, color: 'rgba(255,255,255,.4)', letterSpacing: 1, textTransform: 'uppercase' }}>{fireHint}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
