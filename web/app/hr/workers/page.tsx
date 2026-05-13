"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HRNav } from "@/components/hr/nav";
import { Loader2, Users, MapPin } from "lucide-react";

interface Worker {
  id: string;
  jobTitle: string;
  homeAddress?: string | null;
  workAddress?: string | null;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    status: string;
  };
  hr?: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export default function HRWorkersPage() {
  const [user, setUser] = useState<any>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [userRes, workersRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/workers"),
        ]);

        if (userRes.ok) {
          const payload = await userRes.json();
          setUser(payload.user ?? payload);
        }

        if (workersRes.ok) {
          const data = await workersRes.json();
          setWorkers(data);
        } else {
          setError("Failed to load workers");
        }
      } catch (err) {
        setError("Unable to fetch worker data");
        console.error("[HR Workers] fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <HRNav user={user} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Workers</h1>
            <p className="text-muted-foreground">View all workers managed by your HR team.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href="/hr/workers/new">Register Worker</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/hr/approvals">Pending Approvals</Link>
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4">
          {workers.length === 0 ? (
            <Card className="border-blue-200">
              <CardContent className="text-center py-16">
                <Users className="w-12 h-12 text-muted-foreground/70 mx-auto mb-4" />
                <p className="text-muted-foreground">No workers found yet.</p>
                <Button asChild className="mt-4 bg-primary hover:bg-primary/90">
                  <Link href="/hr/workers/new">Register your first worker</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            workers.map((worker) => (
              <Card key={worker.id} className="border-blue-200">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>{worker.user.firstName} {worker.user.lastName}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      {worker.user.email}
                    </CardDescription>
                  </div>
                  <Badge className={worker.user.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {worker.user.status}
                  </Badge>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Job title</p>
                    <p>{worker.jobTitle}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">HR</p>
                    <p>{worker.hr ? `${worker.hr.firstName} ${worker.hr.lastName}` : "Unassigned"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contact</p>
                    <p>{worker.user.phone || "No phone"}</p>
                  </div>
                </CardContent>
                <CardContent className="grid gap-4 md:grid-cols-2 border-t border-blue-100 pt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Home address</p>
                    <p>{worker.homeAddress || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Work address</p>
                    <p>{worker.workAddress || "Not provided"}</p>
                  </div>
                </CardContent>
                <CardContent className="border-t border-blue-100 pt-4">
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/hr/workers/${worker.id}`}>View Worker Details</Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
