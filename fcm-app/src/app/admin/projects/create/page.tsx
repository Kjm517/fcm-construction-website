'use client';

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { projectsAPI } from "@/lib/api";

export default function CreateProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [formData, setFormData] = useState({
    projectName: "",
    clientName: "",
    clientContact: "",
    buildingAddress: "",
    workType: "",
    scopeOfWork: "",
    projectCost: "",
    deadlineDate: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadingFiles(true);
      const newFiles = Array.from(e.target.files);
      
      // Validate file sizes (25MB max)
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];
      
      newFiles.forEach((file) => {
        if (file.size > 25 * 1024 * 1024) {
          invalidFiles.push(file.name);
        } else {
          validFiles.push(file);
        }
      });
      
      if (invalidFiles.length > 0) {
        alert(`The following files exceed 25MB and were not added:\n${invalidFiles.join('\n')}`);
      }
      
      if (validFiles.length > 0) {
        setFiles((prev) => [...prev, ...validFiles]);
        
        // Create previews for images and PDFs
        const previewPromises = validFiles.map((file) => {
          return new Promise<string>((resolve) => {
            if (file.type.startsWith("image/")) {
              const reader = new FileReader();
              reader.onloadend = () => {
                resolve(reader.result as string);
              };
              reader.onerror = () => resolve("");
              reader.readAsDataURL(file);
            } else if (file.type === "application/pdf") {
              // For PDFs, we'll show a PDF icon
              resolve("pdf");
            } else {
              // For other files, show a document icon
              resolve("document");
            }
          });
        });
        
        const previews = await Promise.all(previewPromises);
        setFilePreviews((prev) => [...prev, ...previews]);
      }
      
      setUploadingFiles(false);
      // Reset the input so the same file can be selected again
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const convertFilesToBase64 = async (files: File[]): Promise<Array<{ name: string; data: string; type: string }>> => {
    const filePromises = files.map((file) => {
      return new Promise<{ name: string; data: string; type: string }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            name: file.name,
            data: reader.result as string,
            type: file.type,
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });
    return Promise.all(filePromises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert files to base64
      let filesData = null;
      if (files.length > 0) {
        setUploadingFiles(true);
        filesData = await convertFilesToBase64(files);
        setUploadingFiles(false);
      }
      
      const newProject = {
        ...formData,
        files: filesData,
      };
      await projectsAPI.create(newProject);
      router.push("/admin/projects");
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Failed to create project. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-6 lg:py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/projects"
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
                Create New Project
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Fill in the project details to create a new project.
              </p>
            </div>
          </div>
          <div></div>
        </div>

        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="projectName"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Project Name *
                </label>
                <input
                  type="text"
                  id="projectName"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900 placeholder:text-gray-400"
                  placeholder="e.g., Commercial Building Renovation"
                />
              </div>

              <div>
                <label
                  htmlFor="clientName"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Client Name *
                </label>
                <input
                  type="text"
                  id="clientName"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900 placeholder:text-gray-400"
                  placeholder="e.g., Juan Dela Cruz"
                />
              </div>

              <div>
                <label
                  htmlFor="clientContact"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Client Contact *
                </label>
                <input
                  type="tel"
                  id="clientContact"
                  name="clientContact"
                  value={formData.clientContact}
                  onChange={handleChange}
                  required
                  pattern="^(\+63|0)?[0-9]{10}$"
                  maxLength={13}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900 placeholder:text-gray-400"
                  placeholder="+63 912 345 6789"
                />
              </div>

              <div>
                <label
                  htmlFor="workType"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Work Type *
                </label>
                <select
                  id="workType"
                  name="workType"
                  value={formData.workType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white text-gray-900 cursor-pointer"
                >
                  <option value="">Select work type</option>
                  <option value="Commercial Construction">Commercial Construction</option>
                  <option value="Residential Construction">Residential Construction</option>
                  <option value="Renovation">Renovation</option>
                  <option value="Design & Planning">Design & Planning</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="buildingAddress"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Building Address *
                </label>
                <input
                  type="text"
                  id="buildingAddress"
                  name="buildingAddress"
                  value={formData.buildingAddress}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900 placeholder:text-gray-400"
                  placeholder="e.g., Cebu City, Philippines"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="scopeOfWork"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Scope of Work *
                </label>
                <textarea
                  id="scopeOfWork"
                  name="scopeOfWork"
                  value={formData.scopeOfWork}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition resize-none text-gray-900 placeholder:text-gray-400"
                  placeholder="Describe the scope of work for this project..."
                />
              </div>

              <div>
                <label
                  htmlFor="projectCost"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Project Cost *
                </label>
                <input
                  type="text"
                  id="projectCost"
                  name="projectCost"
                  value={formData.projectCost}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900 placeholder:text-gray-400"
                  placeholder="e.g., ₱2,500,000"
                />
              </div>

              <div>
                <label
                  htmlFor="deadlineDate"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Deadline Date *
                </label>
                <input
                  type="date"
                  id="deadlineDate"
                  name="deadlineDate"
                  value={formData.deadlineDate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="files"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Files / Images (Optional)
                </label>
                <input
                  type="file"
                  id="files"
                  name="files"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.csv"
                  onChange={handleFileChange}
                  disabled={uploadingFiles}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can upload images, PDFs, or documents. Maximum file size: 25MB per file.
                </p>
                {uploadingFiles && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-emerald-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                    <span>Processing files...</span>
                  </div>
                )}
                
                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-gray-700">Uploaded Files:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className="relative border border-gray-200 rounded-lg p-2 bg-gray-50"
                        >
                          {file.type.startsWith("image/") && filePreviews[index] && filePreviews[index] !== "pdf" && filePreviews[index] !== "document" ? (
                            <div className="relative">
                              <img
                                src={filePreviews[index]}
                                alt={file.name}
                                className="w-full h-24 object-cover rounded"
                              />
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                                aria-label="Remove file"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={2}
                                  stroke="currentColor"
                                  className="w-4 h-4"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <div className="relative">
                              <div className="w-full h-24 bg-gray-200 rounded flex items-center justify-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                  className="w-8 h-8 text-gray-400"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                                aria-label="Remove file"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={2}
                                  stroke="currentColor"
                                  className="w-4 h-4"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          )}
                          <p className="text-xs text-gray-600 mt-1 truncate" title={file.name}>
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Link
                href="/admin/projects"
                className="rounded-md border border-slate-300 px-6 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Project"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

