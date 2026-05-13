"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle, ArrowRight, ArrowLeft, Lock, Eye, EyeOff, Users,
  UserCheck, CheckCircle, MapPin, Building, Briefcase, User, Mail, Phone, Loader2,
} from "lucide-react";

// Rwanda Provinces and Districts
const RWANDA_LOCATIONS: Record<string, string[]> = {
  "City of Kigali": ["Nyarugenge", "Gasabo", "Kicukiro"],
  "Eastern Province": ["Rwamagana", "Kayonza", "Gatsibo", "Ngoma", "Kirehe", "Bugesera", "Nyagatare"],
  "Western Province": ["Rubavu", "Nyabihu", "Ngororero", "Karongi", "Rutsiro", "Rusizi", "Nyamasheke"],
  "Northern Province": ["Musanze", "Burera", "Gakenke", "Gicumbi", "Rulindo"],
  "Southern Province": ["Huye", "Gisagara", "Nyanza", "Nyaruguru", "Muhanga", "Ruhango", "Kamonyi", "Nyamagabe"],
};

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"role" | "form" | "address" | "success">("role");
  const [selectedRole, setSelectedRole] = useState<"WORKER" | "HR" | null>(null);
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    password: "", confirmPassword: "",
    institution: "", department: "", jobTitle: "", nationalId: "",
    // Home address
    homeProvince: "", homeDistrict: "", homeSector: "", homeCell: "", homeVillage: "",
    // Work address
    workProvince: "", workDistrict: "", workSector: "", workCell: "", workVillage: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hrDepartments, setHrDepartments] = useState<any[]>([]);
  const [selectedHrDept, setSelectedHrDept] = useState("");

  useEffect(() => {
    fetch("/api/hr/departments")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setHrDepartments(data))
      .catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Reset district when province changes
      if (name === "homeProvince") { updated.homeDistrict = ""; }
      if (name === "workProvince") { updated.workDistrict = ""; }
      return updated;
    });
  };

  const validateStep1 = () => {
    if (!formData.firstName.trim()) return "First name is required";
    if (!formData.lastName.trim()) return "Last name is required";
    if (!formData.email.trim()) return "Email is required";
    if (!formData.phone.trim()) return "Phone number is required";
    if (formData.password.length < 6) return "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword) return "Passwords do not match";
    if (selectedRole === "HR" && !formData.institution.trim()) return "Institution is required";
    if (selectedRole === "HR" && !formData.department.trim()) return "Department is required";
    if (selectedRole === "WORKER" && !selectedHrDept) return "Please select your department";
    return null;
  };

  const handleNext = () => {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError("");
    setStep("address");
  };

  const handleSubmit = async () => {
    setError("");
    if (!formData.homeProvince || !formData.homeDistrict) {
      setError("Home province and district are required");
      return;
    }

    setLoading(true);
    try {
      const homeAddress = [formData.homeVillage, formData.homeCell, formData.homeSector, formData.homeDistrict, formData.homeProvince]
        .filter(Boolean).join(", ");
      const workAddress = [formData.workVillage, formData.workCell, formData.workSector, formData.workDistrict, formData.workProvince]
        .filter(Boolean).join(", ");

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          password: formData.password,
          role: selectedRole,
          institution: formData.institution,
          department: formData.department,
          jobTitle: formData.jobTitle || "Field Worker",
          nationalId: formData.nationalId,
          homeAddress,
          workAddress,
          homeProvince: formData.homeProvince,
          homeDistrict: formData.homeDistrict,
          workProvince: formData.workProvince,
          workDistrict: formData.workDistrict,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed"); return; }
      setStep("success");
    } catch {
      setError("Connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <MapPin className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
          <p className="text-muted-foreground text-sm">RWATRACK — Workforce Management</p>
        </div>

        {/* ═══ STEP: Role Selection ═══ */}
        {step === "role" && (
          <Card className="shadow-xl border-blue-200 dark:border-gray-800">
            <CardHeader className="text-center">
              <CardTitle>Select Your Role</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <button
                onClick={() => { setSelectedRole("WORKER"); setStep("form"); }}
                className="w-full p-4 border-2 border-blue-200 rounded-xl hover:border-primary hover:bg-blue-50 dark:hover:bg-gray-800 transition flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-bold">Worker</p>
                  <p className="text-xs text-muted-foreground">Field worker with GPS tracking via mobile app</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground ml-auto" />
              </button>

              <button
                onClick={() => { setSelectedRole("HR"); setStep("form"); }}
                className="w-full p-4 border-2 border-blue-200 rounded-xl hover:border-primary hover:bg-blue-50 dark:hover:bg-gray-800 transition flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-bold">HR Manager</p>
                  <p className="text-xs text-muted-foreground">Manage workers in your department</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground ml-auto" />
              </button>
            </CardContent>
          </Card>
        )}

        {/* ═══ STEP: Personal Info Form ═══ */}
        {step === "form" && (
          <Card className="shadow-xl border-blue-200 dark:border-gray-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <button onClick={() => setStep("role")} className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <CardTitle className="text-lg">
                  Register as {selectedRole === "HR" ? "HR Manager" : "Worker"}
                </CardTitle>
              </div>
              {/* Step indicator */}
              <div className="flex gap-2 mt-3">
                <div className="flex-1 h-1.5 bg-primary rounded" />
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Step 1 of 2 — Personal Information</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {error && <Alert variant="destructive"><AlertCircle className="w-4 h-4" /><AlertDescription>{error}</AlertDescription></Alert>}

              {/* Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">First Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First name" className="pl-9" required />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Last Name *</label>
                  <Input name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last name" required />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-medium mb-1 block">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="email@example.com" className="pl-9" required />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs font-medium mb-1 block">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="+250 7XX XXX XXX" className="pl-9" required />
                </div>
              </div>

              {/* National ID */}
              <div>
                <label className="text-xs font-medium mb-1 block">National ID Number</label>
                <Input name="nationalId" value={formData.nationalId} onChange={handleChange} placeholder="1 XXXX X XXXXXXX X XX" />
              </div>

              {/* Institution & Department */}
              {selectedRole === "HR" ? (
                <>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Institution / Organization *</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input name="institution" value={formData.institution} onChange={handleChange} placeholder="e.g. Ministry of Finance" className="pl-9" required />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Department *</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input name="department" value={formData.department} onChange={handleChange} placeholder="e.g. Budget Department" className="pl-9" required />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Select Your Department *</label>
                    {hrDepartments.length === 0 ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                        No departments available yet. An HR Manager must register first.
                      </div>
                    ) : (
                      <select value={selectedHrDept} onChange={(e) => {
                        const val = e.target.value;
                        setSelectedHrDept(val);
                        const dept = hrDepartments.find((d: any) => d.hrId === val);
                        if (dept) setFormData({ ...formData, institution: dept.institution, department: dept.department });
                        else setFormData({ ...formData, institution: "", department: "" });
                      }} className={selectClass} required>
                        <option value="">-- Select department --</option>
                        {hrDepartments.map((d: any) => (
                          <option key={d.hrId} value={d.hrId}>{d.institution} — {d.department} (HR: {d.hrName})</option>
                        ))}
                      </select>
                    )}
                  </div>
                  {formData.institution && (
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                      Assigned to: <strong>{formData.institution} — {formData.department}</strong>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-medium mb-1 block">Job Title</label>
                    <Input name="jobTitle" value={formData.jobTitle} onChange={handleChange} placeholder="e.g. Field Officer, Security Guard" />
                  </div>
                </>
              )}

              {/* Password */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input name="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange} placeholder="Min 6 chars" className="pl-9 pr-9" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Confirm *</label>
                  <Input name="confirmPassword" type={showPassword ? "text" : "password"} value={formData.confirmPassword} onChange={handleChange} placeholder="Repeat" required />
                </div>
              </div>

              <Button className="w-full" onClick={handleNext}>
                Next — Address Details <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ═══ STEP: Address Details ═══ */}
        {step === "address" && (
          <Card className="shadow-xl border-blue-200 dark:border-gray-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <button onClick={() => setStep("form")} className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <CardTitle className="text-lg">Address Details</CardTitle>
              </div>
              <div className="flex gap-2 mt-3">
                <div className="flex-1 h-1.5 bg-primary rounded" />
                <div className="flex-1 h-1.5 bg-primary rounded" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Step 2 of 2 — Home & Work Address</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && <Alert variant="destructive"><AlertCircle className="w-4 h-4" /><AlertDescription>{error}</AlertDescription></Alert>}

              {/* HOME ADDRESS */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
                <p className="font-semibold text-sm text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Home Address (Where you live) *
                </p>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium mb-1 block">Province *</label>
                      <select name="homeProvince" value={formData.homeProvince} onChange={handleChange} className={selectClass} required>
                        <option value="">Select Province</option>
                        {Object.keys(RWANDA_LOCATIONS).map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">District *</label>
                      <select name="homeDistrict" value={formData.homeDistrict} onChange={handleChange} className={selectClass} required>
                        <option value="">Select District</option>
                        {formData.homeProvince && RWANDA_LOCATIONS[formData.homeProvince]?.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs font-medium mb-1 block">Sector</label>
                      <Input name="homeSector" value={formData.homeSector} onChange={handleChange} placeholder="Sector" />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Cell</label>
                      <Input name="homeCell" value={formData.homeCell} onChange={handleChange} placeholder="Cell" />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Village</label>
                      <Input name="homeVillage" value={formData.homeVillage} onChange={handleChange} placeholder="Village" />
                    </div>
                  </div>
                </div>
              </div>

              {/* WORK ADDRESS */}
              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800">
                <p className="font-semibold text-sm text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                  <Building className="w-4 h-4" /> Work Address (Where you work)
                </p>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium mb-1 block">Province</label>
                      <select name="workProvince" value={formData.workProvince} onChange={handleChange} className={selectClass}>
                        <option value="">Select Province</option>
                        {Object.keys(RWANDA_LOCATIONS).map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">District</label>
                      <select name="workDistrict" value={formData.workDistrict} onChange={handleChange} className={selectClass}>
                        <option value="">Select District</option>
                        {formData.workProvince && RWANDA_LOCATIONS[formData.workProvince]?.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs font-medium mb-1 block">Sector</label>
                      <Input name="workSector" value={formData.workSector} onChange={handleChange} placeholder="Sector" />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Cell</label>
                      <Input name="workCell" value={formData.workCell} onChange={handleChange} placeholder="Cell" />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Village</label>
                      <Input name="workVillage" value={formData.workVillage} onChange={handleChange} placeholder="Village" />
                    </div>
                  </div>
                </div>
              </div>

              <Button className="w-full" onClick={handleSubmit} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ═══ STEP: Success ═══ */}
        {step === "success" && (
          <Card className="shadow-xl border-blue-200 dark:border-gray-800">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Registration Successful!</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Your account is pending approval.
                {selectedRole === "WORKER" ? " Your HR manager will review and approve your account." : " An admin will review and approve your account."}
              </p>
              <Button asChild className="w-full">
                <Link href="/login">Go to Login <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Footer links */}
        <div className="text-center mt-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:text-primary/80 font-medium">Sign In</Link>
          </p>
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
