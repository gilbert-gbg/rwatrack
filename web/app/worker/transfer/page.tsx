"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle, XCircle, Clock, Send, Building, History } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function WorkerTransferPage() {
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>({ transfers: [], history: [] });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [reason, setReason] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const [uRes, tRes, dRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/transfers"),
          fetch("/api/hr/departments"),
        ]);
        if (uRes.ok) setUser(await uRes.json());
        if (tRes.ok) setData(await tRes.json());
        if (dRes.ok) setDepartments(await dRes.json());
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const submitTransfer = async () => {
    if (!selectedDept || !reason.trim()) {
      toast({ title: "Error", description: "Select department and provide reason", variant: "destructive" });
      return;
    }

    const dept = departments.find((d: any) => d.hrId === selectedDept);
    if (!dept) return;

    setSending(true);
    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request",
          toInstitution: dept.institution,
          toDepartment: dept.department,
          reason: reason.trim(),
        }),
      });
      if (res.ok) {
        toast({ title: "Transfer Requested!", description: "Your HR manager will review your request" });
        setSelectedDept("");
        setReason("");
        // Refresh
        const tRes = await fetch("/api/transfers");
        if (tRes.ok) setData(await tRes.json());
      }
    } catch {}
    setSending(false);
  };

  const statusBadge = (status: string) => {
    const map: any = {
      PENDING: { color: "bg-amber-100 text-amber-700", icon: Clock, text: "Pending HR Approval" },
      OLD_HR_APPROVED: { color: "bg-blue-100 text-blue-700", icon: CheckCircle, text: "Approved, Waiting New HR" },
      COMPLETED: { color: "bg-green-100 text-green-700", icon: CheckCircle, text: "Transfer Complete" },
      REJECTED: { color: "bg-red-100 text-red-700", icon: XCircle, text: "Rejected" },
    };
    const s = map[status] || map.PENDING;
    return <Badge className={s.color}><s.icon className="w-3 h-3 mr-1" />{s.text}</Badge>;
  };

  const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  // Filter out current department from options
  const availableDepts = departments.filter((d: any) =>
    !(d.institution === user?.institution && d.department === user?.department)
  );

  const hasPending = data.transfers?.some((t: any) => t.status === "PENDING" || t.status === "OLD_HR_APPROVED");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-950">
      <header className="border-b border-blue-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/worker" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <Badge className="bg-primary/10 text-primary">Transfer</Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <ArrowRight className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Request Transfer</h1>
            <p className="text-muted-foreground text-sm">Move to a different department or institution</p>
          </div>
        </div>

        {/* Current Department */}
        <Card className="border-blue-200 dark:border-gray-700 mb-6">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground mb-1">Your Current Department</p>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <p className="font-semibold">{user?.institution || "N/A"}</p>
              <p className="text-sm text-muted-foreground">{user?.department || "N/A"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Request Transfer Form */}
        {!hasPending ? (
          <Card className="border-blue-200 dark:border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Send className="w-4 h-4 text-primary" /> New Transfer Request
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1 block">Transfer To (Select Department)</label>
                {availableDepts.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                    No other departments available for transfer.
                  </div>
                ) : (
                  <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className={selectClass}>
                    <option value="">-- Select new department --</option>
                    {availableDepts.map((d: any) => (
                      <option key={d.hrId} value={d.hrId}>{d.institution} — {d.department} (HR: {d.hrName})</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Reason for Transfer</label>
                <textarea
                  value={reason} onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why you want to transfer..."
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <Button onClick={submitTransfer} disabled={sending || !selectedDept || !reason.trim()} className="w-full">
                {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                {sending ? "Submitting..." : "Submit Transfer Request"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-amber-200 dark:border-gray-700 mb-6">
            <CardContent className="py-8 text-center">
              <Clock className="w-12 h-12 mx-auto text-amber-400 mb-3" />
              <p className="font-semibold">You have a pending transfer request</p>
              <p className="text-sm text-muted-foreground">Please wait for HR to process it before submitting another.</p>
            </CardContent>
          </Card>
        )}

        {/* My Transfer Requests */}
        {data.transfers?.length > 0 && (
          <Card className="border-blue-200 dark:border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowRight className="w-4 h-4" /> My Transfer Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.transfers.map((t: any) => (
                <div key={t.id} className="p-4 border border-blue-100 dark:border-gray-700 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="grid grid-cols-2 gap-3 flex-1">
                      <div>
                        <p className="text-xs text-muted-foreground">From</p>
                        <p className="text-sm font-medium">{t.fromInstitution} — {t.fromDepartment}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">To</p>
                        <p className="text-sm font-medium">{t.toInstitution} — {t.toDepartment}</p>
                      </div>
                    </div>
                    {statusBadge(t.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">Reason: {t.reason}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(t.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Work History */}
        {data.history?.length > 0 && (
          <Card className="border-purple-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="w-4 h-4 text-purple-500" /> My Work History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.history.map((h: any, i: number) => (
                <div key={i} className="p-3 border border-purple-100 dark:border-gray-700 rounded-lg flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Building className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{h.institution} — {h.department}</p>
                    <p className="text-xs text-muted-foreground">Job: {h.jobTitle} • HR: {h.hrName || "N/A"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(h.startDate).toLocaleDateString()} → {h.endDate ? new Date(h.endDate).toLocaleDateString() : "Present"}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
