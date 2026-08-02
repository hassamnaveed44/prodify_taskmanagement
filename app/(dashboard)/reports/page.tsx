"use client";

import { useState, useEffect } from "react";
import { BarChart2, TrendingUp, Users, Calendar, Loader2, RefreshCw } from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  CartesianGrid, 
  Legend 
} from "recharts";

interface ReportsMetrics {
  completionRate: number;
  membersCount: number;
  upcomingTasksCount: number;
  totalTasks: number;
  completedTasks: number;
}

interface ChartDatasets {
  statusData: Array<{ name: string; value: number }>;
  projectData: Array<{ name: string; tasks: number; completed: number }>;
  priorityData: Array<{ name: string; count: number }>;
  weeklyTrendData: Array<{ name: string; Completed: number }>;
}

// Gorgeous HSL-tailored color schemes for charts
const PIE_COLORS = ["#6366f1", "#10b981", "#cbd5e1"]; // Indigo, Emerald, Slate-300
const PRIORITY_COLORS = {
  High: "#ef4444",   // Red
  Medium: "#f59e0b", // Amber
  Low: "#3b82f6"     // Blue
};

export default function ReportsPage() {
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<ReportsMetrics | null>(null);
  const [charts, setCharts] = useState<ChartDatasets | null>(null);

  useEffect(() => {
    setIsClient(true);
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/reports", { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
        setCharts(data.charts);
      }
    } catch (err) {
      console.error("Failed to load reports dataset:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isClient) return null;

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-650 shrink-0">
            <BarChart2 className="w-4.5 h-4.5" />
          </div>
          <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Reports & Analytics</h3>
        </div>
        <button
          onClick={fetchAnalyticsData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-100 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading ? "animate-spin" : "")} />
          <span>Refresh Data</span>
        </button>
      </div>

      {loading ? (
        /* Loading Skeleton State */
        <div className="h-[calc(100vh-250px)] flex flex-col items-center justify-center text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-650" />
          <p className="text-xs text-slate-400 font-semibold italic">Analyzing task logs and compiling charts...</p>
        </div>
      ) : !metrics || !charts ? (
        <div className="h-[calc(100vh-250px)] flex flex-col items-center justify-center text-slate-400 text-xs font-semibold italic">
          No analytics data available. Create some projects and tasks to see metrics!
        </div>
      ) : (
        /* Live Analytics View */
        <>
          {/* Key Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Completion Rate */}
            <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-650 shrink-0">
                <TrendingUp className="w-5 h-5 animate-pulse" />
              </div>
              <div className="text-left">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Completion Rate</span>
                <h4 className="text-lg font-black text-slate-850 mt-0.5">{metrics.completionRate}%</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  {metrics.completedTasks} of {metrics.totalTasks} tasks finished
                </p>
              </div>
            </div>

            {/* Card 2: Active Members */}
            <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-650 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Workspace Colleagues</span>
                <h4 className="text-lg font-black text-slate-850 mt-0.5">{metrics.membersCount} Members</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Collaborating across spaces</p>
              </div>
            </div>

            {/* Card 3: Upcoming Deliverables */}
            <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-650 shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Upcoming Deliverables</span>
                <h4 className="text-lg font-black text-slate-850 mt-0.5">{metrics.upcomingTasksCount} Tasks</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Active with upcoming deadlines</p>
              </div>
            </div>
          </div>

          {/* Primary Charts Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Tasks Completion Trend Line */}
            <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4 flex flex-col">
              <div className="text-left">
                <h4 className="text-xs font-black text-slate-800 tracking-tight">Completions Trend</h4>
                <p className="text-[10px] text-slate-400 font-bold tracking-wide uppercase mt-0.5">Tasks marked completed in last 7 days</p>
              </div>
              <div className="h-64 w-full text-xs font-semibold">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.weeklyTrendData} margin={{ left: -20, right: 10, top: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}
                      labelStyle={{ fontWeight: "800", color: "#1e293b", fontSize: "11px" }}
                    />
                    <Line type="monotone" dataKey="Completed" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, stroke: "#6366f1", fill: "#ffffff" }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Project Tasks Breakdown Bar */}
            <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4 flex flex-col">
              <div className="text-left">
                <h4 className="text-xs font-black text-slate-800 tracking-tight">Project Comparisons</h4>
                <p className="text-[10px] text-slate-400 font-bold tracking-wide uppercase mt-0.5">Total tasks vs completed per project</p>
              </div>
              <div className="h-64 w-full text-xs font-semibold">
                {charts.projectData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 italic">No project task data.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.projectData} margin={{ left: -20, right: 10, top: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}
                        labelStyle={{ fontWeight: "800", color: "#1e293b", fontSize: "11px" }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "10px", fontWeight: "800" }} />
                      <Bar dataKey="tasks" name="Total Tasks" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar dataKey="completed" name="Completed" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 3: Tasks Status Distribution Pie */}
            <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4 flex flex-col">
              <div className="text-left">
                <h4 className="text-xs font-black text-slate-800 tracking-tight">Status Ratios</h4>
                <p className="text-[10px] text-slate-400 font-bold tracking-wide uppercase mt-0.5">Ratio breakdown by workflow statuses</p>
              </div>
              <div className="h-64 w-full flex items-center justify-center text-xs font-semibold relative">
                {metrics.totalTasks === 0 ? (
                  <div className="text-slate-400 italic">Create tasks to view ratios.</div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={charts.statusData.filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {charts.statusData.filter(d => d.value > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}
                          itemStyle={{ fontSize: "11px", fontWeight: "700" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Middle stats text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                      <span className="text-lg font-black text-slate-800">{metrics.totalTasks}</span>
                      <span className="text-[9px] text-slate-400 font-extrabold tracking-widest uppercase">Tasks</span>
                    </div>
                  </>
                )}
              </div>
              
              {/* Legend Indicators */}
              <div className="flex justify-center gap-6 pt-2 shrink-0">
                {charts.statusData.map((d, index) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[index] }} />
                    <span className="text-[10px] font-bold text-slate-600">{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 4: Priority Breakdown Bar */}
            <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4 flex flex-col">
              <div className="text-left">
                <h4 className="text-xs font-black text-slate-800 tracking-tight">Priority Distribution</h4>
                <p className="text-[10px] text-slate-400 font-bold tracking-wide uppercase mt-0.5">Tasks counts categorized by priority level</p>
              </div>
              <div className="h-64 w-full text-xs font-semibold">
                {metrics.totalTasks === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 italic">No tasks created.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.priorityData} margin={{ left: -20, right: 10, top: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}
                        labelStyle={{ fontWeight: "800", color: "#1e293b", fontSize: "11px" }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={32}>
                        {charts.priorityData.map((entry, index) => {
                          const color = entry.name === "High" ? PRIORITY_COLORS.High : entry.name === "Medium" ? PRIORITY_COLORS.Medium : PRIORITY_COLORS.Low;
                          return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}

// Minimal helper to inline className utility injection
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
