import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";

import { getAccessToken } from "@/features/auth/auth-storage";
import type { Notification } from "./types";

function getSocketUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL ?? "/api";
  const origin = new URL(apiUrl, window.location.origin).origin;
  return `${origin}/notifications`;
}

export function useNotificationSocket(
  onNotification: (notification: Notification) => void,
): void {
  // Giữ handler trong ref để đổi callback không phải dựng lại kết nối.
  const handlerRef = useRef(onNotification);
  useEffect(() => {
    handlerRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    const socket: Socket = io(getSocketUrl(), {
      transports: ["websocket"],
      auth: { token },
    });

    const handleNotification = (notification: Notification) => {
      handlerRef.current(notification);
    };

    socket.on("notification", handleNotification);
    socket.on("error", (msg) => {
      // Server emit "Unauthorized" ngay trước khi ngắt kết nối.
      console.warn("Notification socket error:", msg);
    });

    return () => {
      socket.off("notification", handleNotification);
      socket.disconnect();
    };
  }, []);
}
