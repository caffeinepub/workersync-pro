import { cn } from "@/lib/utils";
import { ArrowLeft, Paperclip, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Message, Session, User } from "../types";
import { StatusBadge } from "./StatusBadge";
import { UserAvatar } from "./UserAvatar";

interface ChatRoomProps {
  session: Session;
  peer: User;
  onBack: () => void;
}

function getMessages(myId: string, peerId: string): Message[] {
  const all: Message[] = JSON.parse(
    localStorage.getItem("workersync_messages") ?? "[]",
  );
  return all
    .filter(
      (m) =>
        (m.senderId === myId && m.receiverId === peerId) ||
        (m.senderId === peerId && m.receiverId === myId),
    )
    .sort((a, b) => a.timestamp - b.timestamp);
}

function isBlocked(myId: string, peerId: string): boolean {
  const blocked: { blockerId: string; blockedId: string }[] = JSON.parse(
    localStorage.getItem("workersync_blocked") ?? "[]",
  );
  return blocked.some(
    (b) =>
      (b.blockerId === myId && b.blockedId === peerId) ||
      (b.blockerId === peerId && b.blockedId === myId),
  );
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChatRoom({ session, peer, onBack }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const blocked = isBlocked(session.idCode, peer.idCode);

  useEffect(() => {
    setMessages(getMessages(session.idCode, peer.idCode));
  }, [session.idCode, peer.idCode]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message count change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function sendMessage() {
    if (!text.trim() || blocked) return;
    const msg: Message = {
      id: Math.random().toString(36).slice(2),
      senderId: session.idCode,
      receiverId: peer.idCode,
      content: text.trim(),
      timestamp: Date.now(),
      type: "text",
    };
    const all: Message[] = JSON.parse(
      localStorage.getItem("workersync_messages") ?? "[]",
    );
    localStorage.setItem("workersync_messages", JSON.stringify([...all, msg]));
    setMessages((prev) => [...prev, msg]);
    setText("");
  }

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          data-ocid="chat.close_button"
        >
          <ArrowLeft size={20} />
        </button>
        <UserAvatar name={peer.name} role={peer.role} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm">{peer.name}</p>
          <StatusBadge status={peer.status} className="text-xs" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {messages.map((m) => {
          const isMine = m.senderId === session.idCode;
          return (
            <div
              key={m.id}
              className={cn(
                "flex flex-col gap-1",
                isMine ? "items-end" : "items-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[75%] px-3 py-2 rounded-2xl text-sm",
                  isMine
                    ? "bg-gradient-to-br from-purple-700 to-blue-700 text-white rounded-br-sm"
                    : "bg-slate-800 text-slate-100 rounded-bl-sm",
                )}
              >
                {m.content}
              </div>
              <span className="text-xs text-slate-600">
                {formatTime(m.timestamp)}
              </span>
            </div>
          );
        })}
        {messages.length === 0 && (
          <p className="text-center text-slate-600 text-sm mt-8">
            No messages yet. Say hello!
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      {blocked ? (
        <div className="px-4 py-4 border-t border-slate-800 text-center text-slate-500 text-sm">
          🚫 Chat is blocked
        </div>
      ) : (
        <div className="px-4 py-3 border-t border-slate-800 flex items-center gap-2 bg-slate-950">
          <button
            type="button"
            className="p-2 text-slate-500 hover:text-slate-300 transition-colors"
            data-ocid="chat.upload_button"
          >
            <Paperclip size={18} />
          </button>
          <input
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500/60 transition-colors"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            data-ocid="chat.input"
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={!text.trim()}
            className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors neon-purple"
            data-ocid="chat.submit_button"
          >
            <Send size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
