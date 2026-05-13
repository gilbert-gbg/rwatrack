"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminNav } from "@/components/admin/nav";
import {
  Loader2, AlertCircle, Shield, Brain,
  MapPin, ArrowLeft, RefreshCw, AlertTriangle, CheckCircle
} from "lucide-react";
import Link from "next/link";

const AI_API_URL = "http://localhost:5000";

interface Worker {
  id: string;
  jobTitle: string;
  homeLat?: number;
  homeLng?: number;
  workLat?: number;
  workLng?: number;
  homeAddress?: string;
  workAddress?: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  hrId?: string;
}

interface AIResult {
  overall_risk: "low" | "medium" | "high";
  requires_action: boolean;
  address_classification: {
    valid: boolean;
    confidence: number;
    alert: boolean;
  };
  anomaly_detection: {
    is_anomaly: boolean;
    score: number;
    risk_level: string;
    alert: boolean;
    flags: {
      frequent_address_changes: boolean;
      far_from_workplace: boolean;
      gps_mismatch: boolean;
    };
  };
  relocation_prediction: {
    likely_to_relocate: boolean;
    probability: number;
    risk_level: string;
    alert: boolean;
  };
}

interface WorkerWithAI {
  worker: Worker;
  ai: AIResult | null;
  loading: boolean;
  error: string;
}

const getRiskColor = (risk: string) => {
  switch (risk) {
    case "high":   return "bg-red-100 text-red-800 border-red-200";
    case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
    default:       return "bg-green-100 text-green-800 border-green-200";
  }
};

const getRiskBorder = (risk: string) => {
  switch (risk) {
    case "high":   return "border-red-300 bg-red-50/30";
    case "medium": return "border-yellow-300 bg-yellow-50/30";
    default:       return "border-blue-200 bg-white";
  }
};

