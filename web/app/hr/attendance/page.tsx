"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { HRNav } from "@/components/hr/nav";
import { ArrowLeft, Loader2, CheckCircle, XCircle, Clock, Users, CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function HRAttendancePage() {
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>({ records: [], absentWorkers: [], date: "" });
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const { toast } = useToast();

  useEffect(() => { fetchData(); }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [userRes, attRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch(`/api/attendance?date=${selectedDate}`),
      ]);
      if (userRes.ok) setUser(await userRes.json());
      if (attRes.ok) setData(await attRes.json());
    } catch {}
    setLoading(false);
  };

  const markAttendance = async (workerId: string, status: string) => {
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId, status }),
      });
      if (res.ok) {
        toast({ title: "Attendance Updated", description: `Marked as ${status}` });
        fetchData();
      }
    } catch {}
  };

  const presentCount = data.records?.filter((r: any) => r.status === "PRESENT").length || 0;
  const lateCount = data.records?.filter((r: any) => r.status === "LATE").length || 0;
  const absentCount = data.absentWorkers?.length || 0;
  const totalCount = presentCount + lateCount + absentCount;

  const statusBadge = (status: string) => {
    if (status === "PRESENT") return <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Present</Badge>;
    if (status === "LATE") return <Badge className="bg-amber-100 text-amber-700"><Clock className="w-3 h-3 mr-1" />Late</Badge>;
    return <Badge className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" />Absent</Badge>;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-950">
      <HRNav user={user} />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/hr" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold">Worker Attendance</h1>
            <p className="text-muted-foreground text-sm">Track daily attendance based on GPS check-ins</p>
          </div>
          <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-auto" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="border-blue-200"><CardContent className="pt-6 text-center">
            <Users className="w-8 h-8 mx-auto text-blue-500 mb-2" />
            <p className="text-3xl font-bold text-blue-600">{totalCount}</p>
            <p className="text-xs text-muted-foreground">Total Workers</p>
          </CardContent></Card>
          <Card className="border-green-200"><CardContent className="pt-6 text-center">
            <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
            <p className="text-3xl font-bold text-green-600">{presentCount}</p>
            <p className="text-xs text-muted-foreground">Present</p>
          </CardContent></Card>
          <Card className="border-amber-200"><CardContent className="pt-6 text-center">
            <Clock className="w-8 h-8 mx-auto text-amber-500 mb-2" />
            <p className="text-3xl font-bold text-amber-600">{lateCount}</p>
            <p className="text-xs text-muted-foreground">Late</p>
          </CardContent></Card>
          <Card className="border-red-200"><CardContent className="pt-6 text-center">
            <XCircle className="w-8 h-8 mx-auto text-red-500 mb-2" />
            <p className="text-3xl font-bold text-red-600">{absentCount}</p>
            <p className="text-xs text-muted-foreground">Absent</p>
          </CardContent></Card>
        </div>

        {/* Checked In Workers */}
        <Card className="border-blue-200 dark:border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><CalendarDays className="w-5 h-5 text-primary" /> Attendance for {selectedDate}</CardTitle>
          </CardHeader>
          <CardContent>
            {data.records?.length === 0 && data.absentWorkers?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No attendance records for this date</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-semibold">Worker</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Check-in Time</th>
                      <th className="pb-3 font-semibold">Distance</th>
                      <th className="pb-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.records?.map((r: any) => (
                      <tr key={r.id} className="border-b hover:bg-blue-50/50 dark:hover:bg-gray-800">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-primary text-xs font-bold">{r.worker?.user?.firstName?.[0]}{r.worker?.user?.lastName?.[0]}</span>
                            </div>
                            <div>
                              <p className="font-medium">{r.worker?.user?.firstName} {r.worker?.user?.lastName}</p>
                              <p className="text-xs text-muted-foreground">{r.worker?.user?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td>{statusBadge(r.status)}</td>
                        <td className="text-muted-foreground">
                          {r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                        </td>
                        <td className="text-muted-foreground">
                          {r.distanceFromWork ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {r.distanceFromWork < 1000 ? `${r.distanceFromWork}m` : `${(r.distanceFromWork / 1000).toFixed(1)}km`}
                            </span>
                          ) : "—"}
                        </td>
                        <td>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => markAttendance(r.workerId, "PRESENT")}>✅</Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => markAttendance(r.workerId, "LATE")}>⏰</Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => markAttendance(r.workerId, "ABSENT")}>❌</Button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* Absent workers (no check-in) */}
                    {data.absentWorkers?.map((w: any) => (
                      <tr key={w.id} className="border-b hover:bg-red-50/50 dark:hover:bg-gray-800 bg-red-50/30">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                              <span className="text-red-500 text-xs font-bold">{w.user?.firstName?.[0]}{w.user?.lastName?.[0]}</span>
                            </div>
                            <div>
                              <p className="font-medium">{w.user?.firstName} {w.user?.lastName}</p>
                              <p className="text-xs text-muted-foreground">{w.user?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td>{statusBadge("ABSENT")}</td>
                        <td className="text-muted-foreground">No check-in</td>
                        <td className="text-muted-foreground">—</td>
                        <td>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => markAttendance(w.id, "PRESENT")}>✅</Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => markAttendance(w.id, "LATE")}>⏰</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
