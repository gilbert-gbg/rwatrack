"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin, Shield, BarChart3, Users, Brain, Smartphone,
  ArrowRight, CheckCircle, Globe, Lock, Zap, Bell,
} from "lucide-react";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { Footer } from "@/components/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Navbar */}
      <header className="border-b border-blue-100 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-black text-xl text-foreground tracking-tight">RWATRACK</span>
              <p className="text-[10px] text-muted-foreground -mt-0.5 tracking-wider uppercase">Rwanda</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DarkModeToggle />
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild size="sm" className="shadow-lg shadow-primary/20">
              <Link href="/register">Get Started <ArrowRight className="w-4 h-4 ml-1" /></Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary/10 dark:bg-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-8 animate-fade-in">
              <Globe className="w-4 h-4" />
              Built for Rwanda's Public Sector
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground leading-tight tracking-tight mb-6">
              AI-Powered
              <span className="block text-primary">Employee Residence</span>
              <span className="block">Tracking System</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Verify government employee addresses, detect anomalies, and predict relocations
              using machine learning — all from one intelligent platform with real-time GPS tracking.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button asChild size="lg" className="text-base px-8 shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all">
                <Link href="/register">
                  Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base px-8">
                <Link href="/login">
                  Sign In to Dashboard
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {[
                { value: "3", label: "AI Models", icon: Brain },
                { value: "95%", label: "Accuracy", icon: CheckCircle },
                { value: "Real-time", label: "GPS Tracking", icon: MapPin },
                { value: "3", label: "User Roles", icon: Users },
              ].map(({ value, label, icon: Icon }) => (
                <div key={label} className="bg-white/80 dark:bg-gray-800/50 backdrop-blur rounded-2xl p-4 border border-blue-100 dark:border-gray-700 shadow-sm">
                  <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-black text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">Powerful Features</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Everything you need to manage government workforce residences efficiently
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: "AI Risk Analysis", desc: "Three ML models analyze each worker for address validity, anomalies, and relocation prediction with 90-95% accuracy.", color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
              { icon: MapPin, title: "GPS Location Tracking", desc: "Real-time GPS tracking via Flutter mobile app. Workers share location every 5 minutes for work verification.", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
              { icon: Users, title: "Role-Based Access", desc: "Admin, HR Manager, and Worker roles with separate dashboards, approval workflows, and permission levels.", color: "text-teal-600", bg: "bg-teal-50 dark:bg-teal-950/30" },
              { icon: Shield, title: "Secure Authentication", desc: "JWT tokens, bcrypt password hashing, session management, and complete audit logging for every action.", color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30" },
              { icon: Bell, title: "Smart Notifications", desc: "In-app notifications for registrations, approvals, and rejections. Bell icon with real-time updates.", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
              { icon: BarChart3, title: "Charts & Reports", desc: "Interactive pie charts, bar graphs, and exportable PDF/CSV reports for workforce analytics.", color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
              { icon: Smartphone, title: "Mobile App", desc: "Cross-platform Flutter app for workers with GPS tracking, secure login, and notification support.", color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
              { icon: Lock, title: "Approval Workflow", desc: "Workers approved by HR, HR approved by Admin. Pending accounts blocked from login until verified.", color: "text-pink-600", bg: "bg-pink-50 dark:bg-pink-950/30" },
              { icon: Zap, title: "Dark Mode & Export", desc: "Professional dark mode toggle, CSV/PDF export, profile image upload, and search with filters.", color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30" },
            ].map(({ icon: Icon, title, desc, color, bg }) => (
              <Card key={title} className={`border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${bg}`}>
                <CardContent className="pt-6">
                  <Icon className={`w-10 h-10 ${color} mb-4`} />
                  <h3 className="font-bold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">How RWATRACK Works</h2>
            <p className="text-muted-foreground">Simple three-step process for workforce management</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Register & Approve", desc: "Workers and HR managers register online. Accounts are verified through an approval chain before access is granted.", icon: Users },
              { step: "02", title: "Track & Monitor", desc: "Workers share GPS location via mobile app. HR managers view worker locations on an interactive Rwanda map.", icon: MapPin },
              { step: "03", title: "Analyze & Predict", desc: "AI models analyze each worker for address fraud, anomalies, and relocation risk. Results shown on the admin dashboard.", icon: Brain },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="relative text-center">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 md:right-auto md:left-[calc(50%+20px)] w-8 h-8 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{step}</span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-blue-600 to-indigo-600" />
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-20 -mt-20" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-40 -mb-40" />

        <div className="max-w-4xl mx-auto px-4 text-center relative">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Modernize Your Workforce Management?
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            Join RWATRACK and experience AI-driven residence tracking for Rwanda's government institutions.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" variant="secondary" className="text-base px-8 shadow-xl">
              <Link href="/register">
                Create Account <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base px-8 bg-transparent text-white border-white/30 hover:bg-white/10">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 bg-white/50 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground mb-6 uppercase tracking-wider font-medium">Built With Modern Technologies</p>
          <div className="flex flex-wrap justify-center gap-6">
            {["Next.js", "React", "MongoDB", "Prisma", "Python", "scikit-learn", "Flask", "Flutter", "Tailwind CSS", "JWT"].map((tech) => (
              <span key={tech} className="px-4 py-2 bg-white dark:bg-gray-800 border border-blue-100 dark:border-gray-700 rounded-full text-sm font-medium text-foreground shadow-sm">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
