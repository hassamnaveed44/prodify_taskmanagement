"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { cn } from "@/lib/utils";
import { BellRing, X } from "lucide-react";
import { ToastProvider, useToast } from "@/components/ui/toast-provider";

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

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const toast = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceProfile | null>(null);
  const [projects, setProjects] = useState<ProjectProfile[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  
  // Ref to track notified task deadlines to avoid spamming
  const notifiedDeadlinesRef = useRef<Record<string, boolean>>({});

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
          toast.info(packet.message);
        } else if (packet.type === "dm" && packet.message) {
          if (packet.message.senderId !== user.id) {
            const isInboxPage = window.location.pathname === "/inbox";
            if (!isInboxPage) {
              toast.info(`💬 Message from ${packet.message.authorName}: "${packet.message.content}"`);
            }
          }
        }
      } catch (err) {
        console.error("Failed to parse background live notification:", err);
      }
    };

    return () => {
      socket.close();
    };
  }, [user, workspace, toast]);

  // Periodic upcoming task deadlines checker (due within 24 hours)
  useEffect(() => {
    if (!user || !workspace) return;

    const fetchAndCheckDeadlines = async () => {
      try {
        const res = await fetch("/api/tasks");
        if (!res.ok) return;
        const data = await res.json();
        const tasksList = data.tasks || [];
        
        const now = new Date();
        tasksList.forEach((task: any) => {
          if (task.status !== "COMPLETED" && task.dueDate) {
            const dueDate = new Date(task.dueDate);
            const diffTime = dueDate.getTime() - now.getTime();
            const diffHours = diffTime / (1000 * 60 * 60);

            // Trigger alert if task is due within 24 hours and is in the future
            if (diffHours > 0 && diffHours <= 24) {
              if (!notifiedDeadlinesRef.current[task.id]) {
                const hoursLeft = Math.max(1, Math.round(diffHours));
                toast.error(`⏰ Deadline warning: Task "${task.name}" is due in ${hoursLeft} hours!`);
                notifiedDeadlinesRef.current[task.id] = true;
              }
            }
          }
        });
      } catch (err) {
        console.error("Failed to check task deadlines:", err);
      }
    };

    // Run check immediately on load
    fetchAndCheckDeadlines();

    // Check deadlines every 3 minutes
    const interval = setInterval(fetchAndCheckDeadlines, 180000);
    return () => clearInterval(interval);
  }, [user, workspace, toast]);

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
        toast.error(errData.error || "Failed to create project.");
      }
    } catch (err) {
      console.error("Project creation failed:", err);
      toast.error("An unexpected error occurred while creating the project.");
    }
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
    </div>
  );
}
