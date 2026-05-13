import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MapPin, Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="text-center max-w-lg">
        {/* Logo */}
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
          <MapPin className="w-8 h-8 text-white" />
        </div>

        {/* 404 number */}
        <h1 className="text-8xl font-black text-primary/20 dark:text-primary/10 mb-2">404</h1>

        {/* Message */}
        <h2 className="text-2xl font-bold text-foreground mb-3">Page Not Found</h2>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Oops! The page you're looking for doesn't exist or has been moved.
          It might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="lg" className="shadow-lg">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Sign In
            </Link>
          </Button>
        </div>

        {/* Footer text */}
        <p className="text-xs text-muted-foreground mt-12">
          RWATRACK — AI-Driven Government Employee Residence Tracking System
        </p>
      </div>
    </div>
  );
}
