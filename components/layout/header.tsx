"use client";

import { useState } from "react";
import { Search, Bell, HelpCircle, Menu, LogOut, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.refresh();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoggingOut(false);
      setDropdownOpen(false);
    }
  };

  return (
    <header className="h-16 border-b border-slate-100 bg-white flex items-center justify-between px-6 sticky top-0 z-40 select-none">
      
      {/* Search & Menu Trigger */}
      <div className="flex-1 max-w-lg flex items-center gap-3">
        {/* Mobile Menu Hamburger Button */}
        <button 
          onClick={onMenuClick}
          className="md:hidden text-slate-500 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-50 transition-colors shrink-0"
        >
          <Menu className="w-5.5 h-5.5" />
        </button>

        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search anything..."
            className="w-full bg-slate-50/50 border border-slate-100 rounded-full py-2 pl-11 pr-4 text-sm text-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Right Icons & User Profile */}
      <div className="flex items-center gap-4 sm:gap-6 relative">
        {/* Help Icon */}
        <button className="text-slate-400 hover:text-slate-650 transition-colors p-1.5 rounded-full hover:bg-slate-50">
          <HelpCircle className="w-5.5 h-5.5" />
        </button>

        {/* Notifications */}
        <button className="text-slate-400 hover:text-slate-650 transition-colors p-1.5 rounded-full hover:bg-slate-50 relative">
          <Bell className="w-5.5 h-5.5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-650 rounded-full ring-2 ring-white"></span>
        </button>

        {/* User Info & Avatar Dropdown Trigger */}
        <div className="relative">
          <div 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 pl-4 border-l border-slate-100 cursor-pointer hover:opacity-85 transition-opacity py-1"
          >
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold select-none shadow-sm shrink-0">
              HN
            </div>
            <div className="hidden sm:block text-left">
              <div className="flex items-center gap-1">
                <h4 className="font-semibold text-slate-800 text-sm leading-none">Hassam</h4>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Personal workspace</p>
            </div>
          </div>

          {/* Profile Dropdown Menu */}
          {dropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2.5 w-44 bg-white border border-slate-100 rounded-2xl p-2 shadow-xl z-45 animate-fade-in">
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-red-50 text-red-600 hover:text-red-750 font-bold text-xs rounded-xl flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>{loggingOut ? "Logging out..." : "Log Out"}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
