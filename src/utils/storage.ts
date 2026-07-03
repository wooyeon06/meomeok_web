import type { YouTubeLink } from '../types';

const LINKS_KEY = 'youtubeLinks';
const CATEGORIES_KEY = 'youtubeCategories';

export function getCategories(): string[] {
  const saved = localStorage.getItem(CATEGORIES_KEY);
  if (saved) {
    try {
      const cats: string[] = JSON.parse(saved);
      return cats;
    } catch {
      return [];
    }
  }
  return [];
}

function saveCategories(categories: string[]): void {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

export function ensureCategory(category: string): void {
  const categories = getCategories();
  if (!categories.includes(category) && category.trim() !== '') {
    saveCategories([...categories, category]);
  }
}

export function deleteCategory(name: string): string[] {
  const updated = getCategories().filter(c => c !== name);
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
  return updated;
}

// 삭제된 카테고리를 사용하던 링크들의 category를 비움(미분류 처리)
export function clearCategoryFromLinks(name: string): YouTubeLink[] {
  const savedLinks = localStorage.getItem(LINKS_KEY);
  const links: YouTubeLink[] = savedLinks ? JSON.parse(savedLinks) : [];
  const updated = links.map(link =>
    link.category === name ? { ...link, category: undefined } : link
  );
  localStorage.setItem(LINKS_KEY, JSON.stringify(updated));
  return updated;
}

export function toggleFavorite(id: string): YouTubeLink[] {
  const savedLinks = localStorage.getItem(LINKS_KEY);
  const links: YouTubeLink[] = savedLinks ? JSON.parse(savedLinks) : [];
  const updatedLinks = links.map(link =>
    link.id === id ? { ...link, isFavorite: !link.isFavorite } : link
  );
  localStorage.setItem(LINKS_KEY, JSON.stringify(updatedLinks));
  return updatedLinks;
}

export function updateLink(
  id: string,
  updates: Pick<YouTubeLink, 'title' | 'url' | 'thumbnail' | 'category'>
): YouTubeLink[] {
  const savedLinks = localStorage.getItem(LINKS_KEY);
  const links: YouTubeLink[] = savedLinks ? JSON.parse(savedLinks) : [];
  const updatedLinks = links.map(link =>
    link.id === id ? { ...link, ...updates } : link
  );
  localStorage.setItem(LINKS_KEY, JSON.stringify(updatedLinks));
  if (updates.category) ensureCategory(updates.category);
  return updatedLinks;
}

export function addLink(newLink: YouTubeLink): YouTubeLink[] {
  const savedLinks = localStorage.getItem(LINKS_KEY);
  const links: YouTubeLink[] = savedLinks ? JSON.parse(savedLinks) : [];
  const updatedLinks = [newLink, ...links];
  localStorage.setItem(LINKS_KEY, JSON.stringify(updatedLinks));
  if (newLink.category && newLink.category.trim() !== '') {
    ensureCategory(newLink.category);
  }
  return updatedLinks;
}

export function saveMemo(id: string, memo: string): YouTubeLink[] {
  const savedLinks = localStorage.getItem(LINKS_KEY);
  const links: YouTubeLink[] = savedLinks ? JSON.parse(savedLinks) : [];
  const updatedLinks = links.map(link =>
    link.id === id ? { ...link, memo } : link
  );
  localStorage.setItem(LINKS_KEY, JSON.stringify(updatedLinks));
  return updatedLinks;
}

const DAY_NOTES_KEY = 'dayNotes';

export function getDayNote(date: string): string {
  const saved = localStorage.getItem(DAY_NOTES_KEY);
  if (!saved) return '';
  try {
    const notes: Record<string, string> = JSON.parse(saved);
    return notes[date] ?? '';
  } catch { return ''; }
}

export function saveDayNote(date: string, note: string): void {
  const saved = localStorage.getItem(DAY_NOTES_KEY);
  let notes: Record<string, string> = {};
  try { if (saved) notes = JSON.parse(saved); } catch { /* */ }
  if (note.trim()) {
    notes[date] = note;
  } else {
    delete notes[date];
  }
  localStorage.setItem(DAY_NOTES_KEY, JSON.stringify(notes));
}

export function saveLinks(links: YouTubeLink[]): void {
  localStorage.setItem(LINKS_KEY, JSON.stringify(links));
}

export function getInitialLinks(): YouTubeLink[] {
  const savedLinks = localStorage.getItem(LINKS_KEY);
  if (savedLinks) {
    try {
      const links: YouTubeLink[] = JSON.parse(savedLinks);
      // order가 없는 기존 항목은 배열 인덱스를 order로 채움
      const normalized = links.map((l, i) => l.order === undefined ? { ...l, order: i } : l);
      return normalized.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    } catch { return []; }
  }
  return [];
}