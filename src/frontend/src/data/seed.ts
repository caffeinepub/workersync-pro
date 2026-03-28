import type {
  LocationData,
  LogEntry,
  Message,
  Task,
  User,
  Worker,
} from "../types";

const SEED_KEY = "workersync_seeded";

export function initSeedData() {
  if (localStorage.getItem(SEED_KEY)) return;

  const users: User[] = [
    {
      userId: "u1",
      name: "Ahmad",
      role: "Owner",
      idCode: "OWN001",
      status: "online",
      lastSeen: Date.now(),
    },
    {
      userId: "u2",
      name: "Marcus",
      role: "Worker",
      idCode: "WRK001",
      status: "online",
      lastSeen: Date.now(),
    },
    {
      userId: "u3",
      name: "Sarah",
      role: "Worker",
      idCode: "WRK002",
      status: "offline",
      lastSeen: Date.now() - 3600000,
    },
    {
      userId: "u4",
      name: "Jake",
      role: "Driver",
      idCode: "DRV001",
      status: "online",
      lastSeen: Date.now(),
    },
  ];

  const workers: Worker[] = [
    {
      id: "w1",
      name: "Marcus",
      phone: "555-123-4567",
      role: "Worker",
      status: "online",
      idCode: "WRK001",
      isBlocked: false,
    },
    {
      id: "w2",
      name: "Sarah",
      phone: "555-234-5678",
      role: "Worker",
      status: "offline",
      idCode: "WRK002",
      isBlocked: false,
    },
    {
      id: "w3",
      name: "Jake",
      phone: "555-345-6789",
      role: "Driver",
      status: "online",
      idCode: "DRV001",
      isBlocked: false,
    },
  ];

  const tasks: Task[] = [
    {
      id: "t1",
      title: "Warehouse Inventory Check",
      description: "Count and verify all items in Section A",
      assignedTo: "WRK001",
      assignedToName: "Marcus",
      status: "inProgress",
      date: Date.now() - 86400000,
      pickupLocation: "Warehouse A, Dock 3",
      dropLocation: "Office HQ",
    },
    {
      id: "t2",
      title: "Client Delivery - Downtown",
      description: "Deliver package to 123 Main St",
      assignedTo: "DRV001",
      assignedToName: "Jake",
      status: "accepted",
      date: Date.now(),
      pickupLocation: "Warehouse B",
      dropLocation: "123 Main St, Downtown",
    },
    {
      id: "t3",
      title: "Equipment Maintenance Report",
      description: "Inspect and report on forklift condition",
      assignedTo: "WRK002",
      assignedToName: "Sarah",
      status: "pending",
      date: Date.now() + 86400000,
      pickupLocation: "Depot",
      dropLocation: "Maintenance Bay",
    },
  ];

  const messages: Message[] = [
    {
      id: "m1",
      senderId: "OWN001",
      receiverId: "WRK001",
      content: "Hey Marcus, how's the inventory check going?",
      timestamp: Date.now() - 3600000,
      type: "text",
    },
    {
      id: "m2",
      senderId: "WRK001",
      receiverId: "OWN001",
      content: "Going well! About 60% done.",
      timestamp: Date.now() - 3500000,
      type: "text",
    },
    {
      id: "m3",
      senderId: "OWN001",
      receiverId: "DRV001",
      content: "Jake, the delivery is ready. Head to Warehouse B.",
      timestamp: Date.now() - 1800000,
      type: "text",
    },
    {
      id: "m4",
      senderId: "DRV001",
      receiverId: "OWN001",
      content: "On my way!",
      timestamp: Date.now() - 1700000,
      type: "text",
    },
  ];

  const locations: LocationData[] = [
    {
      userId: "WRK001",
      latitude: 40.7128,
      longitude: -74.006,
      timestamp: Date.now(),
      isSharing: true,
    },
    {
      userId: "DRV001",
      latitude: 40.7158,
      longitude: -74.012,
      timestamp: Date.now(),
      isSharing: true,
    },
  ];

  const logs: LogEntry[] = [
    {
      id: "l1",
      userId: "OWN001",
      userName: "Ahmad",
      action: "Task Created",
      details: "Created task: Warehouse Inventory Check",
      timestamp: Date.now() - 86400000,
    },
    {
      id: "l2",
      userId: "WRK001",
      userName: "Marcus",
      action: "Task Accepted",
      details: "Accepted: Warehouse Inventory Check",
      timestamp: Date.now() - 82800000,
    },
    {
      id: "l3",
      userId: "DRV001",
      userName: "Jake",
      action: "Location Shared",
      details: "Started sharing live location",
      timestamp: Date.now() - 3600000,
    },
    {
      id: "l4",
      userId: "OWN001",
      userName: "Ahmad",
      action: "Message Sent",
      details: "Broadcast message to all workers",
      timestamp: Date.now() - 1800000,
    },
    {
      id: "l5",
      userId: "WRK002",
      userName: "Sarah",
      action: "Status Changed",
      details: "Went offline",
      timestamp: Date.now() - 900000,
    },
  ];

  const ids = users.map((u) => u.idCode);

  if (!localStorage.getItem("workersync_users")) {
    localStorage.setItem("workersync_users", JSON.stringify(users));
  }
  if (!localStorage.getItem("workersync_workers")) {
    localStorage.setItem("workersync_workers", JSON.stringify(workers));
  }
  if (!localStorage.getItem("workersync_tasks")) {
    localStorage.setItem("workersync_tasks", JSON.stringify(tasks));
  }
  if (!localStorage.getItem("workersync_messages")) {
    localStorage.setItem("workersync_messages", JSON.stringify(messages));
  }
  if (!localStorage.getItem("workersync_locations")) {
    localStorage.setItem("workersync_locations", JSON.stringify(locations));
  }
  if (!localStorage.getItem("workersync_logs")) {
    localStorage.setItem("workersync_logs", JSON.stringify(logs));
  }
  if (!localStorage.getItem("workersync_ids")) {
    localStorage.setItem("workersync_ids", JSON.stringify(ids));
  }
  if (!localStorage.getItem("workersync_blocked")) {
    localStorage.setItem("workersync_blocked", JSON.stringify([]));
  }

  localStorage.setItem(SEED_KEY, "true");
}
