"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useToast } from "@/components/ui/toast-provider";
import { 
  Home, 
  Bot, 
  CheckSquare, 
  Inbox, 
  Calendar, 
  BarChart2, 
  Settings, 
  Plus,
  ChevronRight,
  ChevronDown,
  X,
  BellRing
} from "lucide-react";
import { cn } from "@/lib/utils";

// Sidebar navigation items
const navItems = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Prodify AI", href: "/prodify-ai", icon: Bot },
  { name: "My tasks", href: "/my-tasks", icon: CheckSquare },
  { name: "Inbox", href: "/inbox", icon: Inbox },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Reports & Analytics", href: "/reports", icon: BarChart2 },
];

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

interface SidebarProps {
  user: UserProfile | null;
  workspace: WorkspaceProfile | null;
  projects: ProjectProfile[];
  onAddProject?: (projectName: string) => void;
  onClose?: () => void;
}

export default function Sidebar({ user, workspace, projects, onAddProject, onClose }: SidebarProps) {
  const pathname = usePathname();
  const toast = useToast();
  
  // Custom Create Project Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  // Custom Workspace Invite Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleCreateConfirm = () => {
    if (newProjectName.trim() && onAddProject) {
      onAddProject(newProjectName.trim());
      setNewProjectName("");
      setIsModalOpen(false);
    }
  };

  const handleInviteConfirm = async () => {
    if (!inviteEmail.trim()) return;
    try {
      const res = await fetch("/api/workspace/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Invitation successfully sent!");
        setIsInviteModalOpen(false);
        setInviteEmail("");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error(data.error || "Failed to invite member.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while sending the workspace invitation.");
    }
  };

  return (
    <aside className="w-64 border-r border-slate-100 bg-white flex flex-col h-full py-4 px-5 select-none overflow-hidden shrink-0 relative justify-between">
      {/* Mobile Close Button */}
      {onClose && (
        <button 
          onClick={onClose}
          className="md:hidden absolute top-4 right-4 text-slate-400 hover:text-slate-650 p-1 rounded-lg hover:bg-slate-50 transition-colors z-50"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Scrollable Upper Area (Profile + Navs + Projects + Settings) */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0 select-none scrollbar-none">
        
        {/* 1. User Profile Card */}
        <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-2xl cursor-pointer transition-colors border border-slate-100/50 shadow-xs bg-slate-50/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-sm shrink-0 relative">
              {user?.initials || "HN"}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white"></span>
            </div>
            <div className="text-left">
              <h4 className="font-extrabold text-slate-800 text-[11px] leading-tight tracking-tight truncate max-w-[120px]">
                {user?.name || "Hassam Naveed"}
              </h4>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Online</p>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </div>

        {/* 2. Main Navigation Links */}
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 select-none",
                  isActive 
                    ? "bg-indigo-50/70 text-indigo-600" 
                    : "text-slate-555 hover:bg-slate-50/60 hover:text-slate-850"
                )}
              >
                <Icon className={cn("w-4.5 h-4.5 shrink-0", isActive ? "text-indigo-600" : "text-slate-455")} />
                <span>{item.name}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-indigo-600 shrink-0" />}
              </Link>
            );
          })}
        </nav>

        {/* Thin Divider */}
        <div className="border-t border-slate-100" />

        {/* 3. Projects Category */}
        <div className="space-y-1.5">
          <div className="px-3 flex items-center justify-between text-[11px] font-bold text-slate-400 tracking-wider mb-1 select-none">
            <span>My Projects</span>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="text-indigo-600 hover:text-indigo-805 transition-colors p-0.5 rounded flex items-center gap-0.5 text-[10px] font-bold normal-case select-none cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>

          <div className="space-y-0.5 max-h-[140px] overflow-y-auto pr-1">
            {projects.length === 0 ? (
              <p className="text-slate-355 text-[10px] italic py-1 pl-3 text-left">No projects created yet.</p>
            ) : (
              projects.map((project) => {
                const projectPath = `/projects/${project.slug}`;
                return (
                  <Link
                    key={project.id}
                    href={projectPath}
                    onClick={handleLinkClick}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-555 hover:bg-slate-50/50 hover:text-slate-800 transition-all duration-150"
                  >
                    <span className={cn("w-2 h-2 rounded-full shrink-0", project.color)} />
                    <span className="truncate">{project.name}</span>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Thin Divider */}
        <div className="border-t border-slate-100" />

        {/* 4. Settings Link */}
        <div>
          <Link
            href="/settings"
            onClick={handleLinkClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 select-none",
              pathname === "/settings"
                ? "bg-indigo-50/70 text-indigo-600"
                : "text-slate-555 hover:bg-slate-50/60 hover:text-slate-800"
            )}
          >
            <Settings className={cn("w-4.5 h-4.5 shrink-0", pathname === "/settings" ? "text-indigo-600" : "text-slate-455")} />
            <span>Settings</span>
            {pathname === "/settings" && <ChevronRight className="w-3.5 h-3.5 ml-auto text-indigo-600 shrink-0" />}
          </Link>
        </div>
      </div>

      {/* 5. Pinned Invite Card (Permanently fixed at the bottom outside scroll container) */}
      <div className="pt-4 border-t border-slate-100 shrink-0 mt-auto">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-650 rounded-2xl p-4 text-white shadow-md relative overflow-hidden select-none">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-xl translate-x-4 -translate-y-4"></div>
          <h3 className="font-extrabold text-xs mb-1 z-10 relative flex items-center gap-1">
            <span className="text-[10px] animate-pulse">★</span> prodify
          </h3>
          <p className="text-[9px] text-white/70 leading-normal mb-3.5 z-10 relative">
            New members will gain access to public Spaces, Docs and Dashboards.
          </p>
          <button 
            onClick={() => setIsInviteModalOpen(true)}
            className="w-full bg-white text-indigo-600 font-extrabold text-[10px] py-1.5 px-3 rounded-xl shadow-xs hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 z-10 relative flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-600" /> Invite people
          </button>
        </div>
      </div>

      {/* Custom Create Project Modal Popup */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-4 animate-fade-in animate-scale-up">
            <h3 className="font-extrabold text-slate-800 text-sm tracking-tight uppercase text-left">Create New Project</h3>
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">Project Name</label>
              <input 
                type="text" 
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g. Mobile Application"
                className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition-all"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setNewProjectName("");
                }}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 px-4 py-2 cursor-pointer"
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

      {/* Custom Workspace Invite Modal Popup */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-4 animate-fade-in animate-scale-up">
            <h3 className="font-extrabold text-slate-800 text-sm tracking-tight uppercase text-left">Invite to Workspace</h3>
            <p className="text-[11px] text-slate-400 font-semibold leading-relaxed text-left">
              Type the email of the registered user you wish to invite to this workspace. They will automatically join all projects and chat channels.
            </p>
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">Email Address</label>
              <input 
                type="email" 
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="e.g. amir@prodify.com"
                className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition-all"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button 
                onClick={() => {
                  setIsInviteModalOpen(false);
                  setInviteEmail("");
                }}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 px-4 py-2 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleInviteConfirm}
                className="bg-indigo-650 text-white text-xs font-extrabold px-4.5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
