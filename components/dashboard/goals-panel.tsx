"use client";

import { Target, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface Goal {
  id: string;
  title: string;
  percentage: number;
  projectName: string;
}

interface GoalsPanelProps {
  goals: Goal[];
}

export default function GoalsPanel({ goals }: GoalsPanelProps) {
  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Target className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-slate-800 text-base">My Goals</h3>
        </div>
        <button className="text-slate-400 hover:text-slate-650 transition-colors p-1.5 rounded hover:bg-slate-50">
          <MoreHorizontal className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Goals List */}
      <div className="flex-1 mt-6 space-y-6">
        {goals.length === 0 ? (
          <p className="text-slate-350 text-xs italic py-2 text-center">No goals set for this workspace.</p>
        ) : (
          goals.map((goal) => {
            const barColor = goal.percentage > 50 ? "bg-[#14b8a6]" : "bg-[#f59e0b]";
            return (
              <div key={goal.id} className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 leading-snug hover:text-indigo-650 transition-colors cursor-pointer text-left">
                      {goal.title}
                    </h4>
                    <p className="text-xs text-slate-400 font-medium mt-0.5 text-left">
                      {goal.projectName} <span className="mx-1">•</span> My Projects
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-800 shrink-0 ml-4">
                    {goal.percentage}%
                  </span>
                </div>

                {/* Custom Progress Bar */}
                <div className="w-full bg-slate-150/50 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full transition-all duration-500", barColor)} 
                    style={{ width: `${goal.percentage}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
