import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

export interface NotifItem {
  id: string;
  message: string;
  type: "success" | "info" | "warning" | "error";
}

let notifListeners: ((n: NotifItem) => void)[] = [];

export function showNotification(
  message: string,
  type: NotifItem["type"] = "info",
) {
  const notif: NotifItem = {
    id: Math.random().toString(36).slice(2),
    message,
    type,
  };
  for (const fn of notifListeners) {
    fn(notif);
  }
}

const TYPE_CONFIG: Record<
  NotifItem["type"],
  { bg: string; border: string; text: string }
> = {
  success: {
    bg: "bg-green-950/90",
    border: "border-green-500/50",
    text: "text-green-300",
  },
  info: {
    bg: "bg-blue-950/90",
    border: "border-blue-500/50",
    text: "text-blue-300",
  },
  warning: {
    bg: "bg-amber-950/90",
    border: "border-amber-500/50",
    text: "text-amber-300",
  },
  error: {
    bg: "bg-red-950/90",
    border: "border-red-500/50",
    text: "text-red-300",
  },
};

export function NotificationContainer() {
  const [items, setItems] = useState<NotifItem[]>([]);

  useEffect(() => {
    const handler = (n: NotifItem) => {
      setItems((prev) => [...prev, n]);
      setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== n.id));
      }, 4000);
    };
    notifListeners.push(handler);
    return () => {
      notifListeners = notifListeners.filter((fn) => fn !== handler);
    };
  }, []);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 w-[360px] max-w-[90vw]">
      {items.map((n) => {
        const cfg = TYPE_CONFIG[n.type];
        return (
          <div
            key={n.id}
            className={cn(
              "notification-enter rounded-xl border px-4 py-3 backdrop-blur-sm text-sm font-medium flex items-center justify-between gap-3",
              cfg.bg,
              cfg.border,
              cfg.text,
            )}
            data-ocid="notification.toast"
          >
            <span>{n.message}</span>
            <button
              type="button"
              onClick={() =>
                setItems((prev) => prev.filter((x) => x.id !== n.id))
              }
              className="opacity-60 hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
