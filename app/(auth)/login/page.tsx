"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed. Please check your credentials.");
      } else {
        // Successful login, redirect to dashboard or requested page
        router.refresh(); // Refresh page data/middleware cookies state
        router.push(redirectPath);
      }
    } catch (err) {
      console.error("Login client error:", err);
      setError("Failed to connect to authentication server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="text-center mb-4">
        <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Welcome Back</h3>
        <p className="text-xs text-slate-400 font-semibold mt-1">Sign in to access your projects and tasks.</p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-150 text-red-650 px-4 py-3 rounded-2xl text-xs font-bold leading-relaxed animate-shake">
          ⚠️ {error}
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
            Email Address
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Mail className="w-4 h-4" />
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-10 pr-4 outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition-all"
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Password
            </label>
            <a href="#" className="text-[9px] font-extrabold text-indigo-650 hover:underline">
              Forgot?
            </a>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Lock className="w-4 h-4" />
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-10 pr-4 outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition-all"
            />
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-extrabold text-xs py-3.5 px-4 rounded-2xl shadow-sm hover:shadow-indigo-100/50 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch link */}
      <div className="text-center pt-3 border-t border-slate-50 mt-4">
        <p className="text-[11px] text-slate-400 font-semibold">
          Don't have an account?{" "}
          <Link href="/register" className="text-indigo-650 font-extrabold hover:underline">
            Sign up free
          </Link>
        </p>
      </div>

      {/* Helper text for developers */}
      <div className="bg-indigo-50/50 border border-indigo-100/50 text-indigo-700 rounded-2xl p-3.5 text-[10px] font-bold leading-normal select-none">
        💡 **Local Seeding Helper**:
        <div className="mt-1 font-semibold normal-case">
          You can sign in with: <code className="bg-white/70 px-1 py-0.5 rounded font-mono text-[9px] text-indigo-800">hassam@prodify.com</code> and password: <code className="bg-white/70 px-1 py-0.5 rounded font-mono text-[9px] text-indigo-800">password123</code>.
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
