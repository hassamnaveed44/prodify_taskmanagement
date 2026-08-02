"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2, Sparkles, User, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface CalendarTask {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  projectName: string;
  projectSlug: string;
  assignee: string | null;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<CalendarTask | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/tasks", { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error("Failed to fetch calendar tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() - 1);
      return next;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + 1);
      return next;
    });
  };

  // Generate calendar days grid
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  const daysGrid = [];

  // Prefix filler days from previous month
  const prevMonthDays = getDaysInMonth(year, month - 1);
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    daysGrid.push({
      day: d.toString(),
      dateKey: `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      isCurrentMonth: false,
    });
  }

  // Active month days
  const today = new Date();
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = 
      today.getDate() === d && 
      today.getMonth() === month && 
      today.getFullYear() === year;
    
    daysGrid.push({
      day: d.toString(),
      dateKey: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      isCurrentMonth: true,
      isToday,
    });
  }

  // Suffix filler days to balance grid (42 grid cells)
  const totalCells = daysGrid.length <= 35 ? 35 : 42;
  const suffixCount = totalCells - daysGrid.length;
  for (let d = 1; d <= suffixCount; d++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    daysGrid.push({
      day: d.toString(),
      dateKey: `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      isCurrentMonth: false,
    });
  }

  // Map workspace tasks by due date key
  const taskMap: { [key: string]: CalendarTask[] } = {};
  tasks.forEach((task) => {
    if (task.dueDate) {
      const dateKey = task.dueDate.split("T")[0];
      if (!taskMap[dateKey]) {
        taskMap[dateKey] = [];
      }
      taskMap[dateKey].push(task);
    }
  });

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col space-y-6 text-left animate-fade-in relative select-none">
      
      {/* Calendar Header Panel */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <CalendarIcon className="w-4.5 h-4.5" />
          </div>
          <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Workspace Calendar</h3>
          <span className="text-xs font-bold text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full">
            {monthNames[month]} {year}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1 border border-slate-100 shrink-0">
            <button
              onClick={handlePrevMonth}
              className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-lg hover:bg-white cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-lg hover:bg-white cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        /* Loading skeleton spinner */
        <div className="h-[500px] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-650" />
          <p className="text-xs text-slate-400 font-semibold italic">Aggregating project calendar events...</p>
        </div>
      ) : (
        /* Dynamic Month Grid Table */
        <div className="flex-1 flex flex-col overflow-x-auto min-w-[700px]">
          {/* Days of Week header row */}
          <div className="grid grid-cols-7 text-center border-b border-slate-100 pb-2">
            {daysOfWeek.map((day) => (
              <span key={day} className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                {day}
              </span>
            ))}
          </div>

          {/* 35/42 days Month Grid cells */}
          <div className="grid grid-cols-7 border-l border-t border-slate-50">
            {daysGrid.map((cell, index) => {
              const dayTasks = taskMap[cell.dateKey] || [];
              return (
                <div
                  key={index}
                  className={cn(
                    "min-h-[110px] border-r border-b border-slate-50 p-2 flex flex-col gap-1 transition-all overflow-hidden text-left",
                    cell.isCurrentMonth ? "bg-white" : "bg-slate-50/20"
                  )}
                >
                  {/* Day cell header row containing indicator badge and dots */}
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "w-6 h-6 rounded-full text-xs font-black flex items-center justify-center select-none shadow-xs",
                      cell.isToday 
                        ? "bg-indigo-600 text-white animate-scale-up" 
                        : cell.isCurrentMonth 
                          ? "text-slate-700" 
                          : "text-slate-300"
                    )}>
                      {cell.day}
                    </span>

                    {/* Deadline dot indicators */}
                    {dayTasks.length > 0 && (
                      <div className="flex gap-1 pr-1 items-center">
                        {dayTasks.slice(0, 3).map((t) => (
                          <span
                            key={t.id}
                            title={`${t.name} (${t.priority})`}
                            className={cn(
                              "w-1.5 h-1.5 rounded-full animate-scale-up",
                              t.status === "COMPLETED"
                                ? "bg-emerald-400"
                                : t.priority === "HIGH"
                                  ? "bg-red-500"
                                  : t.priority === "MEDIUM"
                                    ? "bg-amber-500"
                                    : "bg-indigo-400"
                            )}
                          />
                        ))}
                        {dayTasks.length > 3 && (
                          <span className="text-[8px] font-bold text-slate-400 leading-none" title={`${dayTasks.length - 3} more tasks`}>
                            +
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Day cell tasks badges list */}
                  <div className="flex-1 overflow-y-auto space-y-1 mt-1 pr-0.5 max-h-[80px]">
                    {dayTasks.map((task) => {
                      const isHigh = task.priority === "HIGH";
                      const isMedium = task.priority === "MEDIUM";
                      const isCompleted = task.status === "COMPLETED";

                      return (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTask(task)}
                          className={cn(
                            "border rounded-lg px-1.5 py-1 text-[9px] font-bold leading-tight truncate cursor-pointer transition-all shadow-xs block text-left",
                            isCompleted
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/50 line-through opacity-75"
                              : isHigh
                                ? "bg-red-50 text-red-700 border-red-100 hover:bg-red-100/50"
                                : isMedium
                                  ? "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100/50"
                                  : "bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100/50"
                          )}
                        >
                          {task.name}
                        </div>
                      );
                    })}
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Task Details Custom POP Card Modal overlay */}
      {selectedTask && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col space-y-5 animate-scale-up text-left">
            {/* Header section with category indicators */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-indigo-650 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                  Project: {selectedTask.projectName}
                </span>
                <h4 className="text-sm font-black text-slate-850 pt-2 leading-tight select-text">
                  {selectedTask.name}
                </h4>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description Text */}
            <div className="text-xs font-semibold text-slate-500 leading-relaxed border-t border-b border-slate-50 py-3 select-text">
              {selectedTask.description || <span className="italic text-slate-300">No task description added.</span>}
            </div>

            {/* Attributes Grid List */}
            <div className="grid grid-cols-2 gap-4">
              {/* Attribute 1: Priority */}
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="text-left">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide block">Priority</span>
                  <span className={cn(
                    "text-[10px] font-bold",
                    selectedTask.priority === "HIGH" 
                      ? "text-red-600" 
                      : selectedTask.priority === "MEDIUM" 
                        ? "text-amber-500" 
                        : "text-blue-500"
                  )}>
                    {selectedTask.priority}
                  </span>
                </div>
              </div>

              {/* Attribute 2: Status */}
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="text-left">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide block">Status</span>
                  <span className="text-[10px] font-bold text-slate-700">{selectedTask.status.replace("_", " ")}</span>
                </div>
              </div>

              {/* Attribute 3: Due Date */}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="text-left">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide block">Due Date</span>
                  <span className="text-[10px] font-bold text-slate-700">
                    {selectedTask.dueDate ? selectedTask.dueDate.split("T")[0] : "No date"}
                  </span>
                </div>
              </div>

              {/* Attribute 4: Assignee */}
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="text-left">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide block">Assignee</span>
                  <span className="text-[10px] font-bold text-slate-700">{selectedTask.assignee || "Unassigned"}</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions Row */}
            <div className="flex justify-end pt-2 shrink-0">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close Details
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// Minimal local Close icon mock fallback
function X(props: any) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
