import type { StateStorage } from "zustand/middleware";

export const safeLocalStorage: StateStorage = {
  getItem(name) {
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem(name, value) {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      // Safari private mode and embedded mail browsers can deny storage.
    }
  },
  removeItem(name) {
    try {
      window.localStorage.removeItem(name);
    } catch {
      // Storage is optional; the application still works without persistence.
    }
  },
};
