"use client";

import { Settings, User, Bell, Lock } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
          <Settings className="w-4 h-4" />
        </div>
        <h3 className="font-semibold text-slate-800 text-base">Workspace Settings</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Settings Nav links */}
        <div className="space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-50/50 text-indigo-600 rounded-xl text-xs font-bold text-left select-none">
            <User className="w-4.5 h-4.5" /> Profile Settings
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 hover:text-slate-800 rounded-xl text-xs font-semibold text-left transition-colors select-none">
            <Bell className="w-4.5 h-4.5 text-slate-400" /> Notifications
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 hover:text-slate-800 rounded-xl text-xs font-semibold text-left transition-colors select-none">
            <Lock className="w-4.5 h-4.5 text-slate-400" /> Password & Security
          </button>
        </div>

        {/* Setting Form Fields */}
        <div className="md:col-span-2 space-y-6 max-w-xl">
          <h4 className="text-sm font-bold text-slate-850">Personal Details</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">First Name</label>
              <input
                type="text"
                defaultValue="Amna"
                className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-2 text-xs text-slate-700 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Last Name</label>
              <input
                type="text"
                defaultValue="Henry"
                className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-2 text-xs text-slate-700 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Email Address</label>
              <input
                type="email"
                defaultValue="amna@prodify.com"
                className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-2 text-xs text-slate-700 focus:outline-none"
              />
            </div>
          </div>

          <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 px-6 rounded-xl shadow-sm hover:shadow-indigo-150 transition-all cursor-pointer">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
