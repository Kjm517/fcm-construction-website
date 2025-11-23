'use client';

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { projectsAPI } from "@/lib/api";

type Project = {
  id: string;
  name: string;
  client: string;
  address: string;
  deadline: string;
  progress: number;
  deadlineDate?: string;
  updatedAt?: number;
  createdAt?: number;
};

type ReminderTag = {
  id: string;
  user_id: string | null;
  position: string | null;
  user?: {
    id: string;
    full_name: string | null;
    username: string;
    position: string | null;
  } | null;
};

type ReminderCompletion = {
  id: string;
  user_id: string;
  completed_at: string;
  user?: {
    id: string;
    full_name: string | null;
    username: string;
  } | null;
};

type Reminder = {
  id: string;
  title: string;
  description: string | null;
  reminder_date: string;
  reminder_time: string;
  deadline: string | null;
  priority: string;
  status: string;
  project_id: string | null;
  projects?: {
    id: string;
    project_name: string;
    client_name: string;
    building_address?: string;
  } | null;
  creator?: {
    id: string;
    full_name: string | null;
    username: string;
  } | null;
  tags?: ReminderTag[];
  completions?: ReminderCompletion[];
  created_at: string;
};

type Request = {
  id: string;
  client: string;
  type: string;
  submitted: string;
  full_name?: string;
  email?: string;
  phone_number?: string;
  project_type?: string;
  project_location?: string;
  estimated_budget?: string;
  project_details?: string;
  status?: string;
  created_at?: string;
};

// projects will be loaded dynamically

// reminders will be loaded dynamically

// requests will be loaded dynamically

type SortKey = "deadline" | "progress" | "client";

