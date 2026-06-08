import { SIDEBAR_W, STATUS_STYLES } from './constants';

export const DS = {
  sidebar: {
    width: SIDEBAR_W, minWidth: SIDEBAR_W, background: '#0f1d35', color: '#fff',
    display: 'flex', flexDirection: 'column', height: '100vh',
    position: 'fixed', left: 0, top: 0, zIndex: 200,
    transition: 'transform 0.25s ease', fontFamily: "'DM Sans', sans-serif",
  },
  navItem: (active) => ({
    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px',
    borderRadius: 8, margin: '2px 12px', cursor: 'pointer',
    background: active ? '#2563eb' : 'transparent',
    color: active ? '#fff' : '#94a3b8', fontSize: 14,
    fontWeight: active ? 600 : 400, transition: 'all 0.15s', userSelect: 'none',
  }),
  main: (sidebarVisible) => ({
    marginLeft: sidebarVisible ? SIDEBAR_W : 0, display: 'flex',
    flexDirection: 'column', minHeight: '100vh', background: '#f0f2f5', flex: 1,
    transition: 'margin-left 0.25s ease', fontFamily: "'DM Sans', sans-serif",
  }),
  header: {
    background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 24px',
    height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    position: 'sticky', top: 0, zIndex: 2000,
  },
  card: { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' },
  btn: (variant = 'primary', extra = {}) => {
    const base = { borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, border: 'none', ...extra };
    if (variant === 'primary') return { ...base, background: '#2563eb', color: '#fff', padding: '8px 18px' };
    if (variant === 'outline') return { ...base, background: '#fff', color: '#374151', border: '1px solid #e5e7eb', padding: '8px 18px' };
    if (variant === 'ghost') return { ...base, background: 'transparent', color: '#6b7280', padding: '5px 8px', fontSize: 13 };
    if (variant === 'danger') return { ...base, background: '#fff', color: '#dc2626', border: '1px solid #fecaca', padding: '8px 18px' };
    return base;
  },
  input: {
    width: '100%', padding: '9px 13px', border: '1px solid #e5e7eb',
    borderRadius: 8, fontSize: 14, outline: 'none', color: '#1f2937',
    background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit',
  },
  label: { fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6, display: 'block' },
  badge: (status) => {
    const s = STATUS_STYLES[status] || STATUS_STYLES.draft;
    return { background: s.bg, color: s.color, fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, display: 'inline-block', whiteSpace: 'nowrap' };
  },
  tag: { background: '#f3f4f6', color: '#4b5563', fontSize: 12, fontWeight: 500, padding: '2px 9px', borderRadius: 6, display: 'inline-block' },
  sectionNum: { width: 28, height: 28, borderRadius: '50%', background: '#2563eb', color: '#fff', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tab: (active) => ({
    padding: '8px 18px', color: active ? '#2563eb' : '#6b7280', fontSize: 14,
    fontWeight: active ? 600 : 400, cursor: 'pointer', background: 'transparent',
    border: 'none', borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
  }),
  select: {
    padding: '8px 32px 8px 12px', border: '1px solid #e5e7eb', borderRadius: 8,
    fontSize: 13, color: '#374151', background: '#fff', appearance: 'none',
    outline: 'none', cursor: 'pointer',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', fontFamily: 'inherit',
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
    zIndex: 199, display: 'flex',
  },
};

export const toolbarBtn = {
  width: 30,
  height: 30,
  border: 'none',
  borderRadius: 6,
  background: '#f3f4f6',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
