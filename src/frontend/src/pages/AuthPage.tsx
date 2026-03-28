import { cn } from "@/lib/utils";
import { RefreshCw, Zap } from "lucide-react";
import { useState } from "react";
import { initSeedData } from "../data/seed";
import type { Role, Session } from "../types";

function generateId(): string {
  const prefix = ["USR", "EMP", "SYN"][Math.floor(Math.random() * 3)];
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}${num}`;
}

interface AuthPageProps {
  onLogin: (session: Session) => void;
}

export function AuthPage({ onLogin }: AuthPageProps) {
  initSeedData();

  const [name, setName] = useState("");
  const [idCode, setIdCode] = useState("");
  const [role, setRole] = useState<Role | null>(null);
  const [error, setError] = useState("");

  const roles: {
    value: Role;
    label: string;
    desc: string;
    color: string;
    border: string;
    glow: string;
  }[] = [
    {
      value: "Owner",
      label: "Owner",
      desc: "Full management access",
      color: "text-purple-300",
      border: "border-purple-500/50",
      glow: "hover-neon-purple",
    },
    {
      value: "Worker",
      label: "Worker",
      desc: "View tasks & chat",
      color: "text-blue-300",
      border: "border-blue-500/50",
      glow: "hover-neon-blue",
    },
    {
      value: "Driver",
      label: "Driver",
      desc: "Delivery & live location",
      color: "text-cyan-300",
      border: "border-cyan-400/50",
      glow: "hover-neon-cyan",
    },
  ];

  function handleSubmit() {
    setError("");
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!idCode.trim()) {
      setError("ID Code is required.");
      return;
    }
    if (!role) {
      setError("Please select a role.");
      return;
    }

    const ids: string[] = JSON.parse(
      localStorage.getItem("workersync_ids") ?? "[]",
    );
    if (ids.includes(idCode.toUpperCase())) {
      setError("This ID Code is already taken. Please choose another.");
      return;
    }

    const session: Session = {
      userId: Math.random().toString(36).slice(2),
      name: name.trim(),
      role,
      idCode: idCode.toUpperCase(),
    };

    // Register user
    const users = JSON.parse(localStorage.getItem("workersync_users") ?? "[]");
    users.push({ ...session, status: "online", lastSeen: Date.now() });
    localStorage.setItem("workersync_users", JSON.stringify(users));
    localStorage.setItem(
      "workersync_ids",
      JSON.stringify([...ids, session.idCode]),
    );
    localStorage.setItem("workersync_session", JSON.stringify(session));

    onLogin(session);
  }

  return (
    <div className="flex flex-col min-h-full bg-slate-950 px-6 py-10 items-center justify-center">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-700 mb-4 neon-purple">
          <Zap size={30} className="text-white" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">
          WorkerSync Pro
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Team management & coordination
        </p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-5">
        {/* Name */}
        <div>
          <span className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
            Your Name
          </span>
          <input
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 outline-none focus:border-purple-500/70 transition-colors text-sm"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-ocid="auth.input"
          />
        </div>

        {/* ID Code */}
        <div>
          <span className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
            Unique ID Code
          </span>
          <div className="flex gap-2">
            <input
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 outline-none focus:border-purple-500/70 transition-colors text-sm font-mono uppercase"
              placeholder="e.g. WRK0042"
              value={idCode}
              onChange={(e) => setIdCode(e.target.value.toUpperCase())}
              data-ocid="auth.search_input"
            />
            <button
              type="button"
              onClick={() => setIdCode(generateId())}
              className="px-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-purple-300 hover:border-purple-500/50 transition-colors"
              data-ocid="auth.secondary_button"
              title="Auto-generate ID"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Role */}
        <div>
          <span className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
            Select Role
          </span>
          <div className="flex flex-col gap-2">
            {roles.map((r) => (
              <button
                type="button"
                key={r.value}
                onClick={() => setRole(r.value)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl border bg-slate-900 transition-all text-left",
                  r.glow,
                  role === r.value
                    ? cn(r.border, "bg-slate-800")
                    : "border-slate-700 hover:border-slate-600",
                )}
                data-ocid={`auth.${r.value.toLowerCase()}.toggle`}
              >
                <div
                  className={cn(
                    "w-3 h-3 rounded-full border-2",
                    role === r.value
                      ? cn("bg-current border-current", r.color)
                      : "border-slate-600",
                  )}
                />
                <div>
                  <p
                    className={cn(
                      "font-semibold text-sm",
                      role === r.value ? r.color : "text-white",
                    )}
                  >
                    {r.label}
                  </p>
                  <p className="text-slate-500 text-xs">{r.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p
            className="text-red-400 text-sm text-center bg-red-950/40 border border-red-500/30 rounded-xl px-3 py-2"
            data-ocid="auth.error_state"
          >
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-sm neon-purple hover:from-purple-500 hover:to-blue-500 transition-all active:scale-95 mt-2"
          data-ocid="auth.primary_button"
        >
          Enter App
        </button>

        <p className="text-center text-slate-600 text-xs">
          Demo: Use ID <span className="text-purple-400 font-mono">OWN001</span>{" "}
          (Ahmad/Owner) to see full dashboard
        </p>
      </div>
    </div>
  );
}
