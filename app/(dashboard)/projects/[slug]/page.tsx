"use client";

import { use, useState, useEffect } from "react";
import { 
  ChevronDown, 
  ChevronRight, 
  Star, 
  Sparkles, 
  Plus, 
  Circle, 
  Check, 
  ArrowLeft,
  Loader2,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Tabs navigation
const tabs = ["Overview", "List", "Board", "Table", "Calendar"];

interface Task {
  id: string;
  name: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "UPCOMING" | "COMPLETED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: string | null;
  assignee: string | null;
  assigneeInitials: string;
  assigneeColor: string;
}

interface Teammate {
  id: string;
  name: string;
  email: string;
  initials: string;
  color: string;
}

interface Project {
  id: string;
  name: string;
  slug: string;
  categoryTitle: string;
  color: string;
}

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export default function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug } = use(params);
  
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teammates, setTeammates] = useState<Teammate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Accordion open states
  const [inProgressOpen, setInProgressOpen] = useState(true);
  const [todoOpen, setTodoOpen] = useState(true);
  const [upcomingOpen, setUpcomingOpen] = useState(true);
  const [completedOpen, setCompletedOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("List");

  // Add Task Input State
  const [addingTaskForSection, setAddingTaskForSection] = useState<string | null>(null);
  const [newTaskName, setNewTaskName] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);

  // Status Selector Popover State
  const [activeStatusMenu, setActiveStatusMenu] = useState<string | null>(null);

  // Fetch Project Dataset
  const fetchProjectData = async () => {
    try {
      const response = await fetch(`/api/projects/${slug}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Project not found.");
        }
        throw new Error("Failed to load project details.");
      }
      const data = await response.json();
      setProject(data.project);
      setTasks(data.tasks);
      setTeammates(data.teammates);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [slug]);

  // Handle Task Status Update (Real PATCH API)
  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      // Optimistic client update
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as any } : t));
      setActiveStatusMenu(null);

      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status on server.");
      }
    } catch (error) {
      console.error(error);
      fetchProjectData(); // Revert/Sync on fail
    }
  };

  // Handle Task Delete (Real DELETE API)
  const handleDeleteTask = async (taskId: string) => {
    try {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
    } catch (error) {
      console.error("Failed to delete task:", error);
      fetchProjectData();
    }
  };

  // Handle Add Task Submission (Real POST API)
  const handleAddTask = async (e: React.FormEvent, sectionStatus: "TODO" | "IN_PROGRESS" | "UPCOMING" | "COMPLETED") => {
    e.preventDefault();
    if (!newTaskName.trim() || !project) return;

    setCreatingTask(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTaskName.trim(),
          projectId: project.id,
          status: sectionStatus,
        }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      setTasks(prev => [...prev, data.task]);
      setNewTaskName("");
      setAddingTaskForSection(null);
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setCreatingTask(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-650" />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Loading project deliverables...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="bg-red-50 border border-red-150 text-red-650 p-6 rounded-3xl max-w-xl mx-auto space-y-4 text-center mt-12">
        <h4 className="font-extrabold text-base">⚠️ Access Denied or Missing Project</h4>
        <p className="text-xs leading-relaxed font-semibold">{error || "The project slug is invalid."}</p>
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-bold text-red-800 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Return to Dashboard
        </Link>
      </div>
    );
  }

  // Group tasks client-side
  const tasksInProgress = tasks.filter(t => t.status === "IN_PROGRESS");
  const tasksTodo = tasks.filter(t => t.status === "TODO");
  const tasksUpcoming = tasks.filter(t => t.status === "UPCOMING");
  const tasksCompleted = tasks.filter(t => t.status === "COMPLETED");

  return (
    <div className="space-y-6 animate-fade-in pb-12 select-none">
      {/* Back link */}
      <Link 
        href="/dashboard" 
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-650 transition-colors uppercase tracking-wider"
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
            
            {/* Project Title */}
            <div className="flex items-center gap-2 cursor-pointer group">
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight leading-tight">
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

        {/* Tab Selection */}
        <div className="flex items-center gap-6 border-b border-slate-100 pb-0.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "text-xs font-bold uppercase tracking-wider pb-3 border-b-2 transition-all cursor-pointer relative",
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
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm min-h-[500px] space-y-6">
        <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
          {project.categoryTitle}
        </h3>

        {/* Task list groupings */}
        <div className="space-y-6">
          
          {/* 1. IN PROGRESS */}
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-50 mb-3">
              <button 
                onClick={() => setInProgressOpen(!inProgressOpen)}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold text-xs tracking-wider transition-colors uppercase"
              >
                {inProgressOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                <span className="bg-[#e0f4f0] text-[#14b8a6] px-2 py-0.5 rounded-md font-bold text-[10px]">
                  IN PROGRESS
                </span>
                <span className="text-[10px] text-slate-400 font-normal normal-case">
                  • {tasksInProgress.length} tasks
                </span>
              </button>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pr-4 hidden sm:block">Assignee</span>
            </div>

            {inProgressOpen && (
              <div className="space-y-1.5 pl-6">
                {tasksInProgress.map(task => (
                  <div key={task.id} className="flex items-center justify-between py-2.5 px-3 border border-slate-50 bg-slate-50/10 hover:bg-slate-50/40 rounded-2xl transition-all relative group">
                    <div className="flex items-center gap-3 pr-4">
                      {/* Checkbox circle triggers status dropdown popup */}
                      <div className="relative">
                        <Circle 
                          onClick={() => setActiveStatusMenu(activeStatusMenu === task.id ? null : task.id)}
                          className="w-4 h-4 text-slate-350 hover:text-indigo-600 hover:scale-105 transition-all cursor-pointer shrink-0" 
                        />
                        {activeStatusMenu === task.id && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setActiveStatusMenu(null)} />
                            <div className="absolute left-0 top-6 bg-white border border-slate-100 shadow-xl rounded-2xl py-2 w-40 z-40 animate-fade-in">
                              {["IN PROGRESS", "TO DO", "UPCOMING", "COMPLETED"].map(st => (
                                <button
                                  key={st}
                                  onClick={() => handleStatusChange(task.id, st.replace(" ", "_"))}
                                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-[10px] font-extrabold tracking-wider text-slate-655 hover:text-indigo-650 flex items-center justify-between uppercase transition-colors"
                                >
                                  <span>{st}</span>
                                  {task.status === st.replace(" ", "_") && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-slate-700 leading-snug line-clamp-2">{task.name}</span>
                    </div>

                    <div className="flex items-center gap-3.5 shrink-0">
                      {/* Trash action visible on hover */}
                      <button 
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className={cn("w-6 h-6 rounded-full text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-white shadow-xs", task.assigneeColor)} title={task.assignee || "Unassigned"}>
                        {task.assigneeInitials}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add task block */}
                {addingTaskForSection === "IN_PROGRESS" ? (
                  <form onSubmit={(e) => handleAddTask(e, "IN_PROGRESS")} className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="Task name..."
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 text-xs font-semibold outline-none focus:bg-white focus:border-indigo-500 text-slate-700 w-full max-w-sm"
                    />
                    <button type="submit" disabled={creatingTask} className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl font-bold text-[10px] hover:bg-indigo-700 cursor-pointer disabled:opacity-50">
                      {creatingTask ? "Adding..." : "Add"}
                    </button>
                    <button type="button" onClick={() => setAddingTaskForSection(null)} className="text-slate-400 hover:text-slate-600 font-bold text-[10px] px-2 py-1.5">Cancel</button>
                  </form>
                ) : (
                  <button onClick={() => setAddingTaskForSection("IN_PROGRESS")} className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-indigo-650 transition-colors py-2 pl-2 cursor-pointer">
                    <Plus className="w-4 h-4" /> Add task
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 2. TO DO */}
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-50 mb-3 mt-4">
              <button 
                onClick={() => setTodoOpen(!todoOpen)}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold text-xs tracking-wider transition-colors uppercase"
              >
                {todoOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                <span className="bg-[#eaf0fa] text-[#2563eb] px-2 py-0.5 rounded-md font-bold text-[10px]">
                  TO DO
                </span>
                <span className="text-[10px] text-slate-400 font-normal normal-case">
                  • {tasksTodo.length} tasks
                </span>
              </button>
            </div>

            {todoOpen && (
              <div className="space-y-1.5 pl-6">
                {tasksTodo.map(task => (
                  <div key={task.id} className="flex items-center justify-between py-2.5 px-3 border border-slate-50 bg-slate-50/10 hover:bg-slate-50/40 rounded-2xl transition-all relative group">
                    <div className="flex items-center gap-3 pr-4">
                      <div className="relative">
                        <Circle 
                          onClick={() => setActiveStatusMenu(activeStatusMenu === task.id ? null : task.id)}
                          className="w-4 h-4 text-slate-350 hover:text-indigo-600 hover:scale-105 transition-all cursor-pointer shrink-0" 
                        />
                        {activeStatusMenu === task.id && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setActiveStatusMenu(null)} />
                            <div className="absolute left-0 top-6 bg-white border border-slate-100 shadow-xl rounded-2xl py-2 w-40 z-40 animate-fade-in">
                              {["IN PROGRESS", "TO DO", "UPCOMING", "COMPLETED"].map(st => (
                                <button
                                  key={st}
                                  onClick={() => handleStatusChange(task.id, st.replace(" ", "_"))}
                                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-[10px] font-extrabold tracking-wider text-slate-655 hover:text-indigo-650 flex items-center justify-between uppercase transition-colors"
                                >
                                  <span>{st}</span>
                                  {task.status === st.replace(" ", "_") && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-slate-700 leading-snug line-clamp-2">{task.name}</span>
                    </div>

                    <div className="flex items-center gap-3.5 shrink-0">
                      <button 
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className={cn("w-6 h-6 rounded-full text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-white shadow-xs", task.assigneeColor)} title={task.assignee || "Unassigned"}>
                        {task.assigneeInitials}
                      </div>
                    </div>
                  </div>
                ))}

                {addingTaskForSection === "TODO" ? (
                  <form onSubmit={(e) => handleAddTask(e, "TODO")} className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="Task name..."
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 text-xs font-semibold outline-none focus:bg-white focus:border-indigo-500 text-slate-700 w-full max-w-sm"
                    />
                    <button type="submit" disabled={creatingTask} className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl font-bold text-[10px] hover:bg-indigo-700 cursor-pointer disabled:opacity-50">
                      {creatingTask ? "Adding..." : "Add"}
                    </button>
                    <button type="button" onClick={() => setAddingTaskForSection(null)} className="text-slate-400 hover:text-slate-600 font-bold text-[10px] px-2 py-1.5">Cancel</button>
                  </form>
                ) : (
                  <button onClick={() => setAddingTaskForSection("TODO")} className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-indigo-650 transition-colors py-2 pl-2 cursor-pointer">
                    <Plus className="w-4 h-4" /> Add task
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 3. UPCOMING */}
          {tasksUpcoming.length > 0 && (
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-50 mb-3 mt-4">
                <button 
                  onClick={() => setUpcomingOpen(!upcomingOpen)}
                  className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold text-xs tracking-wider transition-colors uppercase"
                >
                  {upcomingOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <span className="bg-[#fef3c7] text-[#d97706] px-2 py-0.5 rounded-md font-bold text-[10px]">
                    UPCOMING
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal normal-case">
                    • {tasksUpcoming.length} tasks
                  </span>
                </button>
              </div>

              {upcomingOpen && (
                <div className="space-y-1.5 pl-6">
                  {tasksUpcoming.map(task => (
                    <div key={task.id} className="flex items-center justify-between py-2.5 px-3 border border-slate-50 bg-slate-50/10 hover:bg-slate-50/40 rounded-2xl transition-all relative group">
                      <div className="flex items-center gap-3 pr-4">
                        <div className="relative">
                          <Circle 
                            onClick={() => setActiveStatusMenu(activeStatusMenu === task.id ? null : task.id)}
                            className="w-4 h-4 text-slate-350 hover:text-indigo-600 hover:scale-105 transition-all cursor-pointer shrink-0" 
                          />
                          {activeStatusMenu === task.id && (
                            <>
                              <div className="fixed inset-0 z-30" onClick={() => setActiveStatusMenu(null)} />
                              <div className="absolute left-0 top-6 bg-white border border-slate-100 shadow-xl rounded-2xl py-2 w-40 z-40 animate-fade-in">
                                {["IN PROGRESS", "TO DO", "UPCOMING", "COMPLETED"].map(st => (
                                  <button
                                    key={st}
                                    onClick={() => handleStatusChange(task.id, st.replace(" ", "_"))}
                                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-[10px] font-extrabold tracking-wider text-slate-655 hover:text-indigo-650 flex items-center justify-between uppercase transition-colors"
                                  >
                                    <span>{st}</span>
                                    {task.status === st.replace(" ", "_") && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-slate-700 leading-snug line-clamp-2">{task.name}</span>
                      </div>

                      <div className="flex items-center gap-3.5 shrink-0">
                        <button 
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                          title="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className={cn("w-6 h-6 rounded-full text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-white shadow-xs", task.assigneeColor)} title={task.assignee || "Unassigned"}>
                          {task.assigneeInitials}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. COMPLETED */}
          {tasksCompleted.length > 0 && (
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-50 mb-3 mt-4">
                <button 
                  onClick={() => setCompletedOpen(!completedOpen)}
                  className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold text-xs tracking-wider transition-colors uppercase"
                >
                  {completedOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <span className="bg-[#dcfce7] text-[#15803d] px-2 py-0.5 rounded-md font-bold text-[10px]">
                    COMPLETED
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal normal-case">
                    • {tasksCompleted.length} tasks
                  </span>
                </button>
              </div>

              {completedOpen && (
                <div className="space-y-1.5 pl-6">
                  {tasksCompleted.map(task => (
                    <div key={task.id} className="flex items-center justify-between py-2.5 px-3 border border-slate-50 bg-slate-50/10 hover:bg-slate-50/40 rounded-2xl transition-all relative group">
                      <div className="flex items-center gap-3 pr-4">
                        <div className="relative">
                          <Circle 
                            onClick={() => setActiveStatusMenu(activeStatusMenu === task.id ? null : task.id)}
                            className="w-4 h-4 text-emerald-500 hover:text-indigo-600 hover:scale-105 transition-all cursor-pointer shrink-0" 
                          />
                          {activeStatusMenu === task.id && (
                            <>
                              <div className="fixed inset-0 z-30" onClick={() => setActiveStatusMenu(null)} />
                              <div className="absolute left-0 top-6 bg-white border border-slate-100 shadow-xl rounded-2xl py-2 w-40 z-40 animate-fade-in">
                                {["IN PROGRESS", "TO DO", "UPCOMING", "COMPLETED"].map(st => (
                                  <button
                                    key={st}
                                    onClick={() => handleStatusChange(task.id, st.replace(" ", "_"))}
                                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-[10px] font-extrabold tracking-wider text-slate-655 hover:text-indigo-650 flex items-center justify-between uppercase transition-colors"
                                  >
                                    <span>{st}</span>
                                    {task.status === st.replace(" ", "_") && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-slate-500 line-through leading-snug line-clamp-2">{task.name}</span>
                      </div>

                      <div className="flex items-center gap-3.5 shrink-0">
                        <button 
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                          title="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className={cn("w-6 h-6 rounded-full text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-white shadow-xs opacity-75", task.assigneeColor)} title={task.assignee || "Unassigned"}>
                          {task.assigneeInitials}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
