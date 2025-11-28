"use client";

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

type ViewMode = "list" | "grid" | "kanban";
type SidebarState = "expanded" | "collapsed" | "hidden";

interface UIState {
  // Sidebar
  sidebarState: SidebarState;
  sidebarOpen: boolean;
  setSidebarState: (state: SidebarState) => void;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;

  // View mode
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Modals
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  toggleSearch: () => void;

  isAIAssistantOpen: boolean;
  setAIAssistantOpen: (open: boolean) => void;
  toggleAIAssistant: () => void;

  // Toast
  toast: string | null;
  setToast: (message: string | null) => void;
  clearToast: () => void;

  // Editor state
  isEditorFocused: boolean;
  setEditorFocused: (focused: boolean) => void;

  // Mobile
  isMobile: boolean;
  setIsMobile: (mobile: boolean) => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      immer((set) => ({
        // Sidebar
        sidebarState: "expanded",
        sidebarOpen: true,
        setSidebarState: (state) => {
          set((s) => {
            s.sidebarState = state;
          });
        },
        toggleSidebar: () => {
          set((state) => {
            state.sidebarOpen = !state.sidebarOpen;
            state.sidebarState =
              state.sidebarState === "expanded" ? "collapsed" : "expanded";
          });
        },
        openSidebar: () => {
          set((state) => {
            state.sidebarOpen = true;
            state.sidebarState = "expanded";
          });
        },
        closeSidebar: () => {
          set((state) => {
            state.sidebarOpen = false;
            state.sidebarState = "collapsed";
          });
        },

        // View mode
        viewMode: "list",
        setViewMode: (mode) => {
          set((state) => {
            state.viewMode = mode;
          });
        },

        // Search modal
        isSearchOpen: false,
        setSearchOpen: (open) => {
          set((state) => {
            state.isSearchOpen = open;
          });
        },
        toggleSearch: () => {
          set((state) => {
            state.isSearchOpen = !state.isSearchOpen;
          });
        },

        // AI Assistant
        isAIAssistantOpen: false,
        setAIAssistantOpen: (open) => {
          set((state) => {
            state.isAIAssistantOpen = open;
          });
        },
        toggleAIAssistant: () => {
          set((state) => {
            state.isAIAssistantOpen = !state.isAIAssistantOpen;
          });
        },

        // Toast
        toast: null,
        setToast: (message) => {
          set((state) => {
            state.toast = message;
          });
        },
        clearToast: () => {
          set((state) => {
            state.toast = null;
          });
        },

        // Editor
        isEditorFocused: false,
        setEditorFocused: (focused) => {
          set((state) => {
            state.isEditorFocused = focused;
          });
        },

        // Mobile
        isMobile: false,
        setIsMobile: (mobile) => {
          set((state) => {
            state.isMobile = mobile;
          });
        },
      })),
      {
        name: "khmer-note-ui-store",
        partialize: (state) => ({
          sidebarState: state.sidebarState,
          viewMode: state.viewMode,
        }),
      }
    ),
    { name: "UIStore" }
  )
);

// Selector hooks
export const useSidebarState = () => {
  const isOpen = useUIStore((state) => state.sidebarOpen);
  const toggle = useUIStore((state) => state.toggleSidebar);
  const open = useUIStore((state) => state.openSidebar);
  const close = useUIStore((state) => state.closeSidebar);
  return { isOpen, toggle, open, close };
};
export const useViewMode = () => useUIStore((state) => state.viewMode);
export const useIsSearchOpen = () => useUIStore((state) => state.isSearchOpen);
export const useIsAIAssistantOpen = () => useUIStore((state) => state.isAIAssistantOpen);
