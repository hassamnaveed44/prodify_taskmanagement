"use client";

import { useState, useEffect, useRef } from "react";
import { Bot, Send, Sparkles, User, Lightbulb, Loader2, MessageSquare, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const suggestions = [
  "What should I work on next?",
  "Summarize my team's progress",
  "Show me my high-priority tasks",
  "Analyze project deadlines"
];

interface ChatMsg {
  sender: "user" | "ai";
  text: string;
}

interface ChatSessionInfo {
  id: string;
  title: string;
  createdAt: string;
}

export default function ProdifyAIPage() {
  const [sessions, setSessions] = useState<ChatSessionInfo[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch all chat sessions for the sidebar history
  const fetchSessions = async () => {
    try {
      const response = await fetch("/api/ai/sessions", { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error("Failed to load sessions:", err);
    }
  };

  // Load session list on component mount
  useEffect(() => {
    fetchSessions();
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load messages for the selected session
  const handleSessionSelect = async (sessionId: string) => {
    if (sessionId === activeSessionId || streaming) return;
    setLoading(true);
    setActiveSessionId(sessionId);
    try {
      const response = await fetch(`/api/ai/sessions/${sessionId}`, { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.session?.messages || []);
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
    } finally {
      setLoading(false);
    }
  };

  // Create a new fresh chat session
  const handleNewChat = () => {
    if (streaming) return;
    setActiveSessionId(null);
    setMessages([]);
    setInput("");
  };

  // Delete a chat session
  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (streaming) return;
    
    const confirmDelete = window.confirm("Are you sure you want to delete this chat session?");
    if (!confirmDelete) return;

    try {
      const response = await fetch(`/api/ai/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        if (activeSessionId === sessionId) {
          handleNewChat();
        }
        fetchSessions();
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = (textOverride || input).trim();
    if (!textToSend || streaming) return;

    setInput("");
    setStreaming(true);

    // Append user message and prepare empty AI response container for SSE tokens
    const initialUserMsg: ChatMsg = { sender: "user", text: textToSend };
    const initialAiMsg: ChatMsg = { sender: "ai", text: "" };

    setMessages((prev) => [...prev, initialUserMsg, initialAiMsg]);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: textToSend, sessionId: activeSessionId }),
      });

      if (!response.ok) {
        throw new Error("Failed to contact the AI assistant.");
      }

      if (!response.body) {
        throw new Error("AI response stream is unavailable.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";
      let hasReadSessionId = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          const cleanLine = line.trim();
          if (cleanLine.startsWith("data:")) {
            try {
              const dataStr = cleanLine.substring(5).trim();
              const parsed = JSON.parse(dataStr);
              
              // Handle metadata containing session ID for new chats
              if (parsed.sessionId && !hasReadSessionId) {
                hasReadSessionId = true;
                setActiveSessionId(parsed.sessionId);
                fetchSessions(); // Reload sidebar list to show the new chat item
              }

              if (parsed.text) {
                accumulatedText += parsed.text;
                // Update the last message in state
                setMessages((prev) => {
                  const next = [...prev];
                  const last = next[next.length - 1];
                  if (last && last.sender === "ai") {
                    last.text = accumulatedText;
                  }
                  return next;
                });
              } else if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
              // Ignore parser syntax issues for partial streams
            }
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.sender === "ai") {
          last.text = `⚠️ **An error occurred generating response.** ${err.message || "Please check your network and API credentials."}`;
        }
        return next;
      });
    } finally {
      setStreaming(false);
      fetchSessions(); // Refresh one more time to capture final state
    }
  };

  // Simple Markdown-to-HTML parser for formatting headers, bolding, lists, and code blocks
  const renderMessageContent = (text: string) => {
    if (!text) return null;
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Bold text (**bold**)
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    
    // Italic text (*italic*)
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    
    // Inline code blocks (`code`)
    html = html.replace(/`(.*?)`/g, "<code class='bg-slate-100 text-indigo-650 px-1.5 py-0.5 rounded font-mono text-[10px] font-bold'>$1</code>");
    
    // Bullet lists (- item)
    html = html.replace(/\n\s*[-*]\s+(.*)/g, "<li class='ml-4 list-disc pl-0.5 mt-1 font-semibold'>$1</li>");
    
    // Paragraph breaks
    html = html.replace(/\n/g, "<br />");

    return (
      <div 
        dangerouslySetInnerHTML={{ __html: html }} 
        className="text-xs font-semibold leading-relaxed space-y-1 text-slate-700 select-text" 
      />
    );
  };

  const isThinking = streaming && messages[messages.length - 1]?.text === "";

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-0 shadow-sm flex h-[calc(100vh-180px)] overflow-hidden animate-fade-in select-none">
      
      {/* 1. ChatGPT-Style Left Sidebar Panel (Chat History) */}
      <div className="w-64 border-r border-slate-100 bg-slate-50/50 flex flex-col shrink-0">
        {/* New Chat Trigger Header */}
        <div className="p-4 border-b border-slate-100 bg-white shrink-0">
          <button
            onClick={handleNewChat}
            disabled={streaming}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Chat History Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-2.5 py-2">
            Chat History
          </h5>
          {sessions.length === 0 ? (
            <p className="text-[11px] text-slate-400 font-semibold text-center py-6 px-3">
              No recent conversations.
            </p>
          ) : (
            sessions.map((s) => {
              const isActive = s.id === activeSessionId;
              return (
                <div
                  key={s.id}
                  onClick={() => handleSessionSelect(s.id)}
                  className={cn(
                    "flex items-center justify-between group p-2.5 rounded-xl cursor-pointer transition-all border border-transparent",
                    isActive
                      ? "bg-white border-slate-150 shadow-xs font-bold text-slate-800"
                      : "hover:bg-slate-100/50 text-slate-500 hover:text-slate-700"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MessageSquare className={cn("w-4 h-4 shrink-0", isActive ? "text-indigo-600" : "text-slate-400")} />
                    <span className="text-xs font-bold truncate text-left">{s.title || "Untitled Conversation"}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(e, s.id)}
                    disabled={streaming}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-650 p-1 rounded transition-all text-slate-400 cursor-pointer disabled:opacity-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Right Panel (Active Conversation Container) */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        
        {/* Active Chat Header */}
        <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-650 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>
            <div className="text-left">
              <h4 className="text-xs font-extrabold text-slate-855 leading-tight">
                {activeSessionId 
                  ? (sessions.find(s => s.id === activeSessionId)?.title || "AI Assistant Chat")
                  : "New Conversation"
                }
              </h4>
              <p className="text-[10px] text-emerald-500 font-bold tracking-wide mt-0.5 animate-pulse">
                ● Live & Streaming
              </p>
            </div>
          </div>
        </div>

        {/* Messages Dialog Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            /* Loading Transcript State */
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-650" />
              <p className="text-xs text-slate-400 font-semibold italic">Retrieving chat transcript...</p>
            </div>
          ) : messages.length === 0 ? (
            /* Empty Chat / Greeting State */
            <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-650 shadow-sm border border-indigo-100 animate-bounce">
                <Bot className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Meet your Prodify Assistant</h2>
                <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-md">
                  Ask me anything! I support both general knowledge queries and direct, real-time workspace project management analyses powered by your live database.
                </p>
              </div>

              {/* Suggestion Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-4">
                {suggestions.map((sug) => (
                  <button
                    key={sug}
                    disabled={streaming}
                    onClick={() => handleSend(sug)}
                    className="bg-slate-50 border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50/20 text-left px-4 py-3 rounded-2xl text-xs font-bold text-slate-600 hover:text-indigo-600 transition-all cursor-pointer flex items-center gap-2.5 group disabled:opacity-50"
                  >
                    <Lightbulb className="w-4 h-4 text-indigo-500 shrink-0 group-hover:animate-pulse" />
                    <span>{sug}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Chat Dialog List */
            <div className="space-y-5">
              {messages.map((msg, i) => {
                const isAi = msg.sender === "ai";
                
                // Skip rendering the thinking placeholder since we show the animated loader below
                if (isAi && msg.text === "") return null;

                return (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-4 p-4.5 rounded-3xl text-left transition-all",
                      isAi 
                        ? "bg-slate-50 border border-slate-100 mr-12" 
                        : "bg-indigo-50/50 border border-indigo-100/50 ml-12 flex-row-reverse"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-extrabold select-none shadow-xs animate-scale-up",
                      isAi ? "bg-indigo-600" : "bg-teal-500"
                    )}>
                      {isAi ? <Bot className="w-4.5 h-4.5" /> : <User className="w-4.5 h-4.5" />}
                    </div>
                    <div className="space-y-1 flex-1">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        {isAi ? "Prodify AI" : "You"}
                      </span>
                      {isAi ? renderMessageContent(msg.text) : (
                        <p className="text-xs font-semibold leading-relaxed text-slate-700 select-text">{msg.text}</p>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Thinking / Streaming Status Loader bubble */}
              {isThinking && (
                <div className="flex gap-4 p-4.5 rounded-3xl bg-slate-50 border border-slate-100 mr-12 animate-pulse text-left">
                  <div className="w-8 h-8 rounded-full bg-indigo-650 shrink-0 flex items-center justify-center text-white">
                    <Bot className="w-4.5 h-4.5 animate-spin" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Prodify AI</span>
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold py-1">
                      <Loader2 className="w-4.5 h-4.5 animate-spin text-indigo-600" />
                      <span className="italic animate-pulse">Analyzing workspace database and thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Composer (Bottom Bar) */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
          className="p-4 bg-white border-t border-slate-100 flex gap-3 shrink-0"
        >
          <input
            type="text"
            value={input}
            disabled={streaming || loading}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Prodify AI a question..."
            className="flex-1 bg-slate-55 border border-slate-100 rounded-2xl px-5 py-3 text-xs text-slate-750 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={streaming || loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:opacity-50 text-white p-3.5 rounded-2xl transition-all shadow-xs cursor-pointer flex items-center justify-center shrink-0"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
