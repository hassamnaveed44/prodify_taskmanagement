"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  X
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

// Mock Projects data matching design
const projects = [
  { name: "Product launch", color: "bg-indigo-600" },
  { name: "Team brainstorm", color: "bg-indigo-650" },
  { name: "Branding launch", color: "bg-teal-500" },
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

interface SidebarProps {
  user: UserProfile | null;
  workspace: WorkspaceProfile | null;
  onClose?: () => void;
}

export default function Sidebar({ user, workspace, onClose }: SidebarProps) {
  const pathname = usePathname();

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <aside className="w-64 border-r border-slate-100 bg-white flex flex-col h-full py-4 px-5 justify-between select-none overflow-hidden shrink-0">
      {/* Mobile Close Button */}
      {onClose && (
        <button 
          onClick={onClose}
          className="md:hidden absolute top-4 right-4 text-slate-400 hover:text-slate-650 p-1 rounded-lg hover:bg-slate-50 transition-colors z-50 animate-fade-in"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Top and middle sections container */}
      <div className="flex flex-col gap-3">
        {/* 1. User Profile Card (Dynamic user name and initials) */}
        <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-2xl cursor-pointer transition-colors border border-slate-100/50 shadow-xs bg-slate-50/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-sm shrink-0 relative">
              {user?.initials || "HN"}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white"></span>
            </div>
            <div>
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
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 select-none",
                  isActive 
                    ? "bg-indigo-50/70 text-indigo-600" 
                    : "text-slate-555 hover:bg-slate-50/60 hover:text-slate-800"
                )}
              >
                <Icon className={cn("w-4.5 h-4.5 shrink-0", isActive ? "text-indigo-600" : "text-slate-455")} />
                <span>{item.name}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-indigo-600 shrink-0" />}
              </Link>
            );
          })}
        </nav>

        {/* Thin Divider Line above Projects */}
        <div className="border-t border-slate-100 my-1" />

        {/* 3. Projects Category */}
        <div className="space-y-1.5">
          <div className="px-3 flex items-center justify-between text-[11px] font-bold text-slate-400 tracking-wider mb-1 select-none">
            <span>My Projects</span>
            <button className="text-indigo-650 hover:text-indigo-855 transition-colors p-0.5 rounded flex items-center gap-0.5 text-[10px] font-bold normal-case select-none">
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>

          <div className="space-y-0.5">
            {projects.map((project) => {
              const projectPath = `/projects/${project.name.toLowerCase().replace(" ", "-")}`;
              return (
                <Link
                  key={project.name}
                  href={projectPath}
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-555 hover:bg-slate-50/50 hover:text-slate-800 transition-all duration-150"
                >
                  <span className={cn("w-2 h-2 rounded-full shrink-0", project.color)} />
                  <span className="truncate">{project.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Thin Divider Line above Settings */}
        <div className="border-t border-slate-100 my-1" />

        {/* 4. Settings Link */}
        <div>
          <Link
            href="/settings"
            onClick={handleLinkClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 select-none",
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

      {/* 5. Pinned Invite Card */}
      <div className="pt-2">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-650 rounded-2xl p-4 text-white shadow-md relative overflow-hidden select-none">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-xl translate-x-4 -translate-y-4"></div>
          <h3 className="font-extrabold text-xs mb-1 z-10 relative flex items-center gap-1">
            <span className="text-[10px] animate-pulse">★</span> prodify
          </h3>
          <p className="text-[9px] text-white/70 leading-normal mb-3.5 z-10 relative">
            New members will gain access to public Spaces, Docs and Dashboards.
          </p>
          <button className="w-full bg-white text-indigo-600 font-extrabold text-[10px] py-1.5 px-3 rounded-xl shadow-xs hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-155 z-10 relative flex items-center justify-center gap-1 cursor-pointer">
            <Plus className="w-3 h-3 text-indigo-600" /> Invite people
          </button>
        </div>
      </div>
    </aside>
  );
}
