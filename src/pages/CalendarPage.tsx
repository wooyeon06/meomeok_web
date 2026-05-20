/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInitialLinks, getDayNote, saveDayNote } from '../utils/storage';
import type { YouTubeLink } from '../types';
import { AppHeader } from '../components/AppHeader';
import './CalendarPage.css';

const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토'];

function toLocalDateStr(isoStr: string): string {
  const d = new Date(isoStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function CalendarPage() {
  const navigate = useNavigate();
  const today = new Date();
  const todayStr = toLocalDateStr(today.toISOString());
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr);
  const [noteEdits, setNoteEdits] = useState<Record<string, string>>({});

  const links = useMemo(() => getInitialLinks(), []);

  const linksByDate = useMemo(() => {
    const map: Record<string, YouTubeLink[]> = {};
    links.forEach(link => {
      const d = toLocalDateStr(link.createdAt);
      (map[d] ??= []).push(link);
    });
    return map;
  }, [links]);

  const prevMonth = () => {
    setSelectedDate(null);
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    setSelectedDate(null);
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const getNoteForDate = (date: string) =>
    noteEdits[date] !== undefined ? noteEdits[date] : getDayNote(date);

  const hasActivity = (dateStr: string) =>
    !!linksByDate[dateStr] || getNoteForDate(dateStr) !== '';

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(prev => prev === dateStr ? null : dateStr);
  };

  const handleNoteChange = (value: string) => {
    if (!selectedDate) return;
    setNoteEdits(prev => ({ ...prev, [selectedDate]: value }));
    saveDayNote(selectedDate, value);
  };

  const selectedLinks = selectedDate ? (linksByDate[selectedDate] ?? []) : [];
  const currentNote = selectedDate ? getNoteForDate(selectedDate) : '';

  return (
    <div className="calendar-page">
      <AppHeader />

      <div className="calendar-body">
        <div className="calendar-month-nav">
          <button className="month-nav-btn" onClick={prevMonth}>‹</button>
          <span className="month-label">{year}년 {month + 1}월</span>
          <button className="month-nav-btn" onClick={nextMonth}>›</button>
        </div>

        <div className="calendar-week-header">
          {WEEK_DAYS.map(d => (
            <span key={d} className="week-day-label">{d}</span>
          ))}
        </div>

        <div className="calendar-grid">
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} className="calendar-cell empty" />;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;
            const isSelected = selectedDate === dateStr;
            const active = hasActivity(dateStr);
            return (
              <div
                key={day}
                className={['calendar-cell', isToday ? 'today' : '', isSelected ? 'selected' : ''].filter(Boolean).join(' ')}
                onClick={() => handleDayClick(day)}
              >
                <div className="cell-inner">
                  <span className="cell-day">{day}</span>
                </div>
                {active && <span className="cell-dot" />}
              </div>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="day-detail">
          <p className="day-detail-date">{selectedDate.replace(/-/g, '.')} 기록</p>

          <textarea
            className="day-note-textarea"
            value={currentNote}
            onChange={e => handleNoteChange(e.target.value)}
            placeholder="오늘의 기록을 남겨보세요..."
            rows={3}
          />

          {selectedLinks.length > 0 && (
            <div className="day-detail-links">
              <p className="day-detail-links-label">저장한 링크</p>
              {selectedLinks.map(link => (
                <div
                  key={link.id}
                  className="day-detail-item"
                  onClick={() => navigate(`/memo/${link.id}`)}
                >
                  <img src={link.thumbnail} alt="" className="day-detail-thumb" />
                  <div className="day-detail-info">
                    <p className="day-detail-title">{link.title}</p>
                    {link.memo
                      ? <p className="day-detail-memo">{link.memo}</p>
                      : <p className="day-detail-memo empty">메모 없음 — 탭해서 추가</p>
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
