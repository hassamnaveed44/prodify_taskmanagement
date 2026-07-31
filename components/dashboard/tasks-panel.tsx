"use client";

import { useState } from "react";
import { 
  CheckSquare, 
  MoreHorizontal, 
  Settings, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Circle 
} from "lucide-react";
import { cn } from "@/lib/utils";

// Static mock task data matching screenshot
const initialTasks = {
  inProgress: {
    label: "IN PROGRESS",
    color: "bg-[#e0f4f0] text-[#14b8a6]",
    tasks: [
      { id: "1", name: "One-on-One Meeting", priority: "High", priorityColor: "bg-red-50 text-red-500", dueDate: "Today", dateColor: "text-red-500" },
      { id: "2", name: "Send a summary email to stakeholders", priority: "Low", priorityColor: "bg-slate-50 text-slate-500", dueDate: "3 days left", dateColor: "text-slate-500" },
    ]
  },
  todo: {
    label: "TO DO",
    color: "bg-[#eaf0fa] text-[#2563eb]",
    tasks: [
      { id: "3", name: "Review code comments & PR feedback", priority: "Medium", priorityColor: "bg-amber-50 text-amber-500", dueDate: "Tomorrow", dateColor: "text-slate-500" }
    ]
  },
  upcoming: {
    label: "UPCOMING",
    color: "bg-[#fef3c7] text-[#d97706]",
    tasks: [
      { id: "4", name: "Draft Q3 workspace deliverables", priority: "Medium", priorityColor: "bg-amber-50 text-amber-500", dueDate: "Next week", dateColor: "text-slate-500" }
    ]
  }
};

export default function TasksPanel() {
  const [sections, setSections] = useState({
    inProgress: true,
    todo: false,
    upcoming: false,
  });

  const toggleSection = (key: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col">
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
        {/* IN PROGRESS */}
        <div>
          <button 
            onClick={() => toggleSection("inProgress")}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold text-xs tracking-wider transition-colors mb-3 uppercase"
          >
            {sections.inProgress ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span className={cn("px-2 py-0.5 rounded-md font-bold text-[10px]", initialTasks.inProgress.color)}>
              {initialTasks.inProgress.label}
            </span>
            <span className="text-[10px] text-slate-400 font-normal normal-case">
              • {initialTasks.inProgress.tasks.length} tasks
            </span>
          </button>

          {sections.inProgress && (
            <div className="pl-6 space-y-2.5">
              {initialTasks.inProgress.tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50 rounded-xl px-2 transition-colors -mx-2">
                  <div className="flex items-center gap-3">
                    <Circle className="w-4 h-4 text-slate-350 cursor-pointer hover:text-indigo-600 transition-colors shrink-0" />
                    <span className="text-sm font-medium text-slate-700 select-none line-clamp-1">{task.name}</span>
                  </div>
                  <div className="flex items-center gap-6 text-xs font-semibold shrink-0">
                    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] tracking-wide", task.priorityColor)}>
                      {task.priority}
                    </span>
                    <span className={cn("w-20 text-right", task.dateColor)}>{task.dueDate}</span>
                  </div>
                </div>
              ))}
              
              <button className="flex items-center gap-2 text-xs font-semibold text-slate-450 hover:text-indigo-600 transition-colors py-2 pl-2">
                <Plus className="w-4 h-4" /> Add task
              </button>
            </div>
          )}
        </div>

        {/* TO DO */}
        <div>
          <button 
            onClick={() => toggleSection("todo")}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold text-xs tracking-wider transition-colors mb-3 uppercase"
          >
            {sections.todo ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span className={cn("px-2 py-0.5 rounded-md font-bold text-[10px]", initialTasks.todo.color)}>
              {initialTasks.todo.label}
            </span>
            <span className="text-[10px] text-slate-400 font-normal normal-case">
              • {initialTasks.todo.tasks.length} task
            </span>
          </button>

          {sections.todo && (
            <div className="pl-6 space-y-2.5">
              {initialTasks.todo.tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50 rounded-xl px-2 transition-colors -mx-2">
                  <div className="flex items-center gap-3">
                    <Circle className="w-4 h-4 text-slate-350 cursor-pointer hover:text-indigo-600 transition-colors shrink-0" />
                    <span className="text-sm font-medium text-slate-700 select-none line-clamp-1">{task.name}</span>
                  </div>
                  <div className="flex items-center gap-6 text-xs font-semibold shrink-0">
                    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] tracking-wide", task.priorityColor)}>
                      {task.priority}
                    </span>
                    <span className={cn("w-20 text-right", task.dateColor)}>{task.dueDate}</span>
                  </div>
                </div>
              ))}
              <button className="flex items-center gap-2 text-xs font-semibold text-slate-450 hover:text-indigo-600 transition-colors py-2 pl-2">
                <Plus className="w-4 h-4" /> Add task
              </button>
            </div>
          )}
        </div>

        {/* UPCOMING */}
        <div>
          <button 
            onClick={() => toggleSection("upcoming")}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold text-xs tracking-wider transition-colors mb-3 uppercase"
          >
            {sections.upcoming ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span className={cn("px-2 py-0.5 rounded-md font-bold text-[10px]", initialTasks.upcoming.color)}>
              {initialTasks.upcoming.label}
            </span>
            <span className="text-[10px] text-slate-400 font-normal normal-case">
              • {initialTasks.upcoming.tasks.length} task
            </span>
          </button>

          {sections.upcoming && (
            <div className="pl-6 space-y-2.5">
              {initialTasks.upcoming.tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50 rounded-xl px-2 transition-colors -mx-2">
                  <div className="flex items-center gap-3">
                    <Circle className="w-4 h-4 text-slate-350 cursor-pointer hover:text-indigo-600 transition-colors shrink-0" />
                    <span className="text-sm font-medium text-slate-700 select-none line-clamp-1">{task.name}</span>
                  </div>
                  <div className="flex items-center gap-6 text-xs font-semibold shrink-0">
                    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] tracking-wide", task.priorityColor)}>
                      {task.priority}
                    </span>
                    <span className={cn("w-20 text-right", task.dateColor)}>{task.dueDate}</span>
                  </div>
                </div>
              ))}
              <button className="flex items-center gap-2 text-xs font-semibold text-slate-450 hover:text-indigo-600 transition-colors py-2 pl-2">
                <Plus className="w-4 h-4" /> Add task
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
