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
    <aside className="w-64 border-r border-slate-100 bg-white flex flex-col h-full relative p-6">
      {/* Mobile Close Button */}
      {onClose && (
        <button 
          onClick={onClose}
          className="md:hidden absolute top-6 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Logo Section */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-sm shadow-indigo-150">
          P
        </div>
        <div>
          <h1 className="font-extrabold text-slate-800 text-lg leading-tight tracking-tight">Prodify</h1>
          <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">AI WORKSPACE</p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={handleLinkClick}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-250 select-none",
                isActive 
                  ? "bg-indigo-50/70 text-indigo-600" 
                  : "text-slate-550 hover:bg-slate-50/60 hover:text-slate-800"
              )}
            >
              <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-indigo-600" : "text-slate-450")} />
              <span>{item.name}</span>
              {isActive && <ChevronRight className="w-4 h-4 ml-auto text-indigo-600 shrink-0" />}
            </Link>
          );
        })}

        {/* Projects Category */}
        <div className="pt-8">
          <div className="px-4 flex items-center justify-between text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-3 select-none">
            <span>My Projects</span>
            <button className="text-indigo-650 hover:text-indigo-800 transition-colors p-0.5 rounded flex items-center gap-0.5 text-[10px] lowercase font-bold tracking-normal normal-case">
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
                      : "text-slate-550 hover:bg-slate-50/50 hover:text-slate-800"
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

        {/* Settings - Immediately below Projects */}
        <div className="pt-4">
          <Link
            href="/settings"
            onClick={handleLinkClick}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 select-none",
              pathname === "/settings"
                ? "bg-indigo-50/70 text-indigo-600"
                : "text-slate-550 hover:bg-slate-50/60 hover:text-slate-800"
            )}
          >
            <Settings className={cn("w-5 h-5 shrink-0", pathname === "/settings" ? "text-indigo-600" : "text-slate-455")} />
            <span>Settings</span>
            {pathname === "/settings" && <ChevronRight className="w-4 h-4 ml-auto text-indigo-600 shrink-0" />}
          </Link>
        </div>
      </nav>
    </aside>
  );
}
