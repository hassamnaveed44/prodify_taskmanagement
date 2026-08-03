import type { Metadata } from "next";
import "./globals.css";

import { ToastProvider } from "@/components/ui/toast-provider";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://prodify-taskmanagement.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "Prodify — AI-Powered Workspace Dashboard",
    template: "%s — Prodify",
  },
  description: "Prodify is an AI-powered task management and workspace collaboration platform. Manage projects, track deadlines, and communicate in real-time.",
  metadataBase: new URL(APP_URL),
  keywords: ["task management", "project management", "AI workspace", "team collaboration", "Prodify"],
  authors: [{ name: "Prodify Team" }],
  creator: "Prodify",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: "Prodify",
    title: "Prodify — AI-Powered Workspace Dashboard",
    description: "Manage projects, track deadlines, and collaborate with your team in real-time.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prodify — AI-Powered Workspace Dashboard",
    description: "Manage projects, track deadlines, and collaborate with your team in real-time.",
    creator: "@prodify",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        {/* Load Google Fonts directly in the browser to avoid offline build errors */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" 
          rel="stylesheet" 
        />
        {/* Theme loader script to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var savedTheme = localStorage.getItem('theme');
              var systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            } catch (e) {}
          })()
        ` }} />
      </head>
      <body className="min-h-full font-sans antialiased text-slate-800 bg-[#f6f8fb]">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
