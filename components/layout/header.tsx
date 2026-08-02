"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Bell, HelpCircle, Menu, LogOut, ChevronDown, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast-provider";
import ThemeToggle from "@/components/ui/theme-toggle";

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

interface WorkspaceItem {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface HeaderProps {
  user: UserProfile | null;
  workspace: WorkspaceProfile | null;
  workspaces?: WorkspaceItem[];
  onMenuClick?: () => void;
}

export default function Header({ user, workspace, workspaces, onMenuClick }: HeaderProps) {
  const router = useRouter();
  const toast = useToast();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);

  // Search states and references
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    tasks: any[];
    projects: any[];
    members: any[];
  } | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);

  // Close search dropdown on clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Debounced search queries fetcher
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error("Search fetch failed:", err);
      }
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

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

  const handleSwitchWorkspace = async (targetId: string) => {
    setSwitching(targetId);
    try {
      const res = await fetch("/api/workspace/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: targetId }),
      });
      if (res.ok) {
        window.location.reload(); // Force full reload to update workspace context across layout & routes
      } else {
        toast.error("Failed to switch workspace.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred switching workspace.");
    } finally {
      setSwitching(null);
    }
  };

  // Extract first name (e.g. "Hassam Naveed" -> "Hassam")
  const getFirstName = (fullName: string) => {
    return fullName.trim().split(/\s+/)[0] || "Hassam";
  };

  return (
    <header className="h-16 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-6 sticky top-0 z-40 select-none shrink-0">
      
      {/* Search & Menu Trigger */}
      <div className="flex-1 max-w-lg flex items-center gap-3">
        {/* Mobile Menu Hamburger Button */}
        <button 
          onClick={onMenuClick}
          className="md:hidden text-slate-500 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors shrink-0"
        >
          <Menu className="w-5.5 h-5.5" />
        </button>

        {/* Search Bar */}
        <div ref={searchRef} className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            placeholder="Search anything..."
            className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-full py-2 pl-11 pr-4 text-sm text-slate-655 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
          />

          {/* Search Dropdown Popup Results */}
          {searchFocused && searchQuery.trim().length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-4 shadow-2xl z-50 text-left max-h-[380px] overflow-y-auto space-y-4 animate-fade-in select-none">
              {!searchResults ? (
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest py-2 pl-2">Searching workspace...</p>
              ) : (searchResults.tasks.length === 0 && searchResults.projects.length === 0 && searchResults.members.length === 0) ? (
                <p className="text-xs text-slate-400 font-semibold py-4 text-center italic">No results found for "{searchQuery}"</p>
              ) : (
                <>
                  {/* Projects Results */}
                  {searchResults.projects.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-2">Projects</span>
                      <div className="space-y-0.5">
                        {searchResults.projects.map((proj) => (
                          <button
                            key={proj.id}
                            onClick={() => {
                              setSearchFocused(false);
                              setSearchQuery("");
                              router.push(`/projects/${proj.slug}`);
                            }}
                            className="w-full text-left px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <span className={cn("w-2 h-2 rounded-full shrink-0", proj.color)} />
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{proj.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tasks Results */}
                  {searchResults.tasks.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-2">Tasks</span>
                      <div className="space-y-0.5">
                        {searchResults.tasks.map((task) => (
                          <button
                            key={task.id}
                            onClick={() => {
                              setSearchFocused(false);
                              setSearchQuery("");
                              router.push(`/projects/${task.project.slug}`);
                            }}
                            className="w-full text-left px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl flex flex-col transition-colors cursor-pointer"
                          >
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 line-clamp-1">{task.name}</span>
                            <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wide mt-0.5">{task.project.name} • {task.status}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Members Results */}
                  {searchResults.members.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-2">Teammates</span>
                      <div className="space-y-0.5">
                        {searchResults.members.map((member) => (
                          <div
                            key={member.id}
                            className="px-2.5 py-2 rounded-xl flex items-center gap-2.5 transition-colors"
                          >
                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {member.initials}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{member.name}</span>
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 truncate">{member.email}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Icons & User Profile */}
      <div className="flex items-center gap-4 sm:gap-6 relative">
        {/* Theme Toggle Switch */}
        <ThemeToggle />

        {/* Help Icon */}
        <button className="text-slate-400 hover:text-slate-650 transition-colors p-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <HelpCircle className="w-5.5 h-5.5" />
        </button>

        {/* Notifications */}
        <button className="text-slate-400 hover:text-slate-650 transition-colors p-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800/50 relative">
          <Bell className="w-5.5 h-5.5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-650 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
        </button>

        {/* User Info & Avatar Dropdown Trigger */}
        <div className="relative">
          <div 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 pl-4 border-l border-slate-100 dark:border-slate-800 cursor-pointer hover:opacity-85 transition-opacity py-1"
          >
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold select-none shadow-sm shrink-0">
              {user?.initials || "HN"}
            </div>
            <div className="hidden sm:block text-left">
              <div className="flex items-center gap-1">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm leading-none truncate max-w-[80px]">
                  {user ? getFirstName(user.name) : "Hassam"}
                </h4>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-[9px] text-slate-405 dark:text-slate-450 font-bold uppercase tracking-wider mt-1 truncate max-w-[120px] text-left">
                {workspace?.name || "Personal workspace"}
              </p>
            </div>
          </div>

          {/* Profile Dropdown Menu */}
          {dropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2.5 w-56 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-2.5 shadow-2xl z-45 animate-fade-in space-y-2 text-left">
                
                {/* Switch Workspace list if they belong to multiple workspaces */}
                {workspaces && workspaces.length > 1 && (
                  <div className="space-y-1">
                    <p className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 pt-1 block">Switch Workspace</p>
                    <div className="space-y-0.5 max-h-[120px] overflow-y-auto pr-1">
                      {workspaces
                        .filter((w) => w.id !== workspace?.id)
                        .map((w) => (
                          <button
                            key={w.id}
                            disabled={switching !== null}
                            onClick={() => handleSwitchWorkspace(w.id)}
                            className="w-full text-left px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] font-bold rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-650 dark:hover:text-indigo-400 transition-colors flex items-center justify-between cursor-pointer"
                          >
                            <span className="truncate pr-2">{w.name}</span>
                            {switching === w.id ? (
                              <Loader2 className="w-3 h-3 animate-spin shrink-0 text-indigo-600" />
                            ) : (
                              <ChevronDown className="w-3 h-3 text-slate-400 -rotate-90 shrink-0" />
                            )}
                          </button>
                        ))}
                    </div>
                    <div className="border-t border-slate-50 my-1" />
                  </div>
                )}

                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full text-left px-2 py-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-650 dark:text-red-400 hover:text-red-750 dark:hover:text-red-300 font-bold text-[10px] rounded-xl flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
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
