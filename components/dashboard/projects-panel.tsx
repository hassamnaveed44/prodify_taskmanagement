"use client";

import { Briefcase, ChevronDown, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const projects = [
  {
    name: "Product launch",
    tasks: 8,
    teammates: 12,
    color: "from-purple-500 to-indigo-600",
  },
  {
    name: "Team brainstorm",
    tasks: 2,
    teammates: 32,
    color: "from-blue-500 to-indigo-500",
  },
  {
    name: "Branding launch",
    tasks: 4,
    teammates: 9,
    color: "from-teal-400 to-cyan-500",
  },
];

export default function ProjectsPanel() {
  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-50 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Briefcase className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-slate-800 text-base">Projects</h3>
        </div>
        <button className="flex items-center gap-1 text-xs font-semibold text-slate-450 hover:text-slate-700 transition-colors">
          Recents <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid of Projects */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
        {/* Create new project card */}
        <div className="border border-dashed border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer group hover:border-indigo-400 hover:bg-slate-50/50 transition-all duration-300 min-h-[120px]">
          <div className="w-10 h-10 rounded-full border border-slate-200 group-hover:border-indigo-400 group-hover:bg-indigo-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-all duration-350 shadow-sm">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-450 group-hover:text-indigo-600 transition-colors">
            Create new project
          </span>
        </div>

        {/* Existing Projects */}
        {projects.map((project) => (
          <div 
            key={project.name} 
            className="border border-slate-100 bg-slate-50/30 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-slate-200 hover:-translate-y-0.5 transition-all duration-300"
          >
            {/* Logo/Icon Container */}
            <div className={cn("w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shrink-0 shadow-sm", project.color)}>
              <Sparkles className="w-5 h-5" />
            </div>

            {/* Project Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-800 truncate mb-0.5 hover:text-indigo-600 transition-colors">
                {project.name}
              </h4>
              <p className="text-[11px] text-slate-400 font-medium">
                {project.tasks} tasks <span className="mx-1">•</span> {project.teammates} teammates
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
