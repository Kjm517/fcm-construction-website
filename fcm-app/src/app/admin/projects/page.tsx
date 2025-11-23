'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { projectsAPI } from "@/lib/api";

type Project = {
  id: string;
  projectName: string;
  clientName: string;
  buildingAddress: string;
  deadlineDate: string;
  createdAt: number;
  updatedAt: number;
  progress?: number; // Progress percentage
};

export default function AdminProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const handleBack = () => {
    // Always go directly to admin dashboard from projects list
    // This prevents loops and ensures consistent navigation
    router.push("/admin");
  };

  useEffect(() => {
    async function loadProjects() {
      setLoading(true);
      try {
        const data = await projectsAPI.getAll();
        
        // Fetch progress for each project
        const projectsWithProgress = await Promise.all(
          data.map(async (project) => {
            try {
              const response = await fetch(`/api/projects/${encodeURIComponent(project.id)}/tasks`);
              if (response.ok) {
                const tasks = await response.json();
                const completed = tasks.filter((t: any) => t.isFinished).length;
                const total = tasks.length;
                const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
                return { ...project, progress };
              }
            } catch (error) {
              console.error(`Error fetching tasks for project ${project.id}:`, error);
            }
            return { ...project, progress: 0 };
          })
        );
        
        // Sort by most recent first
        projectsWithProgress.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
        setProjects(projectsWithProgress);
      } catch (e) {
        console.error("Error loading projects:", e);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  const formatDeadline = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return dateString;
    }
  };

  // Circular Progress Component
  const CircularProgress = ({ progress, size = 60 }: { progress: number; size?: number }) => {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;
    
    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-slate-200"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="text-emerald-600 transition-all duration-300"
          />
        </svg>
        {/* Percentage text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-slate-700">
            {progress}%
          </span>
        </div>
      </div>
    );
  };
  return (
    <main className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
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
          {loading ? (
            <div className="col-span-full text-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
                <p className="text-slate-600">Loading projects...</p>
              </div>
            </div>
          ) : projects.length > 0 ? (
            projects.map((project) => (
              <Link
                key={project.id}
                href={`/admin/projects/${encodeURIComponent(project.id)}`}
                className="group rounded-2xl bg-white shadow-sm border border-slate-200 p-6 flex flex-col justify-between hover:shadow-lg hover:border-emerald-300 transition-all duration-200"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors mb-2">
                        {project.projectName}
                      </h2>
                      <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{project.clientName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{project.buildingAddress}</span>
                      </div>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      <CircularProgress progress={project.progress || 0} size={60} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Deadline:</span>
                    </div>
                    <span className="text-xs font-medium text-slate-700">{formatDeadline(project.deadlineDate)}</span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <div className="max-w-md mx-auto">
                <svg
                  className="mx-auto h-16 w-16 text-slate-400 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  No projects yet
                </h3>
                <p className="text-slate-600 mb-6">
                  Get started by creating your first project. Track progress, manage tasks, and keep everything organized.
                </p>
                <Link
                  href="/admin/projects/create"
                  className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-700 transition shadow-sm hover:shadow-md"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Create Your First Project
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}


