import { cn } from "@/lib/utils";
import {
  Activity,
  Ban,
  CheckCircle2,
  ClipboardList,
  Clock,
  LayoutDashboard,
  LogOut,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  Plus,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ChatRoom } from "../components/ChatRoom";
import { NeonCard } from "../components/NeonCard";
import { showNotification } from "../components/Notification";
import { StatusBadge } from "../components/StatusBadge";
import { UserAvatar } from "../components/UserAvatar";
import type { LogEntry, Session, Task, User, Worker } from "../types";

type Tab = "dashboard" | "team" | "tasks" | "map" | "chat" | "logs";

const NAV: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { id: "team", label: "Team", icon: <Users size={18} /> },
  { id: "tasks", label: "Tasks", icon: <ClipboardList size={18} /> },
  { id: "map", label: "Map", icon: <MapPin size={18} /> },
  { id: "chat", label: "Chat", icon: <MessageSquare size={18} /> },
  { id: "logs", label: "Logs", icon: <Activity size={18} /> },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "text-amber-400",
  accepted: "text-blue-400",
  inProgress: "text-cyan-400",
  completed: "text-green-400",
  rejected: "text-red-400",
};

// ─── Local helpers ─────────────────────────────────────────────────────────
function getWorkers(): Worker[] {
  return JSON.parse(localStorage.getItem("workersync_workers") ?? "[]");
}
function getTasks(): Task[] {
  return JSON.parse(localStorage.getItem("workersync_tasks") ?? "[]");
}
function getLogs(): LogEntry[] {
  return JSON.parse(localStorage.getItem("workersync_logs") ?? "[]");
}
function getUsers(): User[] {
  return JSON.parse(localStorage.getItem("workersync_users") ?? "[]");
}
function getLocations(): {
  userId: string;
  latitude: number;
  longitude: number;
  isSharing: boolean;
  timestamp: number;
}[] {
  return JSON.parse(localStorage.getItem("workersync_locations") ?? "[]");
}

function storeWorkers(w: Worker[]) {
  localStorage.setItem("workersync_workers", JSON.stringify(w));
}
function storeTasks(t: Task[]) {
  localStorage.setItem("workersync_tasks", JSON.stringify(t));
}

