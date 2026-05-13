"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HRNav } from "@/components/hr/nav";
import { Loader2, Users, MapPin, BarChart3, TrendingUp } from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
}

export default function HRReportsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, workersRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/workers"),
        ]);

        if (userRes.ok) setUser(await userRes.json());
        if (workersRes.ok) {
          const data = await workersRes.json();
          setWorkers(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeWorkers = workers.filter((w) => w.user?.status === "ACTIVE" || w.status === "ACTIVE").length;
  const inactiveWorkers = workers.filter((w) => w.user?.status === "INACTIVE" || w.status === "INACTIVE").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <HRNav user={user} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">Overview of workforce statistics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Workers</p>
                  <p className="text-2xl font-bold">{workers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active Workers</p>
                  <p className="text-2xl font-bold text-green-600">{activeWorkers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Users className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pending Approval</p>
                  <p className="text-2xl font-bold text-amber-600">{inactiveWorkers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">With GPS Data</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {workers.filter((w) => w.homeLat).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Worker List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Worker Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {workers.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No workers registered yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Job Title</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Home Address</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">GPS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workers.map((w) => (
                      <tr key={w.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">
                          {w.user?.firstName || w.firstName || "—"} {w.user?.lastName || w.lastName || ""}
                        </td>
                        <td className="py-3 px-4 text-gray-600">{w.jobTitle || "—"}</td>
                        <td className="py-3 px-4 text-gray-600">{w.homeAddress || "—"}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            (w.user?.status || w.status) === "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            {w.user?.status || w.status || "—"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {w.homeLat ? (
                            <span className="text-green-600 text-xs">✓ Has GPS</span>
                          ) : (
                            <span className="text-gray-400 text-xs">No data</span>
                          )}
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
