"use client";

import { Calendar, ChevronLeft, ChevronRight, Video, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const weekDays = [
  { day: "Fri", num: "04" },
  { day: "Sat", num: "05" },
  { day: "Sun", num: "06" },
  { day: "Mon", num: "07", isSelected: true },
  { day: "Tue", num: "08" },
  { day: "Wed", num: "09" },
  { day: "Thu", num: "10" },
];

const meetingAttendees = [
  { name: "Courtney Henry", avatar: "CH", color: "bg-orange-500" },
  { name: "Hassam", avatar: "HN", color: "bg-indigo-600" },
  { name: "Devin", avatar: "DV", color: "bg-emerald-500" },
  { name: "John", avatar: "JD", color: "bg-pink-500" },
];

export default function CalendarPanel() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-50 dark:border-slate-800 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Calendar className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base">Calendar</h3>
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">July</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="text-slate-400 hover:text-slate-650 transition-colors p-1 rounded hover:bg-slate-55">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="text-slate-400 hover:text-slate-650 transition-colors p-1 rounded hover:bg-slate-55">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekly horizontal strip */}
      <div className="flex items-center justify-between py-2 mb-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl px-2">
        {weekDays.map((day) => (
          <div 
            key={day.num} 
            className={cn(
              "flex flex-col items-center justify-center py-2 px-3 rounded-xl cursor-pointer select-none transition-all duration-300 min-w-[36px]",
              day.isSelected 
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200 scale-105" 
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <span className={cn("text-[10px] font-semibold mb-0.5", day.isSelected ? "text-white/80" : "text-slate-400 dark:text-slate-500")}>
              {day.day}
            </span>
            <span className="text-sm font-bold">{day.num}</span>
          </div>
        ))}
      </div>

      {/* Selected Day Event Card */}
      <div className="border border-slate-100 dark:border-slate-800 bg-[#f9fafc] dark:bg-slate-800/10 rounded-2xl p-4 flex flex-col gap-3 relative hover:shadow-md transition-all duration-300">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-sm">
              <Video className="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-850 dark:text-slate-200 hover:text-indigo-600 transition-colors cursor-pointer select-none">
                Meeting with VP
              </h4>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                Today <span className="mx-1">•</span> 10:00 - 11:00 am
              </p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-colors p-1 rounded hover:bg-white/80 dark:hover:bg-slate-800/50">
            <MoreHorizontal className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Info & Attendees row */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100/50 dark:border-slate-800/50">
          {/* Platform Badge */}
          <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-455 font-bold text-[10px] tracking-wide uppercase px-2 py-0.5 rounded-md flex items-center gap-1 select-none">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Google Meet
          </span>

          {/* Attendee Avatar Stack */}
          <div className="flex items-center -space-x-1.5 overflow-hidden">
            {meetingAttendees.map((att, i) => (
              <div 
                key={att.name} 
                className={cn("w-6 h-6 rounded-full text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-white dark:ring-slate-900 select-none shrink-0 shadow-sm", att.color)}
                title={att.name}
              >
                {att.avatar}
              </div>
            ))}
            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shrink-0 shadow-sm select-none">
              +2
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
