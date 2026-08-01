"use client";

import { useState, useEffect } from "react";
import { Sparkles, MessageSquare, Plus, Link2, Loader2 } from "lucide-react";
import TasksPanel from "@/components/dashboard/tasks-panel";
import GoalsPanel from "@/components/dashboard/goals-panel";
import ProjectsPanel from "@/components/dashboard/projects-panel";
import CalendarPanel from "@/components/dashboard/calendar-panel";
import RemindersPanel from "@/components/dashboard/reminders-panel";

export default function DashboardPage() {
  const [userName, setUserName] = useState("Hassam");
  
  // Dashboard datasets state
  const [tasks, setTasks] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch logged in user profile details and dashboard datasets
  const fetchDashboardData = async () => {
    try {
      // 1. Fetch User details for greeting
      const userRes = await fetch("/api/auth/me");
      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.user?.name) {
          const firstName = userData.user.name.trim().split(/\s+/)[0];
          if (firstName) setUserName(firstName);
        }
      }

      // 2. Fetch Dashboard Datasets
      const dbRes = await fetch("/api/dashboard");
      if (dbRes.ok) {
        const dbData = await dbRes.json();
        setTasks(dbData.tasks);
        setGoals(dbData.goals);
        setProjects(dbData.projects);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Handle Task status update on the dashboard (Real PATCH API integration)
  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    try {
      // Optimistically update client state
      setTasks(prev => prev.map((t: any) => t.id === taskId ? { ...t, status: newStatus } : t));

      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error();
      
      // Re-fetch dashboard values to keep goals calculations synchronized
      const dbRes = await fetch("/api/dashboard");
      if (dbRes.ok) {
        const dbData = await dbRes.json();
        setTasks(dbData.tasks);
        setGoals(dbData.goals);
        setProjects(dbData.projects);
      }
    } catch (error) {
      console.error("Failed to update task status:", error);
      fetchDashboardData(); // Revert on fail
    }
  };

  // Handle Project Creation from Dashboard Grid (Real POST API integration)
  const handleCreateProject = async (name: string) => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        window.location.reload(); // Force full reload to update sidebar links and dashboard grid in one sync
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to create project.");
      }
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-650" />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Compiling workspace datasets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in select-none">
      {/* Greeting Header */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          Monday, July 7
        </p>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Hello, {userName}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xl font-medium text-[#14b8a6]">How can I help you today?</span>
              
              {/* Quick AI Trigger Button */}
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm hover:shadow-indigo-150 transition-all select-none cursor-pointer">
                <Sparkles className="w-3.5 h-3.5 fill-white/20" />
                Ask AI
              </button>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button className="bg-white border border-slate-100 hover:border-slate-200 text-slate-600 hover:text-slate-850 font-semibold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              Get tasks updates
            </button>
            <button className="bg-white border border-slate-100 hover:border-slate-200 text-slate-600 hover:text-slate-850 font-semibold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer">
              <Plus className="w-4 h-4 text-slate-400" />
              Create workspace
            </button>
            <button className="bg-white border border-slate-100 hover:border-slate-200 text-slate-600 hover:text-slate-850 font-semibold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer">
              <Link2 className="w-4 h-4 text-slate-400" />
              Connect apps
            </button>
          </div>
        </div>
      </div>

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column (60% width) - Tasks & Goals */}
        <div className="lg:col-span-7 space-y-8 flex flex-col">
          <TasksPanel tasks={tasks} onStatusChange={handleTaskStatusChange} />
          <GoalsPanel goals={goals} />
        </div>

        {/* Right column (40% width) - Projects, Calendar, Reminders */}
        <div className="lg:col-span-5 space-y-8 flex flex-col">
          <ProjectsPanel projects={projects} onCreateProject={handleCreateProject} />
          <CalendarPanel />
          <RemindersPanel />
        </div>
      </div>
    </div>
  );
}
