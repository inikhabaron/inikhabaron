'use client';

export function MenuBtn({ icon: Icon, label, color, hoverBg = '#f9fafb', onClick }) {
  return (
    <button
      style={{ width: '100%', padding: '9px 16px', fontSize: 13, color, background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9 }}
      onMouseEnter={e => e.currentTarget.style.background = hoverBg}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      onClick={onClick}
    >
      <Icon size={14} />{label}
    </button>
  );
}
