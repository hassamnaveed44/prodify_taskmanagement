"use client";

import { useState, useEffect } from "react";
import { CheckSquare, Plus, ArrowUpDown, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  name: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "UPCOMING" | "COMPLETED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: string | null;
  projectName: string;
  projectSlug: string;
}

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch assigned tasks from the unified dashboard API
    fetch("/api/dashboard")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then((data) => {
        setTasks(data.tasks || []);
      })
      .catch((err) => {
        console.error("Failed to load tasks:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Helper to format status badges
  const getStatusStyles = (status: string) => {
    if (status === "IN_PROGRESS") return "bg-[#e0f4f0] text-[#14b8a6]";
    if (status === "TODO") return "bg-[#eaf0fa] text-[#2563eb]";
    if (status === "UPCOMING") return "bg-[#fef3c7] text-[#d97706]";
    return "bg-[#dcfce7] text-[#15803d]"; // COMPLETED
  };

  const getStatusLabel = (status: string) => {
    if (status === "IN_PROGRESS") return "In Progress";
    if (status === "TODO") return "To Do";
    if (status === "UPCOMING") return "Upcoming";
    return "Completed";
  };

  // Helper to format priority badges
  const getPriorityStyles = (priority: string) => {
    if (priority === "HIGH") return "bg-red-50 text-red-500 border border-red-100/50";
    if (priority === "MEDIUM") return "bg-amber-50 text-amber-600 border border-amber-100/50";
    return "bg-slate-50 text-slate-500 border border-slate-100/30";
  };

  // Helper to format due date labels
  const getDueDateLabel = (dueDateString: string | null, status?: string) => {
    if (!dueDateString) return { label: "No due date", color: "text-slate-400" };
    const date = new Date(dueDateString);
    const today = new Date();
    
    if (status === "COMPLETED") {
      return { 
        label: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), 
        color: "text-slate-400" 
      };
    }

    const isToday = date.toDateString() === today.toDateString();
    if (isToday) return { label: "Today", color: "text-red-550 font-bold" };
    
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: "Overdue", color: "text-rose-600 font-semibold" };
    if (diffDays === 1) return { label: "Tomorrow", color: "text-amber-500 font-semibold" };
    if (diffDays <= 7) return { label: `${diffDays} days left`, color: "text-slate-500" };
    
    return { 
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), 
      color: "text-slate-450" 
    };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-650" />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Compiling all tasks...</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col space-y-6 select-none animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <CheckSquare className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-slate-800 text-base">All Tasks</h3>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        {tasks.length === 0 ? (
          <div className="py-12 text-center text-slate-350 italic text-sm">
            No tasks assigned to you in this workspace. Create tasks in your projects to see them listed here!
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Task Name</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">
                  <button className="flex items-center gap-1 hover:text-slate-700 transition-colors cursor-pointer">
                    Status <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-655">
              {tasks.map((task) => {
                const dateInfo = getDueDateLabel(task.dueDate, task.status);
                return (
                  <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-800 text-left max-w-sm truncate">
                      {task.name}
                    </td>
                    <td className="py-4 px-4 text-left">
                      <Link 
                        href={`/projects/${task.projectSlug}`} 
                        className="text-indigo-500 hover:text-indigo-755 hover:underline font-bold"
                      >
                        {task.projectName}
                      </Link>
                    </td>
                    <td className="py-4 px-4 text-left">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-md font-extrabold uppercase tracking-wide text-[9px]",
                        getStatusStyles(task.status)
                      )}>
                        {getStatusLabel(task.status)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-left">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full tracking-wide font-extrabold text-[9px] uppercase border",
                        getPriorityStyles(task.priority)
                      )}>
                        {task.priority}
                      </span>
                    </td>
                    <td className={cn("py-4 px-4 text-left text-[11px]", dateInfo.color)}>
                      {dateInfo.label}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
