import { cn } from "@/lib/utils";

const ROLE_COLORS: Record<string, string> = {
  Owner: "from-purple-600 to-purple-900",
  Worker: "from-blue-600 to-blue-900",
  Driver: "from-cyan-600 to-cyan-900",
};

const RING_COLORS: Record<string, string> = {
  Owner: "ring-purple-500/70",
  Worker: "ring-blue-500/70",
  Driver: "ring-cyan-500/70",
};

interface UserAvatarProps {
  name: string;
  role?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
};

export function UserAvatar({
  name,
  role = "Worker",
  size = "md",
  className,
}: UserAvatarProps) {
  const initials = name.slice(0, 2).toUpperCase();
  const gradient = ROLE_COLORS[role] ?? "from-slate-600 to-slate-900";
  const ring = RING_COLORS[role] ?? "ring-slate-500/70";
  return (
    <div
      className={cn(
        "rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-white ring-2",
        gradient,
        ring,
        sizes[size],
        className,
      )}
    >
      {initials}
    </div>
  );
}
