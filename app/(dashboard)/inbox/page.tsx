"use client";

import { Inbox, Send, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const mockChats = [
  { id: "1", name: "Courtney Henry", message: "Hey, can you review the new branding mockups?", time: "09:32 am", unread: true },
  { id: "2", name: "Devin Allen", message: "Sure, let's connect tomorrow for the brainstorm.", time: "Yesterday", unread: false },
  { id: "3", name: "Hassam", message: "Workspace setup is complete, let me know when you push.", time: "Jul 28", unread: false },
];

export default function InboxPage() {
  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-0 shadow-sm flex h-[calc(100vh-180px)] overflow-hidden">
      {/* Chats List Pane (Left) */}
      <div className="w-80 border-r border-slate-100 flex flex-col">
        {/* Search */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search chat..."
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-655 focus:outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Chats scroll */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {mockChats.map((chat) => (
            <div
              key={chat.id}
              className={cn(
                "p-4 cursor-pointer hover:bg-slate-50/50 flex gap-3 transition-colors",
                chat.id === "1" ? "bg-slate-50/70" : ""
              )}
            >
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                {chat.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className="text-xs font-bold text-slate-800 truncate">{chat.name}</h4>
                  <span className="text-[9px] text-slate-400 font-medium shrink-0">{chat.time}</span>
                </div>
                <p className={cn(
                  "text-xs truncate", 
                  chat.unread ? "text-slate-800 font-bold" : "text-slate-400 font-medium"
                )}>
                  {chat.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Container (Right) */}
      <div className="flex-1 flex flex-col bg-slate-50/20">
        {/* Active Header */}
        <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-150 text-indigo-700 font-bold flex items-center justify-center">
              CH
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 leading-tight">Courtney Henry</h4>
              <p className="text-[10px] text-slate-400 font-medium">Online</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex gap-3 max-w-lg">
            <div className="w-8 h-8 rounded-full bg-indigo-150 text-indigo-700 font-semibold text-xs flex items-center justify-center shrink-0">
              CH
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-3.5 shadow-sm">
              <p className="text-xs font-medium text-slate-700 leading-relaxed">
                Hey, can you review the new branding mockups? I uploaded them to the workspace shared space.
              </p>
              <span className="text-[9px] text-slate-400 font-medium block mt-1">09:30 am</span>
            </div>
          </div>

          <div className="flex gap-3 max-w-lg ml-auto flex-row-reverse">
            <div className="w-8 h-8 rounded-full bg-indigo-650 text-white font-semibold text-xs flex items-center justify-center shrink-0">
              AI
            </div>
            <div className="bg-indigo-600 text-white rounded-2xl p-3.5 shadow-sm">
              <p className="text-xs font-medium leading-relaxed">
                Sure, I will take a look at it right away and leave my comments!
              </p>
              <span className="text-[9px] text-indigo-200 font-medium block mt-1 text-right">09:32 am</span>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-slate-100 flex gap-3">
          <input
            type="text"
            placeholder="Type your message..."
            className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl transition-colors cursor-pointer">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
