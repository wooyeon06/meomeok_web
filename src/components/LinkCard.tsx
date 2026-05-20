import type { YouTubeLink } from '../types';
import { shareViaKakao } from '../utils/shareLink';
import { getVideoId } from '../utils/utils';
import { useSwipeReveal } from '../hooks/useSwipeReveal';
import { ForkIcon, EditIcon, ShareIcon } from './Icons';
import './LinkCard.css';

interface LinkCardProps {
  link: YouTubeLink;
  onPlay: (link: YouTubeLink) => void;
  onEdit: (link: YouTubeLink) => void;
  onMemo: (link: YouTubeLink) => void;
  onToggleFavorite: (e: React.MouseEvent, id: string) => void;
  onDelete: (id: string) => void;
  canReorder?: boolean;
  isDragging?: boolean;
  isDropTarget?: boolean;
  onReorderStart?: (e: React.PointerEvent) => void;
  isRevealed?: boolean;
  onReveal?: () => void;
  onHide?: () => void;
}

function getThumbnail(url: string): string {
  const videoId = getVideoId(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '';
}

export function LinkCard({
  link, onPlay, onEdit, onMemo, onToggleFavorite, onDelete,
  canReorder, isDragging, isDropTarget, onReorderStart,
  isRevealed = false, onReveal, onHide,
}: LinkCardProps) {
  const {
    isSwiping,
    offset,
    thumbWidth,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
  } = useSwipeReveal({
    initialRevealed: isRevealed,
    onReveal,
    onHide,
  });

  const onShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    shareViaKakao(
      { id: link.id, title: link.title, url: link.url, category: link.category ?? '' },
      { title: '머먹앱에서 링크공유', description: link.url, imageUrl: getThumbnail(link.url), buttonTitle: '머먹앱에서 보기' },
    );
  };

  const handleCardClick = () => {
    if (isRevealed) return;
    onPlay(link);
  };

  const cardClass = [
    'link-item',
    isDragging ? 'dragging' : '',
    isDropTarget ? 'drop-target' : '',
    isRevealed ? 'revealed' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClass}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <div
        className={`link-item-inner${isSwiping ? ' swiping' : ''}`}
        style={{ transform: `translateX(-${offset}px)` }}
      >
        {canReorder && (
          <div
            className="drag-handle"
            onPointerDown={(e) => { e.stopPropagation(); onReorderStart?.(e); }}
            onClick={(e) => e.stopPropagation()}
          >
            &#8801;
          </div>
        )}
        <div
          className="link-thumbnail-wrap"
          style={offset > 0 ? { width: thumbWidth } : undefined}
          onClick={handleCardClick}
        >
          <img src={getThumbnail(link.url)} alt={link.title} className="link-thumbnail" />
          {link.category && <span className="link-category">{link.category}</span>}
        </div>
        <div
          className="link-info"
          onClick={() => { if (!isRevealed) onMemo(link); }}
        >
          <div className="link-info-top">
            <h3 className="link-title">{link.title}</h3>
            <button
              className={`favorite-btn${link.isFavorite ? ' active' : ''}`}
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(e, link.id); }}
              title="즐겨찾기"
            >
              <ForkIcon active={!!link.isFavorite} />
            </button>
          </div>
          <p className="link-url">{link.memo || (link.url.length > 30 ? `${link.url.substring(0, 30)}...` : link.url)}</p>
        </div>
      </div>

      <div className="link-actions">
        <button
          className="edit-btn"
          onClick={(e) => { e.stopPropagation(); onEdit(link); }}
          title="수정"
        >
          <EditIcon />
        </button>
        <button
          className="share-btn"
          onClick={(e) => { e.stopPropagation(); onShare(e); }}
          title="공유하기"
        >
          <ShareIcon />
        </button>
        <button
          className="delete-btn"
          onClick={(e) => { e.stopPropagation(); onDelete(link.id); }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