function logActivity(action: string, details: string, session: Session) {
  const logs: LogEntry[] = getLogs();
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

function maskPhone(phone: string): string {
  return `***-***-${phone.slice(-4)}`;
}

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

// ─── Main component ─────────────────────────────────────────────────────────
export function OwnerDashboard({
  session,
  onLogout,
}: { session: Session; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [workers, setWorkers] = useState<Worker[]>(getWorkers);
  const [tasks, setTasks] = useState<Task[]>(getTasks);
  const [logs, setLogs] = useState<LogEntry[]>(getLogs);
  const [chatPeer, setChatPeer] = useState<User | null>(null);

  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [editWorker, setEditWorker] = useState<Worker | null>(null);
  const [wForm, setWForm] = useState({
    name: "",
    phone: "",
    role: "Worker" as "Worker" | "Driver",
    idCode: "",
  });

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [tForm, setTForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    pickupLocation: "",
    dropLocation: "",
  });

  const users = getUsers();
  const locations = getLocations();

  useEffect(() => {
    setWorkers(getWorkers());
    setTasks(getTasks());
    setLogs(getLogs());
  }, []);

  // ── Worker CRUD ──
  function openAddWorker() {
    setEditWorker(null);
    setWForm({ name: "", phone: "", role: "Worker", idCode: "" });
    setShowWorkerModal(true);
  }
  function openEditWorker(w: Worker) {
    setEditWorker(w);
    setWForm({ name: w.name, phone: w.phone, role: w.role, idCode: w.idCode });
    setShowWorkerModal(true);
  }
  function saveWorkerForm() {
    if (!wForm.name || !wForm.phone || !wForm.idCode) return;
    const updated = [...workers];
    if (editWorker) {
      const idx = updated.findIndex((w) => w.id === editWorker.id);
      if (idx !== -1) updated[idx] = { ...updated[idx], ...wForm };
      logActivity("Worker Updated", `Updated: ${wForm.name}`, session);
      showNotification(`Worker ${wForm.name} updated`, "info");
    } else {
      updated.push({
        id: Math.random().toString(36).slice(2),
        ...wForm,
        status: "offline",
        isBlocked: false,
      });
      logActivity("Worker Added", `Added: ${wForm.name}`, session);
      showNotification(`${wForm.name} added to team`, "success");
    }
    storeWorkers(updated);
    setWorkers(updated);
    setShowWorkerModal(false);
  }
  function deleteWorker(id: string) {
    const updated = workers.filter((w) => w.id !== id);
    storeWorkers(updated);
    setWorkers(updated);
    logActivity("Worker Deleted", "Worker removed", session);
    showNotification("Worker removed", "error");
  }
  function toggleBlock(worker: Worker) {
    const updated = workers.map((w) =>
      w.id === worker.id ? { ...w, isBlocked: !w.isBlocked } : w,
    );
    storeWorkers(updated);
    setWorkers(updated);
    const blocked: { blockerId: string; blockedId: string }[] = JSON.parse(
      localStorage.getItem("workersync_blocked") ?? "[]",
    );
    if (!worker.isBlocked) {
      blocked.push({ blockerId: session.idCode, blockedId: worker.idCode });
      showNotification(`${worker.name} blocked`, "warning");
    } else {
      const idx = blocked.findIndex(
        (b) => b.blockerId === session.idCode && b.blockedId === worker.idCode,
      );
      if (idx !== -1) blocked.splice(idx, 1);
      showNotification(`${worker.name} unblocked`, "success");
    }
    localStorage.setItem("workersync_blocked", JSON.stringify(blocked));
  }

  // ── Task CRUD ──
  function saveTaskForm() {
    if (!tForm.title || !tForm.assignedTo) return;
    const assignee = workers.find((w) => w.idCode === tForm.assignedTo);
    const newTask: Task = {
      id: Math.random().toString(36).slice(2),
      ...tForm,
      assignedToName: assignee?.name ?? tForm.assignedTo,
      status: "pending",
      date: Date.now(),
    };
    const updated = [...tasks, newTask];
    storeTasks(updated);
    setTasks(updated);
    logActivity("Task Created", `Created: ${tForm.title}`, session);
    showNotification(`Task "${tForm.title}" assigned`, "success");
    setShowTaskModal(false);
    setTForm({
      title: "",
      description: "",
      assignedTo: "",
      pickupLocation: "",
      dropLocation: "",
    });
  }

  function updateTaskStatus(taskId: string, status: Task["status"]) {
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, status } : t));
    storeTasks(updated);
    setTasks(updated);
    logActivity("Task Updated", `Status → ${status}`, session);
    showNotification("Task status updated", "info");
  }

  if (chatPeer && tab === "chat") {
    return (
      <div className="flex flex-col h-full">
        <ChatRoom
          session={session}
          peer={chatPeer}
          onBack={() => setChatPeer(null)}
        />
      </div>
    );
  }

  const totalWorkers = workers.length;
  const activeWorkers = workers.filter((w) => w.status === "online").length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/95">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-blue-700 flex items-center justify-center neon-purple">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">
              WorkerSync Pro
            </p>
            <p className="text-purple-400 text-xs">
              {session.name} · {session.role}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="p-2 text-slate-500 hover:text-red-400 transition-colors"
          data-ocid="owner.logout.button"
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === "dashboard" && (
          <DashboardTab
            totalWorkers={totalWorkers}
            activeWorkers={activeWorkers}
            totalTasks={tasks.length}
            completedTasks={completedTasks}
            logs={logs}
          />
        )}
        {tab === "team" && (
          <TeamTab
            workers={workers}
            users={users}
            onAdd={openAddWorker}
            onEdit={openEditWorker}
            onDelete={deleteWorker}
            onToggleBlock={toggleBlock}
            onChat={(u) => {
              setChatPeer(u);
            }}
          />
        )}
        {tab === "tasks" && (
          <TasksTab
            tasks={tasks}
            workers={workers}
            onAddTask={() => setShowTaskModal(true)}
            onUpdateStatus={updateTaskStatus}
          />
        )}
        {tab === "map" && <MapTab locations={locations} workers={workers} />}
        {tab === "chat" && (
          <ChatListTab
            workers={workers}
            users={users}
            session={session}
            onOpenChat={(u) => setChatPeer(u)}
          />
        )}
        {tab === "logs" && <LogsTab logs={logs} />}
      </div>

      {/* Bottom Nav */}
      <div className="border-t border-slate-800 bg-slate-950/95 px-2 py-2 flex justify-around">
        {NAV.map((n) => (
          <button
            type="button"
            key={n.id}
            onClick={() => {
              setTab(n.id);
              setChatPeer(null);
            }}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all",
              tab === n.id
                ? "text-purple-400 bg-purple-950/40"
                : "text-slate-500 hover:text-slate-300",
            )}
            data-ocid={`owner.${n.id}.tab`}
          >
            {n.icon}
            <span className="text-[10px] font-medium">{n.label}</span>
          </button>
        ))}
      </div>

      {/* Worker Modal */}
      {showWorkerModal && (
        <Modal
          onClose={() => setShowWorkerModal(false)}
          title={editWorker ? "Edit Worker" : "Add Worker"}
        >
          <div className="flex flex-col gap-3">
            {(["name", "phone", "idCode"] as const).map((field) => (
              <div key={field}>
                <span className="text-xs text-slate-400 uppercase tracking-wider">
                  {field === "idCode"
                    ? "ID Code"
                    : field.charAt(0).toUpperCase() + field.slice(1)}
                </span>
                <input
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-purple-500/70"
                  value={wForm[field]}
                  onChange={(e) =>
                    setWForm((prev) => ({ ...prev, [field]: e.target.value }))
                  }
                  data-ocid={`worker_form.${field}.input`}
                />
              </div>
            ))}
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider">
                Role
              </span>
              <select
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm outline-none"
                value={wForm.role}
                onChange={(e) =>
                  setWForm((prev) => ({
                    ...prev,
                    role: e.target.value as "Worker" | "Driver",
                  }))
                }
                data-ocid="worker_form.role.select"
              >
                <option value="Worker">Worker</option>
                <option value="Driver">Driver</option>
              </select>
            </div>
            <button
              type="button"
              onClick={saveWorkerForm}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm neon-purple transition-all"
              data-ocid="worker_form.submit_button"
            >
              {editWorker ? "Save Changes" : "Add Worker"}
            </button>
          </div>
        </Modal>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <Modal onClose={() => setShowTaskModal(false)} title="Assign New Task">
          <div className="flex flex-col gap-3">
            {(["title", "description"] as const).map((field) => (
              <div key={field}>
                <span className="text-xs text-slate-400 uppercase tracking-wider">
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </span>
                {field === "description" ? (
                  <textarea
                    rows={2}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500/70 resize-none"
                    value={tForm[field]}
                    onChange={(e) =>
                      setTForm((p) => ({ ...p, [field]: e.target.value }))
                    }
                    data-ocid={`task_form.${field}.textarea`}
                  />
                ) : (
                  <input
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500/70"
                    value={tForm[field]}
                    onChange={(e) =>
                      setTForm((p) => ({ ...p, [field]: e.target.value }))
                    }
                    data-ocid={`task_form.${field}.input`}
                  />
                )}
              </div>
            ))}
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider">
                Assign To
              </span>
              <select
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm outline-none"
                value={tForm.assignedTo}
                onChange={(e) =>
                  setTForm((p) => ({ ...p, assignedTo: e.target.value }))
                }
                data-ocid="task_form.assignee.select"
              >
                <option value="">-- Select Worker --</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.idCode}>
                    {w.name} ({w.role})
                  </option>
                ))}
              </select>
            </div>
            {(["pickupLocation", "dropLocation"] as const).map((field) => (
              <div key={field}>
                <span className="text-xs text-slate-400 uppercase tracking-wider">
                  {field === "pickupLocation"
                    ? "Pickup Location"
                    : "Drop Location"}
                </span>
                <input
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500/70"
                  value={tForm[field]}
                  onChange={(e) =>
                    setTForm((p) => ({ ...p, [field]: e.target.value }))
                  }
                  data-ocid={`task_form.${field}.input`}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={saveTaskForm}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm neon-blue transition-all"
              data-ocid="task_form.submit_button"
            >
              Assign Task
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Modal({
  onClose,
  title,
  children,
}: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      data-ocid="modal.dialog"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="presentation"
      />
      <div className="relative bg-slate-900 border border-slate-700 rounded-t-3xl w-full max-w-[430px] p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-white"
            data-ocid="modal.close_button"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  variant,
}: {
  label: string;
  value: number;
  sub: string;
  variant: "purple" | "blue" | "cyan" | "green";
}) {
  const colors: Record<string, string> = {
    purple: "text-purple-400",
    blue: "text-blue-400",
    cyan: "text-cyan-400",
    green: "text-green-400",
  };
  return (
    <NeonCard variant={variant} className="flex-1">
      <div className="text-center">
        <p className={cn("text-3xl font-black", colors[variant])}>{value}</p>
        <p className="text-white text-xs font-semibold mt-1">{label}</p>
        <p className="text-slate-500 text-xs">{sub}</p>
      </div>
    </NeonCard>
  );
}

function DashboardTab({
  totalWorkers,
  activeWorkers,
  totalTasks,
  completedTasks,
  logs,
}: {
  totalWorkers: number;
  activeWorkers: number;
  totalTasks: number;
  completedTasks: number;
  logs: LogEntry[];
}) {
  return (
    <div className="p-4 flex flex-col gap-4">
      <div>
        <h2 className="text-white font-black text-xl">Admin Dashboard</h2>
        <p className="text-slate-500 text-sm">Overview of your team</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Total Workers"
          value={totalWorkers}
          sub="Team members"
          variant="purple"
        />
        <StatCard
          label="Active Now"
          value={activeWorkers}
          sub="Online"
          variant="green"
        />
        <StatCard
          label="Total Tasks"
          value={totalTasks}
          sub="All time"
          variant="blue"
        />
        <StatCard
          label="Completed"
          value={completedTasks}
          sub="Tasks done"
          variant="cyan"
        />
      </div>
      <NeonCard
        variant="purple"
        title="Recent Activity"
        titleIcon={<TrendingUp size={14} />}
      >
        {logs.slice(0, 5).map((log, i) => (
          <div
            key={log.id}
            className={cn(
              "flex items-start gap-3 py-2",
              i !== 0 && "border-t border-slate-800",
            )}
            data-ocid={`logs.item.${i + 1}`}
          >
            <div className="w-8 h-8 rounded-full bg-purple-950/60 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
              <Activity size={12} className="text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold">{log.action}</p>
              <p className="text-slate-500 text-xs truncate">{log.details}</p>
              <p className="text-slate-600 text-xs">
                {new Date(log.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
        {logs.length === 0 && (
          <p className="text-slate-600 text-sm">No activity yet.</p>
        )}
      </NeonCard>
    </div>
  );
}

function TeamTab({
  workers,
  users,
  onAdd,
  onEdit,
  onDelete,
  onToggleBlock,
  onChat,
}: {
  workers: Worker[];
  users: User[];
  onAdd: () => void;
  onEdit: (w: Worker) => void;
  onDelete: (id: string) => void;
  onToggleBlock: (w: Worker) => void;
  onChat: (u: User) => void;
}) {
  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-black text-xl">Team</h2>
          <p className="text-slate-500 text-sm">{workers.length} members</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold neon-purple hover:bg-purple-500 transition-all"
          data-ocid="team.add_worker.button"
        >
          <Plus size={16} /> Add Worker
        </button>
      </div>
      {workers.length === 0 && (
        <div
          className="text-center py-12 text-slate-600"
          data-ocid="team.empty_state"
        >
          <Users size={32} className="mx-auto mb-2 opacity-40" />
          <p>No workers yet.</p>
        </div>
      )}
      {workers.map((w, i) => {
        const user = users.find((u) => u.idCode === w.idCode);
        return (
          <NeonCard
            key={w.id}
            variant="purple"
            data-ocid={`team.item.${i + 1}`}
          >
            <div className="flex items-start gap-3">
              <UserAvatar name={w.name} role={w.role} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-bold text-sm">{w.name}</p>
                  {w.isBlocked && (
                    <span className="text-xs text-red-400 bg-red-950/60 px-2 py-0.5 rounded-full">
                      Blocked
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-xs">
                  {w.role} · {w.idCode}
                </p>
                <p className="text-slate-600 text-xs font-mono">
                  {maskPhone(w.phone)}
                </p>
                <StatusBadge
                  status={user?.status ?? w.status}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              <button
                type="button"
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-blue-950/60 border border-blue-500/30 text-blue-300 text-xs font-semibold hover:bg-blue-900/60 transition-colors"
                data-ocid={`team.call.button.${i + 1}`}
              >
                <Phone size={12} /> Call
              </button>
              <button
                type="button"
                onClick={() => user && onChat(user)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold hover:bg-cyan-900/60 transition-colors"
                data-ocid={`team.chat.button.${i + 1}`}
              >
                <MessageSquare size={12} /> Chat
              </button>
              <button
                type="button"
                onClick={() => onEdit(w)}
                className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors"
                data-ocid={`team.edit_button.${i + 1}`}
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={() => onToggleBlock(w)}
                className={cn(
                  "p-1.5 rounded-lg border transition-colors",
                  w.isBlocked
                    ? "bg-green-950/60 border-green-500/30 text-green-400"
                    : "bg-pink-950/60 border-pink-500/30 text-pink-400",
                )}
                data-ocid={`team.block.button.${i + 1}`}
              >
                {w.isBlocked ? <ShieldCheck size={14} /> : <Ban size={14} />}
              </button>
              <button
                type="button"
                onClick={() => onDelete(w.id)}
                className="p-1.5 rounded-lg bg-red-950/60 border border-red-500/30 text-red-400 hover:bg-red-900/60 transition-colors"
                data-ocid={`team.delete_button.${i + 1}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </NeonCard>
        );
      })}
    </div>
  );
}

function TasksTab({
  tasks,
  workers,
  onAddTask,
  onUpdateStatus,
}: {
  tasks: Task[];
  workers: Worker[];
  onAddTask: () => void;
  onUpdateStatus: (id: string, status: Task["status"]) => void;
}) {
  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-black text-xl">Tasks</h2>
          <p className="text-slate-500 text-sm">{tasks.length} total</p>
        </div>
        <button
          type="button"
          onClick={onAddTask}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold neon-blue hover:bg-blue-500 transition-all"
          data-ocid="tasks.add.button"
        >
          <Plus size={16} /> Assign Task
        </button>
      </div>
      {tasks.length === 0 && (
        <div
          className="text-center py-12 text-slate-600"
          data-ocid="tasks.empty_state"
        >
          <ClipboardList size={32} className="mx-auto mb-2 opacity-40" />
          <p>No tasks yet.</p>
        </div>
      )}
      {tasks.map((t, i) => (
        <NeonCard key={t.id} variant="blue" data-ocid={`tasks.item.${i + 1}`}>
          <div className="flex items-start gap-3">
            <CheckCircle2
              size={18}
              className={cn(
                "mt-0.5 flex-shrink-0",
                STATUS_COLORS[t.status] ?? "text-slate-400",
              )}
            />
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">{t.title}</p>
              <p className="text-slate-500 text-xs mt-0.5">{t.description}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <StatusBadge status={t.status} />
                <span className="text-slate-600 text-xs">
                  {t.assignedToName}
                </span>
                <span className="text-slate-700 text-xs">
                  {fmtDate(t.date)}
                </span>
              </div>
              {t.pickupLocation && (
                <p className="text-slate-600 text-xs mt-1">
                  📦 {t.pickupLocation} → {t.dropLocation}
                </p>
              )}
            </div>
          </div>
          {t.status !== "completed" && t.status !== "rejected" && (
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => onUpdateStatus(t.id, "completed")}
                className="flex-1 py-1.5 rounded-lg bg-green-950/60 border border-green-500/30 text-green-300 text-xs font-semibold hover:bg-green-900/60 transition-colors"
                data-ocid={`tasks.complete.button.${i + 1}`}
              >
                Complete
              </button>
              <button
                type="button"
                onClick={() => onUpdateStatus(t.id, "rejected")}
                className="flex-1 py-1.5 rounded-lg bg-red-950/60 border border-red-500/30 text-red-300 text-xs font-semibold hover:bg-red-900/60 transition-colors"
                data-ocid={`tasks.reject.button.${i + 1}`}
              >
                Cancel
              </button>
            </div>
          )}
        </NeonCard>
      ))}
      {/* Assigning to track usage */}
      {workers.length === 0 && <span className="hidden" />}
    </div>
  );
}

function MapTab({
  locations,
  workers,
}: {
  locations: {
    userId: string;
    latitude: number;
    longitude: number;
    isSharing: boolean;
    timestamp: number;
  }[];
  workers: Worker[];
}) {
  const sharingLocs = locations.filter((l) => l.isSharing);
  const dotColors = ["#a855f7", "#22d3ee", "#3b82f6", "#f472b6"];
  return (
    <div className="p-4 flex flex-col gap-4">
      <div>
        <h2 className="text-white font-black text-xl">Live Map</h2>
        <p className="text-slate-500 text-sm">
          {sharingLocs.length} location(s) active
        </p>
      </div>
      <NeonCard
        variant="cyan"
        title="Team Locations"
        titleIcon={<MapPin size={14} />}
      >
        <div
          className="relative bg-slate-900 rounded-xl overflow-hidden"
          style={{ height: 260 }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 300 240"
            className="absolute inset-0"
            role="img"
            aria-label="Live team location map"
          >
            {[0, 1, 2, 3, 4].map((r) => (
              <line
                key={`h${r}`}
                x1="0"
                y1={r * 60}
                x2="300"
                y2={r * 60}
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="1"
              />
            ))}
            {[0, 1, 2, 3, 4, 5].map((c) => (
              <line
                key={`v${c}`}
                x1={c * 60}
                y1="0"
                x2={c * 60}
                y2="240"
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="1"
              />
            ))}
            <line
              x1="0"
              y1="120"
              x2="300"
              y2="120"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="2"
            />
            <line
              x1="150"
              y1="0"
              x2="150"
              y2="240"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="2"
            />
            {[
              [30, 30],
              [90, 30],
              [210, 30],
              [270, 30],
              [30, 150],
              [90, 150],
              [210, 150],
              [270, 150],
            ].map(([x, y]) => (
              <rect
                key={`${x}-${y}`}
                x={x}
                y={y}
                width="40"
                height="50"
                fill="rgba(255,255,255,0.03)"
                rx="3"
              />
            ))}
            {sharingLocs.map((loc, i) => {
              const wk = workers.find((w) => w.idCode === loc.userId);
              const color = dotColors[i % dotColors.length];
              const x = 60 + ((i * 80) % 180);
              const y = 80 + ((i * 60) % 80);
              return (
                <g key={loc.userId}>
                  <circle
                    cx={x}
                    cy={y}
                    r="12"
                    fill={color}
                    fillOpacity="0.15"
                  />
                  <circle cx={x} cy={y} r="6" fill={color} fillOpacity="0.9" />
                  <circle cx={x} cy={y} r="3" fill="white" />
                  <text
                    x={x}
                    y={y - 16}
                    textAnchor="middle"
                    fill="white"
                    fontSize="9"
                    fontWeight="600"
                  >
                    {wk?.name ?? loc.userId}
                  </text>
                </g>
              );
            })}
            {sharingLocs.length === 0 && (
              <text
                x="150"
                y="125"
                textAnchor="middle"
                fill="rgba(255,255,255,0.2)"
                fontSize="12"
              >
                No active locations
              </text>
            )}
          </svg>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {sharingLocs.map((loc) => {
            const wk = workers.find((x) => x.idCode === loc.userId);
            return (
              <div key={loc.userId} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-cyan-400 status-online-dot" />
                <span className="text-white font-medium">
                  {wk?.name ?? loc.userId}
                </span>
                <span className="text-slate-500">
                  {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                </span>
                <span className="text-slate-600 ml-auto">
                  {new Date(loc.timestamp).toLocaleTimeString()}
                </span>
              </div>
            );
          })}
        </div>
      </NeonCard>
    </div>
  );
}

function ChatListTab({
  workers,
  users,
  session,
  onOpenChat,
}: {
  workers: Worker[];
  users: User[];
  session: Session;
  onOpenChat: (u: User) => void;
}) {
  const messages: {
    senderId: string;
    receiverId: string;
    content: string;
    timestamp: number;
  }[] = JSON.parse(localStorage.getItem("workersync_messages") ?? "[]");

  function getLastMsg(peerId: string) {
    return messages
      .filter(
        (m) =>
          (m.senderId === session.idCode && m.receiverId === peerId) ||
          (m.senderId === peerId && m.receiverId === session.idCode),
      )
      .sort((a, b) => b.timestamp - a.timestamp)[0];
  }

  return (
    <div className="p-4 flex flex-col gap-3">
      <h2 className="text-white font-black text-xl">Chats</h2>
      {workers.map((w, i) => {
        const user = users.find((u) => u.idCode === w.idCode);
        const lastMsg = getLastMsg(w.idCode);
        if (!user) return null;
        return (
          <button
            type="button"
            key={w.id}
            onClick={() => onOpenChat(user)}
            className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-pink-500/30 hover:bg-pink-950/10 transition-all text-left w-full"
            data-ocid={`chat.item.${i + 1}`}
          >
            <UserAvatar name={w.name} role={w.role} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-white font-semibold text-sm">{w.name}</p>
                {lastMsg && (
                  <span className="text-slate-600 text-xs">
                    {new Date(lastMsg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-xs truncate mt-0.5">
                {lastMsg?.content ?? "No messages yet"}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function LogsTab({ logs }: { logs: LogEntry[] }) {
  const ICONS: Record<string, React.ReactNode> = {
    "Task Created": <ClipboardList size={12} className="text-blue-400" />,
    "Task Accepted": <CheckCircle2 size={12} className="text-green-400" />,
    "Location Shared": <MapPin size={12} className="text-cyan-400" />,
    "Message Sent": <MessageSquare size={12} className="text-pink-400" />,
    "Status Changed": <Clock size={12} className="text-amber-400" />,
  };
  return (
    <div className="p-4 flex flex-col gap-3">
      <h2 className="text-white font-black text-xl">Activity Log</h2>
      {logs.map((log, i) => (
        <div
          key={log.id}
          className="flex items-start gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800"
          data-ocid={`logs.item.${i + 1}`}
        >
          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
            {ICONS[log.action] ?? (
              <Activity size={12} className="text-slate-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-white text-xs font-semibold">{log.action}</p>
              <span className="text-slate-600 text-xs">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-slate-500 text-xs">{log.details}</p>
            <p className="text-purple-400/60 text-xs">by {log.userName}</p>
          </div>
        </div>
      ))}
      {logs.length === 0 && (
        <div
          className="text-center py-12 text-slate-600"
          data-ocid="logs.empty_state"
        >
          <Activity size={32} className="mx-auto mb-2 opacity-40" />
          <p>No activity logged yet.</p>
        </div>
      )}
    </div>
  );
}
