"use client";

import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Lock, Share2, Plus, Copy, ShieldCheck } from "lucide-react";

interface BrowserFrameProps {
  children: React.ReactNode;
}

export default function BrowserFrame({ children }: BrowserFrameProps) {
  const pathname = usePathname();

  // Map route pathnames to mock URL strings
  const getMockUrl = (path: string) => {
    if (path === "/dashboard") return "app.prodify.com/5623800/home";
    if (path === "/prodify-ai") return "app.prodify.com/5623800/prodify-ai";
    if (path === "/my-tasks") return "app.prodify.com/5623800/my-tasks";
    if (path === "/inbox") return "app.prodify.com/5623800/inbox";
    if (path === "/calendar") return "app.prodify.com/5623800/calendar";
    if (path === "/reports") return "app.prodify.com/5623800/reports";
    if (path === "/settings") return "app.prodify.com/5623800/settings";
    if (path.startsWith("/projects/")) {
      const slug = path.split("/").pop();
      return `app.prodify.com/5623800/projects/${slug}`;
    }
    return `app.prodify.com/5623800${path}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-violet-200 via-indigo-150 to-pink-200 p-2 sm:p-4 md:p-8 flex items-center justify-center">
      {/* Centered browser container */}
      <div className="w-full max-w-[1440px] h-[94vh] bg-white rounded-3xl border border-white/30 shadow-2xl flex flex-col overflow-hidden animate-fade-in">
        
        {/* Safari/Browser Top Bar Header */}
        <div className="h-12 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between px-4 shrink-0 select-none">
          {/* macOS window controls */}
          <div className="flex items-center gap-2 w-32">
            <span className="w-3 h-3 rounded-full bg-red-400 hover:bg-red-500 transition-colors cursor-pointer"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-400 hover:bg-yellow-500 transition-colors cursor-pointer"></span>
            <span className="w-3 h-3 rounded-full bg-green-400 hover:bg-green-500 transition-colors cursor-pointer"></span>
            
            {/* Back/Forward Navigation arrows */}
            <div className="flex items-center gap-1 ml-4 text-slate-350">
              <ChevronLeft className="w-4 h-4 cursor-pointer hover:text-slate-600 transition-colors" />
              <ChevronRight className="w-4 h-4 cursor-pointer hover:text-slate-600 transition-colors" />
            </div>
          </div>

          {/* Safari URL address bar */}
          <div className="flex-1 max-w-xl relative flex items-center justify-center">
            <div className="w-full bg-white border border-slate-100 rounded-lg py-1 px-4 text-xs font-semibold text-slate-500 text-center flex items-center justify-center gap-1.5 shadow-inner">
              <Lock className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{getMockUrl(pathname)}</span>
            </div>
          </div>

          {/* Browser utilities */}
          <div className="flex items-center justify-end gap-3 w-32 text-slate-400">
            <Share2 className="w-4 h-4 cursor-pointer hover:text-slate-650 transition-colors" />
            <Plus className="w-4 h-4 cursor-pointer hover:text-slate-650 transition-colors" />
            <Copy className="w-4 h-4 cursor-pointer hover:text-slate-650 transition-colors" />
          </div>
        </div>

        {/* The Actual Next.js Page Workspace */}
        <div className="flex-1 flex overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
