import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full h-full min-h-[80vh] flex items-center justify-center bg-[#f6f8fb] p-6 animate-fade-in">
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-md shadow-indigo-100/50 mb-2">
            P
          </div>
          <h2 className="font-extrabold text-slate-800 text-xl tracking-tight">Prodify</h2>
          <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">AI WORKSPACE</p>
        </div>

        {children}
      </div>
    </div>
  );
}
