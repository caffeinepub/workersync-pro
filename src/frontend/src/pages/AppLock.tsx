import { cn } from "@/lib/utils";
import { Delete, Lock } from "lucide-react";
import { useEffect, useState } from "react";

interface AppLockProps {
  onUnlocked: () => void;
}

export function AppLock({ onUnlocked }: AppLockProps) {
  const pinSet = localStorage.getItem("workersync_pin_set") === "true";
  const [mode, setMode] = useState<"enter" | "set" | "confirm">(
    pinSet ? "enter" : "set",
  );
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [lockoutEnd, setLockoutEnd] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!lockoutEnd) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockoutEnd - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockoutEnd(null);
        setAttempts(0);
        setCountdown(0);
        clearInterval(interval);
      } else {
        setCountdown(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutEnd]);

  function pressDigit(d: string) {
    if (lockoutEnd) return;
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError("");
    if (next.length === 4) handlePinComplete(next);
  }

  function handlePinComplete(entered: string) {
    if (mode === "set") {
      setConfirmPin(entered);
      setMode("confirm");
      setPin("");
    } else if (mode === "confirm") {
      if (entered === confirmPin) {
        localStorage.setItem("workersync_pin", entered);
        localStorage.setItem("workersync_pin_set", "true");
        onUnlocked();
      } else {
        setError("PINs don't match. Try again.");
        setMode("set");
        setConfirmPin("");
        setPin("");
      }
    } else {
      const stored = localStorage.getItem("workersync_pin");
      if (entered === stored) {
        onUnlocked();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= 3) {
          setLockoutEnd(Date.now() + 30000);
          setCountdown(30);
          setError("Too many attempts. Locked for 30 seconds.");
        } else {
          setError(`Wrong PIN. ${3 - newAttempts} attempts left.`);
        }
        setPin("");
      }
    }
  }

  function deleteLast() {
    setPin((p) => p.slice(0, -1));
  }

  const title =
    mode === "set"
      ? "Set Your PIN"
      : mode === "confirm"
        ? "Confirm PIN"
        : "Enter PIN";

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="lock-icon-float lock-icon-glow inline-block mb-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center neon-purple">
            <Lock size={32} className="text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-black text-white">WorkerSync Pro</h1>
        <p className="text-slate-500 text-sm mt-1">{title}</p>
      </div>

      {/* PIN dots */}
      <div className="flex gap-4 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "w-4 h-4 rounded-full border-2 transition-all duration-200",
              pin.length > i
                ? "bg-purple-500 border-purple-400 neon-purple"
                : "bg-transparent border-slate-600",
            )}
          />
        ))}
      </div>

      {error && (
        <p
          className="text-red-400 text-sm mb-4 px-6 text-center"
          data-ocid="applock.error_state"
        >
          {error}
        </p>
      )}
      {lockoutEnd && (
        <p
          className="text-amber-400 text-sm mb-4"
          data-ocid="applock.loading_state"
        >
          ⏱ Unlock in {countdown}s
        </p>
      )}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 w-64">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button
            type="button"
            key={d}
            onClick={() => pressDigit(d)}
            disabled={!!lockoutEnd}
            className="h-16 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xl font-bold hover:bg-slate-700 hover:neon-border-purple active:scale-95 transition-all disabled:opacity-40"
          >
            {d}
          </button>
        ))}
        <div />
        <button
          type="button"
          onClick={() => pressDigit("0")}
          disabled={!!lockoutEnd}
          className="h-16 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xl font-bold hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-40"
        >
          0
        </button>
        <button
          type="button"
          onClick={deleteLast}
          className="h-16 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center"
          data-ocid="applock.delete_button"
        >
          <Delete size={20} />
        </button>
      </div>
    </div>
  );
}
