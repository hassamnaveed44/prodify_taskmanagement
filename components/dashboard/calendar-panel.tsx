"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Video, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  date: string;
}

interface CalendarTask {
  id: string;
  name: string;
  status: string;
  priority: string;
  dueDate: string | null;
}

export default function CalendarPanel() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Load calendar events & tasks from APIs
  const fetchCalendarData = async () => {
    try {
      const [eventsRes, tasksRes] = await Promise.all([
        fetch("/api/calendar-events", { cache: "no-store" }),
        fetch("/api/tasks", { cache: "no-store" })
      ]);

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData.events || []);
      }

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.tasks || []);
      }
    } catch (err) {
      console.error("Failed to load dashboard calendar events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, []);

  // Center strip around current selected Date
  const generateWeekDays = (centerDate: Date) => {
    const weekDays = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    // Generate 7 days centered on centerDate (3 days before, 3 days after)
    for (let i = -3; i <= 3; i++) {
      const d = new Date(centerDate);
      d.setDate(centerDate.getDate() + i);
      weekDays.push({
        name: dayNames[d.getDay()],
        num: String(d.getDate()).padStart(2, "0"),
        date: d,
        isSelected: d.toDateString() === selectedDate.toDateString()
      });
    }
    return weekDays;
  };

  const handlePrevDays = () => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 7);
      return next;
    });
  };

  const handleNextDays = () => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 7);
      return next;
    });
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const currentMonthName = monthNames[selectedDate.getMonth()];
  const weekDays = generateWeekDays(selectedDate);

  // Filter events and tasks for selected day
  const targetDateStr = selectedDate.toDateString();
  const dayEvents = events.filter(e => new Date(e.date).toDateString() === targetDateStr);
  const dayTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === targetDateStr);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col h-full text-left select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-50 dark:border-slate-800 mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Calendar</h3>
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
            {currentMonthName}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={handlePrevDays}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={handleNextDays}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekly horizontal strip */}
      <div className="flex items-center justify-between py-2 mb-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl px-2 shrink-0">
        {weekDays.map((day, i) => (
          <div 
            key={i} 
            onClick={() => setSelectedDate(day.date)}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-3 rounded-xl cursor-pointer transition-all duration-200 min-w-[36px]",
              day.isSelected 
                ? "bg-indigo-600 text-white shadow-sm scale-105" 
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <span className={cn("text-[10px] font-semibold mb-0.5", day.isSelected ? "text-white/80" : "text-slate-400 dark:text-slate-500")}>
              {day.name}
            </span>
            <span className="text-xs font-black">{day.num}</span>
          </div>
        ))}
      </div>

      {/* Events & Deadlines container */}
      <div className="flex-1 overflow-y-auto max-h-[170px] space-y-3 pr-1">
        {loading ? (
          <p className="text-slate-350 text-xs italic py-4 text-center">Synchronizing calendar...</p>
        ) : dayEvents.length === 0 && dayTasks.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-slate-355 text-xs italic">No workspace events or deadlines.</p>
            <Link 
              href="/calendar"
              className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline mt-2 inline-block"
            >
              Go to Calendar &rarr;
            </Link>
          </div>
        ) : (
          <>
            {/* Render Day Custom Events */}
            {dayEvents.map((evt) => (
              <div 
                key={evt.id}
                className="border border-slate-100 dark:border-slate-800 bg-[#fbfbfe] dark:bg-slate-800/10 rounded-2xl p-3 flex items-start gap-3 hover:shadow-xs transition-shadow text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                  <Video className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {evt.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5 truncate">
                    {evt.description || "Custom workspace event"}
                  </p>
                </div>
              </div>
            ))}

            {/* Render Day Tasks/Deadlines */}
            {dayTasks.map((task) => (
              <div 
                key={task.id}
                className="border border-slate-100 dark:border-slate-800 bg-[#fafbfa] dark:bg-slate-800/10 rounded-2xl p-3 flex items-start gap-3 hover:shadow-xs transition-shadow text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center text-indigo-650 dark:text-indigo-400 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 truncate">
                    {task.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5 flex items-center gap-1.5 uppercase tracking-wide">
                    Task Deadline <span className="w-1 h-1 bg-red-400 rounded-full" /> {task.priority}
                  </p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
