"use client";

import { use, useState } from "react";
import { 
  ChevronDown, 
  ChevronRight, 
  Star, 
  Sparkles, 
  Plus, 
  Circle, 
  Check, 
  ArrowLeft,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Tabs navigation
const tabs = ["Overview", "List", "Board", "Table", "Calendar"];

// Teammates details for avatars
const teammatesData: Record<string, { initials: string; color: string }> = {
  "Hassam": { initials: "HN", color: "bg-indigo-600" },
  "Courtney": { initials: "CH", color: "bg-orange-500" },
  "Devin": { initials: "DA", color: "bg-emerald-500" },
  "John": { initials: "JH", color: "bg-pink-500" },
  "Sarah": { initials: "SL", color: "bg-purple-500" },
  "Kate": { initials: "KT", color: "bg-blue-500" },
};

// Mock data structured by project slug matching the design
const projectDetails: Record<string, {
  name: string;
  categoryTitle: string;
  inProgressTasks: Array<{ id: string; name: string; assignee: string }>;
  todoTasks: Array<{ id: string; name: string; assignee: string }>;
  color: string;
}> = {
  "product-launch": {
    name: "Product launch",
    categoryTitle: "Product Development Goals",
    inProgressTasks: [
      { id: "p1", name: "Ensure all product features are fully developed and tested.", assignee: "Courtney" },
      { id: "p2", name: "Confirm that the product meets all quality standards.", assignee: "Devin" },
      { id: "p3", name: "Conduct Final Quality Assurance (QA) Testing.", assignee: "John" },
    ],
    todoTasks: [
      { id: "t1", name: "Ensure all product features are fully developed and tested.", assignee: "Sarah" },
      { id: "t2", name: "Create user manuals, installation guides, and troubleshooting documents.", assignee: "Devin" },
      { id: "t3", name: "Ensure all documentation is reviewed and approved.", assignee: "Kate" },
    ],
    color: "from-purple-500 to-indigo-600",
  },
  "team-brainstorm": {
    name: "Team brainstorm",
    categoryTitle: "Sprint Backlog Goals",
    inProgressTasks: [
      { id: "p1", name: "Outline functional API specifications for Gemini integration.", assignee: "Hassam" },
    ],
    todoTasks: [
      { id: "t1", name: "Review code comments & PR feedback.", assignee: "Devin" },
      { id: "t2", name: "Draft database relations logic on whiteboard.", assignee: "John" },
    ],
    color: "from-blue-500 to-indigo-500",
  },
  "branding-launch": {
    name: "Branding launch",
    categoryTitle: "Marketing & Visual Goals",
    inProgressTasks: [
      { id: "p1", name: "Export final vector assets for logos.", assignee: "Sarah" },
    ],
    todoTasks: [
      { id: "t1", name: "Draft copywriting outline for product landing page conversion.", assignee: "Courtney" },
    ],
    color: "from-teal-400 to-cyan-500",
  },
};

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export default function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug } = use(params);
  
  // State for collapsible lists
  const [inProgressOpen, setInProgressOpen] = useState(true);
  const [todoOpen, setTodoOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("List");

  // State for dropdown popover status select mock (Task p3 "Conduct QA testing" status selector)
  const [showStatusPopup, setShowStatusPopup] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("IN PROGRESS");

  const project = projectDetails[slug] || {
    name: "Project Detail",
    categoryTitle: "Development Goals",
    inProgressTasks: [],
    todoTasks: [],
    color: "from-slate-400 to-slate-500",
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Back link */}
      <Link 
        href="/dashboard" 
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-650 transition-colors uppercase tracking-wider select-none"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* Top Title Bar with tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo box */}
            <div className={cn("w-10 h-10 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shrink-0 shadow-sm shadow-indigo-100/50", project.color)}>
              <Sparkles className="w-5 h-5" />
            </div>
            
            {/* Project Title dropdown triggers */}
            <div className="flex items-center gap-2 cursor-pointer group">
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight leading-tight select-none">
                {project.name}
              </h2>
              <ChevronDown className="w-5 h-5 text-slate-450 group-hover:text-slate-700 transition-colors shrink-0" />
            </div>

            {/* Favorite Star */}
            <button className="text-slate-350 hover:text-amber-500 transition-colors p-1 rounded hover:bg-slate-50 shrink-0">
              <Star className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex items-center gap-6 border-b border-slate-100 pb-0.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "text-xs font-bold uppercase tracking-wider pb-3 border-b-2 transition-all cursor-pointer relative select-none",
                  isActive 
                    ? "border-indigo-600 text-indigo-600" 
                    : "border-transparent text-slate-400 hover:text-slate-700"
                )}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Container Content Sheet */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm min-h-[500px]">
        {/* Title */}
        <h3 className="text-base font-extrabold text-slate-800 mb-6 tracking-tight select-none">
          {project.categoryTitle}
        </h3>

        {/* Dynamic Project Data warning box */}
        <div className="bg-indigo-50/50 border border-indigo-100/50 text-indigo-700 p-3.5 rounded-2xl text-xs font-semibold leading-relaxed mb-6 select-none">
          💡 **Frontend UI Phase**: This screen simulates the interactive design from your reference layout. In Phase 4, we will hook it up to your native local PostgreSQL database via Prisma client queries to fetch actual task rows dynamically!
        </div>

        <div className="space-y-6">
          {/* SECTION 1: IN PROGRESS */}
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-50 mb-3">
              <button 
                onClick={() => setInProgressOpen(!inProgressOpen)}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold text-xs tracking-wider transition-colors uppercase select-none"
              >
                {inProgressOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                <span className="bg-[#e0f4f0] text-[#14b8a6] px-2 py-0.5 rounded-md font-bold text-[10px]">
                  IN PROGRESS
                </span>
                <span className="text-[10px] text-slate-400 font-normal normal-case">
                  • {project.inProgressTasks.length} tasks
                </span>
              </button>

              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pr-4 hidden sm:block">
                Assignee
              </span>
            </div>

            {inProgressOpen && (
              <div className="space-y-1.5 pl-6">
                {project.inProgressTasks.map((task) => {
                  const isSpecialTask = task.id === "p3" && slug === "product-launch";
                  const teammate = teammatesData[task.assignee] || { initials: "U", color: "bg-slate-400" };

                  return (
                    <div 
                      key={task.id} 
                      className="flex items-center justify-between py-2.5 px-3 border border-slate-50 bg-slate-50/10 hover:bg-slate-50/40 rounded-2xl transition-all relative group"
                    >
                      <div className="flex items-center gap-3 pr-4">
                        {/* Checkbox trigger */}
                        <div className="relative">
                          <Circle 
                            onClick={() => isSpecialTask && setShowStatusPopup(!showStatusPopup)}
                            className={cn(
                              "w-4 h-4 text-slate-350 cursor-pointer transition-colors shrink-0",
                              isSpecialTask ? "hover:text-indigo-600 hover:scale-105" : "hover:text-emerald-500"
                            )} 
                          />
                          
                          {/* MOCK Status selector popup as shown in SS2 */}
                          {isSpecialTask && showStatusPopup && (
                            <div className="absolute left-0 top-6 bg-white border border-slate-100 shadow-xl rounded-2xl py-2 w-40 z-50 animate-fade-in">
                              {["IN PROGRESS", "TO DO", "UPCOMING", "COMPLETED"].map((status) => (
                                <button
                                  key={status}
                                  onClick={() => {
                                    setSelectedStatus(status);
                                    setShowStatusPopup(false);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-[10px] font-extrabold tracking-wider text-slate-600 hover:text-indigo-650 flex items-center justify-between uppercase transition-colors"
                                >
                                  <span>{status}</span>
                                  {selectedStatus === status && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Task name */}
                        <span className="text-xs font-semibold text-slate-700 leading-snug line-clamp-2 select-none">
                          {task.name}
                        </span>
                      </div>

                      {/* Assignee Avatar */}
                      <div className="flex items-center gap-4 shrink-0">
                        {isSpecialTask && (
                          <span className="bg-[#e0f4f0] text-[#14b8a6] px-2 py-0.5 rounded font-bold text-[9px] uppercase tracking-wide hidden sm:inline-block">
                            {selectedStatus}
                          </span>
                        )}
                        <div 
                          className={cn("w-6 h-6 rounded-full text-[9px] font-bold text-white flex items-center justify-center select-none shadow-sm ring-2 ring-white", teammate.color)}
                          title={`Assignee: ${task.assignee}`}
                        >
                          {teammate.initials}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Add Task Button */}
                <button className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-indigo-650 transition-colors py-2 pl-2">
                  <Plus className="w-4 h-4" /> Add task
                </button>
              </div>
            )}
          </div>

          {/* SECTION 2: TO DO */}
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-50 mb-3 mt-4">
              <button 
                onClick={() => setTodoOpen(!todoOpen)}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold text-xs tracking-wider transition-colors uppercase select-none"
              >
                {todoOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                <span className="bg-[#eaf0fa] text-[#2563eb] px-2 py-0.5 rounded-md font-bold text-[10px]">
                  TO DO
                </span>
                <span className="text-[10px] text-slate-400 font-normal normal-case">
                  • {project.todoTasks.length} tasks
                </span>
              </button>
            </div>

            {todoOpen && (
              <div className="space-y-1.5 pl-6">
                {project.todoTasks.map((task) => {
                  const teammate = teammatesData[task.assignee] || { initials: "U", color: "bg-slate-400" };

                  return (
                    <div 
                      key={task.id} 
                      className="flex items-center justify-between py-2.5 px-3 border border-slate-50 bg-slate-50/10 hover:bg-slate-50/40 rounded-2xl transition-all group"
                    >
                      <div className="flex items-center gap-3 pr-4">
                        <Circle className="w-4 h-4 text-slate-350 hover:text-indigo-650 cursor-pointer transition-colors shrink-0" />
                        <span className="text-xs font-semibold text-slate-700 leading-snug line-clamp-2 select-none">
                          {task.name}
                        </span>
                      </div>

                      {/* Assignee Avatar */}
                      <div 
                        className={cn("w-6 h-6 rounded-full text-[9px] font-bold text-white flex items-center justify-center select-none shadow-sm shrink-0 ring-2 ring-white", teammate.color)}
                        title={`Assignee: ${task.assignee}`}
                      >
                        {teammate.initials}
                      </div>
                    </div>
                  );
                })}

                {/* Add Task Button */}
                <button className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-indigo-650 transition-colors py-2 pl-2">
                  <Plus className="w-4 h-4" /> Add task
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
