export const EyeIcon = ({ open }) => (
  open ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" stroke="#1e90ff" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="#1e90ff" strokeWidth="2"/></svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" stroke="#1e90ff" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="#1e90ff" strokeWidth="2"/><line x1="4" y1="20" x2="20" y2="4" stroke="#1e90ff" strokeWidth="2"/></svg>
  )
);
