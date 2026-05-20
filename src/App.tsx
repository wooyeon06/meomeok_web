/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import "./App.css";
import { AddLinkModal } from "./components/AddLinkModal";
import { AppHeader } from "./components/AppHeader";
import { FloatingButton } from "./components/FloatingButton";
import { VideoPlayer } from "./components/VideoPlayer";
import {
    CategoryProvider,
    useCategoryContext,
} from "./contexts/CategoryContext";
import { useAndroidBackPress } from "./hooks/useAndroidBackPress";
import { DockLayout } from "./layouts/DockLayout";
import { RootLayout } from "./layouts/RootLayout";
import { CalendarPage } from "./pages/CalendarPage";
import { MemoPage } from "./pages/MemoPage";
import { useAppStore } from "./stores/appStore";
import type { YouTubeLink } from "./types";
import {
    initKakao,
    KAKAO_JS_APP_KEY,
    notifyReady,
    onDeepLink,
} from "./utils/shareLink";
import {
    addLink,
    ensureCategory,
    getCategories,
    getInitialLinks,
} from "./utils/storage";
import { generateId, getThumbnail } from "./utils/utils";
import { LinkList } from "./pages/LinkList";

function AppContent() {
    const { categories, setCategories } = useCategoryContext();
    const {
        showModal,
        selectedLink,
        refreshKey,
        setShowModal,
        setSelectedLink,
        incrementRefreshKey,
    } = useAppStore();

    const navigate = useNavigate();
    const location = useLocation();
    
    useAndroidBackPress(() => {
            if (selectedLink) {
                setSelectedLink(null);
                return true;
            }
            // location.key === 'default'는 세션의 첫 히스토리 엔트리.
            // push가 한 번이라도 일어났으면 고유 키로 바뀌므로, 그때만 뒤로 가기.
            if (location.key !== 'default') {
                navigate(-1);
                return true;
            }
            return false;
        });

    useEffect(() => {
        initKakao(KAKAO_JS_APP_KEY);

        const cleanup = onDeepLink<YouTubeLink>((payload) => {
            if (payload.shareText) { //Youtube 공유된 링크 처리
                if (getInitialLinks().every((link) => link.url !== payload.shareText)) {
                    addLink({
                        id: generateId(),
                        thumbnail: getThumbnail(payload.shareText),
                        createdAt: new Date().toISOString(),
                        category: "",
                        title: "Youtube공유된 링크",
                        url: payload.shareText,
                    });

                    incrementRefreshKey();
                }
            }
            if (payload.data) { //카카오톡 공유된 링크 처리
                const shareData: YouTubeLink = payload.data;
                if (shareData) {
                    //카테고리 추가
                    if (!getCategories().includes(shareData.category || "")) {
                        ensureCategory(shareData.category || "");
                        setCategories(getCategories());
                    }

                    if (
                        getInitialLinks().every(
                            (link) => link.url !== shareData.url,
                        )
                    ) {
                        addLink({
                            ...shareData,
                            id: generateId(),
                            thumbnail: getThumbnail(shareData.url),
                            createdAt: new Date().toISOString(),
                        });
                        incrementRefreshKey();
                    }
                }
            }
        });
        notifyReady();
        return cleanup;
    }, []);

    return (
        <div className="app">
            <AppHeader />
            <main>
                <LinkList key={refreshKey} onPlayVideo={setSelectedLink} />
            </main>
            <FloatingButton onClick={() => setShowModal(true)} />
            <AddLinkModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                categories={categories}
            />
            <VideoPlayer
                link={selectedLink}
                onClose={() => setSelectedLink(null)}
            />
        </div>
    );
}

function App() {
    return (
        <CategoryProvider>
            <Routes>
                <Route element={<RootLayout />}>
                    <Route element={<DockLayout />}>
                        <Route path="/" element={<AppContent />} />
                        <Route path="/calendar" element={<CalendarPage />} />
                    </Route>
                    <Route path="/memo/:id" element={<MemoPage />} />
                </Route>
            </Routes>
        </CategoryProvider>
    );
}

export default App;
