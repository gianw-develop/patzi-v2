import { create } from "zustand";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "transfer" | "kyc" | "system" | "wallet";
  read: boolean;
  created_at: string;
  href?: string;
}

interface NotificationsState {
  notifications: Notification[];
  markRead: (id: string) => void;
  markAllRead: () => void;
  addNotification: (n: Omit<Notification, "id" | "read" | "created_at">) => void;
}

const USER_MOCK: Notification[] = [
  {
    id: "n1",
    title: "Transferencia completada",
    message: "Tu envío de €200 a Pedro García fue completado con éxito.",
    type: "transfer",
    read: false,
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    href: "/dashboard/history",
  },
  {
    id: "n2",
    title: "KYC aprobado ✓",
    message: "Tu identidad ha sido verificada. Ya puedes enviar hasta €10,000/mes.",
    type: "kyc",
    read: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    href: "/dashboard/profile",
  },
  {
    id: "n3",
    title: "Saldo recargado",
    message: "Se han añadido €500 a tu billetera EUR.",
    type: "wallet",
    read: false,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    href: "/dashboard/wallet",
  },
];

export const ADMIN_MOCK: Notification[] = [
  {
    id: "a1",
    title: "KYC pendiente de revisión",
    message: "Carlos López envió su documentación. Requiere aprobación.",
    type: "kyc",
    read: false,
    created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    href: "/admin/kyc",
  },
  {
    id: "a2",
    title: "Nueva transferencia en proceso",
    message: "PTZ-2026-003 por €150 está pendiente de validación.",
    type: "transfer",
    read: false,
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    href: "/admin/transactions",
  },
  {
    id: "a3",
    title: "Nuevo usuario registrado",
    message: "Ana Martínez se ha registrado en la plataforma.",
    type: "system",
    read: false,
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    href: "/admin/users",
  },
];

export const useUserNotifications = create<NotificationsState>((set) => ({
  notifications: [],
  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),
  markAllRead: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
  addNotification: (n) =>
    set((s) => ({
      notifications: [
        { ...n, id: crypto.randomUUID(), read: false, created_at: new Date().toISOString() },
        ...s.notifications,
      ],
    })),
}));

export const useAdminNotifications = create<NotificationsState>((set) => ({
  notifications: [],
  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),
  markAllRead: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
  addNotification: (n) =>
    set((s) => ({
      notifications: [
        { ...n, id: crypto.randomUUID(), read: false, created_at: new Date().toISOString() },
        ...s.notifications,
      ],
    })),
}));
