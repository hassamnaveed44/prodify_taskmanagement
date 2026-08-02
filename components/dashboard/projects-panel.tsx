"use client";

import { useState } from "react";
import { Briefcase, ChevronDown, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  slug: string;
  taskCount: number;
  memberCount: number;
  color: string;
}

interface ProjectsPanelProps {
  projects: Project[];
  onCreateProject?: (name: string) => void;
}

export default function ProjectsPanel({ projects, onCreateProject }: ProjectsPanelProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const handleCreateConfirm = () => {
    if (newProjectName.trim() && onCreateProject) {
      onCreateProject(newProjectName.trim());
      setNewProjectName("");
      setIsModalOpen(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col h-full select-none relative">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-50 dark:border-slate-800 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Briefcase className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base">Projects</h3>
        </div>
        <button className="flex items-center gap-1 text-xs font-semibold text-slate-455 dark:text-slate-400 hover:text-slate-700 transition-colors">
          Recents <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid of Projects */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
        {/* Create new project card (trigger popup modal) */}
        <div 
          onClick={() => setIsModalOpen(true)}
          className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer group hover:border-indigo-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all duration-300 min-h-[120px]"
        >
          <div className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800 group-hover:border-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/50 flex items-center justify-center text-slate-400 dark:text-slate-550 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all duration-350 shadow-sm">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-450 dark:text-slate-400 group-hover:text-indigo-600 transition-colors">
            Create new project
          </span>
        </div>

        {/* Existing Projects */}
        {projects.map((project) => (
          <Link 
            key={project.id}
            href={`/projects/${project.slug}`}
            className="border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700 hover:-translate-y-0.5 transition-all duration-300 text-left"
          >
            <div className={cn("w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shrink-0 shadow-sm", project.color)}>
              <Sparkles className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate mb-0.5 hover:text-indigo-650 dark:hover:text-indigo-400 transition-colors">
                {project.name}
              </h4>
              <p className="text-[11px] text-slate-400 font-medium">
                {project.taskCount} tasks <span className="mx-1">•</span> {project.memberCount} teammates
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Custom Create Project Modal Popup */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-4 animate-fade-in">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm tracking-tight uppercase text-left">Create New Project</h3>
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block px-1">Project Name</label>
              <input 
                type="text" 
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g. Mobile Application"
                className="w-full text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-3 px-4 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition-all"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setNewProjectName("");
                }}
                className="text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 px-4 py-2 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateConfirm}
                className="bg-indigo-600 text-white text-xs font-extrabold px-4.5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
