"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AdminNav } from "@/components/admin/nav";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Loader2, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SearchFilter } from "@/components/SearchFilter";
import { ExportButton } from "@/components/ExportButton";
import { exportToCSV, exportToPDF } from "@/lib/export";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: "ADMIN" | "HR" | "WORKER";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  createdAt: string;
}

export default function AdminUsersPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, usersRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/admin/users"),
        ]);
        if (userRes.ok) setCurrentUser(await userRes.json());
        if (usersRes.ok) setUsers(await usersRes.json());
        else setError("Failed to load users");
      } catch {
        setError("Error fetching users");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !searchQuery ||
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.phone && u.phone.includes(searchQuery));
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdating(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole, status: users.find((u) => u.id === userId)?.status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers(users.map((u) => (u.id === userId ? { ...u, role: updated.role } : u)));
        toast({ title: "Role Updated", description: `User role changed to ${newRole}` });
      } else {
        toast({ title: "Error", description: "Failed to update role", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update role", variant: "destructive" });
    }
    setUpdating(null);
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    setUpdating(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: users.find((u) => u.id === userId)?.role, status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers(users.map((u) => (u.id === userId ? { ...u, status: updated.status } : u)));
        toast({ title: "Status Updated", description: `User status changed to ${newStatus}` });
      } else {
        toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
    setUpdating(null);
  };

  const handleExportCSV = () => {
    const data = filteredUsers.map((u) => ({
      Name: `${u.firstName} ${u.lastName}`,
      Email: u.email,
      Phone: u.phone || "",
      Role: u.role,
      Status: u.status,
      Joined: new Date(u.createdAt).toLocaleDateString(),
    }));
    exportToCSV(data, "rwatrack_users");
    toast({ title: "Exported!", description: "Users exported to CSV file" });
  };

  const handleExportPDF = () => {
    const data = filteredUsers.map((u) => ({
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      phone: u.phone || "—",
      role: u.role,
      status: u.status,
      joined: new Date(u.createdAt).toLocaleDateString(),
    }));
    exportToPDF("User Management Report", data, [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "role", label: "Role" },
      { key: "status", label: "Status" },
      { key: "joined", label: "Joined" },
    ]);
    toast({ title: "PDF Ready", description: "PDF report opened in new tab" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-950">
        <AdminNav user={currentUser} />
        <div className="max-w-6xl w-full mx-auto px-4 py-8 space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-lg w-48 animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-64 animate-pulse" />
          <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-950">
      <AdminNav user={currentUser} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/admin" className="flex items-center gap-2 text-primary hover:text-primary/80 mb-4 text-sm font-medium">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground mt-2">Manage system users, roles, and permissions</p>
          </div>
          <ExportButton onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <SearchFilter
          placeholder="Search by name, email, or phone..."
          onSearch={setSearchQuery}
          filters={[
            { label: "All", value: "all" },
            { label: "Admin", value: "ADMIN" },
            { label: "HR", value: "HR" },
            { label: "Worker", value: "WORKER" },
          ]}
          activeFilter={roleFilter}
          onFilterChange={setRoleFilter}
        />

        <Card className="border-blue-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle>
              {searchQuery || roleFilter !== "all"
                ? `Filtered Users (${filteredUsers.length} of ${users.length})`
                : `All Users (${users.length})`}
            </CardTitle>
            <CardDescription>Manage user roles and account status</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {searchQuery ? "No users matching your search" : "No users found"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-blue-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-sm">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Role</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-blue-100 dark:border-gray-800 hover:bg-blue-50/50 dark:hover:bg-gray-800/50">
                        <td className="py-3 px-4 text-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-primary font-bold text-xs">
                                {user.firstName?.[0]}{user.lastName?.[0]}
                              </span>
                            </div>
                            <div className="font-semibold text-foreground">
                              {user.firstName} {user.lastName}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{user.email}</td>
                        <td className="py-3 px-4 text-sm">
                          <Select
                            defaultValue={user.role}
                            onValueChange={(value) => handleRoleChange(user.id, value)}
                            disabled={updating === user.id}
                          >
                            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                              <SelectItem value="HR">HR</SelectItem>
                              <SelectItem value="WORKER">Worker</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <Select
                            defaultValue={user.status}
                            onValueChange={(value) => handleStatusChange(user.id, value)}
                            disabled={updating === user.id}
                          >
                            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ACTIVE">Active</SelectItem>
                              <SelectItem value="INACTIVE">Inactive</SelectItem>
                              <SelectItem value="SUSPENDED">Suspended</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
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

      {/* Footer */}
      <footer className="border-t border-blue-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">R</span>
              </div>
              <span className="font-semibold text-sm text-foreground">RWATRACK</span>
              <span className="text-xs text-muted-foreground">v1.0.0</span>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              &copy; {new Date().getFullYear()} RWATRACK — AI-Driven Government Employee Residence Tracking System | University of Rwanda
            </p>
            <p className="text-xs text-muted-foreground">
              School of ICT • Department of Information Systems
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
