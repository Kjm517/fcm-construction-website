'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";

type Project = {
  id: string;
  projectName: string;
  clientName: string;
  buildingAddress: string;
  deadlineDate: string;
  createdAt: number;
  updatedAt: number;
};

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem("projects");
    if (stored) {
      try {
        const parsedProjects: Project[] = JSON.parse(stored);
        // Sort by most recent first
        parsedProjects.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
        setProjects(parsedProjects);
      } catch (e) {
        console.error("Error loading projects:", e);
      }
    }
  }, []);

  const formatDeadline = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return dateString;
    }
  };
  return (
    <main className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
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
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                Projects
              </h1>
              <p className="text-sm text-slate-600">
                Select a project to view its detailed progress and information.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/projects/create"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition"
            >
              Create Project
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.length > 0 ? (
            projects.map((project) => (
              <Link
                key={project.id}
                href={`/admin/projects/${project.id}`}
                className="group rounded-2xl bg-white shadow-sm border border-slate-200 p-5 flex flex-col justify-between hover:shadow-md hover:border-emerald-300 transition"
              >
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {project.projectName}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    {project.clientName}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {project.buildingAddress}
                  </p>
                </div>

                <div className="mt-4">
                  <p className="mt-2 text-xs text-slate-500">
                    Deadline: <span className="font-medium">{formatDeadline(project.deadlineDate)}</span>
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-slate-600 mb-4">No projects found.</p>
              <Link
                href="/admin/projects/create"
                className="inline-block rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition"
              >
                Create Your First Project
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}


