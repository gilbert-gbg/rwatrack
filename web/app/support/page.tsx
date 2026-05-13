"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, HelpCircle, Send, Loader2, CheckCircle, Clock, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Footer } from "@/components/Footer";

export default function SupportPage() {
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userRes, ticketsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/support"),
      ]);
      if (userRes.ok) setUser(await userRes.json());
      if (ticketsRes.ok) setTickets(await ticketsRes.json());
    } catch {}
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({ title: "Error", description: "Subject and message are required", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
      });
      if (res.ok) {
        const ticket = await res.json();
        setTickets((prev) => [ticket, ...prev]);
        setSubject("");
        setMessage("");
        toast({ title: "Ticket Submitted!", description: "Admin will respond to your request" });
      }
    } catch {}
    setSending(false);
  };

  const dashboardPath = user?.role === "ADMIN" ? "/admin" : user?.role === "HR" ? "/hr" : "/worker";
  const statusColor = (s: string) => {
    if (s === "RESOLVED") return "bg-green-100 text-green-700";
    if (s === "IN_PROGRESS") return "bg-blue-100 text-blue-700";
    return "bg-amber-100 text-amber-700";
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-950">
      <header className="border-b border-blue-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={dashboardPath} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <Badge className="bg-primary/10 text-primary">Help & Support</Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <HelpCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Help & Support</h1>
            <p className="text-muted-foreground text-sm">Submit a request or ask a question</p>
          </div>
        </div>

        {/* Submit form */}
        <Card className="border-blue-200 dark:border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" /> New Support Request
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Subject</label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What do you need help with?" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue or question in detail..."
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <Button onClick={handleSubmit} disabled={sending} className="w-full">
              {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              {sending ? "Submitting..." : "Submit Request"}
            </Button>
          </CardContent>
        </Card>

        {/* My tickets */}
        <Card className="border-blue-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> My Requests ({tickets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tickets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No support requests yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map((t: any) => (
                  <div key={t.id} className="p-4 border border-blue-100 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-sm">{t.subject}</p>
                      <Badge className={statusColor(t.status)}>{t.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{t.message}</p>
                    <p className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleString()}</p>
                    {t.response && (
                      <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-xs font-semibold text-green-700 mb-1">Admin Response:</p>
                        <p className="text-sm text-green-800 dark:text-green-300">{t.response}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
