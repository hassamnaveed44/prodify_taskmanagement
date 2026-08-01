"use client";

import { useState, useEffect } from "react";
import { Sparkles, MessageSquare, Plus, Link2 } from "lucide-react";
import TasksPanel from "@/components/dashboard/tasks-panel";
import GoalsPanel from "@/components/dashboard/goals-panel";
import ProjectsPanel from "@/components/dashboard/projects-panel";
import CalendarPanel from "@/components/dashboard/calendar-panel";
import RemindersPanel from "@/components/dashboard/reminders-panel";

export default function DashboardPage() {
  const [userName, setUserName] = useState("Hassam");

  // Fetch logged in user details to display dynamic greeting name
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) {
          return res.json().then((data) => {
            if (data.user?.name) {
              const firstName = data.user.name.trim().split(/\s+/)[0];
              if (firstName) {
                setUserName(firstName);
              }
            }
          });
        } else {
          console.warn("Could not retrieve user details for greeting.");
        }
      })
      .catch(() => {
        // Fallback to default Hassam
      });
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Dynamic/Mock Greeting Header */}
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
          <TasksPanel />
          <GoalsPanel />
        </div>

        {/* Right column (40% width) - Projects, Calendar, Reminders */}
        <div className="lg:col-span-5 space-y-8 flex flex-col">
          <ProjectsPanel />
          <CalendarPanel />
          <RemindersPanel />
        </div>
      </div>
    </div>
  );
}
