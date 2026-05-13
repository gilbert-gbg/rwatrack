"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, Home, ArrowRight, Lock, Eye, EyeOff, Shield, Users, UserCheck, Clock } from "lucide-react";

type Role = "ADMIN" | "HR" | "WORKER";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"role" | "form">("role");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setStep("form");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPendingMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: selectedRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.pending) {
          setPendingMessage(data.error);
        } else {
          setError(data.error || "Login failed");
        }
        return;
      }

      // Redirect based on role
      if (data.user.role === "ADMIN") router.push("/admin");
      else if (data.user.role === "HR") router.push("/hr");
      else router.push("/worker");

    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    {
      role: "ADMIN" as Role,
      label: "Admin",
      description: "System administrator",
      icon: Shield,
      color: "text-red-600",
      bg: "bg-red-100",
      border: "hover:border-red-400",
    },
    {
      role: "HR" as Role,
      label: "HR Manager",
      description: "Human Resources manager",
      icon: UserCheck,
      color: "text-green-600",
      bg: "bg-green-100",
      border: "hover:border-green-400",
    },
    {
      role: "WORKER" as Role,
      label: "Worker",
      description: "Government field worker",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100",
      border: "hover:border-blue-400",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Home className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-2xl text-foreground">RWATRACK</span>
          <span className="text-xs text-muted-foreground ml-1">Workforce</span>
        </div>

        {/* STEP 1 — Role Selection */}
        {step === "role" && (
          <Card className="border-blue-200 shadow-lg">
            <CardHeader className="space-y-2 text-center">
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription>Select your role to sign in</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {roles.map(({ role, label, description, icon: Icon, color, bg, border }) => (
                <button
                  key={role}
                  onClick={() => handleRoleSelect(role)}
                  className={`w-full border-2 border-blue-200 ${border} hover:bg-blue-50 rounded-xl p-4 text-left transition group`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 ${bg} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{label}</p>
                      <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto group-hover:text-primary" />
                  </div>
                </button>
              ))}

              <div className="pt-2 text-center text-sm">
                <span className="text-muted-foreground">Don't have an account? </span>
                <Link href="/register" className="text-primary hover:text-primary/80 font-medium">
                  Register
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 2 — Login Form */}
        {step === "form" && (
          <Card className="border-blue-200 shadow-lg">
            <CardHeader className="space-y-2">
              <button
                onClick={() => { setStep("role"); setError(""); setPendingMessage(""); }}
                className="text-sm text-muted-foreground hover:text-foreground w-fit"
              >
                ← Back
              </button>
              <CardTitle className="text-2xl">Sign In</CardTitle>
              <CardDescription>
                Sign in as{" "}
                <strong>
                  {selectedRole === "ADMIN" ? "Admin" : selectedRole === "HR" ? "HR Manager" : "Worker"}
                </strong>
              </CardDescription>
              {/* Role badge */}
              {selectedRole && (() => {
                const r = roles.find(r => r.role === selectedRole)!;
                return (
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium w-fit ${r.bg} ${r.color}`}>
                    <r.icon className="w-4 h-4" />
                    {r.label}
                  </div>
                );
              })()}
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {pendingMessage && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      {pendingMessage}
                    </AlertDescription>
                  </Alert>
                )}

                <FieldGroup>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required disabled={loading}
                  />
                </FieldGroup>

                <FieldGroup>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required disabled={loading}
                      className="pl-9 pr-10"
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </FieldGroup>

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                  {loading ? (
                    <><Spinner className="w-4 h-4 mr-2" />Signing in...</>
                  ) : (
                    <>Sign In <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              </form>

              <div className="mt-4 text-center text-sm">
                <span className="text-muted-foreground">Don't have an account? </span>
                <Link href="/register" className="text-primary hover:text-primary/80 font-medium">
                  Register
                </Link>
              </div>
              <div className="mt-2 text-center">
                <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-primary transition">
                  Forgot your password?
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
