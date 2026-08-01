"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f8fb]">
      
      {/* 1. Desktop Left Sidebar (Always visible on large screens) */}
      <div className="hidden md:flex md:w-64 md:flex-col md:h-full shrink-0">
        <Sidebar />
      </div>

      {/* 2. Mobile Sidebar Overlay & Drawer Drawer */}
      {/* Backdrop overlay */}
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
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* 3. Main Display Panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

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
