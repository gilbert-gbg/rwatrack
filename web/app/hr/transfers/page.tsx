"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HRNav } from "@/components/hr/nav";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle, XCircle, Clock, Shield, Eye, UserCheck, Building, History } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function HRTransfersPage() {
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>({ transfers: [], workerHistory: [] });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [viewingHistory, setViewingHistory] = useState<string | null>(null);
  const [workerHistory, setWorkerHistory] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [uRes, tRes] = await Promise.all([
        fetch("/api/auth/me"), fetch("/api/transfers"),
      ]);
      if (uRes.ok) setUser(await uRes.json());
      if (tRes.ok) setData(await tRes.json());
    } catch {}
    setLoading(false);
  };

  const handleAction = async (action: string, transferId: string, extra?: any) => {
    setProcessing(transferId);
    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, transferId, ...extra }),
      });
      if (res.ok) {
        toast({ title: "Success!", description: `Transfer ${action.replace("_", " ")} completed` });
        fetchData();
      }
    } catch {}
    setProcessing(null);
  };

  const viewHistory = async (workerId: string) => {
    setViewingHistory(workerId);
    try {
      const res = await fetch(`/api/transfers?workerId=${workerId}`);
      if (res.ok) {
        const d = await res.json();
        setWorkerHistory(d.workerHistory || []);
      }
    } catch {}
  };

  const statusBadge = (status: string) => {
    const map: any = {
      PENDING: { color: "bg-amber-100 text-amber-700", icon: Clock, text: "Pending" },
      OLD_HR_APPROVED: { color: "bg-blue-100 text-blue-700", icon: CheckCircle, text: "Released by HR" },
      COMPLETED: { color: "bg-green-100 text-green-700", icon: CheckCircle, text: "Completed" },
      REJECTED: { color: "bg-red-100 text-red-700", icon: XCircle, text: "Rejected" },
    };
    const s = map[status] || map.PENDING;
    return <Badge className={s.color}><s.icon className="w-3 h-3 mr-1" />{s.text}</Badge>;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const incoming = data.transfers?.filter((t: any) => t.toInstitution === user?.institution && t.toDepartment === user?.department) || [];
  const outgoing = data.transfers?.filter((t: any) => t.fromInstitution === user?.institution && t.fromDepartment === user?.department) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-950">
      <HRNav user={user} />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/hr" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <ArrowRight className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Worker Transfers</h1>
            <p className="text-muted-foreground text-sm">Manage incoming and outgoing worker transfers</p>
          </div>
        </div>

        {/* Outgoing Transfers (workers leaving your department) */}
        <Card className="border-blue-200 dark:border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-red-500" /> Outgoing Transfers (Workers Leaving)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {outgoing.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">No outgoing transfer requests</p>
            ) : (
              <div className="space-y-4">
                {outgoing.map((t: any) => (
                  <div key={t.id} className="p-4 border border-blue-100 dark:border-gray-700 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary text-xs font-bold">{t.worker?.user?.firstName?.[0]}{t.worker?.user?.lastName?.[0]}</span>
                        </div>
                        <div>
                          <p className="font-semibold">{t.worker?.user?.firstName} {t.worker?.user?.lastName}</p>
                          <p className="text-xs text-muted-foreground">{t.worker?.user?.email}</p>
                        </div>
                      </div>
                      {statusBadge(t.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                      <div className="p-2 bg-red-50 dark:bg-red-950/20 rounded-lg">
                        <p className="text-xs text-red-500 font-semibold">From (Your Dept)</p>
                        <p className="font-medium">{t.fromInstitution}</p>
                        <p className="text-muted-foreground text-xs">{t.fromDepartment}</p>
                      </div>
                      <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <p className="text-xs text-green-500 font-semibold">To (New Dept)</p>
                        <p className="font-medium">{t.toInstitution}</p>
                        <p className="text-muted-foreground text-xs">{t.toDepartment}</p>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3"><strong>Reason:</strong> {t.reason}</p>

                    {t.status === "PENDING" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleAction("approve_release", t.id)} disabled={processing === t.id}>
                          <CheckCircle className="w-4 h-4 mr-1" /> Approve Release
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleAction("reject", t.id)} disabled={processing === t.id}>
                          <XCircle className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </div>
                    )}

                    {t.status !== "PENDING" && !t.dataAccessGranted && t.status !== "REJECTED" && (
                      <Button size="sm" variant="outline" onClick={() => handleAction("grant_access", t.id)} disabled={processing === t.id}>
                        <Eye className="w-4 h-4 mr-1" /> Grant Data Access to New HR
                      </Button>
                    )}

                    {t.dataAccessGranted && (
                      <Badge className="bg-blue-100 text-blue-700"><Eye className="w-3 h-3 mr-1" /> Data access granted to new HR</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Incoming Transfers (workers joining your department) */}
        <Card className="border-green-200 dark:border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-green-500" /> Incoming Transfers (Workers Joining)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {incoming.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">No incoming transfer requests</p>
            ) : (
              <div className="space-y-4">
                {incoming.map((t: any) => (
                  <div key={t.id} className="p-4 border border-green-100 dark:border-gray-700 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-green-600 text-xs font-bold">{t.worker?.user?.firstName?.[0]}{t.worker?.user?.lastName?.[0]}</span>
                        </div>
                        <div>
                          <p className="font-semibold">{t.worker?.user?.firstName} {t.worker?.user?.lastName}</p>
                          <p className="text-xs text-muted-foreground">{t.worker?.user?.email} • {t.worker?.user?.phone || "N/A"}</p>
                        </div>
                      </div>
                      {statusBadge(t.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                      <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-xs text-muted-foreground font-semibold">Coming From</p>
                        <p className="font-medium">{t.fromInstitution}</p>
                        <p className="text-muted-foreground text-xs">{t.fromDepartment}</p>
                      </div>
                      <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <p className="text-xs text-green-500 font-semibold">To (Your Dept)</p>
                        <p className="font-medium">{t.toInstitution}</p>
                        <p className="text-muted-foreground text-xs">{t.toDepartment}</p>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3"><strong>Reason:</strong> {t.reason}</p>

                    {t.status === "OLD_HR_APPROVED" && (
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleAction("approve_join", t.id)} disabled={processing === t.id}>
                          <UserCheck className="w-4 h-4 mr-1" /> Accept Worker
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleAction("reject", t.id)} disabled={processing === t.id}>
                          <XCircle className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </div>
                    )}

                    {t.status === "PENDING" && (
                      <div className="p-2 bg-amber-50 rounded-lg text-xs text-amber-700">
                        <Clock className="w-3 h-3 inline mr-1" /> Waiting for current HR to approve release first
                      </div>
                    )}

                    {!t.dataAccessGranted && t.status !== "REJECTED" && t.status !== "PENDING" && (
                      <Button size="sm" variant="outline" className="mt-2" onClick={() => handleAction("request_access", t.id)} disabled={processing === t.id}>
                        <Shield className="w-4 h-4 mr-1" /> Request Access to Previous Data
                      </Button>
                    )}

                    {t.dataAccessGranted && (
                      <div className="mt-2">
                        <Badge className="bg-green-100 text-green-700 mb-2"><Eye className="w-3 h-3 mr-1" /> Data access granted</Badge>
                        <Button size="sm" variant="outline" className="ml-2" onClick={() => viewHistory(t.workerId)}>
                          <History className="w-4 h-4 mr-1" /> View Work History
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Worker History Modal */}
        {viewingHistory && workerHistory.length > 0 && (
          <Card className="border-purple-200 dark:border-gray-700 mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="w-4 h-4 text-purple-500" /> Work History
                </CardTitle>
                <Button size="sm" variant="ghost" onClick={() => { setViewingHistory(null); setWorkerHistory([]); }}>Close</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workerHistory.map((h: any, i: number) => (
                  <div key={i} className="p-3 border border-purple-100 dark:border-gray-700 rounded-lg flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <Building className="w-4 h-4 text-purple-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{h.institution} — {h.department}</p>
                      <p className="text-xs text-muted-foreground">Job: {h.jobTitle} • HR: {h.hrName || "N/A"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(h.startDate).toLocaleDateString()} → {h.endDate ? new Date(h.endDate).toLocaleDateString() : "Present"}
                      </p>
                      {h.reason && <p className="text-xs text-muted-foreground mt-1">Transfer reason: {h.reason}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
