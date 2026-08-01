"use client";

import { use } from "react";
import { Sparkles, CheckSquare, Users, Target, ArrowLeft, Plus, Circle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Mock data structured by project slug
const projectDetails: Record<string, {
  name: string;
  tasksCount: number;
  teammates: string[];
  goalsCount: number;
  progress: number;
  color: string;
  description: string;
  tasksList: Array<{ name: string; priority: string; priorityColor: string; dueDate: string; status: string }>;
}> = {
  "product-launch": {
    name: "Product launch",
    tasksCount: 8,
    teammates: ["Hassam", "Courtney", "Devin", "John", "Sarah", "Alex"],
    goalsCount: 2,
    progress: 73,
    color: "from-purple-500 to-indigo-600",
    description: "Preparation for the public beta release of the Prodify workspace application, compiling feedback and deploying assets.",
    tasksList: [
      { name: "One-on-One Meeting", priority: "High", priorityColor: "bg-red-50 text-red-500", dueDate: "Today", status: "In Progress" },
      { name: "Send a summary email to stakeholders", priority: "Low", priorityColor: "bg-slate-50 text-slate-500", dueDate: "3 days left", status: "In Progress" },
      { name: "Finalize deployment script and keys", priority: "High", priorityColor: "bg-red-50 text-red-500", dueDate: "Tomorrow", status: "To Do" },
      { name: "Draft public release notes documentation", priority: "Medium", priorityColor: "bg-amber-50 text-amber-500", dueDate: "5 days left", status: "To Do" }
    ]
  },
  "team-brainstorm": {
    name: "Team brainstorm",
    tasksCount: 2,
    teammates: ["Hassam", "Devin", "John", "Kate", "James"],
    goalsCount: 1,
    progress: 63,
    color: "from-blue-500 to-indigo-500",
    description: "Weekly collaborative design sync to model upcoming AI functionalities and database structures for Phase 2.",
    tasksList: [
      { name: "Review code comments & PR feedback", priority: "Medium", priorityColor: "bg-amber-50 text-amber-500", dueDate: "Tomorrow", status: "To Do" },
      { name: "Brainstorm new user onboarding layouts", priority: "Low", priorityColor: "bg-slate-50 text-slate-500", dueDate: "Next week", status: "To Do" }
    ]
  },
  "branding-launch": {
    name: "Branding launch",
    tasksCount: 4,
    teammates: ["Hassam", "Courtney", "Sarah", "Emily"],
    goalsCount: 0,
    progress: 45,
    color: "from-teal-400 to-cyan-500",
    description: "Revamping marketing website copy, color tokens, visual styles, and logo packages for modern client-facing aesthetics.",
    tasksList: [
      { name: "Export final vector assets for logos", priority: "High", priorityColor: "bg-red-50 text-red-500", dueDate: "2 days left", status: "In Progress" },
      { name: "Draft copy for landing page conversion", priority: "Medium", priorityColor: "bg-amber-50 text-amber-500", dueDate: "3 days left", status: "To Do" }
    ]
  }
};

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export default function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug } = use(params);
  const project = projectDetails[slug] || {
    name: "Project Detail",
    tasksCount: 0,
    teammates: [],
    goalsCount: 0,
    progress: 0,
    color: "from-slate-400 to-slate-500",
    description: "Project details are loading or do not exist in the mock datasets.",
    tasksList: []
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Go Back Link */}
      <Link 
        href="/dashboard" 
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-wider"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* Hero Banner Grid Card */}
      <div className={cn("bg-gradient-to-br text-white rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6", project.color)}>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">{project.name}</h2>
          </div>
          <p className="text-white/80 text-xs md:text-sm max-w-2xl leading-relaxed">
            {project.description}
          </p>
        </div>

        {/* Floating statistics widget */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 md:p-6 flex flex-row items-center gap-6 divide-x divide-white/15 min-w-[240px] shrink-0 border border-white/5 shadow-inner select-none">
          <div className="flex-1 text-center">
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-1">Tasks</span>
            <span className="text-xl font-black">{project.tasksCount}</span>
          </div>
          <div className="flex-1 text-center pl-6">
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-1">Teammates</span>
            <span className="text-xl font-black">{project.teammates.length}</span>
          </div>
          <div className="flex-1 text-center pl-6">
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-1">Progress</span>
            <span className="text-xl font-black">{project.progress}%</span>
          </div>
        </div>
      </div>

      {/* Warning Notice about Mock Data */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 text-amber-700">
        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 shrink-0" />
        <p className="text-xs font-semibold leading-relaxed">
          <strong>Notice:</strong> This screen is currently rendering mock visual state files. In Phase 4, after we design the database in Phase 2 and build authentication in Phase 3, we will rewrite this file to query live relational datasets (tasks, members, and progress) from your native PostgreSQL database.
        </p>
      </div>

      {/* Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Area: Project Tasks */}
        <div className="lg:col-span-8 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-50">
            <div className="flex items-center gap-3">
              <CheckSquare className="w-5 h-5 text-indigo-650" />
              <h3 className="font-bold text-slate-800 text-base">Project Deliverables</h3>
            </div>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm">
              <Plus className="w-4 h-4" /> Add Task
            </button>
          </div>

          <div className="space-y-3">
            {project.tasksList.map((task, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between p-3 bg-slate-50/20 hover:bg-slate-50/50 border border-slate-50 rounded-2xl group transition-all"
              >
                <div className="flex items-center gap-3">
                  <Circle className="w-4 h-4 text-slate-350 hover:text-indigo-650 cursor-pointer transition-colors" />
                  <span className="text-sm font-semibold text-slate-750 line-clamp-1">{task.name}</span>
                </div>
                <div className="flex items-center gap-6 text-xs font-semibold shrink-0">
                  <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] tracking-wide", task.priorityColor)}>
                    {task.priority}
                  </span>
                  <span className="w-20 text-right text-slate-450">{task.dueDate}</span>
                </div>
              </div>
            ))}
            {project.tasksList.length === 0 && (
              <p className="text-xs text-slate-400 font-semibold text-center py-6">No tasks added to this project yet.</p>
            )}
          </div>
        </div>

        {/* Right Area: Goals & Teammates */}
        <div className="lg:col-span-4 space-y-8 flex flex-col">
          {/* Progress Goal Widget */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-indigo-650" />
              <h3 className="font-bold text-slate-800 text-base">Target Goal</h3>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Completed Tasks Ratio</span>
                <span>{project.progress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Project Teammates Widget */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-indigo-650" />
              <h3 className="font-bold text-slate-800 text-base">Teammates</h3>
            </div>

            <div className="space-y-3">
              {project.teammates.map((member) => (
                <div key={member} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-750 font-bold text-xs flex items-center justify-center select-none shadow-sm">
                    {member.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-slate-700">{member}</span>
                  {member === "Hassam" && (
                    <span className="bg-indigo-50 text-indigo-655 font-bold text-[9px] px-1.5 py-0.5 rounded ml-auto">owner</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
