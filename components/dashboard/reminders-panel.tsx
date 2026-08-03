"use client";

import { useState, useEffect } from "react";
import { BellRing, MoreHorizontal, ChevronDown, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReminderItem {
  id: string;
  text: string;
  time: string;
  color: string;
}

export default function RemindersPanel() {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeadlineReminders = async () => {
    try {
      const res = await fetch("/api/tasks", { cache: "no-store" });
      if (!res.ok) return;

      const data = await res.json();
      const tasks = data.tasks || [];
      const now = new Date();

      // Find tasks with 1 day remaining (due within 36 hours)
      const dynamicReminders = tasks
        .filter((task: any) => {
          if (task.status === "COMPLETED" || !task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          const diffTime = dueDate.getTime() - now.getTime();
          const diffHours = diffTime / (1000 * 60 * 60);
          return diffHours > 0 && diffHours <= 36;
        })
        .map((task: any) => {
          const dueDate = new Date(task.dueDate);
          const hoursLeft = Math.max(1, Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)));
          return {
            id: task.id,
            text: `🚨 Deadline alert: Task "${task.name}" is due in ${hoursLeft} hours!`,
            time: `Due ${dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
            color: "bg-red-500",
          };
        });

      // Default helper reminders if no immediate deadlines
      const staticHelpers = [
        {
          id: "static-1",
          text: "Review team whiteboard sketches for the client presentation.",
          time: "Today • 02:00 pm",
          color: "bg-indigo-500",
        },
        {
          id: "static-2",
          text: "Outline key points for tomorrow's stand-up meeting.",
          time: "Today • 05:00 pm",
          color: "bg-teal-500",
        }
      ];

      // Merge them, placing real-time deadline warnings at the top!
      setReminders([...dynamicReminders, ...staticHelpers]);
    } catch (err) {
      console.error("Failed to load task reminder notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeadlineReminders();
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col h-full text-left">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-50 dark:border-slate-800 mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <BellRing className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Reminders</h3>
        </div>
        <button className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-colors p-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
          <MoreHorizontal className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Date header */}
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <ChevronDown className="w-4 h-4 text-slate-400 cursor-pointer animate-bounce" />
        <span className="text-xs font-bold text-slate-500 select-none">Today</span>
        <span className="text-[10px] text-slate-400 font-bold">• {reminders.length} Alerts</span>
      </div>

      {/* Reminders List */}
      <div className="flex-1 overflow-y-auto max-h-[160px] space-y-3 pr-1">
        {loading ? (
          <p className="text-slate-350 text-xs italic py-4 text-center">Checking tasks list...</p>
        ) : (
          reminders.map((reminder) => (
            <div 
              key={reminder.id} 
              className="flex items-start justify-between gap-3 p-3 bg-slate-50/20 dark:bg-slate-800/10 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 border border-slate-50 dark:border-slate-800 rounded-2xl group transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <span className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0 animate-pulse", reminder.color)} />
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-slate-650 dark:text-slate-200 leading-relaxed">
                    {reminder.text}
                  </p>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">
                    {reminder.time}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Floating Sparkle Icon */}
      <div className="mt-auto pt-4 flex justify-end shrink-0">
        <button 
          onClick={fetchDeadlineReminders}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Refresh Alerts"
        >
          <Star className="w-4 h-4 fill-white" />
        </button>
      </div>
    </div>
  );
}
