import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prodify — AI Workspace Dashboard",
  description: "AI-powered workspace and task management dashboard.",
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
      </head>
      <body className="min-h-full bg-[#f6f8fb] text-slate-800 font-sans">
        {children}
      </body>
    </html>
  );
}
