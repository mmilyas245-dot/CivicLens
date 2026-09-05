"use client";

import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Brain,
  Camera,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  FileWarning,
  Gauge,
  MapPin,
  Menu,
  MessageSquareWarning,
  Navigation,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const MOTTO =
  "SEE THE PROBLEM. REPORT IT INSTANTLY. WATCH YOUR CITY GET BETTER.";

type Report = {
  id: string;
  problem: string;
  category: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  priority: number;
  department: string;
  location: string;
  status: "Pending" | "Processing" | "Resolved";
};

const demoReports: Report[] = [
  {
    id: "#CL-0042",
    problem: "Large pothole detected",
    category: "Road Infrastructure",
    severity: "High",
    priority: 9,
    department: "Roads & Highways",
    location: "University Road",
    status: "Pending",
  },
  {
    id: "#CL-0041",
    problem: "Overflowing garbage container",
    category: "Waste Management",
    severity: "Medium",
    priority: 6,
    department: "Sanitation",
    location: "Main Bazaar",
    status: "Processing",
  },
  {
    id: "#CL-0040",
    problem: "Damaged street light",
    category: "Public Utilities",
    severity: "Low",
    priority: 4,
    department: "Electricity",
    location: "Sector B",
    status: "Resolved",
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "command">(
    "dashboard"
  );
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [dragging, setDragging] = useState(false);
  // ADD THIS
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [agentResult, setAgentResult] = useState<any>(null);
  const [reportRecord, setReportRecord] = useState<any>(null);

  const [userLocation, setUserLocation] = useState<{
  latitude: number;
  longitude: number;
  accuracy: number;
} | null>(null);
  const getUserLocation = (): Promise<{
    latitude: number;
    longitude: number;
    accuracy: number;
  }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by this browser.");
        reject(new Error("Geolocation is not supported."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };

          console.log("REAL GPS LOCATION:", location);

          setUserLocation(location);

          resolve(location);
        },
        (error) => {
          console.error("Location error:", error);
          alert("Please allow location access to submit your civic report.");
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  function handleFile(selectedFile: File | undefined) {
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      alert("Please select an image.");
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setAnalyzed(false);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  }

  const handleAnalyze = async () => {
  if (!file) return;

  setAnalyzing(true);
  setAnalyzed(false);

  try {
    // Get REAL GPS location
    const location = await getUserLocation();

    console.log("Location being sent to backend:", location);

    const formData = new FormData();

    formData.append("image", file);
     // Send GPS
    formData.append("latitude", location.latitude.toString());
    formData.append("longitude", location.longitude.toString());
    formData.append("accuracy", location.accuracy.toString());


    // Send the user's image to Flask
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();

    console.log("CivicLens AI Response:", data);

    // Store the real backend response

    if (data.success) {
      setAnalysisResult(data.analysis);
      setAgentResult(data.agent);

      const matchedReport = data.reports?.find(
        (r: any) => r.report_id === data.agent?.report_id
      );
      setReportRecord(matchedReport || null);
    }

    setAnalyzed(true);
  } catch (error) {
    console.error("CivicLens analysis failed:", error);

    alert(
      `CivicLens could not connect to the AI backend at ${API_BASE_URL}. ` +
        "If you're running locally, make sure Flask is running. " +
        "If this is the deployed site, check that NEXT_PUBLIC_API_URL is set correctly."
    );
  } finally {
    setAnalyzing(false);
  }
};

  function clearFile() {
    setFile(null);
    setPreview(null);
    setAnalyzed(false);
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-15%] h-[500px] w-[500px] rounded-full bg-fuchsia-500/10 blur-[120px]" />
        <div className="absolute right-[-10%] top-[20%] h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[130px]" />
        <div className="absolute bottom-[-15%] left-[35%] h-[400px] w-[400px] rounded-full bg-amber-500/10 blur-[120px]" />
      </div>

      {/* NAVBAR */}
      <nav className="relative z-10 border-b border-white/10 bg-[#050816]">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10">
              <Brain className="h-5 w-5 text-fuchsia-300" />
            </div>

            <div>
              <div className="text-lg font-bold tracking-tight">
                Civic<span className="text-fuchsia-300">Lens</span>
              </div>
              <div className="text-[9px] font-medium uppercase tracking-[0.25em] text-slate-500">
                Civic Intelligence Platform
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-4 py-2 md:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-xs font-medium text-emerald-300">
              AI SYSTEM ONLINE
            </span>
          </div>

          <button className="rounded-lg border border-white/10 p-2 text-slate-400 md:hidden">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </nav>

      {/* MOTTO TICKER */}
      <div className="relative z-10 overflow-hidden border-b border-white/10 bg-white/[0.02] py-2.5">
        <div className="motto-track">
          {[0, 1].map((groupIndex) => (
            <div
              key={groupIndex}
              className="flex shrink-0 items-center gap-10 pr-10"
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <span
                  key={i}
                  className="flex items-center gap-3 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.3em]"
                >
                  <Sparkles className="h-3 w-3 shrink-0 text-violet-300" />
                  <span className="bg-gradient-to-r from-fuchsia-300 via-violet-300 to-amber-300 bg-clip-text text-transparent">
                    {MOTTO}
                  </span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="relative z-10 mx-auto max-w-[1500px] px-5 py-8 lg:px-8">
        {/* TAB NAVIGATION */}
        <div className="mb-8 flex items-center gap-2 border-b border-white/10">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`border-b-2 px-4 pb-4 text-sm font-medium transition ${
              activeTab === "dashboard"
                ? "border-fuchsia-400 text-white"
                : "border-transparent text-slate-500 hover:text-white"
            }`}
          >
            AI Dashboard
          </button>

          <button
            onClick={() => setActiveTab("command")}
            className={`border-b-2 px-4 pb-4 text-sm font-medium transition ${
              activeTab === "command"
                ? "border-fuchsia-400 text-white"
                : "border-transparent text-slate-500 hover:text-white"
            }`}
          >
            Command Center
          </button>
        </div>

        {activeTab === "dashboard" ? (
          <>
            {/* HERO */}
            <section className="mb-8">
              <div className="max-w-4xl">
                <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-fuchsia-300">
                  <Sparkles className="h-4 w-4" />
                  AI-powered civic infrastructure
                </div>

                <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                  Turn civic problems
                  <br />
                  <span className="bg-gradient-to-r from-fuchsia-300 via-violet-400 to-amber-300 bg-clip-text text-transparent">
                    into action.
                  </span>
                </h1>

                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400">
                  Upload a photo of a civic issue. CivicLens uses AI vision and
                  intelligent reasoning to identify the problem, calculate its
                  priority, find duplicates, and route it to the right
                  department.
                </p>
              </div>
            </section>

            {/* STATS */}
            <section className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat
                icon={<FileWarning />}
                label="Total Reports"
                value="1,284"
                trend="+12.4%"
              />
              <Stat
                icon={<AlertTriangle />}
                label="High Priority"
                value="86"
                trend="+4.8%"
              />
              <Stat
                icon={<ShieldCheck />}
                label="AI Confidence"
                value="96.8%"
                trend="+2.1%"
              />
              <Stat
                icon={<Activity />}
                label="Processing"
                value="24"
                trend="Live"
              />
            </section>

            {/* MAIN GRID */}
            <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              {/* UPLOAD PANEL */}
              <div className="glass-panel">
                <PanelHeader
                  icon={<Camera />}
                  title="Report a Civic Issue"
                  subtitle="Upload evidence for AI analysis"
                />

                <div className="p-5">
                  {!preview ? (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragging(true);
                      }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={handleDrop}
                      className={`group flex min-h-[330px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed transition ${
                        dragging
                          ? "border-fuchsia-400 bg-fuchsia-400/10"
                          : "border-white/15 bg-white/[0.02] hover:border-fuchsia-400/40 hover:bg-white/[0.04]"
                      }`}
                      onClick={() =>
                        document.getElementById("file-upload")?.click()
                      }
                    >
                      <input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFile(e.target.files?.[0])}
                      />

                      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/10">
                        <Upload className="h-7 w-7 text-fuchsia-300" />
                      </div>

                      <h3 className="text-lg font-semibold">
                        Drop civic evidence here
                      </h3>

                      <p className="mt-2 text-center text-sm text-slate-500">
                        Drag & drop an image or click to browse
                        <br />
                        JPG, PNG or WEBP
                      </p>

                      <div className="mt-6 rounded-lg border border-white/10 px-4 py-2 text-xs text-slate-400">
                        Maximum file size: 10 MB
                      </div>
                    </div>
                  ) : (
                    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black">
                      <img
                        src={preview}
                        alt="Selected civic issue"
                        className="h-[330px] w-full object-cover"
                      />

                      <button
                        onClick={clearFile}
                        className="absolute right-3 top-3 rounded-lg border border-white/10 bg-black/70 p-2 backdrop-blur-md"
                      >
                        <X className="h-4 w-4" />
                      </button>

                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-5 pt-16">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          Evidence ready for analysis
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          {file?.name}
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleAnalyze}
                    disabled={!file || analyzing}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-amber-400 px-5 py-4 text-sm font-semibold shadow-lg shadow-fuchsia-500/10 transition hover:scale-[1.01] hover:shadow-fuchsia-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {analyzing ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        CivicLens AI is analyzing...
                      </>
                    ) : (
                      <>
                        <ScanSearch className="h-4 w-4" />
                        Analyze with CivicLens AI
                        <ArrowUpRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* AI AGENT PANEL */}
              <div className="glass-panel">
                <PanelHeader
                  icon={<Brain />}
                  title="AI Agent Activity"
                  subtitle="CivicLens reasoning pipeline"
                />

                <div className="p-5">
                  <div className="space-y-1">
                    <AgentStep
                      number="01"
                      title="Image received"
                      description="Evidence uploaded successfully"
                      done={!!file}
                    />

                    <AgentStep
                      number="02"
                      title="AI vision analysis"
                      description="Qwen Vision examining image"
                      done={analyzed}
                      active={analyzing}
                    />

                    <AgentStep
                      number="03"
                      title="Civic problem classified"
                      description="Category and issue identified"
                      done={analyzed}
                    />

                    <AgentStep
                      number="04"
                      title="Severity & priority"
                      description="Calculating civic impact"
                      done={analyzed}
                    />

                    <AgentStep
                      number="05"
                      title="Location obtained"
                      description="GPS coordinates attached"
                      done={analyzed}
                    />

                    <AgentStep
                      number="06"
                      title="Duplicate check"
                      description="Searching nearby reports"
                      done={analyzed}
                    />

                    <AgentStep
                      number="07"
                      title="Report processed"
                      description="Routing to responsible department"
                      done={analyzed}
                    />
                  </div>

                  {!file && (
                    <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center text-xs text-slate-500">
                      Upload an image to start the AI reasoning pipeline.
                    </div>
                  )}

                  {analyzing && (
                    <div className="mt-6 rounded-xl border border-fuchsia-400/20 bg-fuchsia-400/5 p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="h-3 w-3 animate-ping rounded-full bg-fuchsia-400" />
                          <div className="absolute inset-0 h-3 w-3 rounded-full bg-fuchsia-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-fuchsia-200">
                            Agent is reasoning...
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            Vision → classification → priority → routing
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ANALYSIS RESULT */}
            {analyzed && (
              <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="glass-panel">
                  <PanelHeader
                    icon={<Sparkles />}
                    title="AI Analysis Result"
                    subtitle="Generated by CivicLens intelligence"
                  />

                  <div className="grid gap-4 p-5 sm:grid-cols-2">
                    <ResultBox
                      label="Detected Problem"
                      value={analysisResult?.problem || "Waiting for analysis"}
                      icon={<MessageSquareWarning />}
                    />

                    <ResultBox
                      label="Category"
                      value={analysisResult?.category || "—"}
                      icon={<Navigation />}
                    />

                    <ResultBox
                      label="Severity"
                      value={analysisResult?.severity || "—"}
                      icon={<AlertTriangle />}
                      accent="red"
                    />

                    <ResultBox
                      label="Priority Score"
                      value={
    analysisResult?.priority_score ||"—"}
                      icon={<Gauge />}
                      accent="cyan"
                    />

                    <div className="sm:col-span-2">
                      <ResultBox
                        label="Responsible Department"
                        value={analysisResult?.responsible_department || "—"}
                        icon={<CircleDot />}
                      />
                    </div>
                    {agentResult?.report_id && (
  <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-5">
    <div className="mb-2 flex items-center gap-2">
      <CheckCircle2 className="h-5 w-5 text-emerald-400" />

      <span className="font-semibold">
        Civic Report Processed
      </span>
    </div>

    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <p className="text-white/40">Report ID</p>
        <p className="mt-1 font-mono">
          #{agentResult.report_id}
        </p>
      </div>

      <div>
        <p className="text-white/40">Status</p>
        <p className="mt-1">
          {reportRecord?.status || "Pending"}
        </p>
      </div>
    </div>
  </div>
)}
{agentResult?.action === "updated" && (
  <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/5 p-5">
    <div className="flex items-start gap-3">
      <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-400" />

      <div>
        <h3 className="font-semibold text-amber-300">
          Existing Civic Report Found
        </h3>

        <p className="mt-1 text-sm text-white/60">
          CivicLens detected a nearby matching report and
          prevented a duplicate submission.
        </p>
      </div>
    </div>
  </div>
)}
{agentResult?.action === "created" && (
  <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-5">
    <div className="flex items-start gap-3">
      <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-400" />

      <div>
        <h3 className="font-semibold text-emerald-300">
          New Civic Report Created
        </h3>

        <p className="mt-1 text-sm text-white/60">
          CivicLens processed the issue and created a new
          civic infrastructure report.
        </p>
      </div>
    </div>
  </div>
)}

                    <div className="sm:col-span-2 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        AI Description
                      </div>
                      <p className="text-sm leading-6 text-slate-300">
                        {analysisResult?.description || "No description available."}
                      </p>
                    </div>

                    <div className="rounded-xl border border-red-400/10 bg-red-400/5 p-4">
                      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-red-300">
                        Risk
                      </div>
                      <p className="text-sm leading-6 text-slate-300">
                        {analysisResult?.risk || "No risk information available."}
                      </p>
                    </div>

                    <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/5 p-4">
                      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                        Recommended Action
                      </div>
                      <p className="text-sm leading-6 text-slate-300">
                        {analysisResult?.recommended_action || "No recommended action available."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="glass-panel">
                  <PanelHeader
                    icon={<MapPin />}
                    title="Report Status"
                    subtitle="AI agent decision"
                  />

                  <div className="p-5">
                    {agentResult?.action === "updated" ? (
                      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
                        <div className="flex items-start gap-3">
                          <div className="rounded-lg bg-amber-400/10 p-2">
                            <FileWarning className="h-5 w-5 text-amber-300" />
                          </div>

                          <div>
                            <div className="font-semibold text-amber-200">
                              Existing report found
                            </div>
                            <p className="mt-1 text-xs leading-5 text-slate-400">
                              CivicLens detected a nearby report with a similar
                              issue and prevented a duplicate submission.
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                              Existing Report
                            </span>
                            <span className="font-mono text-sm text-fuchsia-300">
                              #{agentResult.report_id}
                            </span>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                              Distance
                            </span>
                            <span className="text-sm text-white">
                              {agentResult.nearby_reports?.[0]?.distance_km ?? "—"} km
                            </span>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                              Status
                            </span>
                            <span className="rounded-full bg-amber-400/10 px-2 py-1 text-[10px] font-medium text-amber-300">
                              {(reportRecord?.status || "Pending").toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : agentResult?.action === "created" ? (
                      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5">
                        <div className="flex items-start gap-3">
                          <div className="rounded-lg bg-emerald-400/10 p-2">
                            <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                          </div>

                          <div>
                            <div className="font-semibold text-emerald-200">
                              New report created
                            </div>
                            <p className="mt-1 text-xs leading-5 text-slate-400">
                              No matching report was nearby, so CivicLens
                              filed this as a new civic issue.
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                              New Report
                            </span>
                            <span className="font-mono text-sm text-fuchsia-300">
                              #{agentResult.report_id}
                            </span>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                              Status
                            </span>
                            <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-medium text-emerald-300">
                              {(reportRecord?.status || "Pending").toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-sm text-slate-500">
                        {agentResult?.final_response ||
                          "Waiting for the AI agent's decision."}
                      </div>
                    )}

                    <div className="mt-4 rounded-xl border border-white/10 p-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        <div>
                          <div className="text-sm font-medium">
                            Duplicate prevention active
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            Agent intelligently avoids redundant civic reports.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* RECENT REPORTS */}
            <section className="glass-panel mt-6">
              <PanelHeader
                icon={<Clock3 />}
                title="Recent Civic Reports"
                subtitle="Live civic intelligence feed"
              />

              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] uppercase tracking-[0.18em] text-slate-600">
                      <th className="px-5 py-4 font-medium">Report</th>
                      <th className="px-5 py-4 font-medium">Issue</th>
                      <th className="px-5 py-4 font-medium">Severity</th>
                      <th className="px-5 py-4 font-medium">Priority</th>
                      <th className="px-5 py-4 font-medium">Department</th>
                      <th className="px-5 py-4 font-medium">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {demoReports.map((report) => (
                      <tr
                        key={report.id}
                        className="border-b border-white/5 transition hover:bg-white/[0.02]"
                      >
                        <td className="px-5 py-4 font-mono text-xs text-fuchsia-300">
                          {report.id}
                        </td>

                        <td className="px-5 py-4">
                          <div className="text-sm font-medium">
                            {report.problem}
                          </div>
                          <div className="mt-1 text-xs text-slate-600">
                            {report.category}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <Severity severity={report.severity} />
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-semibold">
                            {report.priority}
                          </span>
                          <span className="text-xs text-slate-600">/10</span>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-400">
                          {report.department}
                        </td>

                        <td className="px-5 py-4">
                          <Status status={report.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : (
          <CommandCenter />
        )}

        {/* FOOTER */}
        <footer className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 py-6 text-xs text-slate-600 sm:flex-row">
          <div>
            CivicLens — AI-powered civic intelligence platform
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            System operational
          </div>
        </footer>
      </div>
    </main>
  );
}

function Stat({
  icon,
  label,
  value,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: string;
}) {
  return (
    <div className="glass-panel p-4">
      <div className="flex items-start justify-between">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-fuchsia-300">
          <div className="h-4 w-4">{icon}</div>
        </div>

        <span className="text-[10px] text-emerald-400">{trend}</span>
      </div>

      <div className="mt-5 text-2xl font-bold">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </div>
  );
}

function PanelHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
      <div className="rounded-lg border border-fuchsia-400/20 bg-fuchsia-400/10 p-2 text-fuchsia-300">
        <div className="h-4 w-4">{icon}</div>
      </div>

      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-0.5 text-[11px] text-slate-600">{subtitle}</div>
      </div>
    </div>
  );
}

function AgentStep({
  number,
  title,
  description,
  done,
  active,
}: {
  number: string;
  title: string;
  description: string;
  done?: boolean;
  active?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-white/[0.02]">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border font-mono text-[10px] ${
          done
            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
            : active
              ? "border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-300"
              : "border-white/10 bg-white/[0.02] text-slate-600"
        }`}
      >
        {done ? <CheckCircle2 className="h-4 w-4" /> : number}
      </div>

      <div className="min-w-0 flex-1">
        <div
          className={`text-sm ${
            done || active ? "text-white" : "text-slate-600"
          }`}
        >
          {title}
        </div>
        <div className="mt-0.5 text-[11px] text-slate-700">
          {description}
        </div>
      </div>

      {active && (
        <span className="h-2 w-2 animate-pulse rounded-full bg-fuchsia-400" />
      )}
    </div>
  );
}

function ResultBox({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: "red" | "cyan";
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        <span className={accent === "red" ? "text-red-300" : "text-fuchsia-300"}>
          {icon}
        </span>
        {label}
      </div>

      <div
        className={`mt-3 text-sm font-semibold ${
          accent === "red"
            ? "text-red-300"
            : accent === "cyan"
              ? "text-fuchsia-300"
              : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function Severity({
  severity,
}: {
  severity: "Low" | "Medium" | "High" | "Critical";
}) {
  const classes = {
    Low: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
    Medium: "bg-amber-400/10 text-amber-300 border-amber-400/20",
    High: "bg-orange-400/10 text-orange-300 border-orange-400/20",
    Critical: "bg-red-400/10 text-red-300 border-red-400/20",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${classes[severity]}`}
    >
      {severity}
    </span>
  );
}

function Status({
  status,
}: {
  status: "Pending" | "Processing" | "Resolved";
}) {
  const classes = {
    Pending: "bg-amber-400/10 text-amber-300",
    Processing: "bg-fuchsia-400/10 text-fuchsia-300",
    Resolved: "bg-emerald-400/10 text-emerald-300",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${classes[status]}`}
    >
      {status}
    </span>
  );
}

function CommandCenter() {
  return (
    <div>
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-fuchsia-300">
          <Navigation className="h-4 w-4" />
          Live civic intelligence
        </div>

        <h1 className="text-4xl font-bold">
          Civic <span className="text-fuchsia-300">Command Center</span>
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          Monitor civic issues, identify hotspots and track AI-processed
          reports across your city.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_0.5fr]">
        {/* MAP */}
        <div className="glass-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <div className="text-sm font-semibold">Issue Map</div>
              <div className="mt-1 text-[11px] text-slate-600">
                Live report distribution
              </div>
            </div>

            <div className="flex items-center gap-3 text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                High
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Medium
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Low
              </span>
            </div>
          </div>

          <div className="relative h-[500px] overflow-hidden bg-[#07101d]">
            {/* map grid */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(148,163,184,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.12) 1px, transparent 1px)",
                backgroundSize: "45px 45px",
              }}
            />

            {/* roads */}
            <div className="absolute left-[-10%] top-[45%] h-8 w-[120%] rotate-[-8deg] bg-white/[0.04]" />
            <div className="absolute left-[35%] top-[-20%] h-[140%] w-8 rotate-[14deg] bg-white/[0.04]" />
            <div className="absolute left-[-10%] top-[70%] h-5 w-[120%] rotate-[12deg] bg-white/[0.03]" />

            <MapMarker x="27%" y="32%" label="9" type="high" />
            <MapMarker x="57%" y="26%" label="7" type="medium" />
            <MapMarker x="68%" y="55%" label="8" type="high" />
            <MapMarker x="42%" y="70%" label="5" type="low" />
            <MapMarker x="78%" y="75%" label="6" type="medium" />
            <MapMarker x="18%" y="66%" label="4" type="low" />

            <div className="absolute bottom-5 left-5 rounded-xl border border-white/10 bg-[#050816]/95 p-4 ">
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-600">
                Active coverage
              </div>
              <div className="mt-1 text-xl font-bold">1,284 reports</div>
              <div className="mt-1 text-xs text-emerald-400">
                System monitoring active
              </div>
            </div>
          </div>
        </div>

        {/* COMMAND STATS */}
        <div className="space-y-4">
          <CommandCard
            title="Critical Hotspots"
            value="12"
            description="Areas requiring immediate attention"
            icon={<AlertTriangle />}
          />

          <CommandCard
            title="Reports Today"
            value="47"
            description="17 already routed to departments"
            icon={<FileWarning />}
          />

          <CommandCard
            title="AI Processed"
            value="96.8%"
            description="Average analysis confidence"
            icon={<Brain />}
          />

          <CommandCard
            title="Duplicate Prevention"
            value="31"
            description="Redundant reports prevented"
            icon={<ShieldCheck />}
          />
        </div>
      </div>

      <div className="glass-panel mt-6">
        <PanelHeader
          icon={<Clock3 />}
          title="Priority Queue"
          subtitle="Issues requiring department attention"
        />

        <div className="divide-y divide-white/5">
          {demoReports.map((report) => (
            <div
              key={report.id}
              className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-fuchsia-300">
                    {report.id}
                  </span>
                  <Severity severity={report.severity} />
                </div>
                <div className="mt-2 text-sm font-medium">
                  {report.problem}
                </div>
                <div className="mt-1 text-xs text-slate-600">
                  {report.location} · {report.department}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-600">
                    Priority
                  </div>
                  <div className="mt-1 text-lg font-bold">
                    {report.priority}
                    <span className="text-xs text-slate-600">/10</span>
                  </div>
                </div>

                <ChevronRight className="h-5 w-5 text-slate-700" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MapMarker({
  x,
  y,
  label,
  type,
}: {
  x: string;
  y: string;
  label: string;
  type: "high" | "medium" | "low";
}) {
  const colors = {
    high: "bg-red-400 shadow-red-400/40",
    medium: "bg-amber-400 shadow-amber-400/40",
    low: "bg-emerald-400 shadow-emerald-400/40",
  };

  return (
    <div
      className="absolute"
      style={{ left: x, top: y }}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full ${colors[type]} shadow-lg`}
      >
        <span className="text-xs font-bold text-black">{label}</span>
      </div>
      <div className="mx-auto mt-1 h-1.5 w-1.5 rounded-full bg-white/60" />
    </div>
  );
}

function CommandCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="glass-panel p-5">
      <div className="flex items-start justify-between">
        <div className="text-slate-500">{icon}</div>
        <ArrowUpRight className="h-4 w-4 text-slate-700" />
      </div>

      <div className="mt-5 text-3xl font-bold">{value}</div>
      <div className="mt-1 text-sm font-medium">{title}</div>
      <div className="mt-2 text-xs leading-5 text-slate-600">
        {description}
      </div>
    </div>
  );
}