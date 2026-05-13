"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminNav } from "@/components/admin/nav";
import {
  AlertCircle,
  Loader2,
  Users,
  ArrowLeft,
  CheckCircle,
  XCircle,
  UserCheck,
  Clock,
} from "lucide-react";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  status: string;
  institution?: string;
  department?: string;
  createdAt: string;
}

export default function AdminHRPage() {
  const [user, setUser] = useState<any>(null);
  const [hrManagers, setHrManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userRes, usersRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/admin/users"),
      ]);

      if (userRes.ok) setUser(await userRes.json());

      if (usersRes.ok) {
        const allUsers = await usersRes.json();
        const hrs = (Array.isArray(allUsers) ? allUsers : []).filter(
          (u: User) => u.role === "HR"
        );
        setHrManagers(hrs);
      } else {
        setError("Failed to load HR managers");
      }
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (userId: string, status: string) => {
    setUpdating(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status }),
      });

      if (res.ok) {
        setHrManagers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status } : u))
        );
      } else {
        alert("Failed to update user");
      }
    } catch {
      alert("Failed to update user");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeHRs = hrManagers.filter((u) => u.status === "ACTIVE").length;
  const pendingHRs = hrManagers.filter((u) => u.status === "INACTIVE").length;
  const suspendedHRs = hrManagers.filter((u) => u.status === "SUSPENDED").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <AdminNav user={user} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          href="/admin"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              HR Manager Management
            </h1>
            <p className="text-gray-500 mt-1">
              View and manage all HR managers in the system
            </p>
          </div>
          <div className="hidden md:block">
            <UserCheck className="w-16 h-16 text-blue-100" />
          </div>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total HR Managers</p>
                  <p className="text-2xl font-bold">{hrManagers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active</p>
                  <p className="text-2xl font-bold text-green-600">
                    {activeHRs}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pending Approval</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {pendingHRs}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* HR List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              All HR Managers ({hrManagers.length})
            </CardTitle>
            <CardDescription>
              Approve, suspend, or manage HR manager accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hrManagers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">No HR managers registered yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">
                        Phone
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">
                        Registered
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {hrManagers.map((hr) => (
                      <tr
                        key={hr.id}
                        className="border-b hover:bg-gray-50 transition"
                      >
                        <td className="py-3 px-4 font-medium">
                          {hr.firstName} {hr.lastName}
                        </td>
                        <td className="py-3 px-4 text-gray-600">{hr.email}</td>
                        <td className="py-3 px-4 text-gray-600">
                          {hr.phone || "—"}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              hr.status === "ACTIVE"
                                ? "default"
                                : hr.status === "INACTIVE"
                                ? "secondary"
                                : "destructive"
                            }
                            className={
                              hr.status === "ACTIVE"
                                ? "bg-green-100 text-green-700 hover:bg-green-100"
                                : hr.status === "INACTIVE"
                                ? "bg-amber-100 text-amber-700 hover:bg-amber-100"
                                : "bg-red-100 text-red-700 hover:bg-red-100"
                            }
                          >
                            {hr.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-xs">
                          {new Date(hr.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            {hr.status === "INACTIVE" && (
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-green-600 hover:bg-green-700 text-xs"
                                disabled={updating === hr.id}
                                onClick={() => updateStatus(hr.id, "ACTIVE")}
                              >
                                {updating === hr.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Approve
                                  </>
                                )}
                              </Button>
                            )}
                            {hr.status === "ACTIVE" && (
                              <Button
                                size="sm"
                                variant="destructive"
                                className="text-xs"
                                disabled={updating === hr.id}
                                onClick={() => updateStatus(hr.id, "SUSPENDED")}
                              >
                                {updating === hr.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <>
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Suspend
                                  </>
                                )}
                              </Button>
                            )}
                            {hr.status === "SUSPENDED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                disabled={updating === hr.id}
                                onClick={() => updateStatus(hr.id, "ACTIVE")}
                              >
                                {updating === hr.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  "Reactivate"
                                )}
                              </Button>
                            )}
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
