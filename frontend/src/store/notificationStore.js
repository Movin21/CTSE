import { create } from 'zustand';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  addNotification: (notification) =>
    set((state) => ({
      notifications: [{ ...notification, read: false }, ...state.notifications].slice(0, 50),
      unreadCount: state.unreadCount + 1,
    })),
  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
  removeNotification: (index) =>
    set((state) => {
      const updated = [...state.notifications];
      const removed = updated.splice(index, 1);
      return {
        notifications: updated,
        unreadCount: Math.max(0, state.unreadCount - (removed[0]?.read ? 0 : 1)),
      };
    }),
  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
}));
