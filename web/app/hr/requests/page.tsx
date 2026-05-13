"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HRNav } from "@/components/hr/nav";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Loader2, FileText, ArrowLeft } from "lucide-react";

interface ResidenceRequest {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "IN_REVIEW";
  employee: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  newAddress: string;
  moveDate: string;
  reason: string;
  createdAt: string;
  comments?: string;
}

export default function HRRequestsPage() {
  const [requests, setRequests] = useState<ResidenceRequest[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const [userRes, requestsRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch(`/api/residence-requests${statusFilter ? `?status=${statusFilter}` : ""}`),
        ]);

        if (userRes.ok) {
          const data = await userRes.json();
          setUser(data.user ?? data);
        }

        if (requestsRes.ok) {
          const data = await requestsRes.json();
          setRequests(data);
        } else {
          setError("Failed to load requests");
        }
      } catch (err) {
        setError("Error fetching requests");
        console.error("[v0] Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "IN_REVIEW":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <HRNav user={user} />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <HRNav user={user} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/hr"
              className="flex items-center gap-2 text-primary hover:text-primary/80 mb-4 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-foreground">
              Residence Requests
            </h1>
            <p className="text-muted-foreground mt-2">
              Review and manage employee residence change requests
            </p>
          </div>
          {pendingCount > 0 && (
            <Badge className="bg-yellow-100 text-yellow-800 text-lg px-3 py-1">
              {pendingCount} Pending
            </Badge>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filter */}
        <div className="mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IN_REVIEW">In Review</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Requests */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle>Requests ({requests.length})</CardTitle>
            <CardDescription>All residence change requests</CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {statusFilter
                    ? "No requests with this status"
                    : "No requests found"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="border border-blue-100 rounded-lg p-4 hover:bg-blue-50/50 transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">
                          {request.employee.user.firstName}{" "}
                          {request.employee.user.lastName}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          <span className="font-medium">New Address:</span>{" "}
                          {request.newAddress}
                        </p>
                      </div>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </div>

                    <div className="grid md:grid-cols-3 gap-3 text-sm mb-3 pt-3 border-t border-blue-100">
                      <div>
                        <p className="text-muted-foreground">Move Date</p>
                        <p className="font-medium">
                          {new Date(request.moveDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Reason</p>
                        <p className="font-medium text-foreground">
                          {request.reason.substring(0, 30)}...
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Submitted</p>
                        <p className="font-medium">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {request.comments && (
                      <div className="bg-blue-50 p-2 rounded text-xs mb-3">
                        <p className="text-muted-foreground">
                          <span className="font-semibold">Comments:</span>{" "}
                          {request.comments}
                        </p>
                      </div>
                    )}

                    <Button
                      asChild
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Link href={`/hr/requests/${request.id}`}>
                        Review Request →
                      </Link>
                    </Button>
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
