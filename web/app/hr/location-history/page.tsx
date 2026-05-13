"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HRNav } from "@/components/hr/nav";
import { Loader2, MapPin, Clock } from "lucide-react";

const WorkerMap = dynamic(() => import("@/components/hr/WorkerMap"), { ssr: false });

interface Log {
  id: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  recordedAt: string;
  worker: {
    jobTitle: string;
    user: { firstName: string; lastName: string; email: string };
  };
}

interface LogWithAddress extends Log {
  address: string;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    return data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

export default function LocationHistoryPage() {
  const [user, setUser] = useState<any>(null);
  const [logs, setLogs] = useState<LogWithAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState<string>("all");

  useEffect(() => {
    const load = async () => {
      const [userRes, logsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/location-logs"),
      ]);
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user ?? userData);
      }
      if (logsRes.ok) {
        const raw: Log[] = await logsRes.json();
        // Reverse geocode all logs (rate-limit: 1 per second for Nominatim)
        const withAddresses: LogWithAddress[] = [];
        for (const log of raw) {
          const address = await reverseGeocode(log.lat, log.lng);
          withAddresses.push({ ...log, address });
          await new Promise((r) => setTimeout(r, 1100)); // respect Nominatim rate limit
        }
        setLogs(withAddresses);
      }
      setLoading(false);
    };
    load();
  }, []);

  const workerNames = Array.from(
    new Map(logs.map((l) => [l.worker.user.email, `${l.worker.user.firstName} ${l.worker.user.lastName}`]))
  );

  const filtered = selectedWorker === "all" ? logs : logs.filter((l) => l.worker.user.email === selectedWorker);

  const mapPins = filtered.map((l) => ({
    lat: l.lat,
    lng: l.lng,
    label: `${l.worker.user.firstName} ${l.worker.user.lastName}`,
    address: l.address,
    time: new Date(l.recordedAt).toLocaleString(),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <HRNav user={user} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-1">Location History</h1>
          <p className="text-muted-foreground">Real-time worker locations with map view</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Loading & geocoding locations…</p>
          </div>
        ) : (
          <>
            {/* Worker filter */}
            <div className="flex gap-2 flex-wrap mb-6">
              <button
                onClick={() => setSelectedWorker("all")}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${selectedWorker === "all" ? "bg-primary text-white border-primary" : "bg-white border-blue-200 text-foreground hover:bg-blue-50"}`}
              >
                All Workers
              </button>
              {workerNames.map(([email, name]) => (
                <button
                  key={email}
                  onClick={() => setSelectedWorker(email)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${selectedWorker === email ? "bg-primary text-white border-primary" : "bg-white border-blue-200 text-foreground hover:bg-blue-50"}`}
                >
                  {name}
                </button>
              ))}
            </div>

            {/* Leaflet Map */}
            {mapPins.length > 0 && (
              <Card className="border-blue-200 mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" /> Map View
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <WorkerMap pins={mapPins} />
                </CardContent>
              </Card>
            )}

            {/* Log list */}
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-base">Location Logs ({filtered.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {filtered.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No location logs found</p>
                ) : (
                  <div className="space-y-3">
                    {filtered.map((log) => (
                      <div key={log.id} className="border border-blue-100 rounded-lg p-4 hover:bg-blue-50/50 transition">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground">
                              {log.worker.user.firstName} {log.worker.user.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground mb-1">{log.worker.jobTitle}</p>
                            <p className="text-sm text-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-primary shrink-0" />
                              <span className="truncate">{log.address}</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Coords: {log.lat.toFixed(5)}, {log.lng.toFixed(5)}
                              {log.accuracy ? ` · ±${Math.round(log.accuracy)}m` : ""}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                              <Clock className="w-3 h-3" />
                              {new Date(log.recordedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
