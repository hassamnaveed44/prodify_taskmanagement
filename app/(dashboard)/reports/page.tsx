"use client";

import { BarChart2, TrendingUp, Users, Calendar, AlertCircle } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
          <BarChart2 className="w-4 h-4" />
        </div>
        <h3 className="font-semibold text-slate-800 text-base">Reports & Analytics</h3>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-650 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tasks Completed</span>
            <h4 className="text-xl font-bold text-slate-850">84%</h4>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-650 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Active Members</span>
            <h4 className="text-xl font-bold text-slate-850">14 Colleagues</h4>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-650 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Upcoming Meetings</span>
            <h4 className="text-xl font-bold text-slate-850">3 Scheduled</h4>
          </div>
        </div>
      </div>

      {/* Chart Placeholder Card */}
      <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-indigo-650" />
          <h4 className="text-sm font-semibold text-slate-800">Workspace Tasks Progress (Mock Chart)</h4>
        </div>

        {/* Visual Mock Chart */}
        <div className="h-64 bg-slate-50 border border-slate-100 rounded-2xl flex items-end justify-between p-6 gap-2">
          <div className="w-full bg-indigo-100 rounded-t-lg transition-all hover:bg-indigo-300" style={{ height: "45%" }}></div>
          <div className="w-full bg-indigo-200 rounded-t-lg transition-all hover:bg-indigo-400" style={{ height: "60%" }}></div>
          <div className="w-full bg-indigo-300 rounded-t-lg transition-all hover:bg-indigo-500" style={{ height: "30%" }}></div>
          <div className="w-full bg-indigo-550 rounded-t-lg transition-all hover:bg-indigo-700" style={{ height: "85%" }}></div>
          <div className="w-full bg-indigo-400 rounded-t-lg transition-all hover:bg-indigo-600" style={{ height: "70%" }}></div>
        </div>
        
        <p className="text-xs text-slate-400 font-semibold text-center">
          In Phase 7, we will integrate Recharts to display interactive charts powered by live task data from the database.
        </p>
      </div>
    </div>
  );
}
