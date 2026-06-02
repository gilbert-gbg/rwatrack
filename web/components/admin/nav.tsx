"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MapPin, LogOut, User, Users, UserCheck, FileText, Settings, MessageSquare, HelpCircle, ChevronDown, BarChart3, Shield, Brain } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { UserAvatar } from "@/components/UserAvatar";

interface NavProps { user: any; }

export function AdminNav({ user }: NavProps) {
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <header className="border-b border-blue-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-foreground hidden sm:inline">RWATRACK Admin</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6">
          {[
            { href: "/admin", label: "Dashboard" },
            { href: "/admin/users", label: "Users" },
            { href: "/admin/approvals", label: "Approvals" },
            { href: "/admin/ai-risk", label: "AI Risk" },
            { href: "/messages", label: "Messages" },
          ].map(({ href, label }) => (
            <Link key={href} href={href} className="text-sm font-medium text-foreground hover:text-primary transition">
              {label}
            </Link>
          ))}

          {/* More dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-sm font-medium text-foreground hover:text-primary transition flex items-center gap-1">
                More <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-52">
              <DropdownMenuItem asChild>
                <Link href="/admin/hr" className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-500" /> HR Managers
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/analytics" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-500" /> Analytics
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/audit-logs" className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-500" /> Audit Logs
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/settings" className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-gray-500" /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/support" className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-red-500" /> Support Tickets
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="flex items-center gap-1">
          <DarkModeToggle />
          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 px-2">
                <UserAvatar firstName={user?.firstName} lastName={user?.lastName} avatar={user?.avatar} size="sm" />
                <span className="hidden sm:inline text-sm font-medium">{user?.firstName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center gap-3 px-2 py-2">
                <UserAvatar firstName={user?.firstName} lastName={user?.lastName} avatar={user?.avatar} size="md" />
                <div>
                  <p className="text-sm font-semibold">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link href="/profile"><User className="w-4 h-4 mr-2" />My Profile</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/admin"><MapPin className="w-4 h-4 mr-2" />Dashboard</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/admin/users"><Users className="w-4 h-4 mr-2" />Manage Users</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/admin/approvals"><UserCheck className="w-4 h-4 mr-2" />Approvals</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/admin/ai-risk"><Brain className="w-4 h-4 mr-2" />AI Risk</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/admin/analytics"><BarChart3 className="w-4 h-4 mr-2" />Analytics</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/admin/audit-logs"><FileText className="w-4 h-4 mr-2" />Audit Logs</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/admin/settings"><Settings className="w-4 h-4 mr-2" />Settings</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/messages"><MessageSquare className="w-4 h-4 mr-2" />Messages</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/admin/support"><HelpCircle className="w-4 h-4 mr-2" />Support Tickets</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" />Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
