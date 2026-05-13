"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AdminNav } from "@/components/admin/nav";
import {
  AlertCircle,
  Loader2,
  FileText,
  ArrowLeft,
  Download,
} from "lucide-react";
import Link from "next/link";

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  details?: string;
  user: {
    email: string;
    firstName: string;
    lastName: string;
  };
  ipAddress?: string;
  createdAt: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const limit = 50;

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(
          `/api/audit-logs?limit=${limit}&offset=${page * limit}`,
        );
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs);
        } else {
          setError("Failed to load audit logs");
        }
      } catch (err) {
        setError("Error fetching logs");
        console.error("[v0] Fetch logs error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [page]);

  const getActionColor = (action: string) => {
    if (action.includes("CREATE") || action.includes("ADD"))
      return "text-green-600";
    if (action.includes("UPDATE") || action.includes("MODIFY"))
      return "text-blue-600";
    if (action.includes("DELETE") || action.includes("REMOVE"))
      return "text-red-600";
    if (action.includes("LOGIN") || action.includes("LOGOUT"))
      return "text-yellow-600";
    return "text-gray-600";
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/admin"
              className="flex items-center gap-2 text-primary hover:text-primary/80 mb-4 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-foreground">Audit Logs</h1>
            <p className="text-muted-foreground mt-2">
              System-wide activity and compliance tracking
            </p>
          </div>
          <FileText className="w-12 h-12 text-blue-100" />
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>
                All system actions tracked for compliance
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">No audit logs found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="border border-blue-100 rounded-lg p-4 hover:bg-blue-50/50 transition"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <h4
                          className={`font-semibold text-sm ${getActionColor(log.action)}`}
                        >
                          {log.action}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {log.resource}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {log.user.firstName} {log.user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.user.email}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {log.ipAddress && (
                          <>
                            <p className="text-xs font-mono">
                              IP: {log.ipAddress}
                            </p>
                          </>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {log.details && (
                      <div className="mt-2 pt-2 border-t border-blue-100">
                        <p className="text-xs text-muted-foreground font-mono">
                          Details: {log.details}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {logs.length > 0 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-blue-100">
                <Button
                  variant="outline"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page + 1}
                </span>
                <Button
                  variant="outline"
                  disabled={logs.length < limit}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
