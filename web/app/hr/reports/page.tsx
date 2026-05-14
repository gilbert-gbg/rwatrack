"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { HRNav } from "@/components/hr/nav";
import {
  Loader2, FileText, Download, ArrowLeft, Users, MapPin,
  CheckCircle, XCircle, Clock, BarChart3, Printer,
} from "lucide-react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#22C55E", "#F59E0B", "#EF4444", "#3B82F6", "#8B5CF6"];

export default function ReportsPage() {
  const [user, setUser] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [reportType, setReportType] = useState("summary");
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.ok ? r.json() : null).then(setUser);
    // Set start date to 30 days ago
    const d = new Date(); d.setDate(d.getDate() - 30);
    setStartDate(d.toISOString().split("T")[0]);
  }, []);

  const generateReport = async () => {
    setLoading(true);
    try {
      const url = `/api/reports?type=${reportType}&start=${startDate}&end=${endDate}`;
      const res = await fetch(url);
      if (res.ok) setReport(await res.json());
    } catch {}
    setLoading(false);
  };

  const exportCSV = () => {
    if (!report?.workers) return;
    const rows = report.workers.map((w: any) => {
      if (reportType === "summary") {
        return `"${w.name}","${w.email}","${w.phone}","${w.jobTitle}","${w.department}","${w.homeAddress}","${w.status}"`;
      }
      if (reportType === "attendance") {
        return `"${w.name}","${w.email}","${w.present}","${w.late}","${w.absent}"`;
      }
      return `"${w.name}","${w.email}","${w.homeLat}","${w.homeLng}","${w.homeAddress}"`;
    });

    let header = "";
    if (reportType === "summary") header = "Name,Email,Phone,Job Title,Department,Home Address,Status";
    if (reportType === "attendance") header = "Name,Email,Present,Late,Absent";
    if (reportType === "location") header = "Name,Email,Latitude,Longitude,Home Address";

    const csv = header + "\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `RWATRACK_${reportType}_report.csv`; a.click();
  };

  const printReport = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>RWATRACK Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #1E293B; }
        h1 { color: #1E3A5F; border-bottom: 3px solid #3B82F6; padding-bottom: 8px; }
        h2 { color: #3B82F6; margin-top: 24px; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
        th { background: #1E3A5F; color: white; padding: 10px 8px; text-align: left; }
        td { padding: 8px; border-bottom: 1px solid #E2E8F0; }
        tr:nth-child(even) { background: #F0F4FF; }
        .stat { display: inline-block; text-align: center; padding: 16px 24px; margin: 8px; border: 1px solid #E2E8F0; border-radius: 8px; }
        .stat .num { font-size: 28px; font-weight: bold; color: #3B82F6; }
        .stat .label { font-size: 11px; color: #64748B; }
        .header { background: linear-gradient(135deg, #1E3A5F, #3B82F6); color: white; padding: 24px; margin: -40px -40px 24px; }
        .header h1 { color: white; border: none; margin: 0; }
        .header p { color: #CADCFC; margin: 4px 0 0; }
        .footer { text-align: center; margin-top: 40px; padding-top: 16px; border-top: 2px solid #E2E8F0; font-size: 10px; color: #94A3B8; }
        @media print { .no-print { display: none; } }
      </style></head><body>
      <div class="header">
        <h1>📍 RWATRACK — ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</h1>
        <p>Generated: ${new Date().toLocaleString()} | AI-Driven Workforce Management</p>
      </div>
      ${content.innerHTML}
      <div class="footer">
        <p>RWATRACK — University of Rwanda • School of ICT • Department of Information Systems</p>
        <p>BIZIRUGIRA Gilbert (222005932) & ABAYISENGA Josiane (222003434) • Supervisor: Dr. RWIGEMA James</p>
      </div>
      </body></html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-950">
      <HRNav user={user} />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/hr" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Reports & Analytics</h1>
            <p className="text-muted-foreground text-sm">Generate detailed reports with charts</p>
          </div>
        </div>

        {/* Controls */}
        <Card className="border-blue-200 dark:border-gray-700 mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="text-xs font-medium mb-1 block">Report Type</label>
                <select value={reportType} onChange={e => setReportType(e.target.value)}
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="summary">Worker Summary</option>
                  <option value="attendance">Attendance Report</option>
                  <option value="location">Location/GPS Report</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">From</label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-auto" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">To</label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-auto" />
              </div>
              <Button onClick={generateReport} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                Generate Report
              </Button>
              {report && (
                <>
                  <Button variant="outline" onClick={exportCSV}><Download className="w-4 h-4 mr-2" /> CSV</Button>
                  <Button variant="outline" onClick={printReport}><Printer className="w-4 h-4 mr-2" /> Print/PDF</Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Report Content */}
        {report && (
          <div ref={printRef}>
            {/* Summary Report */}
            {report.type === "summary" && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <Card className="border-blue-200"><CardContent className="pt-4 text-center">
                    <Users className="w-6 h-6 mx-auto text-blue-500 mb-1" />
                    <p className="text-2xl font-bold">{report.stats.totalWorkers}</p>
                    <p className="text-xs text-muted-foreground">Total Workers</p>
                  </CardContent></Card>
                  <Card className="border-green-200"><CardContent className="pt-4 text-center">
                    <CheckCircle className="w-6 h-6 mx-auto text-green-500 mb-1" />
                    <p className="text-2xl font-bold text-green-600">{report.stats.present}</p>
                    <p className="text-xs text-muted-foreground">Present Today</p>
                  </CardContent></Card>
                  <Card className="border-amber-200"><CardContent className="pt-4 text-center">
                    <MapPin className="w-6 h-6 mx-auto text-amber-500 mb-1" />
                    <p className="text-2xl font-bold text-amber-600">{report.stats.withGPS}</p>
                    <p className="text-xs text-muted-foreground">With GPS</p>
                  </CardContent></Card>
                  <Card className="border-red-200"><CardContent className="pt-4 text-center">
                    <XCircle className="w-6 h-6 mx-auto text-red-500 mb-1" />
                    <p className="text-2xl font-bold text-red-600">{report.stats.absent}</p>
                    <p className="text-xs text-muted-foreground">Absent Today</p>
                  </CardContent></Card>
                </div>

                {/* Attendance Pie Chart */}
                <Card className="border-blue-200 mb-6">
                  <CardHeader><CardTitle className="text-base">Today's Attendance Overview</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={[
                          { name: "Present", value: report.stats.present },
                          { name: "Late", value: report.stats.late || 0 },
                          { name: "Absent", value: report.stats.absent },
                        ]} cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                          <Cell fill="#22C55E" /><Cell fill="#F59E0B" /><Cell fill="#EF4444" />
                        </Pie>
                        <Tooltip /><Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Worker Table */}
                <Card className="border-blue-200">
                  <CardHeader><CardTitle className="text-base">Worker Details</CardTitle></CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b bg-muted/50">
                          <th className="text-left p-3 font-semibold">Name</th>
                          <th className="text-left p-3 font-semibold">Email</th>
                          <th className="text-left p-3 font-semibold">Department</th>
                          <th className="text-left p-3 font-semibold">Home Address</th>
                          <th className="text-left p-3 font-semibold">GPS</th>
                          <th className="text-left p-3 font-semibold">Status</th>
                        </tr></thead>
                        <tbody>
                          {report.workers?.map((w: any, i: number) => (
                            <tr key={i} className="border-b hover:bg-blue-50/50">
                              <td className="p-3 font-medium">{w.name}</td>
                              <td className="p-3 text-muted-foreground">{w.email}</td>
                              <td className="p-3">{w.department}</td>
                              <td className="p-3 text-xs max-w-[200px] truncate">{w.homeAddress}</td>
                              <td className="p-3">{w.hasGPS ? <Badge className="bg-green-100 text-green-700">Yes</Badge> : <Badge className="bg-gray-100 text-gray-500">No</Badge>}</td>
                              <td className="p-3"><Badge className={w.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>{w.status}</Badge></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Attendance Report */}
            {report.type === "attendance" && (
              <>
                <Card className="border-blue-200 mb-6">
                  <CardHeader><CardTitle className="text-base">Attendance Summary ({report.period.start} to {report.period.end})</CardTitle></CardHeader>
                  <CardContent>
                    {report.workers?.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={report.workers}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="present" fill="#22C55E" name="Present" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="late" fill="#F59E0B" name="Late" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="absent" fill="#EF4444" name="Absent" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No attendance data for this period</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-blue-200">
                  <CardHeader><CardTitle className="text-base">Worker Attendance Details</CardTitle></CardHeader>
                  <CardContent>
                    <table className="w-full text-sm">
                      <thead><tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-semibold">Worker</th>
                        <th className="text-center p-3 font-semibold">Present</th>
                        <th className="text-center p-3 font-semibold">Late</th>
                        <th className="text-center p-3 font-semibold">Absent</th>
                        <th className="text-center p-3 font-semibold">Rate</th>
                      </tr></thead>
                      <tbody>
                        {report.workers?.map((w: any, i: number) => {
                          const total = w.present + w.late + w.absent;
                          const rate = total > 0 ? Math.round(((w.present + w.late) / total) * 100) : 0;
                          return (
                            <tr key={i} className="border-b">
                              <td className="p-3"><p className="font-medium">{w.name}</p><p className="text-xs text-muted-foreground">{w.email}</p></td>
                              <td className="p-3 text-center text-green-600 font-bold">{w.present}</td>
                              <td className="p-3 text-center text-amber-600 font-bold">{w.late}</td>
                              <td className="p-3 text-center text-red-600 font-bold">{w.absent}</td>
                              <td className="p-3 text-center">
                                <Badge className={rate >= 80 ? "bg-green-100 text-green-700" : rate >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}>{rate}%</Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Location Report */}
            {report.type === "location" && (
              <Card className="border-blue-200">
                <CardHeader><CardTitle className="text-base">GPS Location Report ({report.totalWorkersWithGPS} workers with GPS)</CardTitle></CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-semibold">Worker</th>
                      <th className="text-left p-3 font-semibold">Home Address</th>
                      <th className="text-left p-3 font-semibold">GPS (Home)</th>
                      <th className="text-left p-3 font-semibold">Work Address</th>
                      <th className="text-left p-3 font-semibold">Last Location</th>
                    </tr></thead>
                    <tbody>
                      {report.workers?.map((w: any, i: number) => (
                        <tr key={i} className="border-b hover:bg-blue-50/50">
                          <td className="p-3"><p className="font-medium">{w.name}</p><p className="text-xs text-muted-foreground">{w.email}</p></td>
                          <td className="p-3 text-xs max-w-[150px] truncate">{w.homeAddress}</td>
                          <td className="p-3 text-xs text-muted-foreground">{w.homeLat?.toFixed(4)}, {w.homeLng?.toFixed(4)}</td>
                          <td className="p-3 text-xs max-w-[150px] truncate">{w.workAddress}</td>
                          <td className="p-3 text-xs text-muted-foreground">
                            {w.recentLocations?.[0] ? (
                              <span>{new Date(w.recentLocations[0].time).toLocaleString()}</span>
                            ) : "No recent data"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {!report && !loading && (
          <Card className="border-blue-200">
            <CardContent className="py-16 text-center">
              <FileText className="w-16 h-16 mx-auto text-blue-100 mb-4" />
              <h2 className="text-lg font-bold mb-2">Generate a Report</h2>
              <p className="text-muted-foreground text-sm">Select a report type, date range, and click Generate</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
