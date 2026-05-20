import type { YouTubeLink } from '../types';
import './VideoPlayer.css';
import { getVideoId } from '../utils/utils';

interface VideoPlayerProps {
  link: YouTubeLink | null;
  onClose: () => void;
}

export function VideoPlayer({ link, onClose }: VideoPlayerProps) {
  if (!link) return null;

  
  
  const videoId = getVideoId(link.url);
  if (!videoId) {
    return (
      <div className="video-player-overlay fullscreen-mode" onClick={onClose}>
        <div className="video-player-container fullscreen-mode" onClick={e => e.stopPropagation()}>
          <button className="close-btn" onClick={onClose}>×</button>
          <p>유효하지 않은 유튜브 URL입니다.</p>
        </div>
      </div>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;

  return (
    <div className="video-player-overlay fullscreen-mode" onClick={onClose}>
      <div className="video-player-container fullscreen-mode" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <div className="video-header">
          <div className="video-title">{link.title}</div>
        </div>
        <iframe
          src={embedUrl}
          title={link.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}