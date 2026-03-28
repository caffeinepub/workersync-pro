import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

type NeonVariant = "purple" | "blue" | "cyan" | "pink" | "green";

interface NeonCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: NeonVariant;
  title?: string;
  titleIcon?: ReactNode;
  headerExtra?: ReactNode;
  children: ReactNode;
}

const variantConfig: Record<
  NeonVariant,
  { border: string; header: string; glow: string; title: string }
> = {
  purple: {
    border: "border-purple-500/40",
    header: "from-purple-900/60 to-transparent",
    glow: "neon-purple",
    title: "text-purple-300",
  },
  blue: {
    border: "border-blue-500/40",
    header: "from-blue-900/60 to-transparent",
    glow: "neon-blue",
    title: "text-blue-300",
  },
  cyan: {
    border: "border-cyan-400/40",
    header: "from-cyan-900/60 to-transparent",
    glow: "neon-cyan",
    title: "text-cyan-300",
  },
  pink: {
    border: "border-pink-500/40",
    header: "from-pink-900/60 to-transparent",
    glow: "neon-pink",
    title: "text-pink-300",
  },
  green: {
    border: "border-green-500/40",
    header: "from-green-900/60 to-transparent",
    glow: "neon-green",
    title: "text-green-300",
  },
};

export function NeonCard({
  variant = "purple",
  title,
  titleIcon,
  children,
  className,
  headerExtra,
  ...props
}: NeonCardProps) {
  const cfg = variantConfig[variant];
  return (
    <div
      className={cn(
        "rounded-2xl border bg-slate-950/80 backdrop-blur-sm card-enter overflow-hidden",
        cfg.border,
        cfg.glow,
        className,
      )}
      {...props}
    >
      {title && (
        <div
          className={cn(
            "bg-gradient-to-b px-4 py-3 flex items-center justify-between",
            cfg.header,
          )}
        >
          <div className="flex items-center gap-2">
            {titleIcon && <span className={cfg.title}>{titleIcon}</span>}
            <h3 className={cn("font-bold text-sm", cfg.title)}>{title}</h3>
          </div>
          {headerExtra}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
