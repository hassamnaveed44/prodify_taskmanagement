"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { cn } from "@/lib/utils";
import { BellRing, X } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  initials: string;
}

interface WorkspaceProfile {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface ProjectProfile {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface ToastNotification {
  id: string;
  message: string;
}

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceProfile | null>(null);
  const [projects, setProjects] = useState<ProjectProfile[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  
  // Real-time system notifications state
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Fetch logged-in user profile details on load
  const fetchProfileData = () => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Failed to retrieve session profile.");
      })
      .then((data) => {
        setUser(data.user);
        setWorkspace(data.workspace);
        setProjects(data.projects || []);
        setWorkspaces(data.workspaces || []);
      })
      .catch((err) => {
        console.error("Error loading user profile in layout:", err);
      });
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  // Listen to background WebSocket notifications for live updates
  useEffect(() => {
    if (!user || !workspace) return;

    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//${window.location.hostname}:3001`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      // Register this socket to listen only to notifications belonging to this workspace
      socket.send(
        JSON.stringify({
          type: "join",
          workspaceId: workspace.id,
          userId: user.id,
        })
      );
    };

    socket.onmessage = (event) => {
      try {
        const packet = JSON.parse(event.data);
        if (packet.type === "notification" && packet.message) {
          const newToast: ToastNotification = {
            id: Math.random().toString(),
            message: packet.message,
          };
          
          // Append to toasts list
          setToasts((prev) => [...prev, newToast]);

          // Auto remove toast after 4.5 seconds
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
          }, 4500);
        }
      } catch (err) {
        console.error("Failed to parse background live notification:", err);
      }
    };

    return () => {
      socket.close();
    };
  }, [user]);

  // Handle Project Creation from Sidebar (Real POST API integration)
  const handleCreateProject = async (projectName: string) => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName }),
      });
      if (res.ok) {
        fetchProfileData(); // Reload projects lists dynamically
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to create project.");
      }
    } catch (err) {
      console.error("Project creation failed:", err);
    }
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#f6f8fb]">
      
      {/* 1. Desktop Left Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:h-full shrink-0">
        <Sidebar 
          user={user} 
          workspace={workspace} 
          projects={projects}
          onAddProject={handleCreateProject}
        />
      </div>

      {/* 2. Mobile Sidebar Overlay & Drawer */}
      <div 
        className={cn(
          "fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-50 transition-opacity duration-300 md:hidden",
          isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Slide-over sidebar container */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 w-64 bg-white z-50 shadow-2xl md:hidden transform transition-transform duration-300 ease-in-out flex flex-col h-full",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar 
          user={user} 
          workspace={workspace} 
          projects={projects}
          onAddProject={handleCreateProject}
          onClose={() => setIsSidebarOpen(false)} 
        />
      </div>

      {/* 3. Main Display Panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <Header 
          user={user} 
          workspace={workspace} 
          workspaces={workspaces}
          onMenuClick={() => setIsSidebarOpen(true)} 
        />

        {/* Scrollable Workspace Pages */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 relative">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>

      {/* Floating Real-time Notifications Container (Toaster) */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            className="bg-slate-900/95 backdrop-blur-sm text-white border border-slate-800 rounded-2xl p-4 shadow-2xl flex items-start gap-3 animate-fade-in pointer-events-auto"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <BellRing className="w-4.5 h-4.5 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0 text-left pt-0.5">
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-indigo-400">Workspace Update</span>
              <p className="text-[11px] font-semibold text-slate-100 leading-normal mt-0.5 break-words select-text">
                {toast.message}
              </p>
            </div>
            <button 
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white transition-colors p-0.5"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
