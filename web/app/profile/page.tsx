"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, User, Mail, Phone, Shield, Calendar, ArrowLeft,
  Save, Edit2, Camera, MapPin, Briefcase, Building, X, Home, Globe,
} from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/Footer";

const RWANDA_LOCATIONS: Record<string, string[]> = {
  "City of Kigali": ["Nyarugenge", "Gasabo", "Kicukiro"],
  "Eastern Province": ["Rwamagana", "Kayonza", "Gatsibo", "Ngoma", "Kirehe", "Bugesera", "Nyagatare"],
  "Western Province": ["Rubavu", "Nyabihu", "Ngororero", "Karongi", "Rutsiro", "Rusizi", "Nyamasheke"],
  "Northern Province": ["Musanze", "Burera", "Gakenke", "Gicumbi", "Rulindo"],
  "Southern Province": ["Huye", "Gisagara", "Nyanza", "Nyaruguru", "Muhanga", "Ruhango", "Kamonyi", "Nyamagabe"],
};

interface UserProfile {
  id: string; email: string; firstName: string; lastName: string;
  phone?: string; avatar?: string; bio?: string; role: string;
  status: string; institution?: string; department?: string; createdAt: string;
  worker?: {
    id: string; jobTitle?: string; homeAddress?: string; workAddress?: string;
    homeLat?: number; homeLng?: number; workLat?: number; workLng?: number;
  };
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    firstName: "", lastName: "", phone: "", bio: "",
    homeProvince: "", homeDistrict: "", homeSector: "", homeCell: "", homeVillage: "",
    workProvince: "", workDistrict: "", workSector: "", workCell: "", workVillage: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        if (data.avatar) setAvatarPreview(data.avatar);

        // Parse existing addresses into province/district/etc
        const homeParts = parseAddress(data.worker?.homeAddress || "");
        const workParts = parseAddress(data.worker?.workAddress || "");

