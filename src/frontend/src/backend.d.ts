import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Location {
    latitude: bigint;
    isSharing: boolean;
    longitude: bigint;
    timestamp: bigint;
}
export interface Task {
    id: string;
    status: Status;
    title: string;
    assignedBy: Principal;
    assignedTo: Principal;
    date: bigint;
    description: string;
    dropLocation: string;
    pickupLocation: string;
}
export interface Profile {
    id: string;
    status: Status__1;
    name: string;
    role: Role;
    lastSeen: bigint;
}
export interface RegisterUserInput {
    id: string;
    name: string;
    role: Role;
}
export interface LogEntry {
    id: string;
    action: string;
    userId: Principal;
    timestamp: bigint;
    details: string;
}
export interface Message {
    id: string;
    content: string;
    sender: Principal;
    messageType: MessageType;
    timestamp: bigint;
    receiver: Principal;
    fileUrl?: ExternalBlob;
}
export enum MessageType {
    text = "text",
    document_ = "document",
    image = "image"
}
export enum Role {
    owner = "owner",
    worker = "worker",
    driver = "driver"
}
export enum Status {
    pending = "pending",
    completed = "completed",
    rejected = "rejected",
    accepted = "accepted",
    inProgress = "inProgress"
}
export enum Status__1 {
    offline = "offline",
    online = "online"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addLog(action: string, details: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    broadcastMessage(receivers: Array<Principal>, content: string, messageType: MessageType, fileUrl: ExternalBlob | null): Promise<void>;
    createTask(taskInput: Task): Promise<string>;
    deleteFile(fileId: string): Promise<void>;
    getActiveWorkerCount(): Promise<bigint>;
    getAllLogs(): Promise<Array<LogEntry>>;
    getAllTasks(): Promise<Array<Task>>;
    getCallerUserProfile(): Promise<Profile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getFiles(fileType: MessageType): Promise<Array<Message>>;
    getMessagesWithUser(user: Principal): Promise<Array<Message>>;
    getMyTasks(): Promise<Array<Task>>;
    getTask(taskId: string): Promise<Task>;
    getTaskStats(): Promise<{
        total: bigint;
        pending: bigint;
        completed: bigint;
        inProgress: bigint;
    }>;
    getUser(user: Principal): Promise<Profile>;
    getUserLocation(user: Principal): Promise<Location>;
    getUserLogs(user: Principal): Promise<Array<LogEntry>>;
    getUserProfile(user: Principal): Promise<Profile | null>;
    isCallerAdmin(): Promise<boolean>;
    registerUser(user: RegisterUserInput): Promise<void>;
    saveCallerUserProfile(profile: Profile): Promise<void>;
    sendMessage(receiver: Principal, content: string, messageType: MessageType, fileUrl: ExternalBlob | null): Promise<void>;
    toggleLocationSharing(isSharing: boolean): Promise<void>;
    updateMyLocation(latitude: bigint, longitude: bigint): Promise<void>;
    updateMyStatus(status: Status__1): Promise<void>;
    updateTaskStatus(taskId: string, newStatus: Status): Promise<void>;
    uploadFile(name: string, fileType: string, fileReference: ExternalBlob): Promise<void>;
}
