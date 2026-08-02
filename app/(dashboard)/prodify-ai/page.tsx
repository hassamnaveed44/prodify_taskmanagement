"use client";

import { useState, useEffect, useRef } from "react";
import { Bot, Send, Sparkles, User, Lightbulb, Loader2 } from "lucide-react";
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

export default function ProdifyAIPage() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = (textOverride || input).trim();
    if (!textToSend || streaming) return;

    setInput("");
    setStreaming(true);

    // Append user message and prepare empty AI response container for SSE tokens
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: textToSend },
      { sender: "ai", text: "" }
    ]);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: textToSend }),
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
    <div className="bg-white border border-slate-100 rounded-3xl p-0 shadow-sm flex flex-col h-[calc(100vh-180px)] overflow-hidden animate-fade-in select-none">
      
      {/* Active AI Chat Header */}
      <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-650 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div className="text-left">
            <h4 className="text-xs font-extrabold text-slate-855 leading-tight">Prodify AI Assistant</h4>
            <p className="text-[10px] text-emerald-500 font-bold tracking-wide mt-0.5 animate-pulse">● Live & Streaming</p>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          /* Empty Chat / Greeting State */
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-650 shadow-sm border border-indigo-100 animate-bounce">
              <Bot className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Meet your Prodify Assistant</h2>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-md">
                I query your active projects, tasks, and team member logs from the PostgreSQL database in real-time, helping you prioritize deliverables and analyze bottlenecks.
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
          disabled={streaming}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Prodify AI a question..."
          className="flex-1 bg-slate-55 border border-slate-100 rounded-2xl px-5 py-3 text-xs text-slate-750 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={streaming}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:opacity-50 text-white p-3.5 rounded-2xl transition-all shadow-xs cursor-pointer flex items-center justify-center shrink-0"
        >
          <Send className="w-4.5 h-4.5" />
        </button>
      </form>
    </div>
  );
}
