'use client';

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type Blueprint = {
  name: string;
  href: string;
};

type Phase = {
  id: number;
  name: string;
  isFinished: boolean;
};

export default function AdminProjectPage() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id ?? "";
  const router = useRouter();

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("admin-auth");
    }
    router.push("/admin/login");
  };

  const projectName = projectId ? `Project #${projectId} – Sample Commercial Building` : "Project – Sample Commercial Building";
  const clientName = "Juan Dela Cruz";
  const buildingAddress = "Cebu City, Philippines";
  const clientContact = "+63 912 345 6789";
  const workType = "Renovation";
  const workArea = 250;
  const deadlineDate = "December 31, 2025";
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
  const blueprints: Blueprint[] = [
    { name: "Floorplan.pdf", href: "#" },
    { name: "Elevations.dwg", href: "#" },
  ];

  return (
    <main className="min-h-screen bg-slate-100">
       <div className="max-w-7xl mx-auto px-4 py-6 lg:py-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              Project Overview
            </h1>
            <p className="text-sm text-slate-600">
              Detailed view for project{" "}
              <span className="font-semibold">{projectId || "#"}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
            >
              Logout
            </button>
            <Link
              href="/admin"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition"
            >
              Back to Admin Home
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
                  <dt className="w-32 text-slate-500">Area of Work:</dt>
                  <dd className="flex-1 text-slate-900">
                    {workArea} sqm.
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
                        <a
                          href={bp.href}
                          className="text-emerald-700 hover:underline break-words"
                        >
                          {bp.name}
                        </a>
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
