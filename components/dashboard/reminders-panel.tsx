"use client";

import { BellRing, MoreHorizontal, ChevronDown, CheckCircle2, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const reminders = [
  {
    id: "1",
    text: "Assess any new risks identified in the morning meeting.",
    time: "Today • 09:30 am",
    color: "bg-indigo-500",
  },
  {
    id: "2",
    text: "Outline key points for tomorrow's stand-up meeting.",
    time: "Today • 05:00 pm",
    color: "bg-teal-500",
  },
];

export default function RemindersPanel() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-50 dark:border-slate-800 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <BellRing className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base">Reminders</h3>
        </div>
        <button className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-colors p-1.5 rounded hover:bg-slate-55 dark:hover:bg-slate-800/50">
          <MoreHorizontal className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Date category dropdown */}
      <div className="flex items-center gap-2 mb-3">
        <ChevronDown className="w-4 h-4 text-slate-400 cursor-pointer" />
        <span className="text-xs font-bold text-slate-500 select-none">Today</span>
        <span className="text-[10px] text-slate-400 font-normal">• {reminders.length}</span>
      </div>

      {/* Reminders List */}
      <div className="space-y-4">
        {reminders.map((reminder) => (
          <div 
            key={reminder.id} 
            className="flex items-start justify-between gap-3 p-3 bg-slate-50/20 dark:bg-slate-800/10 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 border border-slate-50 dark:border-slate-800 rounded-2xl group transition-all duration-300"
          >
            <div className="flex items-start gap-3">
              {/* Left Indicator Dot */}
              <span className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0 animate-pulse", reminder.color)} />
              <div>
                <p className="text-xs font-medium text-slate-650 dark:text-slate-300 leading-relaxed group-hover:text-slate-850 dark:group-hover:text-slate-100 transition-colors select-none">
                  {reminder.text}
                </p>
              </div>
            </div>

            {/* Actions button */}
            <button className="text-slate-350 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 opacity-0 group-hover:opacity-100 rounded hover:bg-white dark:hover:bg-slate-800 shrink-0">
              <MoreHorizontal className="w-4.5 h-4.5" />
            </button>
          </div>
        ))}
      </div>
      
      {/* Floating Sparkle Action button (matches bottom-right of screenshot) */}
      <div className="mt-auto pt-6 flex justify-end">
        <button className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg hover:shadow-indigo-200 hover:scale-105 active:scale-95 transition-all cursor-pointer">
          <Star className="w-4.5 h-4.5 fill-white" />
        </button>
      </div>
    </div>
  );
}
