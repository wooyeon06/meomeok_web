import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInitialLinks, saveMemo } from '../utils/storage';
import './MemoPage.css';
import { useAndroidBackPress } from '../hooks/useAndroidBackPress';

export function MemoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const link = useMemo(() => getInitialLinks().find(l => l.id === id) ?? null, [id]);
  const [memo, setMemo] = useState(() => link?.memo ?? '');

  useEffect(() => {
    if (!link) { navigate('/'); }
  }, [link, navigate]);

  const handleClose = () => {
    if (id) saveMemo(id, memo);
    navigate(-1);
    return true; // 뒤로가기 이벤트 소비
  };

  useAndroidBackPress(handleClose);

  if (!link) return null;

  return (
    <div className="memo-page">
      <div className="memo-header">
        <button className="memo-back-btn" onClick={handleClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          뒤로
        </button>
        <span className="memo-header-title">메모</span>
        <div className="memo-header-spacer" />
      </div>

      <div className="memo-link-info">
        <p className="memo-link-title">{link.title}</p>
        <p className="memo-link-url">{link.url}</p>
      </div>

      <textarea
        className="memo-textarea"
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="메모를 입력하세요..."
      />
    </div>
  );
}
