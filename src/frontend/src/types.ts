export type Role = "Owner" | "Worker" | "Driver";

export type TaskStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "inProgress"
  | "completed";

export type UserStatus = "online" | "offline";

export interface User {
  userId: string;
  name: string;
  role: Role;
  idCode: string;
  status: UserStatus;
  lastSeen: number;
  isBlocked?: boolean;
}

export interface Worker {
  id: string;
  name: string;
  phone: string;
  role: "Worker" | "Driver";
  status: UserStatus;
  idCode: string;
  isBlocked: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // idCode
  assignedToName: string;
  status: TaskStatus;
  date: number;
  pickupLocation: string;
  dropLocation: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: number;
  type: "text" | "image" | "document";
}

export interface LocationData {
  userId: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  isSharing: boolean;
}

export interface LogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: number;
}

export interface Session {
  userId: string;
  name: string;
  role: Role;
  idCode: string;
}
