"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Smartphone, MapPin, LogOut, User, Mail, Phone,
  Briefcase, Home, Building2, Clock, CheckCircle,
  Shield, Activity, Edit2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NotificationBell } from "@/components/NotificationBell";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { UserAvatar } from "@/components/UserAvatar";
import { Footer } from "@/components/Footer";

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  bio?: string;
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
      case "ACTIVE": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "INACTIVE": return "bg-yellow-100 text-yellow-800";
      case "SUSPENDED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-950">

      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-blue-100 dark:border-gray-800 sticky top-0 z-10">
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

          <div className="flex items-center gap-1">
            <DarkModeToggle />
            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 px-2">
                  <UserAvatar
                    firstName={user?.firstName}
                    lastName={user?.lastName}
                    avatar={user?.avatar}
                    size="sm"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-3 px-2 py-2">
                  <UserAvatar firstName={user?.firstName} lastName={user?.lastName} avatar={user?.avatar} size="md" />
                  <div>
                    <p className="text-sm font-semibold">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile"><User className="w-4 h-4 mr-2" />My Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile"><Edit2 className="w-4 h-4 mr-2" />Edit Profile & Photo</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Welcome Card with Avatar */}
        <Card className="border-blue-200 dark:border-gray-700 bg-primary text-white overflow-hidden">
          <CardContent className="pt-6 pb-6 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-8 -mt-8" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-6 -mb-6" />
            <div className="flex items-center gap-4 relative">
              <div className="w-18 h-18 flex-shrink-0">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Profile"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30 shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  Welcome, {user?.firstName}!
                </h1>
                {user?.bio && (
                  <p className="text-white/70 text-xs mt-0.5 italic">"{user.bio}"</p>
                )}
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

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
            <Link href="/profile">
              <Edit2 className="w-5 h-5 text-primary" />
              <span className="text-xs">Edit Profile & Photo</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2" disabled>
            <Smartphone className="w-5 h-5 text-primary" />
            <span className="text-xs">Open Mobile App</span>
          </Button>
        </div>

        {/* Status Card */}
        <Card className="border-blue-200 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
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
        <Card className="border-blue-200 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-primary" />
                My Profile
              </CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/profile">
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow icon={User} label="Full Name" value={`${user?.firstName} ${user?.lastName}`} />
            <InfoRow icon={Mail} label="Email Address" value={user?.email || "—"} />
            {user?.phone && <InfoRow icon={Phone} label="Phone Number" value={user.phone} />}
            {user?.worker?.jobTitle && <InfoRow icon={Briefcase} label="Job Title" value={user.worker.jobTitle} />}
            {user?.worker?.homeAddress && <InfoRow icon={Home} label="Home Address" value={user.worker.homeAddress} />}
            {user?.worker?.workAddress && <InfoRow icon={Building2} label="Work Address" value={user.worker.workAddress} />}
            <InfoRow icon={Clock} label="Member Since" value={
              user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                : "—"
            } />
          </CardContent>
        </Card>

        {/* Location History */}
        <Card className="border-blue-200 dark:border-gray-700">
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
                  <div key={log.id} className="flex items-center gap-3 p-3 border border-blue-100 dark:border-gray-700 rounded-lg">
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

        {/* Mobile App Card */}
        <Card className="border-blue-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-950/30">
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

      <Footer />
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
      <Icon className="w-4 h-4 text-primary flex-shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
