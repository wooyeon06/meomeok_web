import { useNavigate, useLocation } from 'react-router-dom';
import './DockBar.css';

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? '#ff4444' : 'none'} stroke={active ? '#ff4444' : '#999'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function CalendarIcon({ active }: { active: boolean }) {
  const color = active ? '#ff4444' : '#999';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function DockBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isHome = pathname === '/';
  const isCalendar = pathname === '/calendar';

  return (
    <nav className="dock-bar">
      <button className={`dock-btn${isHome ? ' active' : ''}`} onClick={() => navigate('/')}>
        <HomeIcon active={isHome} />
        <span>홈</span>
      </button>
      <button className={`dock-btn${isCalendar ? ' active' : ''}`} onClick={() => navigate('/calendar')}>
        <CalendarIcon active={isCalendar} />
        <span>달력</span>
      </button>
    </nav>
  );
}
