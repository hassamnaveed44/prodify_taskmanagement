"use client";

import { useState } from "react";
import { Bot, Send, Sparkles, User, Lightbulb } from "lucide-react";

const suggestions = [
  "What should I work on next?",
  "Summarize my team's progress",
  "Show me my high-priority tasks",
  "Analyze project deadlines"
];

export default function ProdifyAIPage() {
  const [messages, setMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [
      ...prev,
      { sender: "user", text: input },
      { sender: "ai", text: "Hi! I am Prodify AI, your intelligent project assistant. Since we are in the frontend shell design phase, my streaming backend (via Server-Sent Events) is not connected yet. Once we reach Phase 6, I will query your real PostgreSQL database and stream answers to you token-by-token!" }
    ]);
    setInput("");
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col h-[calc(100vh-180px)]">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-6 mb-6 pr-2">
        {messages.length === 0 ? (
          /* Empty Chat / Greeting State */
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-650 shadow-sm border border-indigo-100 animate-bounce">
              <Bot className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">I&apos;m Prodify AI</h2>
              <p className="text-sm text-slate-400 font-medium">
                Your intelligent companion. Ask me to summarize your deliverables, query project statuses, or predict bottle-necks.
              </p>
            </div>

            {/* suggestion chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-4">
              {suggestions.map((sug) => (
                <button
                  key={sug}
                  onClick={() => setInput(sug)}
                  className="bg-slate-50 border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50/20 text-left px-4 py-3 rounded-2xl text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-all cursor-pointer flex items-center gap-2.5 group"
                >
                  <Lightbulb className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>{sug}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Chat List */
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-4 p-4 rounded-2xl ${
                  msg.sender === "ai" 
                    ? "bg-slate-50 border border-slate-100 mr-12" 
                    : "bg-indigo-50/50 border border-indigo-100/50 ml-12 flex-row-reverse"
                }`}
              >
                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white ${
                  msg.sender === "ai" ? "bg-indigo-600" : "bg-teal-500"
                }`}>
                  {msg.sender === "ai" ? <Bot className="w-4.5 h-4.5" /> : <User className="w-4.5 h-4.5" />}
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    {msg.sender === "ai" ? "Prodify AI" : "You"}
                  </span>
                  <p className="text-sm leading-relaxed text-slate-700">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message Input Composer */}
      <div className="border-t border-slate-100 pt-4 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask Prodify AI a question..."
          className="flex-1 bg-slate-50/50 border border-slate-100 rounded-2xl px-5 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
        />
        <button
          onClick={handleSend}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-2xl shadow-sm hover:shadow-indigo-150 transition-all cursor-pointer"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
