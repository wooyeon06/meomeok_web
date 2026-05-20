export function ForkIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
      stroke={active ? '#ff6b35' : '#bbb'}
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
    >
      <line x1="6" y1="2" x2="6" y2="8"/>
      <line x1="12" y1="2" x2="12" y2="8"/>
      <line x1="18" y1="2" x2="18" y2="8"/>
      <path d="M6 8 Q6 12 12 13 Q18 12 18 8"/>
      <line x1="12" y1="13" x2="12" y2="22"/>
    </svg>
  );
}

export function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
      stroke="#bbb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

export function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
      stroke="#bbb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
    >
      <circle cx="18" cy="5" r="3"/>
      <circle cx="6" cy="12" r="3"/>
      <circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  );
}

export function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
      stroke="#bbb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  );
}

export function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10"/>
      <polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/>
    </svg>
  );
}