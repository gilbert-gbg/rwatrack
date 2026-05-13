"use client";

import { useState, useEffect } from "react";
import nextDynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { HRNav } from "@/components/hr/nav";
import { Loader2, AlertCircle, Users, MapPin, Plus, UserCheck, Clock, TrendingUp, Eye } from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

// Dynamic import for map (no SSR)
const WorkerMap = nextDynamic(() => import("@/components/hr/WorkerMap"), { ssr: false });

interface Worker {
  id: string;
  jobTitle: string;
  homeAddress?: string;
  homeLat?: number;
  homeLng?: number;
  user: { firstName: string; lastName: string; email: string; status: string; createdAt: string };
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function HRDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, workersRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/workers"),
        ]);
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData.user ?? userData);
        }
        if (workersRes.ok) setWorkers(await workersRes.json());
      } catch {
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const activeWorkers = workers.filter((w) => w.user?.status === "ACTIVE").length;
  const inactiveWorkers = workers.filter((w) => w.user?.status === "INACTIVE").length;
  const withGPS = workers.filter((w) => w.homeLat).length;

  // Chart data
  const statusData = [
    { name: "Active", value: activeWorkers, color: "#22C55E" },
    { name: "Pending", value: inactiveWorkers, color: "#F59E0B" },
  ].filter((d) => d.value > 0);

  // Registrations by month
  const monthData: Record<string, number> = {};
  workers.forEach((w) => {
    const date = new Date(w.user?.createdAt);
    const key = date.toLocaleString("default", { month: "short" });
    monthData[key] = (monthData[key] || 0) + 1;
  });
  const registrationData = Object.entries(monthData).map(([name, count]) => ({ name, count }));

  // Map pins
  const mapPins = workers
    .filter((w) => w.homeLat && w.homeLng)
    .map((w) => ({
      lat: w.homeLat!,
      lng: w.homeLng!,
      label: `${w.user.firstName} ${w.user.lastName}`,
      address: w.homeAddress || "No address",
      time: w.jobTitle || "",
    }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <HRNav user={user} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">HR Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.firstName}! Manage your workforce.</p>
          </div>
          <Button asChild>
            <Link href="/hr/workers/new"><Plus className="w-4 h-4 mr-2" />Add Worker</Link>
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Workers", value: workers.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Active Workers", value: activeWorkers, icon: UserCheck, color: "text-green-600", bg: "bg-green-50" },
            { label: "Pending Approval", value: inactiveWorkers, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "With GPS Data", value: withGPS, icon: MapPin, color: "text-purple-600", bg: "bg-purple-50" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="border-blue-200 hover:shadow-lg transition">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${bg}`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className={`text-3xl font-bold ${color}`}>{value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Worker Status Pie Chart */}
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Worker Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statusData.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No workers yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {statusData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Registrations Bar Chart */}
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4" />
                Registrations by Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              {registrationData.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No registration data</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={registrationData}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Workers" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Worker Map */}
        <Card className="border-blue-200 mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Worker Locations Map
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMap(!showMap)}
              >
                {showMap ? "Hide Map" : "Show Map"}
                <Eye className="w-4 h-4 ml-2" />
              </Button>
            </div>
            <CardDescription>
              {mapPins.length} workers with GPS coordinates
            </CardDescription>
          </CardHeader>
          {showMap && (
            <CardContent>
              {mapPins.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400">No workers with GPS data yet</p>
                  <p className="text-gray-400 text-sm">Workers will appear on the map once they share their location</p>
                </div>
              ) : (
                <WorkerMap pins={mapPins} />
              )}
            </CardContent>
          )}
        </Card>

        {/* Quick Actions + Worker List */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full" variant="default">
                <Link href="/hr/approvals"><UserCheck className="w-4 h-4 mr-2" />Worker Approvals</Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link href="/hr/workers"><Users className="w-4 h-4 mr-2" />All Workers</Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link href="/hr/workers/new"><Plus className="w-4 h-4 mr-2" />Register Worker</Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link href="/hr/location-history"><MapPin className="w-4 h-4 mr-2" />Location History</Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link href="/hr/reports"><TrendingUp className="w-4 h-4 mr-2" />Reports</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Workers */}
          <Card className="border-blue-200 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Recent Workers
              </CardTitle>
              <CardDescription>Latest registered workers</CardDescription>
            </CardHeader>
            <CardContent>
              {workers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No workers registered yet</p>
              ) : (
                <div className="space-y-3">
                  {workers.slice(0, 6).map((w) => (
                    <Link
                      key={w.id}
                      href={`/hr/workers/${w.id}`}
                      className="flex items-center justify-between p-3 border border-blue-100 rounded-lg hover:bg-blue-50/50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-bold text-sm">
                            {w.user?.firstName?.[0]}{w.user?.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{w.user?.firstName} {w.user?.lastName}</p>
                          <p className="text-xs text-muted-foreground">{w.jobTitle}</p>
                        </div>
                      </div>
                      <Badge
                        className={
                          w.user?.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }
                      >
                        {w.user?.status}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
