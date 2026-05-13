"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HRNav } from "@/components/hr/nav";
import { Loader2, ArrowLeft, MapPin, User, Phone } from "lucide-react";

interface WorkerDetails {
  id: string;
  jobTitle: string;
  institution?: string | null;
  department?: string | null;
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
  locationLogs: Array<{
    id: string;
    lat: number;
    lng: number;
    accuracy: number | null;
    recordedAt: string;
  }>;
}

export default function HRWorkerDetailPage() {
  const params = useParams();
  const workerId = params?.id as string | undefined;
  const [worker, setWorker] = useState<WorkerDetails | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    jobTitle: "",
    homeAddress: "",
    workAddress: "",
    phone: "",
  });
  const router = useRouter();

  useEffect(() => {
    if (!workerId) return;

    const load = async () => {
      try {
        const [userRes, workerRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch(`/api/workers/${workerId}`),
        ]);

        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData.user ?? userData);
        }

        if (!workerRes.ok) {
          const data = await workerRes.json();
          setError(data.error || "Unable to load worker");
          return;
        }

        setWorker(await workerRes.json());
      } catch (err) {
        console.error("[HR Worker Detail] fetch error:", err);
        setError("Unable to fetch worker details.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [workerId]);

  useEffect(() => {
    if (!worker) return;
    setForm({
      jobTitle: worker.jobTitle || "",
      homeAddress: worker.homeAddress || "",
      workAddress: worker.workAddress || "",
      phone: worker.user.phone || "",
    });
  }, [worker]);

  const handleSave = async () => {
    if (!workerId) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/workers/${workerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to save worker details.");
        return;
      }

      setWorker(data);
      setSuccess("Worker details updated successfully.");
      setEditing(false);
    } catch (err) {
      console.error("[HR Worker Detail] save error:", err);
      setError("Unable to update worker details.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!workerId) return;
    const confirmed = window.confirm("Delete this worker? This cannot be undone.");
    if (!confirmed) return;

    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/workers/${workerId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Unable to delete worker.");
        return;
      }
      router.push("/hr/workers");
    } catch (err) {
      console.error("[HR Worker Detail] delete error:", err);
      setError("Unable to delete worker.");
    } finally {
      setDeleting(false);
    }
  };

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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/hr/workers" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Workers
          </Link>
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-foreground">Worker Details</h1>
            <p className="text-muted-foreground mt-1">Review worker profile and location history.</p>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button variant={editing ? "secondary" : "outline"} onClick={() => { setEditing((value) => !value); setSuccess(""); setError(""); }}>
              {editing ? "Cancel Edit" : "Edit Worker"}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete Worker"}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {worker ? (
          <div className="space-y-6">
            {editing ? (
              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle>Edit Worker</CardTitle>
                  <CardDescription>Update basic worker details and contact information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Job Title</label>
                      <Input
                        value={form.jobTitle}
                        onChange={(event) => setForm((prev) => ({ ...prev, jobTitle: event.target.value }))}
                        placeholder="Job title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Phone</label>
                      <Input
                        value={form.phone}
                        onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                        placeholder="Phone number"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Home Address</label>
                    <Textarea
                      value={form.homeAddress}
                      onChange={(event) => setForm((prev) => ({ ...prev, homeAddress: event.target.value }))}
                      placeholder="Home address"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Work Address</label>
                    <Textarea
                      value={form.workAddress}
                      onChange={(event) => setForm((prev) => ({ ...prev, workAddress: event.target.value }))}
                      placeholder="Work address"
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle>{worker.user.firstName} {worker.user.lastName}</CardTitle>
                  <CardDescription>{worker.jobTitle}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p>{worker.user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p>{worker.department || "Not assigned"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Institution</p>
                  <p>{worker.institution || "Not assigned"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2"><Phone className="w-4 h-4" />Phone</p>
                  <p>{worker.user.phone || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2"><User className="w-4 h-4" />Status</p>
                  <p>{worker.user.status}</p>
                </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle>Address</CardTitle>
                  <CardDescription>Worker home and work addresses</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2"><MapPin className="w-4 h-4" /> Home Address</p>
                    <p>{worker.homeAddress || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2"><MapPin className="w-4 h-4" /> Work Address</p>
                    <p>{worker.workAddress || "Not provided"}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle>HR Contact</CardTitle>
                  <CardDescription>The assigned HR manager</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {worker.hr ? (
                    <>
                      <p>{worker.hr.firstName} {worker.hr.lastName}</p>
                      <p className="text-sm text-muted-foreground">{worker.hr.email}</p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">No HR assigned</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle>Recent Location Logs</CardTitle>
                <CardDescription>Latest location records for this worker.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {worker.locationLogs.length === 0 ? (
                  <p className="text-muted-foreground">No location records available.</p>
                ) : (
                  worker.locationLogs.map((log) => (
                    <div key={log.id} className="rounded-xl border border-blue-100 p-4 bg-white/80">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                        <span>{new Date(log.recordedAt).toLocaleString()}</span>
                        <span>·</span>
                        <span>{log.accuracy ? `±${Math.round(log.accuracy)}m` : "No accuracy"}</span>
                      </div>
                      <p className="font-medium text-foreground">Lat: {log.lat.toFixed(5)}, Lng: {log.lng.toFixed(5)}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </main>
    </div>
  );
}