export default function AIRiskDashboard() {
  const [workersWithAI, setWorkersWithAI] = useState<WorkerWithAI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [aiOnline, setAiOnline] = useState(false);
  const [summary, setSummary] = useState({ high: 0, medium: 0, low: 0, total: 0 });

  // Check if AI API is online
  useEffect(() => {
    fetch(`${AI_API_URL}/`)
      .then(r => r.ok ? setAiOnline(true) : setAiOnline(false))
      .catch(() => setAiOnline(false));
  }, []);

  // Load workers
  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const res = await fetch("/api/workers");
        if (res.ok) {
          const workers: Worker[] = await res.json();
          setWorkersWithAI(workers.map(w => ({
            worker: w,
            ai: null,
            loading: false,
            error: "",
          })));
        } else {
          setError("Failed to load workers");
        }
      } catch {
        setError("Error fetching workers");
      } finally {
        setLoading(false);
      }
    };
    fetchWorkers();
  }, []);

  const analyzeWorker = async (index: number, worker: Worker): Promise<AIResult | null> => {
    try {
      const payload = {
        home_lat: worker.homeLat || -1.9441,
        home_lng: worker.homeLng || 30.0619,
        reported_lat: worker.homeLat || -1.9441,
        reported_lng: worker.homeLng || 30.0619,
        work_lat: worker.workLat || -1.8960,
        work_lng: worker.workLng || 30.1127,
        distance_home_to_work_km: worker.homeLat && worker.workLat
          ? Math.sqrt(
              Math.pow(worker.homeLat - worker.workLat, 2) +
              Math.pow((worker.homeLng || 0) - (worker.workLng || 0), 2)
            ) * 111
          : 5,
        address_changes_last_year: 1,
        department: "Ministry of Finance",
        job_title: worker.jobTitle || "Officer",
        home_district: "Nyarugenge",
        work_district: "Gasabo",
      };

      const res = await fetch(`${AI_API_URL}/predict/all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) return await res.json();
      return null;
    } catch {
      return null;
    }
  };

  const runAIAnalysis = async () => {
    if (!aiOnline) {
      setError("AI API is offline. Please start it with: python ai_api.py");
      return;
    }

    setAnalyzing(true);
    setError("");

    const updated = [...workersWithAI];

    for (let i = 0; i < updated.length; i++) {
      updated[i] = { ...updated[i], loading: true };
      setWorkersWithAI([...updated]);

      const result = await analyzeWorker(i, updated[i].worker);

      updated[i] = {
        ...updated[i],
        ai: result,
        loading: false,
        error: result ? "" : "Analysis failed",
      };
      setWorkersWithAI([...updated]);
    }

    // Compute summary
    const analyzed = updated.filter(w => w.ai);
    setSummary({
      total: analyzed.length,
      high:   analyzed.filter(w => w.ai?.overall_risk === "high").length,
      medium: analyzed.filter(w => w.ai?.overall_risk === "medium").length,
      low:    analyzed.filter(w => w.ai?.overall_risk === "low").length,
    });

    setAnalyzing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <AdminNav user={null} />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <AdminNav user={null} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-primary hover:text-primary/80 mb-4 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Brain className="w-8 h-8 text-primary" />
                AI Risk Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                AI-powered residence verification, anomaly detection & relocation prediction
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={aiOnline
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
              }>
                {aiOnline ? "✓ AI API Online" : "✗ AI API Offline"}
              </Badge>
              <Button
                onClick={runAIAnalysis}
                disabled={analyzing || !aiOnline}
                className="bg-primary hover:bg-primary/90"
              >
                {analyzing
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</>
                  : <><RefreshCw className="w-4 h-4 mr-2" />Run AI Analysis</>
                }
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* AI not online warning */}
        {!aiOnline && (
          <Alert className="mb-6 border-yellow-200 bg-yellow-50">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              AI API is offline. Open a terminal and run: <code className="font-mono bg-yellow-100 px-1 rounded">python ai_api.py</code>
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        {summary.total > 0 && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: "Analyzed", value: summary.total, color: "text-foreground", bg: "bg-blue-50" },
              { label: "High Risk", value: summary.high, color: "text-red-700", bg: "bg-red-50" },
              { label: "Medium Risk", value: summary.medium, color: "text-yellow-700", bg: "bg-yellow-50" },
              { label: "Low Risk", value: summary.low, color: "text-green-700", bg: "bg-green-50" },
            ].map(({ label, value, color, bg }) => (
              <Card key={label} className={`border-blue-200 ${bg}`}>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">{label}</p>
                  <p className={`text-3xl font-bold ${color}`}>{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Workers List */}
        <div className="space-y-4">
          {workersWithAI.length === 0 ? (
            <Card className="border-blue-200">
              <CardContent className="py-12 text-center">
                <Shield className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">No workers found</p>
              </CardContent>
            </Card>
          ) : (
            workersWithAI.map(({ worker, ai, loading: wLoading, error: wError }) => (
              <Card
                key={worker.id}
                className={`border transition ${ai ? getRiskBorder(ai.overall_risk) : "border-blue-200"}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between flex-wrap gap-4">

                    {/* Worker Info */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-primary font-bold text-lg">
                        {worker.user.firstName[0]}{worker.user.lastName[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-lg">
                          {worker.user.firstName} {worker.user.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">{worker.user.email}</p>
                        <p className="text-sm text-muted-foreground">{worker.jobTitle}</p>
                        {worker.homeAddress && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" /> {worker.homeAddress}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* AI Results */}
                    <div className="flex-1 min-w-[300px]">
                      {wLoading && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Analyzing...</span>
                        </div>
                      )}

                      {wError && (
                        <p className="text-sm text-red-500">{wError}</p>
                      )}

                      {!wLoading && !ai && !wError && (
                        <p className="text-sm text-muted-foreground italic">
                          Click "Run AI Analysis" to analyze this worker
                        </p>
                      )}

                      {ai && (
                        <div className="space-y-3">
                          {/* Overall Risk Badge */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Overall Risk:</span>
                            <Badge className={getRiskColor(ai.overall_risk)}>
                              {ai.overall_risk.toUpperCase()}
                            </Badge>
                            {ai.requires_action && (
                              <Badge className="bg-red-100 text-red-800">
                                ⚠ Action Required
                              </Badge>
                            )}
                          </div>

                          {/* 3 Model Results */}
                          <div className="grid grid-cols-3 gap-3">

                            {/* Model 1 - Address */}
                            <div className={`rounded-lg p-3 border ${
                              ai.address_classification.alert
                                ? "bg-red-50 border-red-200"
                                : "bg-green-50 border-green-200"
                            }`}>
                              <p className="text-xs font-semibold mb-1 text-muted-foreground">
                                Address Check
                              </p>
                              <div className="flex items-center gap-1">
                                {ai.address_classification.valid
                                  ? <CheckCircle className="w-4 h-4 text-green-600" />
                                  : <AlertTriangle className="w-4 h-4 text-red-600" />
                                }
                                <span className={`text-sm font-medium ${
                                  ai.address_classification.valid
                                    ? "text-green-700" : "text-red-700"
                                }`}>
                                  {ai.address_classification.valid ? "Valid" : "Invalid"}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {ai.address_classification.confidence}% confidence
                              </p>
                            </div>

                            {/* Model 2 - Anomaly */}
                            <div className={`rounded-lg p-3 border ${
                              ai.anomaly_detection.alert
                                ? "bg-red-50 border-red-200"
                                : "bg-green-50 border-green-200"
                            }`}>
                              <p className="text-xs font-semibold mb-1 text-muted-foreground">
                                Anomaly
                              </p>
                              <div className="flex items-center gap-1">
                                {ai.anomaly_detection.is_anomaly
                                  ? <AlertTriangle className="w-4 h-4 text-red-600" />
                                  : <CheckCircle className="w-4 h-4 text-green-600" />
                                }
                                <span className={`text-sm font-medium ${
                                  ai.anomaly_detection.is_anomaly
                                    ? "text-red-700" : "text-green-700"
                                }`}>
                                  {ai.anomaly_detection.is_anomaly ? "Suspicious" : "Normal"}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Risk: {ai.anomaly_detection.risk_level}
                              </p>
                            </div>

                            {/* Model 3 - Relocation */}
                            <div className={`rounded-lg p-3 border ${
                              ai.relocation_prediction.alert
                                ? "bg-yellow-50 border-yellow-200"
                                : "bg-green-50 border-green-200"
                            }`}>
                              <p className="text-xs font-semibold mb-1 text-muted-foreground">
                                Relocation
                              </p>
                              <div className="flex items-center gap-1">
                                {ai.relocation_prediction.likely_to_relocate
                                  ? <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                  : <CheckCircle className="w-4 h-4 text-green-600" />
                                }
                                <span className={`text-sm font-medium ${
                                  ai.relocation_prediction.likely_to_relocate
                                    ? "text-yellow-700" : "text-green-700"
                                }`}>
                                  {ai.relocation_prediction.likely_to_relocate ? "Likely" : "Stable"}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {ai.relocation_prediction.probability}% chance
                              </p>
                            </div>
                          </div>

                          {/* Flags */}
                          {(ai.anomaly_detection.flags.frequent_address_changes ||
                            ai.anomaly_detection.flags.far_from_workplace ||
                            ai.anomaly_detection.flags.gps_mismatch) && (
                            <div className="flex flex-wrap gap-2">
                              {ai.anomaly_detection.flags.frequent_address_changes && (
                                <Badge className="bg-orange-100 text-orange-800 text-xs">
                                  ⚠ Frequent Address Changes
                                </Badge>
                              )}
                              {ai.anomaly_detection.flags.far_from_workplace && (
                                <Badge className="bg-orange-100 text-orange-800 text-xs">
                                  ⚠ Far from Workplace
                                </Badge>
                              )}
                              {ai.anomaly_detection.flags.gps_mismatch && (
                                <Badge className="bg-red-100 text-red-800 text-xs">
                                  ⚠ GPS Mismatch
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}