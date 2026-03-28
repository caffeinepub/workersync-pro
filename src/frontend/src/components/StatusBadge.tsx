import { cn } from "@/lib/utils";
import type { TaskStatus, UserStatus } from "../types";

interface StatusBadgeProps {
  status: TaskStatus | UserStatus | string;
  className?: string;
}

const statusConfig: Record<
  string,
  { bg: string; text: string; glow: string; label: string }
> = {
  online: {
    bg: "bg-green-950/60",
    text: "text-green-300",
    glow: "neon-green",
    label: "Online",
  },
  offline: {
    bg: "bg-slate-800/60",
    text: "text-slate-400",
    glow: "",
    label: "Offline",
  },
  pending: {
    bg: "bg-amber-950/60",
    text: "text-amber-300",
    glow: "",
    label: "Pending",
  },
  accepted: {
    bg: "bg-blue-950/60",
    text: "text-blue-300",
    glow: "neon-blue",
    label: "Accepted",
  },
  inProgress: {
    bg: "bg-cyan-950/60",
    text: "text-cyan-300",
    glow: "neon-cyan",
    label: "In Progress",
  },
  completed: {
    bg: "bg-green-950/60",
    text: "text-green-300",
    glow: "neon-green",
    label: "Completed",
  },
  rejected: {
    bg: "bg-red-950/60",
    text: "text-red-300",
    glow: "",
    label: "Rejected",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const cfg = statusConfig[status] ?? {
    bg: "bg-slate-800",
    text: "text-slate-300",
    glow: "",
    label: status,
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold",
        cfg.bg,
        cfg.text,
        className,
      )}
    >
      {status === "online" && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full bg-green-400 status-online-dot",
          )}
        />
      )}
      {cfg.label}
    </span>
  );
}
