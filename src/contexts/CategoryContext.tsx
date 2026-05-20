import { createContext, useContext, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { getCategories } from '../utils/storage';

export type ActiveFilter = 'all' | 'favorites' | string;

interface CategoryContextValue {
  categories: string[];
  setCategories: Dispatch<SetStateAction<string[]>>;
  activeFilter: ActiveFilter;
  setActiveFilter: Dispatch<SetStateAction<ActiveFilter>>;
}

const CategoryContext = createContext<CategoryContextValue | null>(null);

export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<string[]>(() => getCategories());
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');

  return (
    <CategoryContext.Provider value={{ categories, setCategories, activeFilter, setActiveFilter }}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategoryContext() {
  const ctx = useContext(CategoryContext);
  if (!ctx) throw new Error('useCategoryContext must be used within CategoryProvider');
  return ctx;
}
