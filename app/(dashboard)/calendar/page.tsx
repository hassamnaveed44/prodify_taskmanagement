"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2, Sparkles, 
  User, CheckCircle2, Clock, AlertCircle, Plus, Trash2, X, FileText 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast-provider";

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

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  date: string;
}

export default function CalendarPage() {
  const { success, error } = useToast();
  const toast = {
    show: (type: "success" | "error" | "info", msg: string) => {
      if (type === "success") success(msg);
      else error(msg);
    }
  };

  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Popups/Modals state
  const [selectedTask, setSelectedTask] = useState<CalendarTask | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);

  // New Event Form state
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [newEventDate, setNewEventDate] = useState("");

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const [tasksRes, eventsRes] = await Promise.all([
        fetch("/api/tasks", { cache: "no-store" }),
        fetch("/api/calendar-events", { cache: "no-store" })
      ]);

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.tasks || []);
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData.events || []);
      }
    } catch (err) {
      console.error("Failed to load calendar data:", err);
      toast.show("error", "Failed to load calendar data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, []);

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

  const handleAddEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventDate) {
      toast.show("error", "Event title and date are required.");
      return;
    }

    try {
      const res = await fetch("/api/calendar-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newEventTitle.trim(),
          description: newEventDesc.trim() || null,
          date: new Date(newEventDate).toISOString(),
        }),
      });

      if (res.ok) {
        toast.show("success", `Custom event "${newEventTitle}" added successfully.`);
        setNewEventTitle("");
        setNewEventDesc("");
        setNewEventDate("");
        setIsAddEventModalOpen(false);
        fetchCalendarData();
      } else {
        toast.show("error", "Failed to save the calendar event.");
      }
    } catch (err) {
      console.error("Failed to add calendar event:", err);
      toast.show("error", "An error occurred adding the event.");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const res = await fetch(`/api/calendar-events/${eventId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.show("success", "Event deleted successfully.");
        setSelectedEvent(null);
        fetchCalendarData();
      } else {
        toast.show("error", "Failed to delete the event.");
      }
    } catch (err) {
      console.error("Failed to delete event:", err);
      toast.show("error", "An error occurred deleting the event.");
    }
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

  // Map tasks by due date key
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

  // Map custom calendar events by date key
  const eventMap: { [key: string]: CalendarEvent[] } = {};
  events.forEach((event) => {
    if (event.date) {
      const dateKey = event.date.split("T")[0];
      if (!eventMap[dateKey]) {
        eventMap[dateKey] = [];
      }
      eventMap[dateKey].push(event);
    }
  });

  return (
    <div className="bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900 rounded-3xl p-6 shadow-sm flex flex-col space-y-6 text-left animate-fade-in relative select-none">
      
      {/* Calendar Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-50 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <CalendarIcon className="w-4.5 h-4.5" />
          </div>
          <h3 className="font-extrabold text-slate-850 dark:text-slate-100 text-sm tracking-tight">Workspace Calendar</h3>
          <span className="text-xs font-bold text-slate-400 dark:text-slate-550 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-3 py-1 rounded-full">
            {monthNames[month]} {year}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Add Custom Calendar Event Button */}
          <button
            onClick={() => setIsAddEventModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Event</span>
          </button>

          {/* Month selector switches */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 rounded-xl p-1 border border-slate-100 dark:border-slate-700 shrink-0">
            <button
              onClick={handlePrevMonth}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-900 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-900 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-[500px] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
          <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold italic">Aggregating workspace calendar events...</p>
        </div>
      ) : (
        /* Month Grid Table */
        <div className="flex-1 flex flex-col overflow-x-auto min-w-[700px]">
          {/* Days of Week header row */}
          <div className="grid grid-cols-7 text-center border-b border-slate-100 dark:border-slate-850 pb-2">
            {daysOfWeek.map((day) => (
              <span key={day} className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {day}
              </span>
            ))}
          </div>

          {/* Grid Cell days */}
          <div className="grid grid-cols-7 border-l border-t border-slate-50 dark:border-slate-850">
            {daysGrid.map((cell, index) => {
              const dayTasks = taskMap[cell.dateKey] || [];
              const dayEvents = eventMap[cell.dateKey] || [];
              const totalItems = dayTasks.length + dayEvents.length;

              return (
                <div
                  key={index}
                  className={cn(
                    "min-h-[110px] border-r border-b border-slate-50 dark:border-slate-850 p-2 flex flex-col gap-1 transition-all overflow-hidden text-left",
                    cell.isCurrentMonth ? "bg-white dark:bg-slate-900" : "bg-slate-50/20 dark:bg-slate-950/20"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "w-6 h-6 rounded-full text-xs font-black flex items-center justify-center select-none shadow-xs",
                      cell.isToday 
                        ? "bg-indigo-600 text-white animate-scale-up" 
                        : cell.isCurrentMonth 
                          ? "text-slate-700 dark:text-slate-200" 
                          : "text-slate-300 dark:text-slate-600"
                    )}>
                      {cell.day}
                    </span>

                    {/* Deadline dot indicators */}
                    {totalItems > 0 && (
                      <div className="flex gap-1 pr-1 items-center">
                        {/* Custom Event Dot Indicator (Purple) */}
                        {dayEvents.slice(0, 2).map((e) => (
                          <span 
                            key={e.id}
                            title={`Event: ${e.title}`}
                            className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-scale-up"
                          />
                        ))}
                        {/* Task Dot Indicators */}
                        {dayTasks.slice(0, 2).map((t) => (
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
                      </div>
                    )}
                  </div>

                  {/* Day cell list item badges */}
                  <div className="flex-1 overflow-y-auto space-y-1 mt-1 pr-0.5 max-h-[80px]">
                    {/* Render Custom Events */}
                    {dayEvents.map((evt) => (
                      <div
                        key={evt.id}
                        onClick={() => setSelectedEvent(evt)}
                        className="bg-purple-50 hover:bg-purple-100/50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30 rounded-lg px-1.5 py-1 text-[9px] font-extrabold leading-tight truncate cursor-pointer transition-all shadow-xs block text-left flex items-center gap-1"
                      >
                        <span className="w-1 h-1 bg-purple-500 rounded-full shrink-0" />
                        <span className="truncate">{evt.title}</span>
                      </div>
                    ))}

                    {/* Render Tasks */}
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
                              ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-100/50 line-through opacity-75"
                              : isHigh
                                ? "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30 hover:bg-red-100/50"
                                : isMedium
                                  ? "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30 hover:bg-amber-100/50"
                                  : "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30 hover:bg-indigo-100/50"
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

      {/* Task Details Popup Overlay Card */}
      {selectedTask && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col space-y-5 animate-scale-up text-left">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/30 px-3 py-1 rounded-full">
                  Project: {selectedTask.projectName}
                </span>
                <h4 className="text-sm font-black text-slate-850 dark:text-slate-100 pt-2 leading-tight select-text">
                  {selectedTask.name}
                </h4>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed border-t border-b border-slate-50 dark:border-slate-850 py-3 select-text whitespace-pre-wrap">
              {selectedTask.description || <span className="italic text-slate-300 dark:text-slate-655">No task description added.</span>}
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                        : "text-indigo-500"
                  )}>
                    {selectedTask.priority}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="text-left">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide block">Status</span>
                  <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {selectedTask.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Event Details Popup Overlay Card */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col space-y-5 animate-scale-up text-left">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-purple-650 bg-purple-50 dark:bg-purple-950/50 border border-purple-100 dark:border-purple-900/30 px-3 py-1 rounded-full">
                  Workspace Event
                </span>
                <h4 className="text-sm font-black text-slate-850 dark:text-slate-100 pt-2 leading-tight select-text">
                  {selectedEvent.title}
                </h4>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed border-t border-b border-slate-50 dark:border-slate-855 py-3 select-text whitespace-pre-wrap">
              {selectedEvent.description || <span className="italic text-slate-300 dark:text-slate-655">No event description added.</span>}
            </div>

            <div className="flex items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="text-left">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide block">Event Date</span>
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                    {new Date(selectedEvent.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => handleDeleteEvent(selectedEvent.id)}
                className="text-red-500 hover:text-red-650 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Event</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Calendar Event Modal popup */}
      {isAddEventModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form 
            onSubmit={handleAddEventSubmit}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-4 animate-fade-in"
          >
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm tracking-tight uppercase text-left">Add Custom Event</h3>
            
            {/* Event Title */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block px-1">Event Title</label>
              <input 
                type="text" 
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                placeholder="e.g. Project Seminar, Team Dinner"
                className="w-full text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-3 px-4 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition-all"
                required
              />
            </div>

            {/* Event Description */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block px-1">Description</label>
              <textarea 
                value={newEventDesc}
                onChange={(e) => setNewEventDesc(e.target.value)}
                placeholder="Details about this seminar or event..."
                rows={3}
                className="w-full text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-3 px-4 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition-all resize-none"
              />
            </div>

            {/* Event Date */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block px-1">Event Date</label>
              <input 
                type="date" 
                value={newEventDate}
                onChange={(e) => setNewEventDate(e.target.value)}
                className="w-full text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-3 px-4 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 transition-all cursor-pointer"
                required
              />
            </div>

            {/* Form actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button 
                type="button"
                onClick={() => {
                  setIsAddEventModalOpen(false);
                  setNewEventTitle("");
                  setNewEventDesc("");
                  setNewEventDate("");
                }}
                className="text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-4 py-2 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-4.5 py-2.5 rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                Save Event
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
