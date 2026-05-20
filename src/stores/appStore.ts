import { create } from "zustand";
import type { YouTubeLink } from "../types";

interface AppState {
    // Modal state
    showModal: boolean;
    setShowModal: (show: boolean) => void;

    // Selected video
    selectedLink: YouTubeLink | null;
    setSelectedLink: (link: YouTubeLink | null) => void;

    // Refresh key for re-rendering
    refreshKey: number;
    setRefreshKey: (key: number | ((prev: number) => number)) => void;

    // Actions
    openModal: () => void;
    closeModal: () => void;
    closeVideo: () => void;
    incrementRefreshKey: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    // Initial state
    showModal: false,
    selectedLink: null,
    refreshKey: 0,

    // Setters
    setShowModal: (show) => set({ showModal: show }),
    setSelectedLink: (link) => set({ selectedLink: link }),
    setRefreshKey: (key) =>
        set((state) => ({
            refreshKey: typeof key === "function" ? key(state.refreshKey) : key,
        })),

    // Actions
    openModal: () => set({ showModal: true }),
    closeModal: () => set({ showModal: false }),
    closeVideo: () => set({ selectedLink: null }),
    incrementRefreshKey: () =>
        set((state) => ({ refreshKey: state.refreshKey + 1 })),
}));