import { useMemo } from 'react';
import type { YouTubeLink } from '../types';

interface UseLinkFilterOptions {
    links: YouTubeLink[];
    activeFilter: string;
    searchQuery: string;
}

export function useLinkFilter({ links, activeFilter, searchQuery }: UseLinkFilterOptions) {
    const filteredLinks = useMemo(() => {
        return links.filter(link => {
            const matchesSearch =
                link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                link.url.includes(searchQuery);

            let matchesFilter = true;
            if (activeFilter === 'favorites') {
                matchesFilter = !!link.isFavorite;
            } else if (activeFilter !== 'all') {
                matchesFilter = link.category === activeFilter;
            }

            return matchesSearch && matchesFilter;
        });
    }, [links, activeFilter, searchQuery]);

    const countLabel = useMemo(() => {
        if (activeFilter !== 'all' || searchQuery) {
            return `${filteredLinks.length} / 전체 ${links.length}개`;
        }
        return `전체 ${links.length}개`;
    }, [activeFilter, searchQuery, filteredLinks.length, links.length]);

    return {
        filteredLinks,
        countLabel,
    };
}