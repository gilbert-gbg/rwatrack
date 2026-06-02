"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Smartphone, MapPin, LogOut, User, Mail, Phone,
  Briefcase, Home, Building2, Clock, CheckCircle,
  AlertCircle, Shield, Activity, ArrowRight, MessageSquare, HelpCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: string;
  worker?: {
    jobTitle: string;
    homeAddress?: string;
    workAddress?: string;
    homeLat?: number;
    homeLng?: number;
    workLat?: number;
    workLng?: number;
  };
}

interface LocationLog {
  id: string;
  lat: number;
  lng: number;
  accuracy?: number;
  recordedAt: string;
}

export default function WorkerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [locationLogs, setLocationLogs] = useState<LocationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) { router.push("/login"); return; }
        const userData = await res.json();
        setUser(userData);

        // Fetch location logs
        const logsRes = await fetch("/api/location-logs");
        if (logsRes.ok) {
          const logs = await logsRes.json();
          setLocationLogs(logs.slice(0, 5));
        }
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800";
      case "INACTIVE": return "bg-yellow-100 text-yellow-800";
      case "SUSPENDED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">

      {/* Header */}
      <header className="bg-white border-b border-blue-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-foreground">RWATRACK</span>
              <p className="text-xs text-muted-foreground">Worker Portal</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Welcome Card */}
        <Card className="border-blue-200 bg-primary text-white">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  Welcome, {user?.firstName}!
                </h1>
                <p className="text-white/80 text-sm mt-1">
                  {currentTime.toLocaleDateString("en-US", {
                    weekday: "long", year: "numeric",
                    month: "long", day: "numeric"
                  })}
                </p>
                <p className="text-white/80 text-sm">
                  {currentTime.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card className="border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Account Status</p>
                  <p className="text-sm text-muted-foreground">Your current account status</p>
                </div>
              </div>
              <Badge className={getStatusColor(user?.status || "")}>
                {user?.status === "ACTIVE" && <CheckCircle className="w-3 h-3 mr-1" />}
                {user?.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Profile Card */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-primary" />
              My Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <User className="w-4 h-4 text-primary flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Full Name</p>
                <p className="font-medium text-foreground">
                  {user?.firstName} {user?.lastName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Mail className="w-4 h-4 text-primary flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Email Address</p>
                <p className="font-medium text-foreground">{user?.email}</p>
              </div>
            </div>

            {user?.phone && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone Number</p>
                  <p className="font-medium text-foreground">{user.phone}</p>
                </div>
              </div>
            )}

            {user?.worker?.jobTitle && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Briefcase className="w-4 h-4 text-primary flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Job Title</p>
                  <p className="font-medium text-foreground">{user.worker.jobTitle}</p>
                </div>
              </div>
            )}

            {user?.worker?.homeAddress && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Home className="w-4 h-4 text-primary flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Home Address</p>
                  <p className="font-medium text-foreground">{user.worker.homeAddress}</p>
                </div>
              </div>
            )}

            {user?.worker?.workAddress && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Building2 className="w-4 h-4 text-primary flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Work Address</p>
                  <p className="font-medium text-foreground">{user.worker.workAddress}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Clock className="w-4 h-4 text-primary flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Member Since</p>
                <p className="font-medium text-foreground">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("en-US", {
                        year: "numeric", month: "long", day: "numeric"
                      })
                    : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location History */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="w-5 h-5 text-primary" />
              Recent Location Activity
            </CardTitle>
            <CardDescription>Your last recorded GPS locations</CardDescription>
          </CardHeader>
          <CardContent>
            {locationLogs.length === 0 ? (
              <div className="text-center py-6">
                <MapPin className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No location data yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Use the mobile app to start sharing your location
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {locationLogs.map((log, index) => (
                  <div key={log.id} className="flex items-center gap-3 p-3 border border-blue-100 rounded-lg">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {index === 0 ? "●" : index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {log.lat.toFixed(5)}, {log.lng.toFixed(5)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.recordedAt).toLocaleString()}
                        {log.accuracy && ` • Accuracy: ${log.accuracy.toFixed(0)}m`}
                      </p>
                    </div>
                    {index === 0 && (
                      <Badge className="bg-green-100 text-green-800 text-xs">Latest</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="w-5 h-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link href="/profile" className="p-3 border border-blue-100 rounded-xl hover:bg-blue-50 transition text-center">
                <User className="w-6 h-6 mx-auto text-blue-500 mb-1" />
                <p className="text-xs font-medium">My Profile</p>
              </Link>
              <Link href="/messages" className="p-3 border border-blue-100 rounded-xl hover:bg-blue-50 transition text-center">
                <MessageSquare className="w-6 h-6 mx-auto text-green-500 mb-1" />
                <p className="text-xs font-medium">Messages</p>
              </Link>
              <Link href="/worker/transfer" className="p-3 border border-blue-100 rounded-xl hover:bg-blue-50 transition text-center">
                <ArrowRight className="w-6 h-6 mx-auto text-purple-500 mb-1" />
                <p className="text-xs font-medium">Request Transfer</p>
              </Link>
              <Link href="/support" className="p-3 border border-blue-100 rounded-xl hover:bg-blue-50 transition text-center">
                <HelpCircle className="w-6 h-6 mx-auto text-amber-500 mb-1" />
                <p className="text-xs font-medium">Help & Support</p>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Mobile App Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">RWATRACK Mobile App</p>
                <p className="text-sm text-muted-foreground">
                  Use the mobile app to share your GPS location and manage your work presence
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}