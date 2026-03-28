import { cn } from "@/lib/utils";
import {
  CheckCircle,
  LogOut,
  MapPin,
  MessageSquare,
  Navigation,
  Phone,
  PlayCircle,
  Truck,
  User,
  Zap,
} from "lucide-react";
import { useRef, useState } from "react";
import { ChatRoom } from "../components/ChatRoom";
import { NeonCard } from "../components/NeonCard";
import { showNotification } from "../components/Notification";
import { StatusBadge } from "../components/StatusBadge";
import { UserAvatar } from "../components/UserAvatar";
import type { Session, Task, User as UserType } from "../types";

type Tab = "trip" | "chat" | "location" | "profile";

const NAV: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "trip", label: "Trip", icon: <Truck size={18} /> },
  { id: "chat", label: "Chat", icon: <MessageSquare size={18} /> },
  { id: "location", label: "Location", icon: <MapPin size={18} /> },
  { id: "profile", label: "Profile", icon: <User size={18} /> },
];

function getMyTask(idCode: string): Task | null {
  const all: Task[] = JSON.parse(
    localStorage.getItem("workersync_tasks") ?? "[]",
  );
  return (
    all.find(
      (t) =>
        t.assignedTo === idCode &&
        t.status !== "completed" &&
        t.status !== "rejected",
    ) ?? null
  );
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

export function DriverDashboard({
  session,
  onLogout,
}: { session: Session; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("trip");
  const [task, setTask] = useState<Task | null>(() =>
    getMyTask(session.idCode),
  );
  const [chatOpen, setChatOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [status, setStatus] = useState<"online" | "offline">("online");
  const locInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const owner = getOwner();

  function updateTask(newStatus: Task["status"]) {
    if (!task) return;
    const all: Task[] = JSON.parse(
      localStorage.getItem("workersync_tasks") ?? "[]",
    );
    const updated = all.map((t) =>
      t.id === task.id ? { ...t, status: newStatus } : t,
    );
    localStorage.setItem("workersync_tasks", JSON.stringify(updated));
    const refreshed = updated.find((t) => t.id === task.id) ?? null;
    setTask(
      refreshed?.status !== "completed" && refreshed?.status !== "rejected"
        ? refreshed
        : null,
    );
    addLog("Trip Updated", `Delivery status → ${newStatus}`, session);
    showNotification(
      newStatus === "completed" ? "Delivery completed! ✅" : "Trip started!",
      newStatus === "completed" ? "success" : "info",
    );
  }

  function toggleSharing() {
    if (!isSharing) {
      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCoords(c);
          saveLocation(c);
          setIsSharing(true);
        },
        () => {
          const c = { lat: 40.715, lng: -74.009 };
          setCoords(c);
          saveLocation(c);
          setIsSharing(true);
        },
      );
      locInterval.current = setInterval(() => {
        setCoords((prev) =>
          prev ? { lat: prev.lat + 0.0002, lng: prev.lng + 0.0001 } : null,
        );
      }, 15000);
      showNotification("Live location sharing started", "success");
      addLog("Location Shared", "Driver started sharing location", session);
    } else {
      setIsSharing(false);
      if (locInterval.current) clearInterval(locInterval.current);
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
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-600 to-cyan-900 flex items-center justify-center neon-cyan">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">{session.name}</p>
            <p className="text-cyan-400 text-xs">
              {session.role} · {session.idCode}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="p-2 text-slate-500 hover:text-red-400 transition-colors"
          data-ocid="driver.logout.button"
        >
          <LogOut size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "trip" && (
          <div className="p-4 flex flex-col gap-4">
            <h2 className="text-white font-black text-xl">Current Delivery</h2>
            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  task ? "bg-cyan-400 status-online-dot" : "bg-slate-600",
                )}
              />
              <span
                className={cn(
                  "text-sm font-medium",
                  task ? "text-cyan-300" : "text-slate-500",
                )}
              >
                {task ? `Status: ${task.status}` : "No active delivery"}
              </span>
            </div>

            {task ? (
              <NeonCard variant="cyan">
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-1">
                      Delivery Task
                    </p>
                    <p className="text-white font-bold text-base">
                      {task.title}
                    </p>
                    <p className="text-slate-500 text-sm mt-0.5">
                      {task.description}
                    </p>
                  </div>
                  <div className="bg-slate-900/80 rounded-xl p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-950/60 border border-blue-500/30 flex items-center justify-center">
                        <span className="text-blue-400 text-xs font-bold">
                          P
                        </span>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Pickup</p>
                        <p className="text-white text-sm font-medium">
                          {task.pickupLocation || "Not specified"}
                        </p>
                      </div>
                    </div>
                    <div className="h-4 border-l border-dashed border-slate-700 ml-3" />
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-green-950/60 border border-green-500/30 flex items-center justify-center">
                        <span className="text-green-400 text-xs font-bold">
                          D
                        </span>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Drop-off</p>
                        <p className="text-white text-sm font-medium">
                          {task.dropLocation || "Not specified"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              </NeonCard>
            ) : (
              <NeonCard variant="cyan">
                <div
                  className="text-center py-6 text-slate-600"
                  data-ocid="driver.trip.empty_state"
                >
                  <Truck size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="font-semibold">No active delivery</p>
                  <p className="text-xs mt-1">Waiting for task assignment</p>
                </div>
              </NeonCard>
            )}

            {/* Big Action Buttons */}
            <div className="flex flex-col gap-3">
              {task?.status === "pending" && (
                <button
                  type="button"
                  onClick={() => updateTask("accepted")}
                  className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold text-base neon-blue hover:bg-blue-500 active:scale-95 transition-all flex items-center justify-center gap-2"
                  data-ocid="driver.accept.button"
                >
                  <CheckCircle size={20} /> Accept Delivery
                </button>
              )}
              {task?.status === "accepted" && (
                <button
                  type="button"
                  onClick={() => updateTask("inProgress")}
                  className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold text-base neon-blue hover:bg-blue-500 active:scale-95 transition-all flex items-center justify-center gap-2"
                  data-ocid="driver.start_trip.button"
                >
                  <PlayCircle size={20} /> Start Trip
                </button>
              )}
              {task?.status === "inProgress" && (
                <button
                  type="button"
                  onClick={() => updateTask("completed")}
                  className="w-full py-4 rounded-2xl bg-green-600 text-white font-bold text-base neon-green hover:bg-green-500 active:scale-95 transition-all flex items-center justify-center gap-2"
                  data-ocid="driver.complete_delivery.button"
                >
                  <CheckCircle size={20} /> Complete Delivery
                </button>
              )}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="py-3 rounded-2xl bg-purple-950/60 border border-purple-500/40 text-purple-300 font-semibold text-sm hover:bg-purple-900/60 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  data-ocid="driver.call_owner.button"
                >
                  <Phone size={16} /> Call Owner
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab("chat");
                    setChatOpen(true);
                  }}
                  className="py-3 rounded-2xl bg-pink-950/60 border border-pink-500/40 text-pink-300 font-semibold text-sm hover:bg-pink-900/60 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  data-ocid="driver.quick_chat.button"
                >
                  <MessageSquare size={16} /> Quick Chat
                </button>
              </div>
            </div>
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
                data-ocid="driver.chat.owner.button"
              >
                <UserAvatar name={owner.name} role={owner.role} />
                <div>
                  <p className="text-white font-semibold">{owner.name}</p>
                  <StatusBadge status={owner.status} />
                </div>
              </button>
            ) : (
              <p className="text-slate-600 text-sm">Owner not found.</p>
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
                    "w-24 h-24 rounded-full flex items-center justify-center transition-all",
                    isSharing
                      ? "bg-green-950/60 border-2 border-green-500/60"
                      : "bg-slate-800 border-2 border-slate-700",
                  )}
                >
                  <Navigation
                    size={40}
                    className={isSharing ? "text-green-400" : "text-slate-500"}
                  />
                </div>
                <div className="text-center">
                  <p
                    className={cn(
                      "font-bold text-xl",
                      isSharing ? "text-green-300" : "text-slate-400",
                    )}
                  >
                    {isSharing ? "LIVE" : "OFF"}
                  </p>
                  {coords && (
                    <p className="text-slate-500 text-xs font-mono mt-1">
                      {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={toggleSharing}
                  className={cn(
                    "w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95",
                    isSharing
                      ? "bg-red-600 hover:bg-red-500"
                      : "bg-green-600 hover:bg-green-500",
                  )}
                  data-ocid="driver.location.toggle"
                >
                  {isSharing ? "Stop Sharing" : "Share Live Location"}
                </button>
              </div>
            </NeonCard>
          </div>
        )}

        {tab === "profile" && (
          <div className="p-4 flex flex-col gap-4">
            <h2 className="text-white font-black text-xl">My Profile</h2>
            <NeonCard variant="cyan">
              <div className="flex flex-col items-center gap-3 py-2">
                <UserAvatar name={session.name} role={session.role} size="lg" />
                <div className="text-center">
                  <p className="text-white font-bold text-lg">{session.name}</p>
                  <p className="text-cyan-400 text-sm">{session.role}</p>
                  <p className="text-slate-500 text-xs font-mono mt-1">
                    {session.idCode}
                  </p>
                </div>
                <StatusBadge status={status} />
              </div>
            </NeonCard>
            <NeonCard variant="green" title="Status Control">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-sm">
                  {status === "online" ? "Available" : "Unavailable"}
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
                  data-ocid="driver.status.toggle"
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
                ? "text-cyan-400 bg-cyan-950/40"
                : "text-slate-500 hover:text-slate-300",
            )}
            data-ocid={`driver.${n.id}.tab`}
          >
            {n.icon}
            <span className="text-[10px] font-medium">{n.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
