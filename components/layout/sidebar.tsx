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
  { name: "Product launch", color: "bg-indigo-650" },
  { name: "Team brainstorm", color: "bg-indigo-600" },
  { name: "Branding launch", color: "bg-teal-500" },
];

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <aside className="w-64 border-r border-slate-100 bg-white flex flex-col h-full p-6 justify-between select-none relative">
      {/* Mobile Close Button */}
      {onClose && (
        <button 
          onClick={onClose}
          className="md:hidden absolute top-6 right-4 text-slate-400 hover:text-slate-650 p-1 rounded-lg hover:bg-slate-50 transition-colors z-50"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Top Section */}
      <div className="space-y-6">
        
        {/* User Profile Card (Matches Top of Sidebar in target UI) */}
        <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-2xl cursor-pointer transition-colors border border-slate-50 shadow-xs">
          <div className="flex items-center gap-3">
            {/* Avatar with initials or face shape */}
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-sm shrink-0 relative">
              HN
              {/* Online status green dot */}
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white"></span>
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800 text-xs leading-tight tracking-tight">Hassam Naveed</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Online</p>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        </div>

        {/* Main Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200",
                  isActive 
                    ? "bg-indigo-50/70 text-indigo-600" 
                    : "text-slate-550 hover:bg-slate-50/60 hover:text-slate-800"
                )}
              >
                <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-indigo-600" : "text-slate-455")} />
                <span>{item.name}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto text-indigo-600 shrink-0" />}
              </Link>
            );
          })}

          {/* Projects Category */}
          <div className="pt-6">
            <div className="px-4 flex items-center justify-between text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2">
              <span>My Projects</span>
              <button className="text-indigo-655 hover:text-indigo-800 transition-colors p-0.5 rounded flex items-center gap-0.5 text-[10px] lowercase font-bold normal-case">
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            <div className="space-y-1">
              {projects.map((project) => {
                const projectPath = `/projects/${project.name.toLowerCase().replace(" ", "-")}`;
                const isProjectActive = pathname === projectPath;
                return (
                  <Link
                    key={project.name}
                    href={projectPath}
                    onClick={handleLinkClick}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200",
                      isProjectActive 
                        ? "bg-slate-50 text-indigo-650"
                        : "text-slate-555 hover:bg-slate-50/50 hover:text-slate-800"
                    )}
                  >
                    <span className={cn("w-2 h-2 rounded-full shrink-0", project.color)} />
                    <span className="truncate">{project.name}</span>
                    {isProjectActive && <ChevronRight className="w-4 h-4 ml-auto text-indigo-600 shrink-0" />}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="pt-6 space-y-4">
        {/* Settings */}
        <Link
          href="/settings"
          onClick={handleLinkClick}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200",
            pathname === "/settings"
              ? "bg-indigo-50/70 text-indigo-600"
              : "text-slate-555 hover:bg-slate-50/60 hover:text-slate-800"
          )}
        >
          <Settings className={cn("w-5 h-5 shrink-0", pathname === "/settings" ? "text-indigo-600" : "text-slate-455")} />
          <span>Settings</span>
          {pathname === "/settings" && <ChevronRight className="w-4 h-4 ml-auto text-indigo-600 shrink-0" />}
        </Link>

        {/* Invite Card - Restored at the bottom as shown in first SS */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-650 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl translate-x-4 -translate-y-4"></div>
          <h3 className="font-semibold text-sm mb-1 z-10 relative">prodify</h3>
          <p className="text-[11px] text-white/80 leading-relaxed mb-3 z-10 relative">
            New members will gain access to public Spaces, Docs and Dashboards.
          </p>
          <button className="w-full bg-white text-indigo-600 font-bold text-xs py-2 px-4 rounded-xl shadow hover:bg-slate-55 transition-colors z-10 relative cursor-pointer">
            Invite people
          </button>
        </div>
      </div>
    </aside>
  );
}
