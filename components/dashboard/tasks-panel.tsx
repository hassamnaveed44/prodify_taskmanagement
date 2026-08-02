"use client";

import { useState } from "react";
import { 
  CheckSquare, 
  MoreHorizontal, 
  Settings, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Circle,
  CheckCircle2
} from "lucide-react";
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

interface TasksPanelProps {
  tasks: Task[];
  onStatusChange?: (taskId: string, newStatus: string) => void;
}

export default function TasksPanel({ tasks, onStatusChange }: TasksPanelProps) {
  const [sections, setSections] = useState({
    inProgress: true,
    todo: true,
    upcoming: false,
    completed: false,
  });

  const toggleSection = (key: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Helper to format due date labels
  const getDueDateLabel = (dueDateString: string | null, status?: string) => {
    if (!dueDateString) return { label: "No due date", color: "text-slate-400" };
    const date = new Date(dueDateString);
    const today = new Date();
    
    if (status === "COMPLETED") {
      return { 
        label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), 
        color: "text-slate-400" 
      };
    }

    // Simple comparison
    const isToday = date.toDateString() === today.toDateString();
    if (isToday) return { label: "Today", color: "text-red-500 font-bold" };
    
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: "Overdue", color: "text-rose-600 font-semibold" };
    if (diffDays === 1) return { label: "Tomorrow", color: "text-amber-500 font-semibold" };
    if (diffDays <= 7) return { label: `${diffDays} days left`, color: "text-slate-500" };
    
    return { 
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), 
      color: "text-slate-400" 
    };
  };

  // Helper for priority badges
  const getPriorityStyles = (priority: "LOW" | "MEDIUM" | "HIGH") => {
    if (priority === "HIGH") return "bg-red-50 text-red-500 border border-red-100/50";
    if (priority === "MEDIUM") return "bg-amber-50 text-amber-600 border border-amber-100/50";
    return "bg-slate-50 text-slate-500 border border-slate-100/30";
  };

  // Group tasks
  const tasksInProgress = tasks.filter(t => t.status === "IN_PROGRESS");
  const tasksTodo = tasks.filter(t => t.status === "TODO");
  const tasksUpcoming = tasks.filter(t => t.status === "UPCOMING");
  const tasksCompleted = tasks.filter(t => t.status === "COMPLETED");

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <CheckSquare className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-slate-800 text-base">My Tasks</h3>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-slate-400 hover:text-slate-650 transition-colors p-1.5 rounded hover:bg-slate-50">
            <Settings className="w-4.5 h-4.5" />
          </button>
          <button className="text-slate-400 hover:text-slate-650 transition-colors p-1.5 rounded hover:bg-slate-50">
            <MoreHorizontal className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 mt-6 space-y-4">
        
        {/* 1. IN PROGRESS */}
        <div>
          <button 
            onClick={() => toggleSection("inProgress")}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold text-xs tracking-wider transition-colors mb-3 uppercase"
          >
            {sections.inProgress ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
            <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-[#e0f4f0] text-[#14b8a6]">
              IN PROGRESS
            </span>
            <span className="text-[10px] text-slate-400 font-normal normal-case">
              • {tasksInProgress.length} tasks
            </span>
          </button>

          {sections.inProgress && (
            <div className="pl-6 space-y-2.5">
              {tasksInProgress.length === 0 ? (
                <p className="text-slate-350 text-xs italic py-2 pl-2">No tasks in progress.</p>
              ) : (
                tasksInProgress.map((task) => {
                  const dateInfo = getDueDateLabel(task.dueDate, task.status);
                  return (
                    <div key={task.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50 rounded-xl px-2 transition-colors -mx-2">
                      <div className="flex items-center gap-3">
                        <Circle 
                          onClick={() => onStatusChange && onStatusChange(task.id, "COMPLETED")}
                          className="w-4 h-4 text-slate-350 cursor-pointer hover:text-emerald-500 hover:scale-105 transition-all shrink-0" 
                        />
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-semibold text-slate-700 select-none line-clamp-1">{task.name}</span>
                          <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wide mt-0.5">{task.projectName}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-xs font-semibold shrink-0">
                        <span className={cn("px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wide font-extrabold", getPriorityStyles(task.priority))}>
                          {task.priority}
                        </span>
                        <span className={cn("w-20 text-right text-[11px]", dateInfo.color)}>{dateInfo.label}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* 2. TO DO */}
        <div>
          <button 
            onClick={() => toggleSection("todo")}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold text-xs tracking-wider transition-colors mb-3 uppercase"
          >
            {sections.todo ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
            <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-[#eaf0fa] text-[#2563eb]">
              TO DO
            </span>
            <span className="text-[10px] text-slate-400 font-normal normal-case">
              • {tasksTodo.length} tasks
            </span>
          </button>

          {sections.todo && (
            <div className="pl-6 space-y-2.5">
              {tasksTodo.length === 0 ? (
                <p className="text-slate-350 text-xs italic py-2 pl-2">No pending tasks.</p>
              ) : (
                tasksTodo.map((task) => {
                  const dateInfo = getDueDateLabel(task.dueDate, task.status);
                  return (
                    <div key={task.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50 rounded-xl px-2 transition-colors -mx-2">
                      <div className="flex items-center gap-3">
                        <Circle 
                          onClick={() => onStatusChange && onStatusChange(task.id, "IN_PROGRESS")}
                          className="w-4 h-4 text-slate-350 cursor-pointer hover:text-indigo-650 hover:scale-105 transition-all shrink-0" 
                        />
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-semibold text-slate-700 select-none line-clamp-1">{task.name}</span>
                          <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wide mt-0.5">{task.projectName}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-xs font-semibold shrink-0">
                        <span className={cn("px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wide font-extrabold", getPriorityStyles(task.priority))}>
                          {task.priority}
                        </span>
                        <span className={cn("w-20 text-right text-[11px]", dateInfo.color)}>{dateInfo.label}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* 3. UPCOMING */}
        {tasksUpcoming.length > 0 && (
          <div>
            <button 
              onClick={() => toggleSection("upcoming")}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold text-xs tracking-wider transition-colors mb-3 uppercase"
            >
              {sections.upcoming ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
              <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-[#fef3c7] text-[#d97706]">
                UPCOMING
              </span>
              <span className="text-[10px] text-slate-400 font-normal normal-case">
                • {tasksUpcoming.length} tasks
              </span>
            </button>

            {sections.upcoming && (
              <div className="pl-6 space-y-2.5">
                {tasksUpcoming.map((task) => {
                  const dateInfo = getDueDateLabel(task.dueDate, task.status);
                  return (
                    <div key={task.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50 rounded-xl px-2 transition-colors -mx-2">
                      <div className="flex items-center gap-3">
                        <Circle 
                          onClick={() => onStatusChange && onStatusChange(task.id, "IN_PROGRESS")}
                          className="w-4 h-4 text-slate-350 cursor-pointer hover:text-indigo-650 hover:scale-105 transition-all shrink-0" 
                        />
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-semibold text-slate-700 select-none line-clamp-1">{task.name}</span>
                          <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wide mt-0.5">{task.projectName}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-xs font-semibold shrink-0">
                        <span className={cn("px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wide font-extrabold", getPriorityStyles(task.priority))}>
                          {task.priority}
                        </span>
                        <span className={cn("w-20 text-right text-[11px]", dateInfo.color)}>{dateInfo.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 4. COMPLETED */}
        {tasksCompleted.length > 0 && (
          <div>
            <button 
              onClick={() => toggleSection("completed")}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold text-xs tracking-wider transition-colors mb-3 uppercase"
            >
              {sections.completed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
              <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-[#dcfce7] text-[#15803d]">
                COMPLETED
              </span>
              <span className="text-[10px] text-slate-400 font-normal normal-case">
                • {tasksCompleted.length} tasks
              </span>
            </button>

            {sections.completed && (
              <div className="pl-6 space-y-2.5">
                {tasksCompleted.map((task) => {
                  const dateInfo = getDueDateLabel(task.dueDate, task.status);
                  return (
                    <div key={task.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50 rounded-xl px-2 transition-colors -mx-2">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 
                          onClick={() => onStatusChange && onStatusChange(task.id, "IN_PROGRESS")}
                          className="w-4 h-4 text-emerald-500 cursor-pointer hover:text-indigo-650 hover:scale-105 transition-all shrink-0" 
                        />
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-semibold text-slate-500 line-through select-none line-clamp-1">{task.name}</span>
                          <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wide mt-0.5">{task.projectName}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-xs font-semibold shrink-0">
                        <span className={cn("px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wide font-extrabold opacity-75", getPriorityStyles(task.priority))}>
                          {task.priority}
                        </span>
                        <span className={cn("w-20 text-right text-[11px] opacity-75", dateInfo.color)}>{dateInfo.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
