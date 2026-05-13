"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminNav } from "@/components/admin/nav";
import { Loader2, HelpCircle, Send, CheckCircle, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function AdminSupportPage() {
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userRes, ticketsRes] = await Promise.all([
        fetch("/api/auth/me"), fetch("/api/support"),
      ]);
      if (userRes.ok) setUser(await userRes.json());
      if (ticketsRes.ok) setTickets(await ticketsRes.json());
    } catch {}
    setLoading(false);
  };

  const handleRespond = async (ticketId: string) => {
    if (!responseText.trim()) return;
    try {
      const res = await fetch("/api/support", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, response: responseText.trim(), status: "RESOLVED" }),
      });
      if (res.ok) {
        setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, response: responseText.trim(), status: "RESOLVED" } : t));
        setResponding(null);
        setResponseText("");
        toast({ title: "Response Sent!", description: "User has been notified" });
      }
    } catch {}
  };

  const statusColor = (s: string) => {
    if (s === "RESOLVED") return "bg-green-100 text-green-700";
    if (s === "IN_PROGRESS") return "bg-blue-100 text-blue-700";
    return "bg-amber-100 text-amber-700";
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const openTickets = tickets.filter((t) => t.status === "OPEN").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-950">
      <AdminNav user={user} />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/admin" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Support Requests</h1>
            <p className="text-muted-foreground text-sm">{openTickets} open tickets</p>
          </div>
          <HelpCircle className="w-12 h-12 text-blue-100" />
        </div>

        {tickets.length === 0 ? (
          <Card className="border-blue-200"><CardContent className="py-12 text-center text-muted-foreground">
            <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No support requests yet</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-4">
            {tickets.map((t: any) => (
              <Card key={t.id} className="border-blue-200 dark:border-gray-700">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-bold text-sm">{t.user?.firstName?.[0]}{t.user?.lastName?.[0]}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{t.user?.firstName} {t.user?.lastName}</p>
                        <p className="text-xs text-muted-foreground">{t.user?.email} • {t.user?.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColor(t.status)}>{t.status}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <h3 className="font-semibold mb-1">{t.subject}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{t.message}</p>

                  {t.response ? (
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
                      <div className="flex items-center gap-1 mb-1">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        <span className="text-xs font-semibold text-green-700">Your Response</span>
                      </div>
                      <p className="text-sm text-green-800 dark:text-green-300">{t.response}</p>
                    </div>
                  ) : responding === t.id ? (
                    <div className="flex gap-2">
                      <Input value={responseText} onChange={(e) => setResponseText(e.target.value)} placeholder="Type your response..." onKeyDown={(e) => e.key === "Enter" && handleRespond(t.id)} />
                      <Button onClick={() => handleRespond(t.id)} size="sm"><Send className="w-4 h-4" /></Button>
                      <Button onClick={() => { setResponding(null); setResponseText(""); }} size="sm" variant="outline">Cancel</Button>
                    </div>
                  ) : (
                    <Button onClick={() => setResponding(t.id)} size="sm" variant="outline" className="mt-2">
                      <Send className="w-4 h-4 mr-1" /> Respond
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
