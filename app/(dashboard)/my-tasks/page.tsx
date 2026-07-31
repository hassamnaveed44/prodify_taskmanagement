"use client";

import { CheckSquare, Plus, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const mockTasks = [
  { id: "1", name: "One-on-One Meeting", project: "Product launch", priority: "High", priorityColor: "bg-red-50 text-red-500", dueDate: "Today", status: "In Progress" },
  { id: "2", name: "Send a summary email to stakeholders", project: "Product launch", priority: "Low", priorityColor: "bg-slate-50 text-slate-500", dueDate: "3 days left", status: "In Progress" },
  { id: "3", name: "Review code comments & PR feedback", project: "Team brainstorm", priority: "Medium", priorityColor: "bg-amber-50 text-amber-500", dueDate: "Tomorrow", status: "To Do" },
  { id: "4", name: "Draft Q3 workspace deliverables", project: "Product launch", priority: "Medium", priorityColor: "bg-amber-50 text-amber-500", dueDate: "Next week", status: "Upcoming" },
];

export default function MyTasksPage() {
  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <CheckSquare className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-slate-800 text-base">All Tasks</h3>
        </div>
        <button className="bg-indigo-650 hover:bg-indigo-755 text-white font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer">
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">Task Name</th>
              <th className="py-3 px-4">Project</th>
              <th className="py-3 px-4">
                <button className="flex items-center gap-1 hover:text-slate-700 transition-colors">
                  Status <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Due Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm font-medium text-slate-600">
            {mockTasks.map((task) => (
              <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-4 font-semibold text-slate-800">{task.name}</td>
                <td className="py-4 px-4 text-slate-400">{task.project}</td>
                <td className="py-4 px-4">
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
                    task.status === "In Progress" ? "bg-[#e0f4f0] text-[#14b8a6]" :
                    task.status === "To Do" ? "bg-[#eaf0fa] text-[#2563eb]" : "bg-[#fef3c7] text-[#d97706]"
                  )}>
                    {task.status}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] tracking-wide font-bold", task.priorityColor)}>
                    {task.priority}
                  </span>
                </td>
                <td className="py-4 px-4 text-slate-450">{task.dueDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
