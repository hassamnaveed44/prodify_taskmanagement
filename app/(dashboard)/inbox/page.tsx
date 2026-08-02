"use client";

import { useState, useEffect, useRef } from "react";
import { Inbox, Send, Search, Loader2, MessageSquare, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

interface Team {
  id: string;
  name: string;
}

interface UserDM {
  id: string;
  name: string;
  email: string;
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
  const [users, setUsers] = useState<UserDM[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [activeDmUserId, setActiveDmUserId] = useState<string | null>(null);
  
  const [currentUserMemberId, setCurrentUserMemberId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState("Teammate");
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Real-time WebSocket connection state
  const [wsStatus, setWsStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");

  // Real-time typing indicators state
  const [activeTypers, setActiveTypers] = useState<Record<string, string>>({});
  const [isCurrentlyTyping, setIsCurrentlyTyping] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch chat datasets
  const fetchInboxData = async (options?: { teamId?: string; dmUserId?: string }) => {
    try {
      let url = "/api/inbox";
      if (options?.teamId) {
        url = `/api/inbox?teamId=${options.teamId}`;
      } else if (options?.dmUserId) {
        url = `/api/inbox?dmUserId=${options.dmUserId}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams || []);
        setUsers(data.users || []);
        setMessages(data.messages || []);
        setActiveTeamId(data.activeTeamId || null);
        setActiveDmUserId(data.activeDmUserId || null);
        setCurrentUserMemberId(data.currentUserMemberId);
        setCurrentUserId(data.currentUserId || null);
        setWorkspaceId(data.workspaceId || null);
        if (data.currentUserName) {
          setCurrentUserName(data.currentUserName);
        }
      }
    } catch (err) {
      console.error("Failed to load chat data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInboxData();
  }, []);

  // Set up WebSocket Connection
  useEffect(() => {
    // We need currentUserId to properly register join scopes
    const joinUserId = currentUserId || currentUserMemberId;
    if (!joinUserId) return;

    setWsStatus("connecting");
    setActiveTypers({}); // Clear active typers on switch

    // Establish WebSocket Connection using appropriate secure protocol
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//${window.location.hostname}:3001`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("Connected to Real-time Chat WebSockets");
      setWsStatus("connected");
      
      // Register client to this specific team/workspace room scope
      socket.send(
        JSON.stringify({
          type: "join",
          teamId: activeTeamId || "",
          workspaceId: workspaceId || "",
          userId: joinUserId,
        })
      );
    };

    socket.onmessage = (event) => {
      try {
        const packet = JSON.parse(event.data);
        
        // Handle channel message broadcasts
        if (packet.type === "message" && activeTeamId && packet.message.teamId === activeTeamId) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === packet.message.id)) return prev;
            return [...prev, packet.message];
          });
        } 
        
        // Handle direct message broadcasts
        else if (packet.type === "dm" && activeDmUserId) {
          const isRelevant = 
            (packet.message.senderId === activeDmUserId && packet.message.receiverId === joinUserId) ||
            (packet.message.senderId === joinUserId && packet.message.receiverId === activeDmUserId);

          if (isRelevant) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === packet.message.id)) return prev;
              // Format to matches UI structures
              return [...prev, {
                id: packet.message.id,
                teamId: "",
                authorId: packet.message.senderId,
                content: packet.message.content,
                createdAt: packet.message.createdAt,
                authorName: packet.message.authorName,
                authorInitials: packet.message.authorInitials,
                authorColor: packet.message.authorColor,
              }];
            });
          }
        } 
        
        // Handle channel typing indicator updates
        else if (packet.type === "typing" && activeTeamId && packet.teamId === activeTeamId) {
          if (packet.isTyping) {
            setActiveTypers((prev) => ({
              ...prev,
              [packet.authorId]: packet.authorName,
            }));
          } else {
            setActiveTypers((prev) => {
              const updated = { ...prev };
              delete updated[packet.authorId];
              return updated;
            });
          }
        }

        // Handle DM typing indicator updates
        else if (packet.type === "dm-typing" && activeDmUserId && packet.senderId === activeDmUserId) {
          if (packet.isTyping) {
            setActiveTypers((prev) => ({
              ...prev,
              [packet.senderId]: packet.senderName,
            }));
          } else {
            setActiveTypers((prev) => {
              const updated = { ...prev };
              delete updated[packet.senderId];
              return updated;
            });
          }
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
  }, [activeTeamId, activeDmUserId, workspaceId, currentUserId, currentUserMemberId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle Team channel switch
  const handleTeamSelect = (teamId: string) => {
    if (teamId === activeTeamId) return;
    setLoading(true);
    fetchInboxData({ teamId });
  };

  // Handle DM partner switch
  const handleDmSelect = (dmUserId: string) => {
    if (dmUserId === activeDmUserId) return;
    setLoading(true);
    fetchInboxData({ dmUserId });
  };

  // Handle Input Changes & Typing Indicator Broadcasts
  const handleInputChange = (val: string) => {
    setNewMessage(val);

    const senderId = currentUserId || currentUserMemberId;
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && senderId) {
      
      // Determine typing properties
      const isDm = activeDmUserId !== null;
      const type = isDm ? "dm-typing" : "typing";
      const payload: any = {
        type,
        senderId,
        senderName: currentUserName,
        isTyping: true,
      };

      if (isDm) {
        payload.receiverId = activeDmUserId;
      } else {
        payload.teamId = activeTeamId;
        payload.authorId = currentUserMemberId;
        payload.authorName = currentUserName;
      }

      // Trigger "Typing Started"
      if (!isCurrentlyTyping) {
        setIsCurrentlyTyping(true);
        socketRef.current.send(JSON.stringify(payload));
      }

      // Debounce "Typing Stopped" (1.8s delay)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsCurrentlyTyping(false);
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          payload.isTyping = false;
          socketRef.current.send(JSON.stringify(payload));
        }
      }, 1800);
    }
  };

  // Handle send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const senderId = currentUserId || currentUserMemberId;
    if (!newMessage.trim() || !senderId || (!activeTeamId && !activeDmUserId)) return;

    const contentToSend = newMessage.trim();
    setNewMessage(""); // Clear immediately for snappy UX

    // Clear typing timeout and broadcast typing stopped
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setIsCurrentlyTyping(false);
    
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const isDm = activeDmUserId !== null;
      const payload: any = {
        type: isDm ? "dm-typing" : "typing",
        senderId,
        senderName: currentUserName,
        isTyping: false,
      };

      if (isDm) {
        payload.receiverId = activeDmUserId;
      } else {
        payload.teamId = activeTeamId;
        payload.authorId = currentUserMemberId;
        payload.authorName = currentUserName;
      }

      socketRef.current.send(JSON.stringify(payload));
    }

    try {
      // Send message via HTTP REST endpoint first (guarantees saving to PostgreSQL)
      const postBody: any = { content: contentToSend };
      if (activeDmUserId) {
        postBody.receiverId = activeDmUserId;
      } else {
        postBody.teamId = activeTeamId;
      }

      const res = await fetch("/api/inbox/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postBody),
      });

      if (res.ok) {
        const data = await res.json();
        // Add to our local state if not already there
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      } else {
        throw new Error("Failed to deliver message.");
      }
    } catch (err) {
      console.error(err);
      setNewMessage(contentToSend);
      alert("Failed to deliver message. Please check your network connection.");
    }
  };

  if (loading && teams.length === 0 && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm min-h-[500px]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-650" />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Syncing real-time workspace inbox...</p>
      </div>
    );
  }

  const activeTeamName = activeDmUserId 
    ? (users.find(u => u.id === activeDmUserId)?.name || "Direct Message")
    : (teams.find((t) => t.id === activeTeamId)?.name || "Group Chat");
  
  const activeInitials = activeTeamName.split(/\s+/).map((n) => n[0]).join("").toUpperCase().substring(0, 2);
  const typersList = Object.values(activeTypers);

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-0 shadow-sm flex h-[calc(100vh-180px)] overflow-hidden animate-fade-in select-none">
      
      {/* Chats & DMs Directories (Left Pane) */}
      <div className="w-80 border-r border-slate-100 flex flex-col shrink-0">
        
        {/* Search */}
        <div className="p-4 border-b border-slate-100 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-655 focus:outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Scroll List container */}
        <div className="flex-1 overflow-y-auto py-2 space-y-4">
          
          {/* Section 1: Team Channels */}
          {teams.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 mb-2">Team Channels</p>
              {teams.map((team) => {
                const isSelected = team.id === activeTeamId && activeDmUserId === null;
                const initials = team.name.split(/\s+/).map((n) => n[0]).join("").toUpperCase().substring(0, 2);

                return (
                  <div
                    key={team.id}
                    onClick={() => handleTeamSelect(team.id)}
                    className={cn(
                      "mx-2 px-3 py-2 cursor-pointer hover:bg-slate-50/50 flex gap-2.5 rounded-xl transition-all text-left items-center",
                      isSelected ? "bg-indigo-50/50 border-l-4 border-indigo-650" : ""
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-lg text-indigo-700 font-extrabold flex items-center justify-center shrink-0 text-[10px]",
                      isSelected ? "bg-indigo-100" : "bg-slate-50"
                    )}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={cn("text-xs font-bold truncate", isSelected ? "text-indigo-700" : "text-slate-700")}>
                        {team.name}
                      </h4>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Section 2: Direct Messages (DMs) */}
          {users.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 mb-2">Direct Messages (DMs)</p>
              {users.map((dmUser) => {
                const isSelected = dmUser.id === activeDmUserId;
                const initials = dmUser.name.split(/\s+/).map((n) => n[0]).join("").toUpperCase().substring(0, 2);

                return (
                  <div
                    key={dmUser.id}
                    onClick={() => handleDmSelect(dmUser.id)}
                    className={cn(
                      "mx-2 px-3 py-2 cursor-pointer hover:bg-slate-50/50 flex gap-2.5 rounded-xl transition-all text-left items-center",
                      isSelected ? "bg-indigo-50/50 border-l-4 border-indigo-650" : ""
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-full text-indigo-700 font-extrabold flex items-center justify-center shrink-0 text-[10px] relative",
                      isSelected ? "bg-indigo-100" : "bg-indigo-50/30"
                    )}>
                      {initials}
                      <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full ring-1 ring-white"></span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={cn("text-xs font-bold truncate", isSelected ? "text-indigo-700" : "text-slate-750")}>
                        {dmUser.name}
                      </h4>
                      <p className="text-[9px] text-slate-400 truncate font-semibold mt-0.5">{dmUser.email}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat Container (Right Pane) */}
      <div className="flex-1 flex flex-col bg-slate-50/10">
        
        {/* Active Header */}
        <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center">
              {activeInitials}
            </div>
            <div className="text-left">
              <h4 className="text-xs font-extrabold text-slate-855 leading-tight">{activeTeamName}</h4>
              
              {/* Dynamic WebSocket Connection Status */}
              {wsStatus === "connected" ? (
                <p className="text-[10px] text-emerald-500 font-bold tracking-wide mt-0.5 animate-pulse">● Connected (Live)</p>
              ) : wsStatus === "connecting" ? (
                <p className="text-[10px] text-amber-500 font-bold tracking-wide mt-0.5 animate-pulse">● Connecting...</p>
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
              const checkId = currentUserId || currentUserMemberId;
              const isMine = msg.authorId === checkId;
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

          {/* Typing Indicator Display bubble */}
          {typersList.length > 0 && (
            <div className="flex gap-2.5 items-center text-slate-405 text-[10px] font-bold pl-12 py-1.5 animate-pulse text-left">
              <div className="flex gap-1 shrink-0">
                <span className="w-1.5 h-1.5 bg-indigo-550 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-1.5 h-1.5 bg-indigo-550 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-1.5 h-1.5 bg-indigo-550 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
              <span className="italic">{typersList.join(", ")} {typersList.length === 1 ? "is" : "are"} typing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Bar */}
        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-3">
          <input
            type="text"
            required
            value={newMessage}
            onChange={(e) => handleInputChange(e.target.value)}
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
