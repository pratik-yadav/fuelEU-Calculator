import { create } from 'zustand';

export type TabId = 'routes' | 'compare' | 'banking' | 'pooling';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface AppState {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  activeTab: 'routes',
  setActiveTab: (tab) => set({ activeTab: tab }),
  toasts: [],
  addToast: (toast) => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    setTimeout(() => get().removeToast(id), 4500);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const useToasts = () => useAppStore((s) => s.toasts);
export const useAddToast = () => useAppStore((s) => s.addToast);
export const useActiveTab = () => useAppStore((s) => s.activeTab);
export const useSetActiveTab = () => useAppStore((s) => s.setActiveTab);
