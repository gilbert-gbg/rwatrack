"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AdminNav } from "@/components/admin/nav";
import { Settings, ArrowLeft, Bell, Lock, Database } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <AdminNav user={null} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-primary hover:text-primary/80 mb-4 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            System Settings
          </h1>
          <p className="text-muted-foreground">
            Configure system-wide settings and integrations
          </p>
        </div>

        {/* General Settings */}
        <Card className="border-blue-200 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              General Settings
            </CardTitle>
            <CardDescription>Basic system configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FieldGroup>
              <FieldLabel htmlFor="appName">Application Name</FieldLabel>
              <Input
                id="appName"
                defaultValue="RWATRACK"
                disabled
                className="bg-muted"
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="version">System Version</FieldLabel>
              <Input
                id="version"
                defaultValue="1.0.0"
                disabled
                className="bg-muted"
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="env">Environment</FieldLabel>
              <Input
                id="env"
                defaultValue="Production"
                disabled
                className="bg-muted"
              />
            </FieldGroup>

            <div className="pt-4">
              <Button disabled className="opacity-50 cursor-not-allowed">
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="border-blue-200 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Manage security policies and authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FieldGroup>
              <FieldLabel htmlFor="sessionTimeout">
                Session Timeout (minutes)
              </FieldLabel>
              <Input
                id="sessionTimeout"
                type="number"
                defaultValue="1440"
                disabled
                className="bg-muted"
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="pwPolicy">Password Policy</FieldLabel>
              <Input
                id="pwPolicy"
                defaultValue="Minimum 6 characters required"
                disabled
                className="bg-muted"
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel>Two-Factor Authentication</FieldLabel>
              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                <p className="text-sm text-foreground">
                  Status: <span className="font-semibold">Available</span>
                </p>
              </div>
            </FieldGroup>

            <div className="pt-4">
              <Button disabled className="opacity-50 cursor-not-allowed">
                Update Security Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Database Settings */}
        <Card className="border-blue-200 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database Settings
            </CardTitle>
            <CardDescription>
              Database configuration and maintenance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold text-foreground mb-2">
                Database Status
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-3 bg-green-50 rounded border border-green-200">
                  <p className="text-sm">
                    <span className="font-semibold">Status:</span> Connected
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-sm">
                    <span className="font-semibold">Type:</span> MongoDB
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <Button variant="outline" className="w-full" disabled>
                Run Database Backup
              </Button>
              <Button variant="outline" className="w-full" disabled>
                Optimize Database
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Configure system notifications and alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FieldGroup>
              <FieldLabel htmlFor="adminEmail">
                Admin Email for Alerts
              </FieldLabel>
              <Input
                id="adminEmail"
                type="email"
                defaultValue="admin@rwatrack.com"
                disabled
                className="bg-muted"
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="alertThreshold">
                Alert Threshold Level
              </FieldLabel>
              <Input
                id="alertThreshold"
                defaultValue="High"
                disabled
                className="bg-muted"
              />
            </FieldGroup>

            <div className="pt-4">
              <Button disabled className="opacity-50 cursor-not-allowed">
                Update Notification Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-foreground">
            <span className="font-semibold">Note:</span> Most system settings
            are locked in production mode. Contact your system administrator for
            advanced configuration.
          </p>
        </div>
      </main>
    </div>
  );
}
