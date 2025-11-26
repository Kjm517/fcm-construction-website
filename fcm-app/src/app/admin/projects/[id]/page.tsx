'use client';

import React, { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { projectsAPI } from "@/lib/api";

type ProjectFile = {
  name: string;
  url?: string;
  data?: string; // base64 data
  type?: string; // MIME type
};

type Phase = {
  id: string | number;
  name: string;
  isFinished: boolean;
  orderIndex?: number;
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
  lastEditedBy?: string;
  files?: ProjectFile[];
  tasks?: Phase[];
};

export default function AdminProjectPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const projectId = params?.id ? decodeURIComponent(params.id) : "";
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [savingTasks, setSavingTasks] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: string;
  } | null>(null);

  const loadProject = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setProject(null); // Clear previous project to force fresh load
    
    try {
      console.log('Loading project with ID:', projectId);
      
      const data = await projectsAPI.getById(projectId);
      console.log('API returned project data:', data);
      
      if (data && (data.id || data.projectName)) {
        console.log('Setting project from API:', data);
        setProject(data);
        setLoading(false);
        return;
      }
      
      console.log('API returned no data, checking localStorage...');
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('projects');
        if (stored) {
          try {
            const projects = JSON.parse(stored);
            console.log('Projects in localStorage:', projects.length);
            
            const found = projects.find((p: any) => {
              const pId = String(p.id || '').toLowerCase().trim();
              const searchId = String(projectId || '').toLowerCase().trim();
              return pId === searchId || pId.includes(searchId) || searchId.includes(pId);
            });
            
            if (found) {
              console.log('Found project in localStorage:', found);
              setProject(found);
              setLoading(false);
              return;
            } else {
              console.log('Project not found in localStorage. Looking for ID:', projectId);
              console.log('Available IDs:', projects.map((p: any) => p.id));
            }
          } catch (e) {
            console.error('Error parsing localStorage:', e);
          }
        }
      }
      
      console.log('Trying to fetch all projects and find by ID...');
      try {
        const allProjects = await projectsAPI.getAll();
        const found = allProjects.find((p: any) => {
          const pId = String(p.id || '').toLowerCase().trim();
          const searchId = String(projectId || '').toLowerCase().trim();
          return pId === searchId;
        });
        if (found) {
          console.log('Found project in all projects list:', found);
          setProject(found);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('Error fetching all projects:', e);
      }
      
      console.log('Project not found anywhere');
      setProject(null);
    } catch (error) {
      console.error('Error loading project:', error);
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject, searchParams]); // Reload when searchParams change (e.g., refresh query param)

  // Also reload when the page becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && projectId) {
        console.log('Page became visible, reloading project...');
        loadProject();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadProject, projectId]);

  const handleDelete = () => {
    if (!project) return;
    
    setConfirmModalData({
      title: 'Delete Project',
      message: `Are you sure you want to delete project "${project.projectName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmColor: 'bg-red-600 hover:bg-red-700',
      onConfirm: async () => {
        setShowConfirmModal(false);
        setDeleting(true);
        try {
          const success = await projectsAPI.delete(projectId);
          if (success) {
            router.push("/admin/projects");
          } else {
            setConfirmModalData({
              title: 'Error',
              message: 'Failed to delete project. Please try again.',
              confirmText: 'OK',
              onConfirm: () => {
                setShowConfirmModal(false);
                setConfirmModalData(null);
              },
            });
            setShowConfirmModal(true);
            setDeleting(false);
          }
        } catch (error) {
          console.error("Error deleting project:", error);
          setConfirmModalData({
            title: 'Error',
            message: 'Failed to delete project. Please try again.',
            confirmText: 'OK',
            onConfirm: () => {
              setShowConfirmModal(false);
              setConfirmModalData(null);
            },
          });
          setShowConfirmModal(true);
          setDeleting(false);
        }
      },
    });
    setShowConfirmModal(true);
  };

  const handleBack = () => {
    router.push("/admin/projects");
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
  
  // Initialize tasks from project data or empty array
  const [phaseList, setPhaseList] = useState<Phase[]>([]);
  const [newPhaseName, setNewPhaseName] = useState("");
  const progressRate = useMemo(() => {
    if (phaseList.length === 0) return 0;
    const completed = phaseList.filter(phase => phase.isFinished).length;
    return Math.round((completed / phaseList.length) * 100);
  }, [phaseList]);

  // Fetch tasks from API
  const fetchTasks = useCallback(async () => {
    if (!projectId) return;
    
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/tasks`);
      if (response.ok) {
        const tasks = await response.json();
        setPhaseList(tasks || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      if (project?.tasks) {
        setPhaseList(project.tasks);
      }
    }
  }, [projectId, project?.tasks]);

  useEffect(() => {
    if (projectId) {
      fetchTasks();
    }
  }, [projectId, fetchTasks]);

  const saveTask = async (task: Phase) => {
    if (!projectId || !task.id || !project) return;
    
    setSavingTasks(true);
    try {
      const username = typeof window !== 'undefined' 
        ? (localStorage.getItem('admin-username') || 'Admin')
        : 'Admin';
      
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(task.id)}`,
        {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'x-username': username,
          },
          body: JSON.stringify({
            name: task.name,
            isFinished: task.isFinished,
            orderIndex: task.orderIndex || 0,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save task');
      }

      const updatedTask = await response.json();
      setPhaseList(prev =>
        prev.map(p => p.id === task.id ? updatedTask : p)
      );
      
      // Update project's last_edited_by and updatedAt in local state
      setProject(prev => prev ? {
        ...prev,
        lastEditedBy: username,
        updatedAt: Date.now(),
      } : null);
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Failed to save task. Please try again.');
    } finally {
      setSavingTasks(false);
    }
  };

  const togglePhase = async (phaseId: string | number) => {
    const phase = phaseList.find(p => p.id === phaseId);
    if (!phase) return;

    const updated = {
      ...phase,
      isFinished: !phase.isFinished,
    };
    
    setPhaseList(prev =>
      prev.map(p => p.id === phaseId ? updated : p)
    );
    
    await saveTask(updated);
  };

  const addPhase = async () => {
    const name = newPhaseName.trim();
    if (!name || !projectId) return;
    
    setSavingTasks(true);
    try {
      const username = typeof window !== 'undefined' 
        ? (localStorage.getItem('admin-username') || 'Admin')
        : 'Admin';
      
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/tasks`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-username': username,
          },
          body: JSON.stringify({ name }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to create task: ${response.status} ${response.statusText}`);
      }

      const newTask = await response.json();
      setPhaseList(prev => [...prev, newTask]);
      setNewPhaseName("");
      
      setProject(prev => prev ? {
        ...prev,
        lastEditedBy: username,
        updatedAt: Date.now(),
      } : null);
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task. Please try again.');
    } finally {
      setSavingTasks(false);
    }
  };

  const removePhase = async (phaseId: string | number) => {
    if (!projectId) return;
    
    setSavingTasks(true);
    try {
      const username = typeof window !== 'undefined' 
        ? (localStorage.getItem('admin-username') || 'Admin')
        : 'Admin';
      
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(phaseId)}`,
        {
          method: 'DELETE',
          headers: {
            'x-username': username,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      setPhaseList(prev => prev.filter(phase => phase.id !== phaseId));
      
      setProject(prev => prev ? {
        ...prev,
        lastEditedBy: username,
        updatedAt: Date.now(),
      } : null);
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task. Please try again.');
    } finally {
      setSavingTasks(false);
    }
  };

  const truncateFileName = (fileName: string, maxLength: number = 35): string => {
    if (!fileName) return '';
    if (fileName.length <= maxLength) return fileName;
    
    const lastDot = fileName.lastIndexOf('.');
    if (lastDot === -1) {
      return fileName.substring(0, maxLength - 3) + '...';
    }
    
    const name = fileName.substring(0, lastDot);
    const extension = fileName.substring(lastDot);
    const maxNameLength = maxLength - extension.length - 3; // 3 for "..."
    
    if (name.length <= maxNameLength) return fileName;
    return name.substring(0, maxNameLength) + '...' + extension;
  };

  const handleDownloadFile = (file: ProjectFile) => {
    if (file.data) {
      // If we have base64 data, convert and download
      const byteCharacters = atob(file.data.split(',')[1] || file.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: file.type || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (file.url) {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const projectFiles: ProjectFile[] = project?.files || [];

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-6 lg:py-10">
          <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
              <p className="text-slate-600 text-lg">Loading project details...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-6 lg:py-10">
          <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-12 md:p-16 text-center">
            <div className="max-w-md mx-auto">
              <div className="mb-6">
                <svg
                  className="mx-auto h-20 w-20 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-3">
                Project Not Found
              </h3>
              <p className="text-slate-600 mb-2">
                The project you're looking for doesn't exist or may have been deleted.
              </p>
              <p className="text-sm text-slate-500 mb-8">
                Project ID: <span className="font-mono bg-slate-100 px-2 py-1 rounded">{projectId}</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleBack}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-700 transition shadow-sm hover:shadow-md"
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
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Back to Projects
                </button>
                <Link
                  href="/admin/projects/create"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
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
                  Create New Project
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
       <div className="max-w-7xl mx-auto px-4 py-6 lg:py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="rounded-lg border-2 border-slate-300 bg-white p-2.5 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition flex items-center justify-center shadow-sm hover:shadow"
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
                {project.projectName}
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Project details and progress tracking
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/projects/${encodeURIComponent(projectId)}/edit`}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition shadow-sm hover:shadow-md"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Project
            </Link>
            <button 
              onClick={handleDelete} 
              disabled={deleting || loading}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Center column: header + project tasks */}
          <section className="lg:col-span-9 space-y-4">
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
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addPhase();
                      }
                    }}
                    placeholder="New task name"
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    disabled={savingTasks}
                  />
                  <button
                    type="button"
                    onClick={addPhase}
                    disabled={savingTasks || !newPhaseName.trim()}
                    className="inline-flex items-center justify-center rounded-full bg-emerald-600 text-white h-10 w-10 text-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-700 transition"
                    aria-label="Add phase"
                  >
                    +
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {savingTasks && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                      <span>Saving...</span>
                    </div>
                  )}
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
                        disabled={savingTasks}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <span 
                        className={`text-sm break-words ${
                          phase.isFinished 
                            ? "line-through text-slate-400" 
                            : "text-slate-800"
                        }`}
                      >
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
                      disabled={savingTasks}
                      className="inline-flex items-center justify-center rounded-full p-2 text-red-500 hover:text-white hover:bg-red-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
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

          {/* Right column: project details / files / deadline */}
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
                    {projectCost && projectCost !== "N/A" ? `Php ${projectCost}` : "N/A"}
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
                  Files
                </h3>
                {projectFiles.length > 0 ? (
                  <ul className="space-y-1 text-sm break-words">
                    {projectFiles.map((file, index) => (
                      <li key={file.name || index}>
                        <button
                          type="button"
                          onClick={() => handleDownloadFile(file)}
                          className="text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer w-full text-left"
                          title={file.name} // Show full name on hover
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4 flex-shrink-0"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                          <span className="truncate">{truncateFileName(file.name)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">
                    No files attached.
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">
                  Deadline
                </h3>
                <p className="text-sm text-slate-800">{deadlineDate}</p>
              </div>

              {project.createdAt && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">
                    Created
                  </h3>
                  <p className="text-sm text-slate-800">
                    {new Date(project.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}

              {project.updatedAt && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">
                    Last Edited
                  </h3>
                  <p className="text-sm text-slate-800">
                    {new Date(project.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    by {project.lastEditedBy || 'Admin'}
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && confirmModalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {confirmModalData.title}
              </h3>
              <p className="text-sm text-slate-600 mb-6">
                {confirmModalData.message}
              </p>
              <div className="flex gap-3 justify-end">
                {confirmModalData.cancelText && (
                  <button
                    onClick={() => {
                      setShowConfirmModal(false);
                      setConfirmModalData(null);
                    }}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition"
                  >
                    {confirmModalData.cancelText}
                  </button>
                )}
                <button
                  onClick={() => {
                    confirmModalData.onConfirm();
                  }}
                  className={`px-4 py-2 text-white rounded-lg text-sm font-medium transition ${confirmModalData.confirmColor || 'bg-emerald-600 hover:bg-emerald-700'}`}
                >
                  {confirmModalData.confirmText || 'OK'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
