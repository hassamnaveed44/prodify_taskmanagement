"use client";

import { useState, useEffect } from "react";
import { Target, Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyGoal {
  id: string;
  title: string;
  completed: boolean;
  date: string;
}

export default function GoalsPanel() {
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [newGoalText, setNewGoalText] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchGoals = async () => {
    try {
      const res = await fetch("/api/daily-goals");
      if (res.ok) {
        const data = await res.json();
        setGoals(data.goals || []);
      }
    } catch (err) {
      console.error("Failed to load daily goals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;

    try {
      const res = await fetch("/api/daily-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newGoalText.trim() })
      });
      if (res.ok) {
        setNewGoalText("");
        fetchGoals();
      }
    } catch (err) {
      console.error("Failed to add daily goal:", err);
    }
  };

  const handleToggleGoal = async (id: string, currentCompleted: boolean) => {
    try {
      // Optimistic update
      setGoals(prev => prev.map(g => g.id === id ? { ...g, completed: !currentCompleted } : g));
      await fetch(`/api/daily-goals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !currentCompleted })
      });
    } catch (err) {
      console.error("Failed to toggle goal status:", err);
      fetchGoals();
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      setGoals(prev => prev.filter(g => g.id !== id));
      await fetch(`/api/daily-goals/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete daily goal:", err);
      fetchGoals();
    }
  };

  const completedCount = goals.filter(g => g.completed).length;
  const progressPercent = goals.length > 0 ? Math.round((completedCount / goals.length) * 100) : 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col h-full select-none text-left">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-50 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Goals for Today</h3>
            {goals.length > 0 && (
              <p className="text-[10px] text-slate-405 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                {completedCount} of {goals.length} completed
              </p>
            )}
          </div>
        </div>
        {goals.length > 0 && (
          <span className="text-xs font-black text-indigo-650 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-full">
            {progressPercent}%
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {goals.length > 0 && (
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 mt-4 overflow-hidden">
          <div 
            className="bg-indigo-600 h-full rounded-full transition-all duration-350"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Add Goal Input */}
      <form onSubmit={handleAddGoal} className="relative mt-4 flex items-center gap-2">
        <input 
          type="text"
          value={newGoalText}
          onChange={(e) => setNewGoalText(e.target.value)}
          placeholder="Add a goal for today..."
          className="w-full text-xs font-semibold text-slate-750 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-2.5 pl-4 pr-10 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 transition-all font-sans"
        />
        <button 
          type="submit"
          className="absolute right-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 p-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>

      {/* Goals List */}
      <div className="flex-1 mt-4 space-y-2 overflow-y-auto max-h-[220px] pr-1">
        {loading ? (
          <p className="text-slate-350 text-xs italic py-4 text-center">Loading daily goals...</p>
        ) : goals.length === 0 ? (
          <p className="text-slate-350 text-xs italic py-4 text-center">No goals set for today.</p>
        ) : (
          goals.map((goal) => (
            <div 
              key={goal.id} 
              className={cn(
                "flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all cursor-pointer",
                goal.completed 
                  ? "bg-slate-50/50 dark:bg-slate-800/10 border-slate-50 dark:border-slate-800 opacity-60" 
                  : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
              )}
              onClick={() => handleToggleGoal(goal.id, goal.completed)}
            >
              <div className="flex items-center gap-3 min-w-0">
                {goal.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                )}
                <span className={cn(
                  "text-xs font-semibold text-slate-700 dark:text-slate-200 truncate select-none",
                  goal.completed && "line-through text-slate-400 dark:text-slate-500"
                )}>
                  {goal.title}
                </span>
              </div>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteGoal(goal.id);
                }}
                className="text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 p-1 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