export default function AdminHomePage() {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<SortKey>("deadline");
  const [currentUser, setCurrentUser] = useState<string>("admin");
  const [displayName, setDisplayName] = useState<string>("FCM Dashboard");
  const [position, setPosition] = useState<string>("");
  const [requests, setRequests] = useState<Request[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loadingReminders, setLoadingReminders] = useState(true);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [isEditingReminder, setIsEditingReminder] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    reminderDate: '',
    reminderTime: '',
    deadline: '',
    priority: 'medium',
    projectId: '',
    taggedUserIds: [] as string[],
    taggedPositions: [] as string[],
  });
  const [updatingReminder, setUpdatingReminder] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loadingReminderDetails, setLoadingReminderDetails] = useState(false);
  const [markingAsDone, setMarkingAsDone] = useState(false);
  const [deletingReminder, setDeletingReminder] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: string;
  } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reminderDate: '',
    reminderTime: '',
    deadline: '',
    priority: 'medium',
    projectId: '',
    taggedUserIds: [] as string[],
    taggedPositions: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [mentionInput, setMentionInput] = useState('');
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<any[]>([]);
  const [mentionCursorPosition, setMentionCursorPosition] = useState(0);

  const POSITION_OPTIONS = [
    'Admin',
    'Manager',
    'Secretary',
    'Communications Marketer',
    'Accounting',
  ];

  useEffect(() => {
    if (typeof window !== "undefined") {
      const username = localStorage.getItem("admin-username") || "admin";
      setCurrentUser(username);
      setDisplayName(username); // Set username as default
      
      // Load full name from profile
      const userId = localStorage.getItem("admin-user-id");
      if (userId) {
        fetch(`/api/profile?userId=${userId}`)
          .then(res => res.json())
          .then(data => {
            if (data && data.full_name && data.full_name.trim()) {
              const nameParts = data.full_name.trim().split(/\s+/);
              // Show full name, or first name, or first two names
              if (nameParts.length >= 2) {
                setDisplayName(`${nameParts[0]} ${nameParts[1]}`);
              } else if (nameParts.length === 1) {
                setDisplayName(nameParts[0]);
              } else {
                setDisplayName(data.full_name);
              }
            }
            // Set position if available
            if (data && data.position) {
              setPosition(data.position);
            }
            // If no full_name, displayName will remain as username (already set above)
          })
          .catch(err => {
            console.error("Error loading profile:", err);
            // On error, keep username as displayName
          });
      }

      // Load quote requests
      loadQuoteRequests();
      // Load task reminders
      loadTaskReminders();
      // Load users for tagging
      loadUsers();
      // Load projects
      loadProjects();
    }
  }, []);

  const loadQuoteRequests = async () => {
    try {
      const response = await fetch('/api/quote-requests?status=pending');
      if (response.ok) {
        const data = await response.json();
        // Set pending count for badge
        setPendingCount(data.length);
        // Transform data to match Request type
        const transformedRequests: Request[] = data.map((req: any) => ({
          id: req.id,
          client: req.full_name || 'Unknown',
          type: req.project_type || 'Unknown',
          submitted: formatTimeAgo(req.created_at),
          full_name: req.full_name,
          email: req.email,
          phone_number: req.phone_number,
          project_type: req.project_type,
          project_location: req.project_location,
          estimated_budget: req.estimated_budget,
          project_details: req.project_details,
          status: req.status,
          created_at: req.created_at,
        }));
        setRequests(transformedRequests.slice(0, 5)); // Show only latest 5
      }
    } catch (error) {
      console.error('Error loading quote requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const formatTimeAgo = (dateString: string | undefined): string => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  };

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch('/api/employees');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadTaskReminders = async () => {
    try {
      setLoadingReminders(true);
      const userId = typeof window !== 'undefined' 
        ? localStorage.getItem('admin-user-id') 
        : null;
      const userPosition = position || null;
      
      // Build query - show all pending reminders
      // Filter by user/position on the server side
      let queryUrl = `/api/task-reminders?status=pending`;
      if (userId) queryUrl += `&userId=${userId}`;
      if (userPosition) queryUrl += `&userPosition=${userPosition}`;
      
      console.log('Loading reminders with URL:', queryUrl);
      
      const response = await fetch(queryUrl);
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded reminders:', data.length, data);
        
        // Show ALL reminders, sorted by reminder date (oldest first)
        const sortedData = [...data].sort((a: Reminder, b: Reminder) => {
          const dateA = new Date(a.reminder_date).getTime();
          const dateB = new Date(b.reminder_date).getTime();
          return dateA - dateB;
        });
        
        console.log('All reminders (sorted by date):', sortedData.length);
        setReminders(sortedData);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error loading reminders:', errorData);
      }
    } catch (error) {
      console.error('Error loading task reminders:', error);
    } finally {
      setLoadingReminders(false);
    }
  };

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      const data = await projectsAPI.getAll();
      
      // Fetch progress for each project
      const projectsWithProgress = await Promise.all(
        data.map(async (project: any) => {
          try {
            const response = await fetch(`/api/projects/${encodeURIComponent(project.id)}/tasks`);
            if (response.ok) {
              const tasks = await response.json();
              const completed = tasks.filter((t: any) => t.isFinished).length;
              const total = tasks.length;
              const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
              
              return {
                id: project.id,
                name: project.projectName || project.name,
                client: project.clientName || project.client,
                address: project.buildingAddress || project.address,
                deadline: project.deadlineDate || project.deadline,
                progress: progress,
                deadlineDate: project.deadlineDate,
                updatedAt: project.updatedAt,
                createdAt: project.createdAt,
              };
            }
          } catch (error) {
            console.error(`Error fetching tasks for project ${project.id}:`, error);
          }
          return {
            id: project.id,
            name: project.projectName || project.name,
            client: project.clientName || project.client,
            address: project.buildingAddress || project.address,
            deadline: project.deadlineDate || project.deadline,
            progress: 0,
            deadlineDate: project.deadlineDate,
            updatedAt: project.updatedAt,
            createdAt: project.createdAt,
          };
        })
      );
      
      // Sort by most recent first
      projectsWithProgress.sort((a, b) => {
        const aDate = a.updatedAt || a.createdAt || 0;
        const bDate = b.updatedAt || b.createdAt || 0;
        return bDate - aDate;
      });
      
      setProjects(projectsWithProgress);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  const formatReminderDateTime = (reminder: Reminder): string => {
    const reminderDate = new Date(reminder.reminder_date);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const reminderDay = new Date(reminderDate.getFullYear(), reminderDate.getMonth(), reminderDate.getDate());
    
    const timeStr = reminder.reminder_time || reminderDate.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    
    if (reminderDay.getTime() === today.getTime()) {
      return `Today, ${timeStr}`;
    } else {
      return reminderDate.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-slate-600';
    }
  };

  const getDeadlineStatus = (reminder: Reminder) => {
    if (!reminder.deadline) return null;
    
    const deadline = new Date(reminder.deadline);
    const now = new Date();
    const diffInMs = deadline.getTime() - now.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;

    if (diffInMs < 0) {
      // Past deadline
      return {
        status: 'overdue',
        label: 'Overdue',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: '⚠️',
      };
    } else if (diffInHours <= 24) {
      // Due within 24 hours
      return {
        status: 'urgent',
        label: diffInHours < 1 ? 'Due Soon' : `Due in ${Math.floor(diffInHours)}h`,
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: '⏰',
      };
    } else if (diffInDays <= 3) {
      // Due within 3 days
      return {
        status: 'approaching',
        label: `Due in ${Math.floor(diffInDays)} Day${Math.floor(diffInDays) > 1 ? 's' : ''}`,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: '📅',
      };
    } else {
      // On time
      return {
        status: 'ontime',
        label: `Due in ${Math.floor(diffInDays)} Day${Math.floor(diffInDays) > 1 ? 's' : ''}`,
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: '✓',
      };
    }
  };

  const handleReminderClick = async (reminder: Reminder) => {
    setLoadingReminderDetails(true);
    setShowReminderModal(true);
    
    try {
      // Fetch full reminder details from API
      const response = await fetch(`/api/task-reminders/${reminder.id}`);
      if (response.ok) {
        const fullDetails = await response.json();
        setSelectedReminder(fullDetails);
      } else {
        // If API fails, use the reminder data we already have
        setSelectedReminder(reminder);
      }
    } catch (error) {
      console.error('Error fetching reminder details:', error);
      // Fallback to the reminder data we already have
      setSelectedReminder(reminder);
    } finally {
      setLoadingReminderDetails(false);
    }
  };

  const handleUpdateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!selectedReminder) return;
    
    if (!editFormData.title || !editFormData.reminderDate || !editFormData.reminderTime) {
      alert('Please fill in all required fields (Title, Reminder Date, Reminder Time)');
      return;
    }

    // Validate deadline is not in the past
    if (editFormData.deadline) {
      const deadlineDate = new Date(editFormData.deadline);
      const now = new Date();
      if (deadlineDate < now) {
        alert('Deadline cannot be set before the current date and time');
        return;
      }
    }

    setUpdatingReminder(true);
    try {
      const userId = typeof window !== 'undefined' 
        ? localStorage.getItem('admin-user-id') 
        : null;

      // Check ownership
      if (userId !== selectedReminder.created_by) {
        alert('You can only edit reminders you created');
        setUpdatingReminder(false);
        return;
      }

      const response = await fetch(`/api/task-reminders/${selectedReminder.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(userId ? { 'x-user-id': userId } : {}),
        },
        body: JSON.stringify({
          title: editFormData.title,
          description: editFormData.description || null,
          reminderDate: editFormData.reminderDate,
          reminderTime: editFormData.reminderTime,
          deadline: editFormData.deadline || null,
          priority: editFormData.priority,
          projectId: editFormData.projectId || null,
          userIds: editFormData.taggedUserIds,
          positions: editFormData.taggedPositions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        alert(errorData.error || `Failed to update reminder (Status: ${response.status})`);
        return;
      }

      // Reload reminder details and close edit mode
      setIsEditingReminder(false);
      await loadTaskReminders();
      
      // Reload the reminder details
      if (selectedReminder.id) {
        const detailResponse = await fetch(`/api/task-reminders/${selectedReminder.id}`);
        if (detailResponse.ok) {
          const updatedReminder = await detailResponse.json();
          setSelectedReminder(updatedReminder);
        }
      }
    } catch (error: any) {
      console.error('Error updating reminder:', error);
      alert(`Failed to update reminder: ${error.message || 'Network error'}`);
    } finally {
      setUpdatingReminder(false);
    }
  };

  const handleMarkAsDone = () => {
    if (!selectedReminder) return;

    setConfirmModalData({
      title: 'Mark as Done',
      message: 'Mark this reminder as done? It will be removed from your reminders list.',
      confirmText: 'Mark as Done',
      cancelText: 'Cancel',
      confirmColor: 'bg-emerald-600 hover:bg-emerald-700',
      onConfirm: async () => {
        setShowConfirmModal(false);
        setMarkingAsDone(true);
        try {
          const userId = typeof window !== 'undefined' 
            ? localStorage.getItem('admin-user-id') 
            : null;

          if (!userId) {
            setConfirmModalData({
              title: 'Error',
              message: 'User ID not found. Please log in again.',
              confirmText: 'OK',
              onConfirm: () => setShowConfirmModal(false),
            });
            setShowConfirmModal(true);
            return;
          }

          const response = await fetch(`/api/task-reminders/${selectedReminder.id}/complete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': userId,
            },
          });

          if (response.ok) {
            // Close modal and reload reminders
            setShowReminderModal(false);
            setSelectedReminder(null);
            await loadTaskReminders();
          } else {
            const errorData = await response.json();
            setConfirmModalData({
              title: 'Error',
              message: errorData.error || 'Failed to mark reminder as done',
              confirmText: 'OK',
              onConfirm: () => setShowConfirmModal(false),
            });
            setShowConfirmModal(true);
          }
        } catch (error) {
          console.error('Error marking reminder as done:', error);
          setConfirmModalData({
            title: 'Error',
            message: 'Failed to mark reminder as done',
            confirmText: 'OK',
            onConfirm: () => setShowConfirmModal(false),
          });
          setShowConfirmModal(true);
        } finally {
          setMarkingAsDone(false);
        }
      },
    });
    setShowConfirmModal(true);
  };

  const handleDeleteReminder = () => {
    if (!selectedReminder) return;

    setConfirmModalData({
      title: 'Delete Reminder',
      message: 'Are you sure you want to delete this reminder? This will permanently remove it for you and all tagged users.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmColor: 'bg-red-600 hover:bg-red-700',
      onConfirm: async () => {
        setShowConfirmModal(false);
        setDeletingReminder(true);
        try {
          const userId = typeof window !== 'undefined' 
            ? localStorage.getItem('admin-user-id') 
            : null;

          if (!userId) {
            setConfirmModalData({
              title: 'Error',
              message: 'User ID not found. Please log in again.',
              confirmText: 'OK',
              onConfirm: () => setShowConfirmModal(false),
            });
            setShowConfirmModal(true);
            return;
          }

          const response = await fetch(`/api/task-reminders/${selectedReminder.id}`, {
            method: 'DELETE',
            headers: {
              'x-user-id': userId,
            },
          });

          if (response.ok) {
            // Close modal and reload reminders
            setShowReminderModal(false);
            setSelectedReminder(null);
            setIsEditingReminder(false);
            await loadTaskReminders();
          } else {
            const errorData = await response.json();
            setConfirmModalData({
              title: 'Error',
              message: errorData.error || 'Failed to delete reminder',
              confirmText: 'OK',
              onConfirm: () => setShowConfirmModal(false),
            });
            setShowConfirmModal(true);
          }
        } catch (error) {
          console.error('Error deleting reminder:', error);
          setConfirmModalData({
            title: 'Error',
            message: 'Failed to delete reminder',
            confirmText: 'OK',
            onConfirm: () => setShowConfirmModal(false),
          });
          setShowConfirmModal(true);
        } finally {
          setDeletingReminder(false);
        }
      },
    });
    setShowConfirmModal(true);
  };

  const handleSelectMention = (suggestion: any) => {
    if (suggestion.type === 'position') {
      if (!formData.taggedPositions.includes(suggestion.value)) {
        setFormData({
          ...formData,
          taggedPositions: [...formData.taggedPositions, suggestion.value],
        });
      }
    } else if (suggestion.type === 'user') {
      if (!formData.taggedUserIds.includes(suggestion.value.id)) {
        setFormData({
          ...formData,
          taggedUserIds: [...formData.taggedUserIds, suggestion.value.id],
        });
      }
    }
    
    // Clear the input and suggestions
    setMentionInput('');
    setShowMentionSuggestions(false);
    setMentionSuggestions([]);
  };

  const handleCreateReminder = () => {
    setFormData({
      title: '',
      description: '',
      reminderDate: '',
      reminderTime: '',
      deadline: '',
      priority: 'medium',
      projectId: '',
      taggedUserIds: [],
      taggedPositions: [],
    });
    setMentionInput('');
    setShowMentionSuggestions(false);
    setShowCreateModal(true);
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Form submitted with data:', formData);
    
    if (!formData.title || !formData.reminderDate || !formData.reminderTime) {
      alert('Please fill in all required fields (Title, Reminder Date, Reminder Time)');
      return;
    }

    // Validate deadline is not in the past
    if (formData.deadline) {
      const deadlineDate = new Date(formData.deadline);
      const now = new Date();
      if (deadlineDate < now) {
        alert('Deadline cannot be set before the current date and time');
        return;
      }
    }

    setSubmitting(true);
    console.log('Submitting reminder...');
    try {
      const userId = typeof window !== 'undefined' 
        ? localStorage.getItem('admin-user-id') 
        : null;

      const response = await fetch('/api/task-reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userId ? { 'x-user-id': userId } : {}),
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          reminderDate: formData.reminderDate,
          reminderTime: formData.reminderTime,
          deadline: formData.deadline || null,
          priority: formData.priority,
          projectId: formData.projectId || null,
          userIds: formData.taggedUserIds,
          positions: formData.taggedPositions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        console.error('API error response:', errorData);
        alert(errorData.error || `Failed to create reminder (Status: ${response.status})`);
        return;
      }

      const result = await response.json().catch(() => null);
      console.log('Reminder created successfully:', result);
      
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        reminderDate: '',
        reminderTime: '',
        deadline: '',
        priority: 'medium',
        projectId: '',
        taggedUserIds: [],
        taggedPositions: [],
      });
      setMentionInput('');
      setShowMentionSuggestions(false);
      // Reload reminders after a short delay to ensure DB is updated
      setTimeout(async () => {
        await loadTaskReminders();
      }, 500);
    } catch (error: any) {
      console.error('Error creating reminder:', error);
      alert(`Failed to create reminder: ${error.message || 'Network error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("admin-auth");
    }
    router.push("/admin/login");
  };

  const sortedProjects = useMemo(() => {
    const p = [...projects];
    if (sortBy === "progress") {
      return p.sort((a, b) => b.progress - a.progress);
    }
    if (sortBy === "client") {
      return p.sort((a, b) => a.client.localeCompare(b.client));
    }
    // Sort by deadline
    return p.sort((a, b) => {
      try {
        const dateA = new Date(a.deadline).getTime();
        const dateB = new Date(b.deadline).getTime();
        return dateA - dateB;
      } catch {
        return 0;
      }
    });
  }, [sortBy, projects]);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-10">
        <header className="flex items-center justify-between mb-6 lg:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              Admin Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <aside className="lg:col-span-2">
            <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-4 flex flex-col gap-3 sticky top-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-lg font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Hello, {displayName}
                  </p>
                  {position && (
                    <p className="text-xs text-slate-600 mt-0.5">
                      {position}
                    </p>
                  )}
                  <Link
                    href="/admin/profile"
                    className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition"
                  >
                    Edit Profile
                  </Link>
                </div>
              </div>
              <nav className="flex flex-col gap-1 text-sm">
                <span className="rounded-lg px-3 py-2 bg-emerald-50 text-emerald-700 font-medium">
                  Dashboard
                </span>
                <Link
                  href="/admin/inbox"
                  className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-50 relative flex items-center justify-between"
                >
                  <span>Inbox</span>
                  {pendingCount > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/admin/projects"
                  className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-50"
                >
                  Projects
                </Link>
                <Link
                  href="/admin/quotations"
                  className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-50"
                >
                  Quotations
                </Link>
                {(position === 'Admin' || position === 'Manager') && (
                  <Link
                    href="/admin/employees"
                    className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-50"
                  >
                    Employees
                  </Link>
                )}
              </nav>
            </div>
          </aside>

          <section className="lg:col-span-6 space-y-4">
            <div className="rounded-2xl overflow-hidden bg-white shadow-sm border border-slate-200">
              <img
                src="/images/fcmbanner.png"
                alt="FCM banner"
                className="w-full h-48 md:h-56 object-cover"
              />
            </div>

            <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-5 md:p-6">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <h2 className="text-lg md:text-xl font-semibold text-slate-900 flex-1">
                  Ongoing Projects
                </h2>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortKey)}
                    className="border border-emerald-600 bg-emerald-600 text-white text-xs md:text-sm rounded-lg px-3 py-2 pr-7 appearance-none cursor-pointer"
                  >
                    <option value="deadline">Sort by: Deadline</option>
                    <option value="progress">Sort by: Progress Rate</option>
                    <option value="client">Sort by: Client Name</option>
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-white text-lg">
                    ▾
                  </span>
                </div>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {loadingProjects ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="text-sm text-slate-500 mt-2">Loading projects...</p>
                  </div>
                ) : sortedProjects.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-500">No projects found</p>
                  </div>
                ) : (
                  sortedProjects.map((project) => {
                    const formatDeadline = (deadline: string) => {
                      try {
                        const date = new Date(deadline);
                        return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
                      } catch {
                        return deadline;
                      }
                    };
                    
                    return (
                      <Link
                        key={project.id}
                        href={`/admin/projects/${project.id}`}
                        className="block rounded-xl border border-slate-200 p-4 hover:border-emerald-400 hover:shadow-md transition bg-slate-50"
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <h3 className="text-sm md:text-base font-semibold text-slate-900">
                              {project.name}
                            </h3>
                            <p className="text-xs md:text-sm text-slate-600 mt-1">
                              {project.client} · {project.address}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              Deadline:{" "}
                              <span className="font-medium">
                                {formatDeadline(project.deadline)}
                              </span>
                            </p>
                          </div>
                          <div className="text-right min-w-[88px]">
                            <p className="text-xs text-slate-600">Progress</p>
                            <p className="text-sm font-semibold text-emerald-600">
                              {project.progress}%
                            </p>
                            <div className="mt-1 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className="h-full bg-emerald-500"
                                style={{ width: `${project.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          </section>

          <aside className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-5 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  Task Reminders
                </h2>
                <button
                  onClick={handleCreateReminder}
                  className="rounded-full bg-emerald-600 text-white p-2 hover:bg-emerald-700 transition shadow-sm"
                  title="Add new reminder"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
              <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
                {loadingReminders ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="text-xs text-slate-500 mt-2">Loading reminders...</p>
                  </div>
                ) : reminders.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">
                    No reminders
                  </p>
                ) : (
                  reminders.map((reminder) => {
                    const deadlineStatus = getDeadlineStatus(reminder);
                    const userId = typeof window !== 'undefined' ? localStorage.getItem('admin-user-id') : null;
                    const userCompleted = reminder.completions?.some((c: ReminderCompletion) => c.user_id === userId);
                    const othersCompleted = reminder.completions && reminder.completions.length > 0 && !userCompleted;
                    const completedCount = reminder.completions?.length || 0;
                    
                    return (
                      <div
                        key={reminder.id}
                        onClick={() => handleReminderClick(reminder)}
                        className={`block rounded-lg border p-3 transition cursor-pointer ${
                          deadlineStatus?.status === 'overdue'
                            ? 'border-red-300 bg-red-50 hover:bg-red-100'
                            : deadlineStatus?.status === 'urgent'
                            ? 'border-orange-300 bg-orange-50 hover:bg-orange-100'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="text-xs text-emerald-700 font-semibold">
                                {formatReminderDateTime(reminder)}
                              </p>
                              {deadlineStatus && (
                                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 ${deadlineStatus.color}`}>
                                  <span>{deadlineStatus.icon}</span>
                                  <span>{deadlineStatus.label}</span>
                                </span>
                              )}
                              {othersCompleted && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 font-medium flex items-center gap-1">
                                  <span>✓</span>
                                  <span>{completedCount} {completedCount === 1 ? 'person' : 'people'} completed</span>
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-slate-900 mt-1">
                              {reminder.title}
                            </p>
                            {reminder.description && (
                              <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                                {reminder.description}
                              </p>
                            )}
                            {reminder.projects && (
                              <p className="text-xs text-slate-500 mt-1">
                                Project: {reminder.projects.project_name}
                              </p>
                            )}
                          </div>
                          <span className={`text-xs font-medium flex-shrink-0 ${getPriorityColor(reminder.priority)}`}>
                            {reminder.priority.charAt(0).toUpperCase() + reminder.priority.slice(1)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-5 md:p-6">
              <h2 className="text-xl font-semibold text-slate-900 text-center">
                Project Requests
              </h2>
              <p className="text-xs text-slate-500 text-center mt-1 mb-4">
                Check and validate within 7 days
              </p>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {loadingRequests ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="text-xs text-slate-500 mt-2">Loading requests...</p>
                  </div>
                ) : requests.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">
                    No pending requests
                  </p>
                ) : (
                  <>
                    {requests.map((request) => (
                      <Link
                        key={request.id}
                        href={`/admin/inbox?requestId=${request.id}`}
                        className="block rounded-lg border border-slate-200 p-3 bg-slate-50 hover:bg-slate-100 hover:border-emerald-300 transition cursor-pointer"
                      >
                        <p className="text-sm font-semibold text-slate-900">
                          {request.client}
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {request.type}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Submitted {request.submitted}
                        </p>
                      </Link>
                    ))}
                    {requests.length >= 5 && (
                      <Link
                        href="/admin/inbox"
                        className="block text-center text-sm text-emerald-600 hover:text-emerald-700 font-medium pt-2"
                      >
                        View all requests →
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Reminder Detail Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">
                {isEditingReminder ? 'Edit Task Reminder' : 'Task Reminder Details'}
              </h3>
              <button
                onClick={() => {
                  setShowReminderModal(false);
                  setSelectedReminder(null);
                  setIsEditingReminder(false);
                }}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {loadingReminderDetails ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="text-slate-600 mt-4">Loading reminder details...</p>
              </div>
            ) : selectedReminder ? (
              <div className="p-6 space-y-6">
              {isEditingReminder ? (
                <form onSubmit={handleUpdateReminder} className="space-y-6">
                  {/* Title */}
                  <div>
                    <label htmlFor="edit-title" className="block text-sm font-semibold text-slate-900 mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="edit-title"
                      required
                      value={editFormData.title}
                      onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                      placeholder="Enter task title"
                    />
                  </div>

                  {/* Task Description */}
                  <div>
                    <label htmlFor="edit-description" className="block text-sm font-semibold text-slate-900 mb-2">
                      Task Description
                    </label>
                    <textarea
                      id="edit-description"
                      rows={4}
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition resize-none"
                      placeholder="Enter task description (optional)"
                    />
                  </div>

                  {/* Reminder Date and Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="edit-reminderDate" className="block text-sm font-semibold text-slate-900 mb-2">
                        Reminder Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        id="edit-reminderDate"
                        required
                        value={editFormData.reminderDate}
                        onChange={(e) => setEditFormData({ ...editFormData, reminderDate: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-reminderTime" className="block text-sm font-semibold text-slate-900 mb-2">
                        Reminder Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        id="edit-reminderTime"
                        required
                        value={editFormData.reminderTime}
                        onChange={(e) => setEditFormData({ ...editFormData, reminderTime: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Deadline */}
                  <div>
                    <label htmlFor="edit-deadline" className="block text-sm font-semibold text-slate-900 mb-2">
                      Deadline (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      id="edit-deadline"
                      value={editFormData.deadline}
                      min={new Date().toISOString().slice(0, 16)}
                      onChange={(e) => {
                        const selectedDate = new Date(e.target.value);
                        const now = new Date();
                        if (selectedDate < now) {
                          alert('Deadline cannot be set before the current date and time');
                          return;
                        }
                        setEditFormData({ ...editFormData, deadline: e.target.value });
                      }}
                      className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    />
                  </div>

                  {/* Priority */}
                  <div>
                    <label htmlFor="edit-priority" className="block text-sm font-semibold text-slate-900 mb-2">
                      Priority
                    </label>
                    <select
                      id="edit-priority"
                      value={editFormData.priority}
                      onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  {/* Project (Optional) */}
                  <div>
                    <label htmlFor="edit-projectId" className="block text-sm font-semibold text-slate-900 mb-2">
                      Related Project ID (Optional)
                    </label>
                    <input
                      type="text"
                      id="edit-projectId"
                      value={editFormData.projectId}
                      onChange={(e) => setEditFormData({ ...editFormData, projectId: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                      placeholder="Enter project ID (UUID)"
                    />
                  </div>

                  {/* Tagged Users/Positions - read-only */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Tagged Users/Positions
                    </label>
                    <div className="space-y-2">
                      {editFormData.taggedPositions.map((pos) => (
                        <span key={pos} className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm mr-2">
                          @{pos}
                        </span>
                      ))}
                      {editFormData.taggedUserIds.map((userId) => {
                        const user = users.find(u => u.id === userId);
                        return (
                          <span key={userId} className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm mr-2">
                            @{user?.username || userId}
                          </span>
                        );
                      })}
                      <p className="text-xs text-slate-500">Tags cannot be edited. Create a new reminder to change tags.</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsEditingReminder(false)}
                      className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updatingReminder}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {updatingReminder ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Updating...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Update Reminder
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <>
              {/* Title */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Title
                </label>
                <p className="text-xl font-bold text-slate-900 mt-2">
                  {selectedReminder.title}
                </p>
              </div>

              {/* Task Description */}
              {selectedReminder.description ? (
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Task Description
                  </label>
                  <div className="mt-2 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-900 whitespace-pre-wrap leading-relaxed">
                      {selectedReminder.description}
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Task Description
                  </label>
                  <p className="text-sm text-slate-400 italic mt-2">No description provided</p>
                </div>
              )}

              {/* Date, Time, Deadline, and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Reminder Date
                  </label>
                  <p className="text-sm font-medium text-slate-900 mt-1">
                    {new Date(selectedReminder.reminder_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Reminder Time
                  </label>
                  <p className="text-sm font-medium text-slate-900 mt-1">
                    {selectedReminder.reminder_time || new Date(selectedReminder.reminder_date).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                </div>
                {selectedReminder.deadline && (() => {
                  const deadlineStatus = getDeadlineStatus(selectedReminder);
                  return (
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Deadline
                      </label>
                      <div className="mt-2 p-3 rounded-lg border-2 bg-slate-50">
                        <div className="flex items-center justify-between mb-2">
                          <p className={`text-sm font-medium ${
                            deadlineStatus?.status === 'overdue' ? 'text-red-600' :
                            deadlineStatus?.status === 'urgent' ? 'text-orange-600' :
                            deadlineStatus?.status === 'approaching' ? 'text-yellow-600' :
                            'text-emerald-600'
                          }`}>
                            {new Date(selectedReminder.deadline).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </p>
                          {deadlineStatus && (
                            <span className={`text-xs px-3 py-1 rounded-full border font-medium flex items-center gap-1 ${deadlineStatus.color}`}>
                              <span>{deadlineStatus.icon}</span>
                              <span>{deadlineStatus.label}</span>
                            </span>
                          )}
                        </div>
                        {deadlineStatus?.status === 'overdue' && (
                          <p className="text-xs text-red-600 font-medium mt-2 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            This task is overdue and requires immediate attention
                          </p>
                        )}
                        {deadlineStatus?.status === 'urgent' && (
                          <p className="text-xs text-orange-600 font-medium mt-2 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            Deadline is approaching soon
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()}
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Priority
                  </label>
                  <p className={`text-sm font-medium mt-1 ${getPriorityColor(selectedReminder.priority)}`}>
                    {selectedReminder.priority.charAt(0).toUpperCase() + selectedReminder.priority.slice(1)}
                  </p>
                </div>
              </div>

              {selectedReminder.projects && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Related Project
                  </label>
                  <div className="mt-2 p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm font-medium text-slate-900">
                      {selectedReminder.projects.project_name}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      Client: {selectedReminder.projects.client_name}
                    </p>
                    {selectedReminder.projects.building_address && (
                      <p className="text-xs text-slate-600 mt-1">
                        Location: {selectedReminder.projects.building_address}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Tagged Users and Positions */}
              {selectedReminder.tags && selectedReminder.tags.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Tagged
                  </label>
                  <div className="mt-2 space-y-2">
                    {selectedReminder.tags.map((tag) => (
                      <div key={tag.id} className="p-2 bg-slate-50 rounded-lg">
                        {tag.user ? (
                          <p className="text-sm text-slate-900">
                            <span className="font-medium">User:</span> {tag.user.full_name || tag.user.username}
                            {tag.user.position && <span className="text-slate-500"> ({tag.user.position})</span>}
                          </p>
                        ) : tag.position ? (
                          <p className="text-sm text-slate-900">
                            <span className="font-medium">Position:</span> {tag.position}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed By Section */}
              {selectedReminder.completions && selectedReminder.completions.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Completed By
                  </label>
                  <div className="mt-2 space-y-2">
                    {selectedReminder.completions.map((completion) => (
                      <div key={completion.id} className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                        <p className="text-sm text-emerald-900">
                          <span className="font-medium">✓</span> {completion.user?.full_name || completion.user?.username || 'Unknown'}
                        </p>
                        <p className="text-xs text-emerald-700 mt-1">
                          {new Date(completion.completed_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedReminder.creator && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Created By
                  </label>
                  <p className="text-sm text-slate-900 mt-1">
                    {selectedReminder.creator.full_name || selectedReminder.creator.username}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                {selectedReminder.project_id && (
                  <Link
                    href={`/admin/projects/${selectedReminder.project_id}`}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition text-center"
                  >
                    View Project
                  </Link>
                )}
                {/* Edit and Delete buttons - only show if user is the creator */}
                {(() => {
                  const userId = typeof window !== 'undefined' ? localStorage.getItem('admin-user-id') : null;
                  const isOwner = userId && selectedReminder.created_by === userId;
                  return isOwner ? (
                    <>
                      <button
                        onClick={() => {
                          // Populate edit form with current reminder data
                          const reminderDate = new Date(selectedReminder.reminder_date);
                          const dateStr = reminderDate.toISOString().split('T')[0];
                          const timeStr = selectedReminder.reminder_time || reminderDate.toTimeString().slice(0, 5);
                          const deadlineStr = selectedReminder.deadline 
                            ? new Date(selectedReminder.deadline).toISOString().slice(0, 16)
                            : '';
                          
                          setEditFormData({
                            title: selectedReminder.title,
                            description: selectedReminder.description || '',
                            reminderDate: dateStr,
                            reminderTime: timeStr,
                            deadline: deadlineStr,
                            priority: selectedReminder.priority || 'medium',
                            projectId: selectedReminder.project_id || '',
                            taggedUserIds: selectedReminder.tags?.filter(t => t.user_id).map(t => t.user_id) || [],
                            taggedPositions: selectedReminder.tags?.filter(t => t.position).map(t => t.position!) || [],
                          });
                          setIsEditingReminder(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={handleDeleteReminder}
                        disabled={deletingReminder}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {deletingReminder ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </>
                        )}
                      </button>
                    </>
                  ) : null;
                })()}
                <button
                  onClick={handleMarkAsDone}
                  disabled={markingAsDone || (() => {
                    const userId = typeof window !== 'undefined' ? localStorage.getItem('admin-user-id') : null;
                    return selectedReminder.completions?.some((c: ReminderCompletion) => c.user_id === userId) || false;
                  })()}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {markingAsDone ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Marking as Done...
                    </>
                  ) : (() => {
                    const userId = typeof window !== 'undefined' ? localStorage.getItem('admin-user-id') : null;
                    const isCompleted = selectedReminder.completions?.some((c: ReminderCompletion) => c.user_id === userId);
                    return isCompleted ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Already Done
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Done
                      </>
                    );
                  })()}
                </button>
              </div>
            </>
                )}
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-slate-600">Failed to load reminder details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Reminder Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">Create New Task Reminder</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmitCreate} className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-slate-900 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  placeholder="Enter task title"
                />
              </div>

              {/* Task Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-slate-900 mb-2">
                  Task Description
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition resize-none"
                  placeholder="Enter task description (optional)"
                />
              </div>

              {/* Reminder Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label htmlFor="reminderDate" className="block text-sm font-semibold text-slate-900 mb-2">
                    Reminder Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="reminderDate"
                      required
                      value={formData.reminderDate}
                      onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
                      className="w-full px-4 py-3 pl-11 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white shadow-sm hover:shadow-md"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    {formData.reminderDate && (
                      <div className="absolute right-12 top-1/2 -translate-y-1/2 pointer-events-none">
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                          {new Date(formData.reminderDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <label htmlFor="reminderTime" className="block text-sm font-semibold text-slate-900 mb-2">
                    Reminder Time <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      id="reminderTime"
                      required
                      value={formData.reminderTime}
                      onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                      className="w-full px-4 py-3 pl-11 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white shadow-sm hover:shadow-md"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    {formData.reminderTime && (
                      <div className="absolute right-12 top-1/2 -translate-y-1/2 pointer-events-none">
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                          {new Date(`2000-01-01T${formData.reminderTime}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Deadline */}
              <div className="relative">
                <label htmlFor="deadline" className="block text-sm font-semibold text-slate-900 mb-2">
                  Deadline (Optional)
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    id="deadline"
                    value={formData.deadline}
                    min={new Date().toISOString().slice(0, 16)}
                    onChange={(e) => {
                      const selectedDate = new Date(e.target.value);
                      const now = new Date();
                      if (selectedDate < now) {
                        alert('Deadline cannot be set before the current date and time');
                        return;
                      }
                      setFormData({ ...formData, deadline: e.target.value });
                    }}
                    className="w-full px-4 py-3 pl-11 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white shadow-sm hover:shadow-md"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  {formData.deadline && (
                    <div className="absolute right-12 top-1/2 -translate-y-1/2 pointer-events-none">
                      <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
                        {new Date(formData.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} {new Date(formData.deadline).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Deadline must be in the future
                </p>
              </div>

              {/* Priority */}
              <div>
                <label htmlFor="priority" className="block text-sm font-semibold text-slate-900 mb-2">
                  Priority
                </label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              {/* Project (Optional) */}
              <div>
                <label htmlFor="projectId" className="block text-sm font-semibold text-slate-900 mb-2">
                  Related Project (Optional)
                </label>
                <input
                  type="text"
                  id="projectId"
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  placeholder="Enter project ID (optional)"
                />
              </div>

              {/* Tag Users and Positions with @mentions */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Tag Users or Positions (Optional)
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Type @ to mention users or positions (e.g., @secretary, @username)
                </p>
                
                {/* Selected Tags Display */}
                {(formData.taggedUserIds.length > 0 || formData.taggedPositions.length > 0) && (
                  <div className="flex flex-wrap gap-2 mb-2 p-2 bg-slate-50 rounded-lg min-h-[40px]">
                    {formData.taggedPositions.map((pos) => (
                      <span
                        key={`pos-${pos}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium"
                      >
                        @{pos.toLowerCase().replace(/\s+/g, '')}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              taggedPositions: formData.taggedPositions.filter((p) => p !== pos),
                            });
                          }}
                          className="ml-1 hover:text-emerald-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {formData.taggedUserIds.map((userId) => {
                      const user = users.find((u) => u.id === userId);
                      if (!user) return null;
                      return (
                        <span
                          key={`user-${userId}`}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                        >
                          @{user.username}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                taggedUserIds: formData.taggedUserIds.filter((id) => id !== userId),
                              });
                            }}
                            className="ml-1 hover:text-blue-900"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Mention Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={mentionInput}
                    onChange={(e) => {
                      const value = e.target.value;
                      setMentionInput(value);
                      const cursorPos = e.target.selectionStart || 0;
                      setMentionCursorPosition(cursorPos);

                      // Check if we're typing a mention
                      const textBeforeCursor = value.substring(0, cursorPos);
                      const lastAtIndex = textBeforeCursor.lastIndexOf('@');
                      
                      if (lastAtIndex !== -1) {
                        const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
                        // Only show suggestions if there's no space after @
                        if (!textAfterAt.includes(' ') && !textAfterAt.includes(',')) {
                          const searchTerm = textAfterAt.toLowerCase();
                          const suggestions: any[] = [];
                          
                          // Add position suggestions
                          POSITION_OPTIONS.forEach((pos) => {
                            const posKey = pos.toLowerCase().replace(/\s+/g, '');
                            if (posKey.includes(searchTerm) && !formData.taggedPositions.includes(pos)) {
                              suggestions.push({ type: 'position', value: pos, key: posKey });
                            }
                          });
                          
                          // Add user suggestions
                          users.forEach((user) => {
                            const username = user.username.toLowerCase();
                            const fullName = (user.full_name || '').toLowerCase();
                            if (
                              (username.includes(searchTerm) || fullName.includes(searchTerm)) &&
                              !formData.taggedUserIds.includes(user.id)
                            ) {
                              suggestions.push({ type: 'user', value: user, key: username });
                            }
                          });
                          
                          setMentionSuggestions(suggestions);
                          setShowMentionSuggestions(suggestions.length > 0);
                        } else {
                          setShowMentionSuggestions(false);
                        }
                      } else {
                        setShowMentionSuggestions(false);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && showMentionSuggestions && mentionSuggestions.length > 0) {
                        e.preventDefault();
                        handleSelectMention(mentionSuggestions[0]);
                      } else if (e.key === 'Escape') {
                        setShowMentionSuggestions(false);
                      }
                    }}
                    onBlur={() => {
                      // Delay hiding suggestions to allow click
                      setTimeout(() => setShowMentionSuggestions(false), 200);
                    }}
                    className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    placeholder="Type @ to mention users or positions"
                  />
                  
                  {/* Mention Suggestions Dropdown */}
                  {showMentionSuggestions && mentionSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border-2 border-slate-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {mentionSuggestions.map((suggestion, index) => (
                        <button
                          key={`${suggestion.type}-${suggestion.key}`}
                          type="button"
                          onClick={() => handleSelectMention(suggestion)}
                          className="w-full text-left px-4 py-2 hover:bg-emerald-50 transition flex items-center gap-2"
                        >
                          {suggestion.type === 'position' ? (
                            <>
                              <span className="text-emerald-600 font-medium">@</span>
                              <span className="text-sm text-slate-900">{suggestion.value}</span>
                              <span className="ml-auto text-xs text-slate-500">Position</span>
                            </>
                          ) : (
                            <>
                              <span className="text-blue-600 font-medium">@</span>
                              <div className="flex-1">
                                <span className="text-sm text-slate-900 block">
                                  {suggestion.value.full_name || suggestion.value.username}
                                </span>
                                {suggestion.value.position && (
                                  <span className="text-xs text-slate-500">{suggestion.value.position}</span>
                                )}
                              </div>
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating...' : 'Create Reminder'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({
                      title: '',
                      description: '',
                      reminderDate: '',
                      reminderTime: '',
                      deadline: '',
                      priority: 'medium',
                      projectId: '',
                      taggedUserIds: [],
                      taggedPositions: [],
                    });
                    setMentionInput('');
                    setShowMentionSuggestions(false);
                  }}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

