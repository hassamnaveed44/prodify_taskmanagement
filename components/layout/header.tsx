"use client";

import { Search, Bell, HelpCircle } from "lucide-react";

export default function Header() {
  return (
    <header className="h-16 border-b border-slate-100 bg-white flex items-center justify-between px-8 sticky top-0 z-40">
      {/* Search Bar */}
      <div className="flex-1 max-w-lg relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search anything..."
          className="w-full bg-slate-50/50 border border-slate-100 rounded-full py-2 pl-11 pr-4 text-sm text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
        />
      </div>

      {/* Right Icons & User Profile */}
      <div className="flex items-center gap-6">
        {/* Help Icon */}
        <button className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-50">
          <HelpCircle className="w-5.5 h-5.5" />
        </button>

        {/* Notifications */}
        <button className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-50 relative">
          <Bell className="w-5.5 h-5.5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full ring-2 ring-white"></span>
        </button>

        {/* User Info & Avatar */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold select-none shadow-sm">
            AI
          </div>
          <div className="hidden sm:block">
            <h4 className="font-semibold text-slate-800 text-sm leading-tight">Amna</h4>
            <p className="text-xs text-slate-400 font-medium">Personal workspace</p>
          </div>
        </div>
      </div>
    </header>
  );
}
