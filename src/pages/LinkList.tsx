import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { YouTubeLink } from '../types';
import { getInitialLinks, toggleFavorite, updateLink, saveMemo } from '../utils/storage';
import { useCategoryContext } from '../contexts/CategoryContext';
import Category from '../components/Category';
import { EditLinkModal } from '../components/EditLinkModal';
import { LinkCard } from '../components/LinkCard';
import { useLinkFilter } from '../hooks/useLinkFilter';
import { useLinkReorder } from '../hooks/useLinkReorder';
import { getThumbnail } from '../utils/utils';
import './LinkList.css';

interface LinkListProps {
  onPlayVideo: (link: YouTubeLink) => void;
}

export function LinkList({ onPlayVideo }: LinkListProps) {
  const { activeFilter } = useCategoryContext();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [links, setLinks] = useState<YouTubeLink[]>(() => getInitialLinks());
  const [editingLink, setEditingLink] = useState<YouTubeLink | null>(null);
  const [revealedId, setRevealedId] = useState<string | null>(null);

  const canReorder = activeFilter === 'all' && !searchQuery;

  const { filteredLinks, countLabel } = useLinkFilter({
    links,
    activeFilter,
    searchQuery,
  });

  const {
    dragIdx,
    overIdx,
    ghostPos,
    draggingLink,
    listRef,
    startReorder,
  } = useLinkReorder({
    onLinksChange: setLinks,
  });

  useEffect(() => {
    const handler = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('.link-actions')) return;
      setRevealedId(null);
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, []);

  const handleToggleFavorite = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setLinks(toggleFavorite(id));
  }, []);

  const handleDelete = useCallback((id: string) => {
    const updatedLinks = links.filter(link => link.id !== id);
    localStorage.setItem('youtubeLinks', JSON.stringify(updatedLinks));
    window.location.reload();
  }, [links]);

  const handleSaveEdit = useCallback((title: string, url: string, category: string, memo?: string) => {
    if (!editingLink) return;
    const thumbnail = getThumbnail(url);
    setLinks(updateLink(editingLink.id, { title, url, thumbnail, category }));
    if (memo !== undefined) saveMemo(editingLink.id, memo);
    setEditingLink(null);
  }, [editingLink]);

  const handleOpenMemo = useCallback((link: YouTubeLink) => {
    navigate(`/memo/${link.id}`);
  }, [navigate]);

  return (
    <div className="home-page">
      <Category onLinksChange={setLinks} />

      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="제목/링크 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {links.length > 0 && (
        <div className="links-count">{countLabel}</div>
      )}

      <div className="links-list" ref={listRef}>
        {filteredLinks.length === 0 ? (
          <div className="empty-state">
            <p>저장된 링크가 없습니다.</p>
            <p>+ 버튼을 눌러 링크를 추가하세요!</p>
          </div>
        ) : (
          filteredLinks.map((link, index) => (
            <LinkCard
              key={link.id}
              link={link}
              onPlay={onPlayVideo}
              onEdit={setEditingLink}
              onMemo={handleOpenMemo}
              onToggleFavorite={handleToggleFavorite}
              onDelete={handleDelete}
              canReorder={canReorder}
              isDragging={dragIdx === index}
              isDropTarget={overIdx === index && dragIdx !== null && overIdx !== dragIdx}
              onReorderStart={(e) => startReorder(e, index, link)}
              isRevealed={revealedId === link.id}
              onReveal={() => setRevealedId(link.id)}
              onHide={() => setRevealedId(null)}
            />
          ))
        )}
      </div>

      {draggingLink && (
        <div
          className="link-card-ghost"
          style={{ left: ghostPos.x, top: ghostPos.y }}
        >
          <img
            src={getThumbnail(draggingLink.url)}
            alt=""
            className="ghost-thumbnail"
          />
          <span className="ghost-title">{draggingLink.title}</span>
        </div>
      )}

      <EditLinkModal
        key={editingLink?.id}
        link={editingLink}
        onClose={() => setEditingLink(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
