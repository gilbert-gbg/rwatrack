"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminNav } from "@/components/admin/nav";
import { AlertCircle, Loader2, UserCheck, CheckCircle, XCircle, ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";

interface PendingUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: string;
}

export default function AdminApprovalsPage() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const users: PendingUser[] = await res.json();
        // Admin sees pending HR managers
        setPendingUsers(users.filter(u => u.status === "INACTIVE" && u.role === "HR"));
      } else {
        setError("Failed to load pending users");
      }
    } catch {
      setError("Error fetching users");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setUpdating(userId);
    setSuccessMsg("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status: "ACTIVE", role: "HR" }),
      });
      if (res.ok) {
        setPendingUsers(prev => prev.filter(u => u.id !== userId));
        setSuccessMsg("HR Manager approved! They can now login and manage workers.");
      }
    } catch {
      setError("Failed to approve user");
    } finally {
      setUpdating(null);
    }
  };

  const handleReject = async (userId: string) => {
    setUpdating(userId);
    setSuccessMsg("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status: "SUSPENDED", role: "HR" }),
      });
      if (res.ok) {
        setPendingUsers(prev => prev.filter(u => u.id !== userId));
        setSuccessMsg("HR Manager registration rejected.");
      }
    } catch {
      setError("Failed to reject user");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <AdminNav user={null} />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <AdminNav user={null} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="mb-8">
          <Link href="/admin" className="flex items-center gap-2 text-primary hover:text-primary/80 mb-4 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-primary" />
            HR Manager Approvals
          </h1>
          <p className="text-muted-foreground mt-2">
            Review and approve HR Manager registration requests
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successMsg && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">{successMsg}</AlertDescription>
          </Alert>
        )}

        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              Pending HR Manager Registrations ({pendingUsers.length})
            </CardTitle>
            <CardDescription>
              These HR managers are waiting for your approval to access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingUsers.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No pending HR approvals</p>
                <p className="text-sm text-muted-foreground">All HR registrations have been reviewed</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingUsers.map(user => (
                  <div key={user.id} className="border border-yellow-200 bg-yellow-50/30 rounded-xl p-5">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center font-bold text-green-700 text-lg">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-lg">
                            {user.firstName} {user.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          {user.phone && (
                            <p className="text-sm text-muted-foreground">{user.phone}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              <UserCheck className="w-3 h-3 mr-1" /> HR Manager
                            </Badge>
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                              <Clock className="w-3 h-3 mr-1" /> Pending
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Registered: {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApprove(user.id)}
                          disabled={updating === user.id}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {updating === user.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <><CheckCircle className="w-4 h-4 mr-1" /> Approve</>
                          }
                        </Button>
                        <Button
                          onClick={() => handleReject(user.id)}
                          disabled={updating === user.id}
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          {updating === user.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <><XCircle className="w-4 h-4 mr-1" /> Reject</>
                          }
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