        setForm({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          phone: data.phone || "",
          bio: data.bio || "",
          homeProvince: homeParts.province, homeDistrict: homeParts.district,
          homeSector: homeParts.sector, homeCell: homeParts.cell, homeVillage: homeParts.village,
          workProvince: workParts.province, workDistrict: workParts.district,
          workSector: workParts.sector, workCell: workParts.cell, workVillage: workParts.village,
        });
      }
    } catch {
      toast({ title: "Error", description: "Failed to load profile", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const parseAddress = (addr: string) => {
    const parts = addr.split(",").map((s) => s.trim()).reverse();
    // Address format: Village, Cell, Sector, District, Province
    return {
      province: parts[0] || "", district: parts[1] || "",
      sector: parts[2] || "", cell: parts[3] || "", village: parts[4] || "",
    };
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Image must be under 2MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const homeAddress = [form.homeVillage, form.homeCell, form.homeSector, form.homeDistrict, form.homeProvince]
        .filter(Boolean).join(", ");
      const workAddress = [form.workVillage, form.workCell, form.workSector, form.workDistrict, form.workProvince]
        .filter(Boolean).join(", ");

      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName, lastName: form.lastName,
          phone: form.phone, bio: form.bio, avatar: avatarPreview,
          homeAddress, workAddress,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
        setEditing(false);
        toast({ title: "Profile Updated!", description: "Your changes have been saved" });
      } else {
        toast({ title: "Error", description: "Failed to update", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Connection failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const dashboardPath = user?.role === "ADMIN" ? "/admin" : user?.role === "HR" ? "/hr" : "/worker";
  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-950">
      <header className="border-b border-blue-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={dashboardPath} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <Badge className="bg-primary/10 text-primary">{user?.role}</Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="border-blue-200 dark:border-gray-800 mb-6 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-primary via-blue-500 to-indigo-600" />
          <CardContent className="relative pb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16">
              <div className="relative group">
                <div className="w-28 h-28 rounded-2xl border-4 border-white dark:border-gray-900 shadow-xl overflow-hidden bg-primary flex items-center justify-center">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-bold text-white">{initials}</span>
                  )}
                </div>
                {editing && (
                  <>
                    <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}>
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                    {avatarPreview && (
                      <button onClick={() => setAvatarPreview(null)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    )}
                  </>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>
              <div className="text-center sm:text-left flex-1">
                <h1 className="text-2xl font-bold">{user?.firstName} {user?.lastName}</h1>
                <p className="text-muted-foreground text-sm">{user?.email}</p>
                {user?.bio && !editing && <p className="text-sm text-muted-foreground mt-1 italic">"{user.bio}"</p>}
              </div>
              <div className="flex items-center gap-2">
                <Badge className={user?.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>{user?.status}</Badge>
                <Button variant={editing ? "destructive" : "outline"} size="sm" onClick={() => setEditing(!editing)}>
                  <Edit2 className="w-4 h-4 mr-1" /> {editing ? "Cancel" : "Edit Profile"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Personal Info */}
          <Card className="border-blue-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><User className="w-5 h-5 text-primary" /> Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {editing ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs font-medium mb-1 block">First Name</label><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
                    <div><label className="text-xs font-medium mb-1 block">Last Name</label><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
                  </div>
                  <div><label className="text-xs font-medium mb-1 block">Phone</label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+250 7XX XXX XXX" /></div>
                  <div><label className="text-xs font-medium mb-1 block">Bio</label>
                    <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="About yourself..." maxLength={200}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[60px]" />
                    <p className="text-xs text-muted-foreground mt-1">{form.bio.length}/200</p>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                    <Camera className="w-4 h-4 mr-2" /> {avatarPreview ? "Change Photo" : "Upload Photo"}
                  </Button>
                </>
              ) : (
                <>
                  <InfoRow icon={User} label="Full Name" value={`${user?.firstName} ${user?.lastName}`} />
                  <InfoRow icon={Mail} label="Email" value={user?.email || "—"} />
                  <InfoRow icon={Phone} label="Phone" value={user?.phone || "Not provided"} />
                  {user?.bio && <InfoRow icon={Edit2} label="Bio" value={user.bio} />}
                  <InfoRow icon={Building} label="Institution" value={user?.institution || "—"} />
                  <InfoRow icon={Briefcase} label="Department" value={user?.department || "—"} />
                </>
              )}
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card className="border-blue-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Shield className="w-5 h-5 text-primary" /> Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow icon={Shield} label="Role" value={user?.role || "—"} />
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className={`w-3 h-3 rounded-full ${user?.status === "ACTIVE" ? "bg-green-500 animate-pulse" : "bg-amber-500"}`} />
                <div><p className="text-xs text-muted-foreground">Status</p><p className="font-medium text-sm">{user?.status}</p></div>
              </div>
              <InfoRow icon={Calendar} label="Member Since" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"} />
              {user?.worker?.jobTitle && <InfoRow icon={Briefcase} label="Job Title" value={user.worker.jobTitle} />}
            </CardContent>
          </Card>

          {/* Home Address */}
          <Card className="border-blue-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Home className="w-5 h-5 text-blue-500" /> Home Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {editing ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-xs font-medium mb-1 block">Province</label>
                      <select value={form.homeProvince} onChange={(e) => setForm({ ...form, homeProvince: e.target.value, homeDistrict: "" })} className={selectClass}>
                        <option value="">Select Province</option>
                        {Object.keys(RWANDA_LOCATIONS).map((p) => <option key={p} value={p}>{p}</option>)}
                      </select></div>
                    <div><label className="text-xs font-medium mb-1 block">District</label>
                      <select value={form.homeDistrict} onChange={(e) => setForm({ ...form, homeDistrict: e.target.value })} className={selectClass}>
                        <option value="">Select District</option>
                        {form.homeProvince && RWANDA_LOCATIONS[form.homeProvince]?.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><label className="text-xs font-medium mb-1 block">Sector</label><Input value={form.homeSector} onChange={(e) => setForm({ ...form, homeSector: e.target.value })} placeholder="Sector" /></div>
                    <div><label className="text-xs font-medium mb-1 block">Cell</label><Input value={form.homeCell} onChange={(e) => setForm({ ...form, homeCell: e.target.value })} placeholder="Cell" /></div>
                    <div><label className="text-xs font-medium mb-1 block">Village</label><Input value={form.homeVillage} onChange={(e) => setForm({ ...form, homeVillage: e.target.value })} placeholder="Village" /></div>
                  </div>
                </>
              ) : (
                <>
                  {user?.worker?.homeAddress ? (
                    <InfoRow icon={MapPin} label="Full Address" value={user.worker.homeAddress} />
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">No home address set. Click Edit to add.</p>
                  )}
                  {user?.worker?.homeLat && (
                    <InfoRow icon={Globe} label="GPS Coordinates" value={`${user.worker.homeLat.toFixed(5)}, ${user.worker.homeLng?.toFixed(5)}`} />
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Work Address */}
          <Card className="border-blue-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Building className="w-5 h-5 text-green-500" /> Work Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {editing ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-xs font-medium mb-1 block">Province</label>
                      <select value={form.workProvince} onChange={(e) => setForm({ ...form, workProvince: e.target.value, workDistrict: "" })} className={selectClass}>
                        <option value="">Select Province</option>
                        {Object.keys(RWANDA_LOCATIONS).map((p) => <option key={p} value={p}>{p}</option>)}
                      </select></div>
                    <div><label className="text-xs font-medium mb-1 block">District</label>
                      <select value={form.workDistrict} onChange={(e) => setForm({ ...form, workDistrict: e.target.value })} className={selectClass}>
                        <option value="">Select District</option>
                        {form.workProvince && RWANDA_LOCATIONS[form.workProvince]?.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><label className="text-xs font-medium mb-1 block">Sector</label><Input value={form.workSector} onChange={(e) => setForm({ ...form, workSector: e.target.value })} placeholder="Sector" /></div>
                    <div><label className="text-xs font-medium mb-1 block">Cell</label><Input value={form.workCell} onChange={(e) => setForm({ ...form, workCell: e.target.value })} placeholder="Cell" /></div>
                    <div><label className="text-xs font-medium mb-1 block">Village</label><Input value={form.workVillage} onChange={(e) => setForm({ ...form, workVillage: e.target.value })} placeholder="Village" /></div>
                  </div>
                </>
              ) : (
                <>
                  {user?.worker?.workAddress ? (
                    <InfoRow icon={MapPin} label="Full Address" value={user.worker.workAddress} />
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">No work address set. Click Edit to add.</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        {editing && (
          <div className="mt-6">
            <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {saving ? "Saving..." : "Save All Changes"}
            </Button>
          </div>
        )}

        {/* Security */}
        <Card className="border-blue-200 dark:border-gray-800 mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Shield className="w-5 h-5 text-primary" /> Security</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div><p className="font-medium text-sm">Password</p><p className="text-xs text-muted-foreground">Change your login password</p></div>
              <Button variant="outline" size="sm" asChild><Link href="/change-password">Change Password</Link></Button>
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
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="font-medium text-sm truncate">{value}</p></div>
    </div>
  );
}
