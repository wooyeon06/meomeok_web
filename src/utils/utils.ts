export const getVideoId = (url: string): string | null => {
    const watchMatch = url.match(/[?&]v=([^&]+)/); //https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30&si=abc
    if (watchMatch) return watchMatch[1];

    const shortMatch = url.match(/youtu\.be\/([^?]+)/); //https://youtu.be/dQw4w9WgXcQ?si=abc123
    if (shortMatch) return shortMatch[1];

    const shortsMatch = url.match(/youtube\.com\/shorts\/([^?]+)/); //https://www.youtube.com/shorts/dQw4w9WgXcQ?si=abc123
    if (shortsMatch) return shortsMatch[1];

    const embedMatch = url.match(/youtube\.com\/embed\/([^?]+)/); //https://www.youtube.com/embed/dQw4w9WgXcQ?si=abc123
    if (embedMatch) return embedMatch[1];

    return null;
};

export const getThumbnail = (url: string): string => {
    const videoId = getVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : "";
};

export const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};
