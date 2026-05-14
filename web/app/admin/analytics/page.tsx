"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminNav } from "@/components/admin/nav";
import {
  Loader2, Users, UserCheck, Shield, MapPin, MessageSquare,
  HelpCircle, TrendingUp, BarChart3, ArrowLeft, Activity, CalendarDays,
} from "lucide-react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area,
} from "recharts";

const COLORS = ["#3B82F6", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#14B8A6"];

export default function AnalyticsPage() {
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [uRes, aRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/analytics"),
        ]);
        if (uRes.ok) setUser(await uRes.json());
        if (aRes.ok) setData(await aRes.json());
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const u = data?.users || {};
  const att = data?.attendance?.today || {};
  const attendanceRate = u.workers > 0 ? Math.round((att.present / u.workers) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-950">
      <AdminNav user={user} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Link href="/admin" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">System Analytics</h1>
            <p className="text-muted-foreground text-sm">Comprehensive overview of RWATRACK platform</p>
          </div>
        </div>

        {/* Row 1 — Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: "Total Users", value: u.total || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Workers", value: u.workers || 0, icon: UserCheck, color: "text-green-600", bg: "bg-green-50" },
            { label: "HR Managers", value: u.hr || 0, icon: Shield, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "With GPS", value: u.withGPS || 0, icon: MapPin, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Messages", value: data?.activity?.totalMessages || 0, icon: MessageSquare, color: "text-cyan-600", bg: "bg-cyan-50" },
            { label: "Open Tickets", value: data?.activity?.openTickets || 0, icon: HelpCircle, color: "text-red-600", bg: "bg-red-50" },
          ].map((m, i) => (
            <Card key={i} className="border-blue-100 dark:border-gray-700">
              <CardContent className="pt-4 pb-4">
                <div className={`w-8 h-8 ${m.bg} rounded-lg flex items-center justify-center mb-2`}>
                  <m.icon className={`w-4 h-4 ${m.color}`} />
                </div>
                <p className="text-2xl font-bold">{m.value}</p>
                <p className="text-xs text-muted-foreground">{m.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Row 2 — Today's Attendance + User Status */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Today's Attendance */}
          <Card className="border-blue-200 dark:border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" /> Today's Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-32 h-32">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none" stroke="#E5E7EB" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none" stroke="#22C55E" strokeWidth="3"
                      strokeDasharray={`${attendanceRate}, 100`} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">{attendanceRate}%</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-green-50 rounded-lg"><p className="text-lg font-bold text-green-600">{att.present || 0}</p><p className="text-xs text-muted-foreground">Present</p></div>
                <div className="p-2 bg-amber-50 rounded-lg"><p className="text-lg font-bold text-amber-600">{att.late || 0}</p><p className="text-xs text-muted-foreground">Late</p></div>
                <div className="p-2 bg-red-50 rounded-lg"><p className="text-lg font-bold text-red-600">{att.absent || 0}</p><p className="text-xs text-muted-foreground">Absent</p></div>
              </div>
            </CardContent>
          </Card>

          {/* User Status Distribution */}
          <Card className="border-blue-200 dark:border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> User Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Active", value: u.active || 0 },
                      { name: "Inactive", value: u.inactive || 0 },
                      { name: "Suspended", value: u.suspended || 0 },
                    ]}
                    cx="50%" cy="50%" outerRadius={70} innerRadius={40}
                    paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}
                  >
                    <Cell fill="#22C55E" /><Cell fill="#F59E0B" /><Cell fill="#EF4444" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Role Distribution */}
          <Card className="border-blue-200 dark:border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> Role Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Workers", value: u.workers || 0 },
                      { name: "HR", value: u.hr || 0 },
                      { name: "Admin", value: u.admins || 0 },
                    ]}
                    cx="50%" cy="50%" outerRadius={70} innerRadius={40}
                    paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}
                  >
                    <Cell fill="#3B82F6" /><Cell fill="#8B5CF6" /><Cell fill="#EF4444" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Row 3 — Attendance Trend + Registration Trend */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* 7-Day Attendance Trend */}
          <Card className="border-blue-200 dark:border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Attendance Trend (7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={data?.attendance?.daily || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="present" stackId="1" fill="#22C55E" stroke="#22C55E" fillOpacity={0.6} name="Present" />
                  <Area type="monotone" dataKey="late" stackId="1" fill="#F59E0B" stroke="#F59E0B" fillOpacity={0.6} name="Late" />
                  <Area type="monotone" dataKey="absent" stackId="1" fill="#EF4444" stroke="#EF4444" fillOpacity={0.6} name="Absent" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Registrations */}
          <Card className="border-blue-200 dark:border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Registration Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data?.registrations || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="workers" fill="#3B82F6" name="Workers" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="hr" fill="#8B5CF6" name="HR Managers" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Row 4 — Department + District Distribution */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Department Distribution */}
          <Card className="border-blue-200 dark:border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Workers by Department</CardTitle>
            </CardHeader>
            <CardContent>
              {data?.departments?.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.departments} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="department" type="category" tick={{ fontSize: 10 }} width={120} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No department data yet</p>
              )}
            </CardContent>
          </Card>

          {/* District Distribution */}
          <Card className="border-blue-200 dark:border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Workers by District</CardTitle>
            </CardHeader>
            <CardContent>
              {data?.districts?.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.districts}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#22C55E" radius={[4, 4, 0, 0]}>
                      {data.districts.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No district data yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Row 5 — Platform Activity + Recent Actions */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Platform Activity */}
          <Card className="border-blue-200 dark:border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Platform Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Total Messages Sent", value: data?.activity?.totalMessages || 0, color: "text-blue-600" },
                { label: "Support Tickets", value: data?.activity?.totalTickets || 0, color: "text-purple-600" },
                { label: "Open Tickets", value: data?.activity?.openTickets || 0, color: "text-red-600" },
                { label: "GPS Logs (Total)", value: data?.activity?.totalLocationLogs || 0, color: "text-green-600" },
                { label: "GPS Logs (Last 7 days)", value: data?.activity?.recentLocationLogs || 0, color: "text-amber-600" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className={`font-bold text-lg ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Actions */}
          <Card className="border-blue-200 dark:border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {(data?.recentLogs || []).map((log: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{log.user}</span>
                        <Badge variant="outline" className="mx-1 text-[10px] px-1">{log.role}</Badge>
                        <span className="text-muted-foreground">{log.action}</span>
                      </p>
                      {log.details && <p className="text-xs text-muted-foreground truncate">{log.details}</p>}
                      <p className="text-[10px] text-muted-foreground">{new Date(log.time).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {(data?.recentLogs || []).length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No recent actions</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
