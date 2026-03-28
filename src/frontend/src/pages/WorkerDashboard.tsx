import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ClipboardList,
  LogOut,
  MapPin,
  MessageSquare,
  Navigation,
  User,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ChatRoom } from "../components/ChatRoom";
import { NeonCard } from "../components/NeonCard";
import { showNotification } from "../components/Notification";
import { StatusBadge } from "../components/StatusBadge";
import { UserAvatar } from "../components/UserAvatar";
import type { Session, Task, User as UserType } from "../types";

type Tab = "tasks" | "chat" | "location" | "profile";

const NAV: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "tasks", label: "Tasks", icon: <ClipboardList size={18} /> },
  { id: "chat", label: "Chat", icon: <MessageSquare size={18} /> },
  { id: "location", label: "Location", icon: <MapPin size={18} /> },
  { id: "profile", label: "Profile", icon: <User size={18} /> },
];

function getMyTasks(idCode: string): Task[] {
  const all: Task[] = JSON.parse(
    localStorage.getItem("workersync_tasks") ?? "[]",
  );
  return all.filter((t) => t.assignedTo === idCode);
}
function getOwner(): UserType | null {
  const users: UserType[] = JSON.parse(
    localStorage.getItem("workersync_users") ?? "[]",
  );
  return users.find((u) => u.role === "Owner") ?? null;
}
function addLog(action: string, details: string, session: Session) {
  const logs = JSON.parse(localStorage.getItem("workersync_logs") ?? "[]");
  logs.unshift({
    id: Math.random().toString(36).slice(2),
    userId: session.idCode,
    userName: session.name,
    action,
    details,
    timestamp: Date.now(),
  });
  localStorage.setItem("workersync_logs", JSON.stringify(logs.slice(0, 100)));
}

interface WorkerDashboardProps {
  session: Session;
  onLogout: () => void;
}

