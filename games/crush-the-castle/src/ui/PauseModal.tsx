interface PauseModalProps {
  onResume: () => void;
}

export function PauseModal({ onResume }: PauseModalProps) {
  return (
    <div
      onClick={onResume}
      style={{
        position: 'absolute', inset: 0, zIndex: 10,
        background: 'rgba(58,42,28,.34)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      <div style={{
        fontFamily: "'Grenze Gotisch', serif", fontWeight: 900, fontSize: 42,
        color: '#FBF3DD', background: '#2E2117',
        border: '3px solid #F2A93B', padding: '10px 40px', borderRadius: 16,
        boxShadow: '0 5px 0 rgba(0,0,0,.4)',
      }}>
        Paused
      </div>
    </div>
  );
}
