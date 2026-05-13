"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HRNav } from "@/components/hr/nav";
import { Loader2, ArrowLeft, PlusCircle } from "lucide-react";

export default function HRRegisterWorkerPage() {
  const [user, setUser] = useState<any>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [workAddress, setWorkAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user ?? data);
        }
      } catch (err) {
        console.error("[HR Register Worker] auth fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          password,
          jobTitle,
          homeAddress,
          workAddress,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to register worker");
      } else {
        setSuccess("Worker registered successfully.");
        setFirstName("");
        setLastName("");
        setEmail("");
        setPhone("");
        setPassword("");
        setJobTitle("");
        setHomeAddress("");
        setWorkAddress("");
      }
    } catch (err) {
      setError("Unable to complete registration. Try again.");
      console.error("[HR Register Worker] submit error:", err);
    } finally {
      setSubmitting(false);
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
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/hr/workers" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Workers
          </Link>
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-foreground">Register Worker</h1>
            <p className="text-muted-foreground mt-1">Create a new worker account for your team.</p>
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

        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle>Create Worker Account</CardTitle>
            <CardDescription>All fields marked with * are required.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputGroup label="First Name" value={firstName} onChange={setFirstName} required />
                <InputGroup label="Last Name" value={lastName} onChange={setLastName} required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputGroup label="Email" type="email" value={email} onChange={setEmail} required />
                <InputGroup label="Phone" type="tel" value={phone} onChange={setPhone} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputGroup label="Password" type="password" value={password} onChange={setPassword} required />
                <InputGroup label="Job Title" value={jobTitle} onChange={setJobTitle} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Home Address</label>
                <Textarea
                  value={homeAddress}
                  onChange={(e) => setHomeAddress(e.target.value)}
                  placeholder="Optional home address"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Work Address</label>
                <Textarea
                  value={workAddress}
                  onChange={(e) => setWorkAddress(e.target.value)}
                  placeholder="Optional work address"
                  rows={3}
                />
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={submitting}>
                {submitting ? "Saving..." : "Register Worker"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function InputGroup({ label, type = "text", value, onChange, required = false }: { label: string; type?: string; value: string; onChange: (value: string) => void; required?: boolean; }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        {label}{required ? " *" : ""}
      </label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}
