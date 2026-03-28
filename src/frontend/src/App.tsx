import { useCallback, useEffect, useState } from "react";
import { NotificationContainer } from "./components/Notification";
import { useInactivity } from "./hooks/useInactivity";
import { AppLock } from "./pages/AppLock";
import { AuthPage } from "./pages/AuthPage";
import { DriverDashboard } from "./pages/DriverDashboard";
import { OwnerDashboard } from "./pages/OwnerDashboard";
import { WorkerDashboard } from "./pages/WorkerDashboard";
import type { Session } from "./types";
import "./styles/neon.css";

function getStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem("workersync_session");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [session, setSession] = useState<Session | null>(getStoredSession);
  const [locked, setLocked] = useState(false);
  const [pinSetup, setPinSetup] = useState(false);

  // Show app lock on inactivity (60s)
  const handleIdle = useCallback(() => {
    if (session && localStorage.getItem("workersync_pin_set") === "true") {
      setLocked(true);
    }
  }, [session]);

  useInactivity(60000, handleIdle);

  // First launch PIN setup
  useEffect(() => {
    if (session && !localStorage.getItem("workersync_pin_set")) {
      setPinSetup(true);
    }
  }, [session]);

  function handleLogin(s: Session) {
    setSession(s);
    if (!localStorage.getItem("workersync_pin_set")) {
      setPinSetup(true);
    }
  }

  function handleLogout() {
    localStorage.removeItem("workersync_session");
    setSession(null);
    setLocked(false);
    setPinSetup(false);
  }

  function handleUnlocked() {
    setLocked(false);
    setPinSetup(false);
  }

  // Show PIN lock overlay if locked or first-time PIN setup
  const showLock = locked || (session && pinSetup);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-0 sm:p-4">
      {/* Phone frame */}
      <div
        className="relative w-full sm:w-[430px] sm:max-h-[900px] h-screen sm:h-[900px] sm:rounded-[2.5rem] overflow-hidden bg-slate-950 sm:border sm:border-slate-800 flex flex-col"
        style={{
          boxShadow:
            "0 0 60px rgba(168,85,247,0.15), 0 0 120px rgba(139,92,246,0.08)",
        }}
      >
        {!session && <AuthPage onLogin={handleLogin} />}
        {session && showLock && <AppLock onUnlocked={handleUnlocked} />}
        {session && !showLock && session.role === "Owner" && (
          <OwnerDashboard session={session} onLogout={handleLogout} />
        )}
        {session && !showLock && session.role === "Worker" && (
          <WorkerDashboard session={session} onLogout={handleLogout} />
        )}
        {session && !showLock && session.role === "Driver" && (
          <DriverDashboard session={session} onLogout={handleLogout} />
        )}
      </div>
      <NotificationContainer />
    </div>
  );
}
