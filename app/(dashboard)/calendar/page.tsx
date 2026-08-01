"use client";

import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// July 2026 grid starting on Wednesday (index 3)
const calendarDays = [
  { day: "", isCurrentMonth: false },
  { day: "", isCurrentMonth: false },
  { day: "", isCurrentMonth: false },
  { day: "1", isCurrentMonth: true },
  { day: "2", isCurrentMonth: true },
  { day: "3", isCurrentMonth: true },
  { day: "4", isCurrentMonth: true },
  { day: "5", isCurrentMonth: true },
  { day: "6", isCurrentMonth: true },
  { day: "7", isCurrentMonth: true, isToday: true, event: "Meeting with VP" },
  { day: "8", isCurrentMonth: true },
  { day: "9", isCurrentMonth: true },
  { day: "10", isCurrentMonth: true },
  { day: "11", isCurrentMonth: true },
  { day: "12", isCurrentMonth: true },
  { day: "13", isCurrentMonth: true },
  { day: "14", isCurrentMonth: true },
  { day: "15", isCurrentMonth: true },
  { day: "16", isCurrentMonth: true },
  { day: "17", isCurrentMonth: true },
  { day: "18", isCurrentMonth: true },
  { day: "19", isCurrentMonth: true },
  { day: "20", isCurrentMonth: true },
  { day: "21", isCurrentMonth: true },
  { day: "22", isCurrentMonth: true },
  { day: "23", isCurrentMonth: true },
  { day: "24", isCurrentMonth: true },
  { day: "25", isCurrentMonth: true },
  { day: "26", isCurrentMonth: true },
  { day: "27", isCurrentMonth: true },
  { day: "28", isCurrentMonth: true },
  { day: "29", isCurrentMonth: true },
  { day: "30", isCurrentMonth: true },
  { day: "31", isCurrentMonth: true },
  { day: "", isCurrentMonth: false },
];

export default function CalendarPage() {
  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-slate-800 text-base">Calendar</h3>
          <span className="text-sm font-semibold text-slate-400">July 2026</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1 border border-slate-100">
            <button className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded hover:bg-white">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded hover:bg-white">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button className="bg-indigo-650 hover:bg-indigo-755 text-white font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer">
            <Plus className="w-4 h-4" /> Add Event
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1">
        {/* Days Header */}
        <div className="grid grid-cols-7 text-center border-b border-slate-100 pb-2">
          {daysOfWeek.map((day) => (
            <span key={day} className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {day}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 border-l border-t border-slate-50">
          {calendarDays.map((d, index) => (
            <div
              key={index}
              className={cn(
                "min-h-[100px] border-r border-b border-slate-50 p-2 flex flex-col gap-1 transition-all",
                d.isCurrentMonth ? "bg-white" : "bg-slate-50/30"
              )}
            >
              <span className={cn(
                "w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center select-none",
                d.isToday ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600"
              )}>
                {d.day}
              </span>
              
              {d.event && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-1.5 text-[10px] font-semibold text-indigo-700 leading-tight truncate shadow-sm mt-1 cursor-pointer">
                  {d.event}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
