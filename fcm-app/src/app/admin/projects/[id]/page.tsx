'use client';

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type Blueprint = {
  name: string;
  href: string;
  file?: File;
  url?: string;
};

type Phase = {
  id: number;
  name: string;
  isFinished: boolean;
};

type Project = {
  id: string;
  projectName: string;
  clientName: string;
  clientContact: string;
  buildingAddress: string;
  workType: string;
  scopeOfWork: string;
  projectCost: string;
  deadlineDate: string;
  workArea?: number;
  createdAt: number;
  updatedAt: number;
};

export default function AdminProjectPage() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id ?? "";
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !projectId) return;

    const stored = localStorage.getItem("projects");
    if (stored) {
      try {
        const projects: Project[] = JSON.parse(stored);
        const found = projects.find((p) => p.id === projectId);
        if (found) {
          setProject(found);
        }
      } catch (e) {
        console.error("Error loading project:", e);
      }
    }
  }, [projectId]);

  const handleBack = () => {
    if (typeof window !== "undefined") {
      const referrer = document.referrer;
      // Check if we came from an admin page and have history
      if (referrer && referrer.includes("/admin") && window.history.length > 1) {
        router.back();
      } else {
        // If not from admin page or no history, go to admin dashboard
        router.push("/admin");
      }
    } else {
      router.push("/admin");
    }
  };

  const projectName = project ? project.projectName : (projectId ? `Project #${projectId}` : "Project");
  const clientName = project?.clientName || "N/A";
  const buildingAddress = project?.buildingAddress || "N/A";
  const clientContact = project?.clientContact || "N/A";
  const workType = project?.workType || "N/A";
  const projectCost = project?.projectCost || "N/A";
  const scopeOfWork = project?.scopeOfWork || "N/A";
  
  const formatDeadline = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return dateString;
    }
  };
  const deadlineDate = project ? formatDeadline(project.deadlineDate) : "N/A";
  const initialPhases: Phase[] = [
    { id: 1, name: "Site Inspection", isFinished: true },
    { id: 2, name: "Structural Works", isFinished: true },
    { id: 3, name: "Interior Fit-out", isFinished: false },
    { id: 4, name: "Final Punchlist", isFinished: false },
  ];
  const [phaseList, setPhaseList] = useState<Phase[]>(initialPhases);
  const [newPhaseName, setNewPhaseName] = useState("");
  const progressRate = useMemo(() => {
    if (phaseList.length === 0) return 0;
    const completed = phaseList.filter(phase => phase.isFinished).length;
    return Math.round((completed / phaseList.length) * 100);
  }, [phaseList]);

  const togglePhase = (phaseId: number) => {
    setPhaseList(prev =>
      prev.map(phase =>
        phase.id === phaseId
          ? { ...phase, isFinished: !phase.isFinished }
          : phase
      )
    );
  };

  const addPhase = () => {
    const name = newPhaseName.trim();
    if (!name) return;
    setPhaseList(prev => [
      ...prev,
      {
        id: prev.length ? Math.max(...prev.map(p => p.id)) + 1 : 1,
        name,
        isFinished: false,
      },
    ]);
    setNewPhaseName("");
  };

  const removePhase = (phaseId: number) => {
    setPhaseList(prev => prev.filter(phase => phase.id !== phaseId));
  };

  const handleDownloadBlueprint = (blueprint: Blueprint) => {
    if (blueprint.file) {
      // If we have a File object, create a download link
      const url = URL.createObjectURL(blueprint.file);
      const link = document.createElement('a');
      link.href = url;
      link.download = blueprint.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (blueprint.url) {
      // If we have a URL, download from that URL
      const link = document.createElement('a');
      link.href = blueprint.url;
      link.download = blueprint.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Fallback: try to download from href if it's a valid URL
      if (blueprint.href && blueprint.href !== '#') {
        window.open(blueprint.href, '_blank');
      }
    }
  };

  const blueprints: Blueprint[] = [
    { name: "Floorplan.pdf", href: "#" },
    { name: "Elevations.dwg", href: "#" },
  ];

  if (!project) {
    return (
      <main className="min-h-screen bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-6 lg:py-10">
          <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-12 text-center">
            <p className="text-slate-600 mb-4">Loading project...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
       <div className="max-w-7xl mx-auto px-4 py-6 lg:py-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="rounded-md border-2 border-slate-400 bg-white p-2.5 text-slate-800 hover:bg-slate-50 hover:border-slate-500 transition flex items-center justify-center shadow-sm"
              aria-label="Go back"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                Project Overview
              </h1>
              <p className="text-sm text-slate-600">
                Detailed view for project{" "}
                <span className="font-semibold">{projectId || "#"}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/projects/${projectId}/edit`}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition"
            >
              Edit Project
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left column (sidebar) */}
          <aside className="lg:col-span-3">
            <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-4 flex flex-col gap-3 sticky top-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-lg font-bold">
                  F
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    FCM Dashboard
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    Admin Panel
                  </p>
                </div>
              </div>
              <nav className="flex flex-col gap-1 text-sm">
                <Link
                  href="/admin"
                  className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-50"
                >
                  Admin Home
                </Link>
                <span className="rounded-lg px-3 py-2 bg-emerald-50 text-emerald-700 font-medium">
                  This Project
                </span>
              </nav>
            </div>
          </aside>

          {/* Center column: header + project tasks */}
          <section className="lg:col-span-6 space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-cover bg-center shadow-sm h-44 md:h-56" style={{ backgroundImage: "url('/images/main1.png')" }}>
              <div className="absolute inset-0 bg-black/50" />
              <div className="relative z-10 px-6 py-4 md:px-8 md:py-6 h-full flex items-center">
                <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="max-w-[60%]">
                    <div className="inline-flex px-4 py-2 rounded-full border border-emerald-400 bg-black/40 text-emerald-200 text-xs md:text-sm font-semibold break-words">
                      {projectName}
                    </div>
                  </div>
                  <div className="text-center md:text-right whitespace-normal break-words">
                    <p className="text-lg md:text-2xl font-bold text-white leading-tight">
                      {clientName}
                    </p>
                    <p className="text-sm md:text-base text-slate-100 mt-2">
                      {buildingAddress}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-5 md:p-6">
              <div className="flex flex-wrap items-center gap-4 mb-4 md:mb-5">
                <h2 className="text-lg md:text-xl font-semibold text-slate-900 flex-1">
                  Project Tasks
                </h2>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newPhaseName}
                    onChange={(e) => setNewPhaseName(e.target.value)}
                    placeholder="New task name"
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={addPhase}
                    className="inline-flex items-center justify-center rounded-full bg-emerald-600 text-white h-10 w-10 text-2xl"
                    aria-label="Add phase"
                  >
                    +
                  </button>
                </div>
                <div className="flex items-center">
                  <div className="bg-emerald-600 text-white rounded-xl px-4 py-2 flex items-center gap-2">
                    <span className="text-sm font-medium">Progress:</span>
                    <span className="text-lg font-semibold">
                      {progressRate}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-4 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${progressRate}%` }}
                />
              </div>

              <div className="mt-4 max-h-72 overflow-y-auto pr-1 space-y-2">
                {phaseList.map((phase) => (
                  <div
                    key={phase.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 bg-slate-50 gap-2"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="checkbox"
                        checked={phase.isFinished}
                        onChange={() => togglePhase(phase.id)}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                      />
                      <span className="text-sm text-slate-800 break-words">
                        {phase.name}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        phase.isFinished ? "text-emerald-600" : "text-amber-600"
                      }`}
                    >
                      {phase.isFinished ? "Finished" : "Pending"}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePhase(phase.id)}
                      className="inline-flex items-center justify-center rounded-full p-2 text-red-500 hover:text-white hover:bg-red-500 transition"
                      aria-label="Delete task"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="w-4 h-4"
                        fill="currentColor"
                      >
                        <path d="M9 3a1 1 0 00-1 1v1H5.5a1 1 0 100 2H6v11a3 3 0 003 3h6a3 3 0 003-3V7h.5a1 1 0 100-2H16V4a1 1 0 00-1-1H9zm1 2h4v1h-4V5zm-2 3h8v10a1 1 0 01-1 1H10a1 1 0 01-1-1V8zm2 2a1 1 0 00-.993.883L9 11v5a1 1 0 001.993.117L11 16v-5a1 1 0 00-1-1zm4 0a1 1 0 00-.993.883L13 11v5a1 1 0 001.993.117L15 16v-5a1 1 0 00-1-1z" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Right column: project details / blueprints / deadline */}
          <aside className="lg:col-span-3">
            <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-5 md:p-6 space-y-4 sticky top-6">
              <h2 className="text-lg md:text-xl font-semibold text-emerald-700 text-center">
                Project Details
              </h2>

              <dl className="space-y-3 text-sm">
                <div className="flex">
                  <dt className="w-32 text-slate-500">Project Name:</dt>
                  <dd className="flex-1 font-medium text-slate-900 break-words">
                    {projectName}
                  </dd>
                </div>
                <div className="flex">
                  <dt className="w-32 text-slate-500">Client Name:</dt>
                  <dd className="flex-1 font-medium text-slate-900 break-words">
                    {clientName}
                  </dd>
                </div>
                <div className="flex">
                  <dt className="w-32 text-slate-500">Contact:</dt>
                  <dd className="flex-1 text-slate-900 break-words">
                    {clientContact}
                  </dd>
                </div>
                <div className="flex">
                  <dt className="w-32 text-slate-500">Work Type:</dt>
                  <dd className="flex-1 text-slate-900 break-words">
                    {workType}
                  </dd>
                </div>
                <div className="flex">
                  <dt className="w-32 text-slate-500">Location:</dt>
                  <dd className="flex-1 text-slate-900 break-words">
                    {buildingAddress}
                  </dd>
                </div>
                <div className="flex">
                  <dt className="w-32 text-slate-500">Project Cost:</dt>
                  <dd className="flex-1 font-medium text-slate-900">
                    {projectCost}
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="w-full text-slate-500 mb-1">Scope of Work:</dt>
                  <dd className="flex-1 text-slate-900 break-words">
                    {scopeOfWork}
                  </dd>
                </div>
              </dl>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">
                  Blueprints
                </h3>
                {blueprints.length > 0 ? (
                  <ul className="space-y-1 text-sm break-words">
                    {blueprints.map((bp) => (
                      <li key={bp.name}>
                        <button
                          type="button"
                          onClick={() => handleDownloadBlueprint(bp)}
                          className="text-emerald-700 hover:text-emerald-800 hover:underline break-words flex items-center gap-1 cursor-pointer"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                          {bp.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">
                    No blueprints attached.
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">
                  Deadline
                </h3>
                <p className="text-sm text-slate-800">{deadlineDate}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
