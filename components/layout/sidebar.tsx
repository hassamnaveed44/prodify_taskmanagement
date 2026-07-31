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
  HelpCircle,
  Briefcase
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
  { name: "Team brainstorm", color: "bg-blue-600" },
  { name: "Branding launch", color: "bg-teal-500" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-100 bg-white flex flex-col h-screen sticky top-0">
      {/* Logo Section */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">
          P
        </div>
        <div>
          <h1 className="font-semibold text-slate-800 text-lg leading-tight">Prodify</h1>
          <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">AI Workspace</p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-indigo-50/70 text-indigo-600" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-indigo-600" : "text-slate-400")} />
              {item.name}
            </Link>
          );
        })}

        {/* Projects Category */}
        <div className="pt-8">
          <div className="px-4 flex items-center justify-between text-xs font-semibold text-slate-400 tracking-wider uppercase mb-3">
            <span>My Projects</span>
            <button className="text-indigo-600 hover:text-indigo-700 transition-colors p-0.5 rounded hover:bg-indigo-50">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            {projects.map((project) => (
              <Link
                key={project.name}
                href={`/projects/${project.name.toLowerCase().replace(" ", "-")}`}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-850 transition-all"
              >
                <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", project.color)} />
                <span className="truncate">{project.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Settings & Bottom Card */}
      <div className="p-4 border-t border-slate-100 space-y-4">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
            pathname === "/settings"
              ? "bg-indigo-50/70 text-indigo-600"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
          )}
        >
          <Settings className="w-5 h-5 text-slate-400" />
          Settings
        </Link>

        {/* Premium Invitation Card */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl translate-x-4 -translate-y-4"></div>
          <h3 className="font-semibold text-sm mb-1 z-10 relative">prodify</h3>
          <p className="text-xs text-white/80 leading-relaxed mb-3 z-10 relative">
            New members will gain access to public Spaces, Docs and Dashboards.
          </p>
          <button className="w-full bg-white text-indigo-600 font-semibold text-xs py-2 px-4 rounded-xl shadow hover:bg-slate-50 transition-colors z-10 relative">
            Invite people
          </button>
        </div>
      </div>
    </aside>
  );
}
