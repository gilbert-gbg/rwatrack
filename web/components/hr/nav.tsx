"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MapPin, LogOut, User, Users, BarChart2, UserCheck, MessageSquare, HelpCircle, ChevronDown, CalendarDays, ArrowRight, Clock } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { UserAvatar } from "@/components/UserAvatar";

interface NavProps { user: any; }

export function HRNav({ user }: NavProps) {
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <header className="border-b border-blue-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link href="/hr" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-foreground hidden sm:inline">RWATRACK HR</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6">
          {[
            { href: "/hr", label: "Dashboard" },
            { href: "/hr/workers", label: "Workers" },
            { href: "/hr/approvals", label: "Approvals" },
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
                <Link href="/hr/attendance" className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-green-500" /> Attendance
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/hr/transfers" className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-purple-500" /> Transfers
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/hr/reports" className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-blue-500" /> Reports
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/hr/location-history" className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" /> Location History
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/support" className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-red-500" /> Help & Support
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
              <DropdownMenuItem asChild><Link href="/hr"><MapPin className="w-4 h-4 mr-2" />Dashboard</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/hr/workers"><Users className="w-4 h-4 mr-2" />Workers</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/hr/approvals"><UserCheck className="w-4 h-4 mr-2" />Approvals</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/hr/attendance"><CalendarDays className="w-4 h-4 mr-2" />Attendance</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/hr/transfers"><ArrowRight className="w-4 h-4 mr-2" />Transfers</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/hr/reports"><BarChart2 className="w-4 h-4 mr-2" />Reports</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/messages"><MessageSquare className="w-4 h-4 mr-2" />Messages</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/support"><HelpCircle className="w-4 h-4 mr-2" />Help & Support</Link></DropdownMenuItem>
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
