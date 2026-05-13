"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AdminNav } from "@/components/admin/nav";
import { Loader2, AlertCircle, Users, MapPin, BarChart3, UserCheck, Brain, Shield, TrendingUp, Clock } from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "HR" | "WORKER";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  createdAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  details?: string;
  user: { email: string; firstName?: string; lastName?: string };
  createdAt: string;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, usersRes, auditRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/admin/users"),
          fetch("/api/audit-logs"),
        ]);

        if (userRes.ok) setUser(await userRes.json());
        if (usersRes.ok) setAllUsers(await usersRes.json());
        if (auditRes.ok) {
          const data = await auditRes.json();
          setAuditLogs(data.logs || []);
        }
      } catch {
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const admins = allUsers.filter((u) => u.role === "ADMIN").length;
  const hrs = allUsers.filter((u) => u.role === "HR").length;
  const workers = allUsers.filter((u) => u.role === "WORKER").length;
  const active = allUsers.filter((u) => u.status === "ACTIVE").length;
  const pending = allUsers.filter((u) => u.status === "INACTIVE").length;

  // Role distribution chart
  const roleData = [
    { name: "Admin", value: admins, color: "#EF4444" },
    { name: "HR", value: hrs, color: "#3B82F6" },
    { name: "Worker", value: workers, color: "#F59E0B" },
  ].filter((d) => d.value > 0);

  // Status distribution chart
  const statusData = [
    { name: "Active", value: active, color: "#22C55E" },
    { name: "Pending", value: pending, color: "#F59E0B" },
    { name: "Suspended", value: allUsers.filter((u) => u.status === "SUSPENDED").length, color: "#EF4444" },
  ].filter((d) => d.value > 0);

  // Registrations by month
  const monthData: Record<string, number> = {};
  allUsers.forEach((u) => {
    const date = new Date(u.createdAt);
    const key = date.toLocaleString("default", { month: "short", year: "2-digit" });
    monthData[key] = (monthData[key] || 0) + 1;
  });
  const registrationData = Object.entries(monthData)
    .slice(-6)
    .map(([name, count]) => ({ name, count }));

  // Action icon helper
  const getActionIcon = (action: string) => {
    if (action.includes("LOGIN")) return "🔑";
    if (action.includes("REGISTER")) return "📝";
    if (action.includes("APPROVE")) return "✅";
    if (action.includes("REJECT") || action.includes("SUSPEND")) return "❌";
    if (action.includes("UPDATE")) return "✏️";
    return "📋";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <AdminNav user={user} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here&apos;s your system overview.</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Total Users", value: allUsers.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Admins", value: admins, icon: Shield, color: "text-red-600", bg: "bg-red-50" },
            { label: "HR Managers", value: hrs, icon: UserCheck, color: "text-indigo-600", bg: "bg-indigo-50" },
            { label: "Workers", value: workers, icon: Users, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Pending", value: pending, icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="border-blue-200 hover:shadow-lg transition">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${bg}`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Role Distribution */}
          <Card className="border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Role Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={roleData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {roleData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card className="border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Account Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Registrations Chart */}
          <Card className="border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Registrations</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={registrationData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Users" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Management + Activity */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Quick Actions */}
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <BarChart3 className="w-4 h-4" />
                Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { href: "/admin/users", icon: Users, label: "Manage Users", variant: "default" as const },
                { href: "/admin/hr", icon: UserCheck, label: "Manage HRs", variant: "outline" as const },
                { href: "/admin/approvals", icon: UserCheck, label: "HR Approvals", variant: "outline" as const },
                { href: "/admin/audit-logs", icon: BarChart3, label: "Audit Logs", variant: "outline" as const },
                { href: "/admin/ai-risk", icon: Brain, label: "AI Risk Dashboard", variant: "outline" as const },
                { href: "/admin/settings", icon: Shield, label: "System Settings", variant: "outline" as const },
              ].map(({ href, icon: Icon, label, variant }) => (
                <Button key={href} asChild variant={variant} className="w-full justify-start">
                  <Link href={href}><Icon className="w-4 h-4 mr-2" />{label}</Link>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-blue-200 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">Recent Activity</CardTitle>
              <CardDescription>Latest system events</CardDescription>
            </CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No activity recorded</p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {auditLogs.slice(0, 10).map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 border border-blue-100 rounded-lg hover:bg-blue-50/50 transition">
                      <span className="text-lg mt-0.5">{getActionIcon(log.action)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm">{log.action.replace(/_/g, " ")}</p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {log.details && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.details}</p>
                        )}
                        <p className="text-xs text-muted-foreground">By: {log.user?.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { name: "Database", status: "Operational" },
                { name: "Web API", status: "Operational" },
                { name: "AI Service", status: "Operational" },
                { name: "Location Service", status: "Operational" },
              ].map((s) => (
                <div key={s.name} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                  <div>
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-green-600">{s.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
