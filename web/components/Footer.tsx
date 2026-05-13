"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-blue-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 mt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo + version */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">R</span>
            </div>
            <span className="font-semibold text-sm text-foreground">RWATRACK</span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">v1.0.0</span>
          </div>

          {/* Copyright */}
          <p className="text-xs text-muted-foreground text-center">
            &copy; {new Date().getFullYear()} RWATRACK — AI-Driven Government Employee Residence Tracking System
          </p>

          {/* University info */}
          <div className="text-right">
            <p className="text-xs text-muted-foreground">University of Rwanda</p>
            <p className="text-xs text-muted-foreground">School of ICT • Dept. of Information Systems</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