export function WorkerDashboard({ session, onLogout }: WorkerDashboardProps) {
  const [tab, setTab] = useState<Tab>("tasks");
  const [tasks, setTasks] = useState<Task[]>(() => getMyTasks(session.idCode));
  const [chatOpen, setChatOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [status, setStatus] = useState<"online" | "offline">("online");
  const locationInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const owner = getOwner();

  // biome-ignore lint/correctness/useExhaustiveDependencies: refresh tasks on tab switch
  useEffect(() => {
    setTasks(getMyTasks(session.idCode));
  }, [tab, session.idCode]);

  function updateTaskStatus(taskId: string, newStatus: Task["status"]) {
    const all: Task[] = JSON.parse(
      localStorage.getItem("workersync_tasks") ?? "[]",
    );
    const updated = all.map((t) =>
      t.id === taskId ? { ...t, status: newStatus } : t,
    );
    localStorage.setItem("workersync_tasks", JSON.stringify(updated));
    setTasks(updated.filter((t) => t.assignedTo === session.idCode));
    addLog("Task Updated", `Task status → ${newStatus}`, session);
    showNotification(
      `Task marked as ${newStatus}`,
      newStatus === "completed" ? "success" : "info",
    );
  }

  function toggleLocationSharing() {
    if (!isSharing) {
      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCoords(c);
          saveLocation(c);
          setIsSharing(true);
          showNotification("Location sharing started", "success");
          addLog("Location Shared", "Started sharing live location", session);
        },
        () => {
          // Fallback simulated location
          const c = {
            lat: 40.7128 + (Math.random() - 0.5) * 0.01,
            lng: -74.006 + (Math.random() - 0.5) * 0.01,
          };
          setCoords(c);
          saveLocation(c);
          setIsSharing(true);
          showNotification("Location sharing started (simulated)", "info");
        },
      );
      locationInterval.current = setInterval(() => {
        navigator.geolocation?.getCurrentPosition(
          (pos) => {
            const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setCoords(c);
            saveLocation(c);
          },
          () => {
            setCoords((prev) =>
              prev ? { lat: prev.lat + 0.0001, lng: prev.lng + 0.0001 } : null,
            );
          },
        );
      }, 15000);
    } else {
      setIsSharing(false);
      if (locationInterval.current) clearInterval(locationInterval.current);
      addLog("Location Stopped", "Stopped sharing live location", session);
      showNotification("Location sharing stopped", "info");
    }
  }

  function saveLocation(c: { lat: number; lng: number }) {
    const locs = JSON.parse(
      localStorage.getItem("workersync_locations") ?? "[]",
    );
    const idx = locs.findIndex(
      (l: { userId: string }) => l.userId === session.idCode,
    );
    const entry = {
      userId: session.idCode,
      latitude: c.lat,
      longitude: c.lng,
      timestamp: Date.now(),
      isSharing: true,
    };
    if (idx !== -1) locs[idx] = entry;
    else locs.push(entry);
    localStorage.setItem("workersync_locations", JSON.stringify(locs));
  }

  function toggleStatus() {
    const next = status === "online" ? "offline" : "online";
    setStatus(next);
    const users: UserType[] = JSON.parse(
      localStorage.getItem("workersync_users") ?? "[]",
    );
    const updated = users.map((u) =>
      u.idCode === session.idCode ? { ...u, status: next } : u,
    );
    localStorage.setItem("workersync_users", JSON.stringify(updated));
    addLog("Status Changed", `Status → ${next}`, session);
  }

  if (chatOpen && owner && tab === "chat") {
    return (
      <ChatRoom
        session={session}
        peer={owner}
        onBack={() => setChatOpen(false)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center neon-blue">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">{session.name}</p>
            <p className="text-blue-400 text-xs">
              {session.role} · {session.idCode}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="p-2 text-slate-500 hover:text-red-400 transition-colors"
          data-ocid="worker.logout.button"
        >
          <LogOut size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "tasks" && (
          <div className="p-4 flex flex-col gap-4">
            <h2 className="text-white font-black text-xl">My Tasks</h2>
            {tasks.length === 0 && (
              <div
                className="text-center py-12 text-slate-600"
                data-ocid="worker.tasks.empty_state"
              >
                <ClipboardList size={32} className="mx-auto mb-2 opacity-40" />
                <p>No tasks assigned yet.</p>
              </div>
            )}
            {tasks.map((t, i) => (
              <NeonCard
                key={t.id}
                variant="blue"
                data-ocid={`worker.tasks.item.${i + 1}`}
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    size={18}
                    className="text-blue-400 mt-0.5 flex-shrink-0"
                  />
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">
                      {t.title}
                    </p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {t.description}
                    </p>
                    {t.pickupLocation && (
                      <p className="text-slate-600 text-xs mt-1">
                        📦 {t.pickupLocation} → {t.dropLocation}
                      </p>
                    )}
                    <StatusBadge status={t.status} className="mt-1.5" />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {t.status === "pending" && (
                    <>
                      <button
                        type="button"
                        onClick={() => updateTaskStatus(t.id, "accepted")}
                        className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold neon-blue hover:bg-blue-500 transition-all"
                        data-ocid={`worker.accept.button.${i + 1}`}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => updateTaskStatus(t.id, "rejected")}
                        className="flex-1 py-2 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-xs font-bold hover:bg-red-900/60 transition-all"
                        data-ocid={`worker.reject.button.${i + 1}`}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {t.status === "accepted" && (
                    <button
                      type="button"
                      onClick={() => updateTaskStatus(t.id, "inProgress")}
                      className="flex-1 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold neon-cyan hover:bg-cyan-500 transition-all"
                      data-ocid={`worker.start.button.${i + 1}`}
                    >
                      Start Work
                    </button>
                  )}
                  {t.status === "inProgress" && (
                    <button
                      type="button"
                      onClick={() => updateTaskStatus(t.id, "completed")}
                      className="flex-1 py-2 rounded-xl bg-green-600 text-white text-xs font-bold neon-green hover:bg-green-500 transition-all"
                      data-ocid={`worker.complete.button.${i + 1}`}
                    >
                      Mark Complete
                    </button>
                  )}
                  {(t.status === "completed" || t.status === "rejected") && (
                    <p className="text-slate-600 text-xs text-center w-full py-1">
                      {t.status === "completed"
                        ? "✅ Completed"
                        : "❌ Rejected"}
                    </p>
                  )}
                </div>
              </NeonCard>
            ))}
          </div>
        )}

        {tab === "chat" && (
          <div className="p-4 flex flex-col gap-3">
            <h2 className="text-white font-black text-xl">Chat</h2>
            {owner ? (
              <button
                type="button"
                onClick={() => setChatOpen(true)}
                className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-pink-500/30 hover:bg-pink-950/10 transition-all text-left"
                data-ocid="worker.chat.owner.button"
              >
                <UserAvatar name={owner.name} role={owner.role} />
                <div>
                  <p className="text-white font-semibold">{owner.name}</p>
                  <StatusBadge status={owner.status} />
                </div>
              </button>
            ) : (
              <p className="text-slate-600 text-sm">No owner found.</p>
            )}
          </div>
        )}

        {tab === "location" && (
          <div className="p-4 flex flex-col gap-4 items-center">
            <h2 className="text-white font-black text-xl self-start">
              Live Location
            </h2>
            <NeonCard variant="cyan" className="w-full">
              <div className="flex flex-col items-center gap-4 py-4">
                <div
                  className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center transition-all",
                    isSharing
                      ? "bg-green-950/60 border-2 border-green-500/60 neon-green"
                      : "bg-slate-800 border-2 border-slate-700",
                  )}
                >
                  <Navigation
                    size={32}
                    className={isSharing ? "text-green-400" : "text-slate-500"}
                  />
                </div>
                <div className="text-center">
                  <p
                    className={cn(
                      "font-bold text-lg",
                      isSharing ? "text-green-300" : "text-slate-400",
                    )}
                  >
                    {isSharing
                      ? "Sharing Live Location"
                      : "Location Sharing OFF"}
                  </p>
                  {coords && (
                    <p className="text-slate-500 text-sm font-mono mt-1">
                      {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={toggleLocationSharing}
                  className={cn(
                    "w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95",
                    isSharing
                      ? "bg-red-600 hover:bg-red-500 neon-pink"
                      : "bg-green-600 hover:bg-green-500 neon-green",
                  )}
                  data-ocid="worker.location.toggle"
                >
                  {isSharing ? "Stop Sharing" : "Share Live Location"}
                </button>
                {isSharing && (
                  <p className="text-slate-600 text-xs">
                    Updates every 15 seconds
                  </p>
                )}
              </div>
            </NeonCard>
          </div>
        )}

        {tab === "profile" && (
          <div className="p-4 flex flex-col gap-4">
            <h2 className="text-white font-black text-xl">My Profile</h2>
            <NeonCard variant="blue">
              <div className="flex flex-col items-center gap-3 py-2">
                <UserAvatar name={session.name} role={session.role} size="lg" />
                <div className="text-center">
                  <p className="text-white font-bold text-lg">{session.name}</p>
                  <p className="text-blue-400 text-sm">{session.role}</p>
                  <p className="text-slate-500 text-xs font-mono mt-1">
                    {session.idCode}
                  </p>
                </div>
                <StatusBadge status={status} />
              </div>
            </NeonCard>
            <NeonCard variant="cyan" title="Status">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-sm">
                  {status === "online" ? "You are Online" : "You are Offline"}
                </span>
                <button
                  type="button"
                  onClick={toggleStatus}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                    status === "online"
                      ? "bg-red-950/60 border border-red-500/30 text-red-300"
                      : "bg-green-950/60 border border-green-500/30 text-green-300",
                  )}
                  data-ocid="worker.status.toggle"
                >
                  Go {status === "online" ? "Offline" : "Online"}
                </button>
              </div>
            </NeonCard>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="border-t border-slate-800 bg-slate-950/95 px-2 py-2 flex justify-around">
        {NAV.map((n) => (
          <button
            type="button"
            key={n.id}
            onClick={() => {
              setTab(n.id);
              setChatOpen(false);
            }}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all",
              tab === n.id
                ? "text-blue-400 bg-blue-950/40"
                : "text-slate-500 hover:text-slate-300",
            )}
            data-ocid={`worker.${n.id}.tab`}
          >
            {n.icon}
            <span className="text-[10px] font-medium">{n.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
