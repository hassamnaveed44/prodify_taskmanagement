"use client";

import { useState, useEffect, useRef } from "react";
import { Inbox, Send, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Team {
  id: string;
  name: string;
}

interface ChatMessage {
  id: string;
  teamId: string;
  authorId: string;
  content: string;
  createdAt: string;
  authorName: string;
  authorInitials: string;
  authorColor: string;
}

export default function InboxPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [currentUserMemberId, setCurrentUserMemberId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Real-time WebSocket connection state
  const [wsStatus, setWsStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");

  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch initial chat datasets
  const fetchInboxData = async (teamId?: string) => {
    try {
      const url = teamId ? `/api/inbox?teamId=${teamId}` : "/api/inbox";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams);
        setMessages(data.messages);
        setActiveTeamId(data.activeTeamId);
        setCurrentUserMemberId(data.currentUserMemberId);
      }
    } catch (err) {
      console.error("Failed to load chat workspace channels:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInboxData();
  }, []);

  // Set up WebSocket Connection
  useEffect(() => {
    if (!activeTeamId) return;

    setWsStatus("connecting");

    // Establish WebSocket Connection using appropriate secure protocol
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//${window.location.host}/api/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("Connected to Real-time Chat WebSockets");
      setWsStatus("connected");
    };

    socket.onmessage = (event) => {
      try {
        const packet = JSON.parse(event.data);
        if (packet.type === "message" && packet.message.teamId === activeTeamId) {
          // Add new incoming message to state
          setMessages((prev) => {
            // Deduplicate (e.g. if the message was already added by our local REST POST response)
            if (prev.some((m) => m.id === packet.message.id)) return prev;
            return [...prev, packet.message];
          });
        }
      } catch (err) {
        console.error("Failed to parse incoming WebSocket message:", err);
      }
    };

    socket.onclose = () => {
      console.log("Disconnected from Chat WebSockets");
      setWsStatus("disconnected");
    };

    socket.onerror = () => {
      console.warn("Error in Chat WebSocket connection");
      setWsStatus("disconnected");
    };

    socketRef.current = socket;

    return () => {
      socket.close();
    };
  }, [activeTeamId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle Team channel switch
  const handleTeamSelect = (teamId: string) => {
    if (teamId === activeTeamId) return;
    setLoading(true);
    fetchInboxData(teamId);
  };

  // Handle send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeTeamId || !currentUserMemberId) return;

    const contentToSend = newMessage.trim();
    setNewMessage(""); // Clear immediately for snappy UX

    try {
      // Send message via HTTP REST endpoint first (guarantees saving to PostgreSQL)
      const res = await fetch("/api/inbox/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: activeTeamId,
          content: contentToSend,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Optimistically add to our local state if not already there
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      } else {
        throw new Error("Failed to deliver message.");
      }
    } catch (err) {
      console.error(err);
      // Restore input text on error
      setNewMessage(contentToSend);
      alert("Failed to deliver message. Please check your network connection.");
    }
  };

  if (loading && teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm min-h-[500px]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-650" />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Syncing real-time workspace inbox...</p>
      </div>
    );
  }

  const activeTeamName = teams.find((t) => t.id === activeTeamId)?.name || "Group Chat";

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-0 shadow-sm flex h-[calc(100vh-180px)] overflow-hidden animate-fade-in select-none">
      
      {/* Chats List Pane (Left) */}
      <div className="w-80 border-r border-slate-100 flex flex-col shrink-0">
        {/* Search */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search channels..."
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-655 focus:outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Channels list scroll */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {teams.map((team) => {
            const isSelected = team.id === activeTeamId;
            // Get initials
            const initials = team.name.split(/\s+/).map((n) => n[0]).join("").toUpperCase().substring(0, 2);

            return (
              <div
                key={team.id}
                onClick={() => handleTeamSelect(team.id)}
                className={cn(
                  "p-4 cursor-pointer hover:bg-slate-50/50 flex gap-3 transition-colors text-left",
                  isSelected ? "bg-slate-50/70 border-l-4 border-indigo-650" : ""
                )}
              >
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 font-extrabold flex items-center justify-center shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0 self-center">
                  <h4 className="text-xs font-bold text-slate-800 truncate">{team.name}</h4>
                  <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">Real-time team channel</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Container (Right) */}
      <div className="flex-1 flex flex-col bg-slate-50/10">
        
        {/* Active Header */}
        <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center">
              {activeTeamName.split(/\s+/).map((n) => n[0]).join("").toUpperCase().substring(0, 2)}
            </div>
            <div className="text-left">
              <h4 className="text-xs font-extrabold text-slate-850 leading-tight">{activeTeamName}</h4>
              
              {/* Dynamic WebSocket Connection Status */}
              {wsStatus === "connected" ? (
                <p className="text-[10px] text-emerald-500 font-bold tracking-wide mt-0.5 animate-pulse">● Connected (Live)</p>
              ) : wsStatus === "connecting" ? (
                <p className="text-[10px] text-amber-500 font-bold tracking-wide mt-0.5">● Connecting...</p>
              ) : (
                <p className="text-[10px] text-slate-400 font-bold tracking-wide mt-0.5">● Connected (REST Fallback)</p>
              )}
            </div>
          </div>
        </div>

        {/* Messages Pane */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-slate-350 text-xs italic py-12">
              No messages sent yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.authorId === currentUserMemberId;
              const formattedTime = new Date(msg.createdAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div 
                  key={msg.id} 
                  className={cn(
                    "flex gap-3 max-w-xl animate-fade-in text-left",
                    isMine ? "ml-auto flex-row-reverse" : ""
                  )}
                >
                  {/* Author Avatar */}
                  <div className={cn(
                    "w-8 h-8 rounded-full text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs select-none", 
                    msg.authorColor
                  )}>
                    {msg.authorInitials}
                  </div>
                  
                  {/* Message bubble */}
                  <div className={cn(
                    "rounded-3xl p-3.5 shadow-xs border relative",
                    isMine 
                      ? "bg-indigo-600 text-white border-indigo-500 rounded-tr-none" 
                      : "bg-white text-slate-700 border-slate-100 rounded-tl-none"
                  )}>
                    {!isMine && (
                      <span className="text-[9px] font-extrabold text-indigo-655 block mb-0.5">
                        {msg.authorName}
                      </span>
                    )}
                    <p className="text-xs font-semibold leading-relaxed break-words whitespace-pre-wrap select-text">
                      {msg.content}
                    </p>
                    <span className={cn(
                      "text-[9px] font-bold block mt-1",
                      isMine ? "text-indigo-200 text-right" : "text-slate-400 text-left"
                    )}>
                      {formattedTime}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Bar */}
        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-3">
          <input
            type="text"
            required
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message ${activeTeamName}...`}
            className="flex-1 bg-slate-55 border border-slate-100 rounded-xl px-4 py-2.5 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500"
          />
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
