"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import jsPDF from "jspdf";
import { quotationsAPI } from "@/lib/api";
import { formatCurrency, calculateTotalFromItems, formatDateForPDF, formatDate } from "@/lib/utils";
import { getTermsTemplate, type TermsTemplate } from "@/lib/terms-templates";

type QuotationItem = {
  description: string;
  price: string;
};

type Quotation = {
  id: string;
  quotationNumber: string;
  date: string;
  validUntil: string;
  clientName: string;
  jobDescription: string;
  clientContact: string;
  installationAddress: string;
  attention: string;
  totalDue: string;
  terms?: string[];
  termsTemplate?: TermsTemplate;
  items?: QuotationItem[];
  status?: string;
  createdAt: number;
  updatedAt?: number;
  lastEditedBy?: string;
  createdBy?: string;
};

export default function ViewQuotationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const quotationId = params?.id ? decodeURIComponent(params.id) : "";
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: string;
  } | null>(null);

  useEffect(() => {
    if (!quotationId) {
      setLoading(false);
      return;
    }

    async function loadQuotation() {
      setLoading(true);
      try {
        const data = await quotationsAPI.getById(quotationId);
        
        if (data && (data.id || data.quotationNumber || data.quotation_number)) {
          setQuotation(data);
        } else {
          if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('quotations');
            if (stored) {
              try {
                const quotations = JSON.parse(stored);
                const found = quotations.find((q: any) => {
                  const qId = String(q.id || '').toLowerCase().trim();
                  const searchId = String(quotationId || '').toLowerCase().trim();
                  return qId === searchId || qId.includes(searchId) || searchId.includes(qId);
                });
                if (found) {
                  setQuotation(found);
                  setLoading(false);
                  return;
                }
              } catch (e) {
                // Handle localStorage parse errors
              }
            }
          }
          
          try {
            const allQuotations = await quotationsAPI.getAll();
            const found = allQuotations.find((q: any) => {
              const qId = String(q.id || '').toLowerCase().trim();
              const searchId = String(quotationId || '').toLowerCase().trim();
              return qId === searchId;
            });
            if (found) {
              setQuotation(found);
              setLoading(false);
              return;
            }
          } catch (e) {
            // Handle fetch errors
          }
          
          setQuotation(null);
        }
      } catch (e) {
        setQuotation(null);
      } finally {
        setLoading(false);
      }
    }
    loadQuotation();
  }, [quotationId]);


  const generatePDF = async () => {
    if (!quotation) return;
    
    setPdfLoading(true);
    try {
      const doc = new jsPDF();
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();
      const margin = 10;
      let y = 10;
      try {
        const resp = await fetch("/images/fcmlogo.png");
        if (!resp.ok) throw new Error("Logo not found");
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = url;

        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            URL.revokeObjectURL(url);
            reject(new Error("Logo load timeout"));
          }, 5000);

          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                throw new Error("Canvas context not available");
              }
              
              const maxWidth = 100;
              const maxHeight = 100;
              let width = img.width;
              let height = img.height;
              if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = width * ratio;
                height = height * ratio;
              }
              
              canvas.width = width;
              canvas.height = height;
              ctx.drawImage(img, 0, 0, width, height);
              
              // Convert to PNG (original format)
              const dataUrl = canvas.toDataURL('image/png');
              
              if (dataUrl && dataUrl !== 'data:,') {
                const w = 22;
                const h = (height / width) * w;
                doc.addImage(dataUrl, "PNG", (pw - w) / 2, y, w, h);
                y += h + 4;
              }
              URL.revokeObjectURL(url);
              clearTimeout(timeout);
              resolve(null);
            } catch (err) {
              URL.revokeObjectURL(url);
              clearTimeout(timeout);
              reject(err);
            }
          };
          
          img.onerror = () => {
            URL.revokeObjectURL(url);
            clearTimeout(timeout);
            resolve(null);
          };
        });
      } catch {
        // Logo not found
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text("+639678339448 / 516-2922 / 09239480967", pw / 2, y, { align: "center" });
      y += 4;
      doc.text("Simborio, Tayud, Lilo-an, Cebu, 6002", pw / 2, y, { align: "center" });
      y += 4;
      doc.text("fcmtradingservices@gmail.com", pw / 2, y, { align: "center" });
      y += 7;

      doc.setDrawColor(0, 128, 0);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pw - margin, y);
      y += 7;

      doc.setFontSize(11);
      const formatDateNoTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      };
      const dateText = `DATE: ${formatDateNoTime(quotation.date)}`;
      const validUntilText = `Valid Until: ${formatDateNoTime(quotation.validUntil)}`;
      doc.text(dateText, margin + 5, y);
      const dateTextWidth = doc.getTextWidth(dateText);
      doc.text(validUntilText, margin + 5 + dateTextWidth + 20, y);
      doc.text(`#${quotation.quotationNumber}`, pw - margin, y, { align: "right" });
      y += 8;

      doc.setFillColor(0, 128, 0);
      doc.rect(margin, y - 4, pw - margin * 2, 6, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("CLIENT INFORMATION", pw / 2, y, { align: "center" });
      y += 9;

      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const lh = 5.5;
      
      doc.text("NAME: ", margin + 5, y);
      doc.setFont("helvetica", "bold");
      doc.text(quotation.clientName, margin + 5 + doc.getTextWidth("NAME: "), y);
      doc.setFont("helvetica", "normal");
      y += lh;
      
      doc.text("JOB DESCRIPTION: ", margin + 5, y);
      doc.setFont("helvetica", "bold");
      doc.text(quotation.jobDescription, margin + 5 + doc.getTextWidth("JOB DESCRIPTION: "), y);
      doc.setFont("helvetica", "normal");
      y += lh;
      
      doc.text("CONTACT: ", margin + 5, y);
      doc.setFont("helvetica", "bold");
      doc.text(quotation.clientContact || "N/A", margin + 5 + doc.getTextWidth("CONTACT: "), y);
      doc.setFont("helvetica", "normal");
      y += lh;
      
      doc.text("INSTALLATION ADDRESS: ", margin + 5, y);
      doc.setFont("helvetica", "bold");
      doc.text(quotation.installationAddress, margin + 5 + doc.getTextWidth("INSTALLATION ADDRESS: "), y);
      doc.setFont("helvetica", "normal");
      y += lh;
      
      doc.text("ATTENTION: ", margin + 5, y);
      doc.setFont("helvetica", "bold");
      doc.text(quotation.attention, margin + 5 + doc.getTextWidth("ATTENTION: "), y);
      doc.setFont("helvetica", "normal");
      y += 9;

      doc.setFillColor(0, 128, 0);
      doc.rect(margin, y - 4, pw - margin * 2, 6, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("SCOPE OF WORK", pw / 2, y, { align: "center" });
      y += 9;

      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      
      const validItems = (quotation.items || []).filter(item => item.description || item.price);
      if (validItems.length > 0) {
        validItems.forEach((item, index) => {
          if (y > ph - 60) {
            doc.addPage();
            y = margin;
          }
          const priceNum = parseFloat((item.price || "0").replace(/[^0-9.]/g, ""));
          const priceText = isNaN(priceNum) ? "Php 0" : `Php ${priceNum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          const shouldNumber = validItems.length > 1;
          const itemText = shouldNumber ? `${index + 1}.) ${item.description || ""}` : `• ${item.description || ""}`;
          
          // Calculate actual price width and reserve space for it
          const priceWidth = doc.getTextWidth(priceText);
          const priceX = pw - margin - 5;
          const pricePadding = 10; // Space between description and price
          const descriptionWidth = priceX - margin - 5 - priceWidth - pricePadding;
          
          // Split description into lines that fit within the available width
          const lines = doc.splitTextToSize(itemText, Math.max(descriptionWidth, 50)); // Minimum 50 units width
          let firstLineY = y;
          
          // Draw description lines
          lines.forEach((l: string) => {
            doc.text(l, margin + 5, y);
            y += 4;
          });
          
          // Draw price aligned to the right on the first line
          doc.text(priceText, priceX, firstLineY, { align: "right" });
          y += 2;
        });
      }
      
      y += 2;
      doc.setFontSize(10);
      doc.text("******* NOTHING FOLLOWS *********", pw / 2, y, { align: "center" });
      y += 6;

      const calculatedTotal = validItems.length > 0 && validItems.some(item => item.price && item.price.toString().trim() !== "")
        ? calculateTotalFromItems(validItems)
        : quotation.totalDue;
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("TOTAL DUE", margin + 5, y);
      doc.text(formatCurrency(calculatedTotal), pw - margin - 5, y, { align: "right" });
      y += 7;

      doc.setFillColor(0, 128, 0);
      doc.rect(margin, y - 4, pw - margin * 2, 6, "F");
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.text("TERMS AND CONDITIONS", pw / 2, y, { align: "center" });
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      
      const calculatedTotalForProposal = validItems.length > 0 && validItems.some(item => item.price && item.price.toString().trim() !== "")
        ? calculateTotalFromItems(validItems)
        : quotation.totalDue;
      const totalFormatted = formatCurrency(calculatedTotalForProposal);
      
      // Get terms based on template - always use template to ensure consistency
      const template = quotation.termsTemplate || 'template1';
      const templateData = getTermsTemplate(template, totalFormatted);
      const termsToUse = templateData.terms; // Always use terms from template
      
      // Display terms
      termsToUse.forEach((t, i) => {
        const lines = doc.splitTextToSize(`${i + 1}. ${t}`, pw - margin * 2 - 10);
        lines.forEach((l: string) => {
          doc.text(l, margin + 5, y);
          y += 3.5;
        });
        y += 1.5;
      });

      y += 3;

      // Display proposal text based on template
      if (template === 'template2' && templateData.proposalText) {
        // Template 2 has custom proposal text - need to insert total in the middle
        const proposalStart = templateData.proposalText;
        const proposalEnd = ".";
        
        const proposalStartLines = doc.splitTextToSize(proposalStart, pw - margin * 2 - 10);
        proposalStartLines.forEach((line: string, index: number) => {
          doc.text(line, margin + 5, y);
          if (index < proposalStartLines.length - 1) {
            y += 4;
          }
        });

        const lastLineWidth = doc.getTextWidth(proposalStartLines[proposalStartLines.length - 1] || "");
        const maxWidth = pw - margin * 2 - 10;
        const boldTextWidth = doc.getTextWidth(totalFormatted);
        if (lastLineWidth + boldTextWidth <= maxWidth) {
          doc.setFont("helvetica", "bold");
          doc.text(totalFormatted, margin + 5 + lastLineWidth, y);
          doc.setFont("helvetica", "normal");
          doc.text(proposalEnd, margin + 5 + lastLineWidth + boldTextWidth, y);
          y += 4;
        } else {
          y += 4;
          doc.setFont("helvetica", "bold");
          doc.text(totalFormatted, margin + 5, y);
          doc.setFont("helvetica", "normal");
          const endWidth = doc.getTextWidth(totalFormatted);
          doc.text(proposalEnd, margin + 5 + endWidth, y);
          y += 4;
        }
      } else {
        // Template 1 - standard proposal
        const proposalStart = "FCM Trading and Services proposes to furnish the items described and specified herein the above-mentioned buyers who accept and bind themselves to the specifications of the materials herein offered, terms and conditions of the proposal, for the sum of  ";
        const proposalEnd = ".";

        const proposalStartLines = doc.splitTextToSize(proposalStart, pw - margin * 2 - 10);
        proposalStartLines.forEach((line: string, index: number) => {
          doc.text(line, margin + 5, y);
          if (index < proposalStartLines.length - 1) {
            y += 4;
          }
        });

        const lastLineWidth = doc.getTextWidth(proposalStartLines[proposalStartLines.length - 1] || "");
        const maxWidth = pw - margin * 2 - 10;
        const boldTextWidth = doc.getTextWidth(totalFormatted);
        if (lastLineWidth + boldTextWidth <= maxWidth) {
          doc.setFont("helvetica", "bold");
          doc.text(totalFormatted, margin + 5 + lastLineWidth, y);
          doc.setFont("helvetica", "normal");
          doc.text(proposalEnd, margin + 5 + lastLineWidth + boldTextWidth, y);
          y += 4;
        } else {
          y += 4;
          doc.setFont("helvetica", "bold");
          doc.text(totalFormatted, margin + 5, y);
          doc.setFont("helvetica", "normal");
          const endWidth = doc.getTextWidth(totalFormatted);
          doc.text(proposalEnd, margin + 5 + endWidth, y);
          y += 4;
        }
      }
      y += 5;

      doc.setFontSize(11);
      doc.text("Customer Acceptance (sign below):", margin + 5, y);
      y += 5;
      doc.setFontSize(10);
      doc.text("X", margin + 5, y);

      const xStart = margin + 12;
      const xEnd = pw - margin - 10;
      doc.line(xStart, y, xEnd, y);

      y += 2;

      // SIGNATURE image - Compressed
      let signatureHeight = 0;
      try {
        const resp = await fetch("/images/signature.png");
        if (!resp.ok) throw new Error("Signature not found");
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = url;

        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            URL.revokeObjectURL(url);
            reject(new Error("Signature load timeout"));
          }, 5000);

          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                throw new Error("Canvas context not available");
              }
              
              const maxWidth = 200;
              const maxHeight = 200;
              let width = img.width;
              let height = img.height;
              
              if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = width * ratio;
                height = height * ratio;
              }
              
              canvas.width = width;
              canvas.height = height;
              ctx.drawImage(img, 0, 0, width, height);
              
              const dataUrl = canvas.toDataURL('image/png');
              
              if (dataUrl && dataUrl !== 'data:,') {
                const w = 55;
                const h = (height / width) * w;
                signatureHeight = h;
                const sigX = (pw - w) / 2;
                doc.addImage(dataUrl, "PNG", sigX, y, w, h);
              }
              URL.revokeObjectURL(url);
              clearTimeout(timeout);
              resolve(null);
            } catch (err) {
              URL.revokeObjectURL(url);
              clearTimeout(timeout);
              reject(err);
            }
          };
          
          img.onerror = () => {
            URL.revokeObjectURL(url);
            clearTimeout(timeout);
            resolve(null);
          };
        });
      } catch {
        // Signature not found
      }

      y += signatureHeight + 0.5;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("CONFIRMED : FLORENTINO MANA-AY JR.", pw / 2, y, { align: "center" });

      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("If you have any questions about this sales quotation, please contact", pw / 2, y, { align: "center" });
      y += 4;
      doc.text("Mr. Florentino Mana-ay Jr - 09239480967", pw / 2, y, { align: "center" });
      y += 5;
      doc.setFont("helvetica", "bolditalic");
      doc.setFontSize(11);
      doc.text("Thank you for your Business!", pw / 2, y, { align: "center" });

      const sanitizeFilename = (str: string) => str.replace(/[<>:"/\\|?*]/g, '-').trim();
      const filename = `${sanitizeFilename(quotation.quotationNumber)} ${sanitizeFilename(quotation.clientName)} - ${sanitizeFilename(quotation.jobDescription)} (Final Quotation).pdf`;
      doc.save(filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDelete = () => {
    if (!quotation) return;
    
    setConfirmModalData({
      title: 'Delete Quotation',
      message: `Are you sure you want to delete quotation #${quotation.quotationNumber}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmColor: 'bg-red-600 hover:bg-red-700',
      onConfirm: async () => {
        setShowConfirmModal(false);
        setDeleting(true);
        try {
          const success = await quotationsAPI.delete(quotationId);
          if (success) {
            router.push("/admin/quotations");
          } else {
            setConfirmModalData({
              title: 'Error',
              message: 'Failed to delete quotation. Please try again.',
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
          console.error("Error deleting quotation:", error);
          setConfirmModalData({
            title: 'Error',
            message: 'Failed to delete quotation. Please try again.',
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

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-6 lg:py-10">
          <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
              <p className="text-slate-600 text-lg">Loading quotation details...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!quotation) {
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
                Quotation Not Found
              </h3>
              <p className="text-slate-600 mb-2">
                The quotation you're looking for doesn't exist or may have been deleted.
              </p>
              <p className="text-sm text-slate-500 mb-8">
                Quotation ID: <span className="font-mono bg-slate-100 px-2 py-1 rounded">{quotationId}</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/admin/quotations"
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
                  Back to Quotations
                </Link>
                <Link
                  href="/admin/quotations/create"
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
                  Create New Quotation
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
        <div className="grid grid-cols-1 gap-6 items-start">
          {/* Main content */}
          <div className="w-full">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    router.push("/admin/quotations");
                  }}
                  className="rounded-md border-2 border-slate-400 p-2.5 text-slate-800 hover:border-slate-500 transition flex items-center justify-center bg-white shadow-sm"
                  aria-label="Go back"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Quotation #{quotation.quotationNumber}</h1>
                  <p className="text-sm text-slate-600">View quotation details</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
            <Link 
              href={`/admin/quotations/${encodeURIComponent(quotationId)}/edit`} 
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Link>
            <button 
              onClick={generatePDF} 
              disabled={pdfLoading || deleting || loading}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {pdfLoading ? "Generating..." : "Download PDF"}
            </button>
            <button 
              onClick={handleDelete} 
              disabled={deleting || pdfLoading || loading}
              className="inline-flex items-center gap-2 rounded-md bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                {/* Last Edited on the left side */}
                {(quotation.updatedAt || quotation.lastEditedBy) && (
                  <div>
                    <p className="text-xs text-slate-500">
                      Last edited: {quotation.updatedAt ? formatDate(quotation.updatedAt) : 'N/A'}
                    </p>
                    <p className="text-xs text-slate-500">
                      by {quotation.lastEditedBy || 'Admin'}
                    </p>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">#{quotation.quotationNumber}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Date:</span>
              <span className="ml-2 font-medium text-slate-900">{quotation.date}</span>
            </div>
            <div>
              <span className="text-slate-500">Valid Until:</span>
              <span className="ml-2 font-medium text-slate-900">{quotation.validUntil}</span>
            </div>
            <div>
              <span className="text-slate-500">Status:</span>
              <span className="ml-2">
                {(() => {
                  const status = quotation.status || 'Draft';
                  const statusColors: { [key: string]: string } = {
                    'Draft': 'bg-slate-100 text-slate-700',
                    'For Review': 'bg-yellow-100 text-yellow-700',
                    'Email Sent': 'bg-blue-100 text-blue-700',
                    'Sent': 'bg-blue-100 text-blue-700',
                    'Approved': 'bg-green-100 text-green-700',
                    'Rejected': 'bg-red-100 text-red-700',
                    'Work In Progress': 'bg-cyan-100 text-cyan-700',
                    'Completed': 'bg-purple-100 text-purple-700',
                    'For Billing': 'bg-orange-100 text-orange-700',
                  };
                  const colorClass = statusColors[status] || statusColors['Draft'];
                  return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
                      {status}
                    </span>
                  );
                })()}
              </span>
            </div>
          </div>


          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-emerald-900 mb-3">CLIENT INFORMATION</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex">
                <dt className="w-32 text-slate-600">Name:</dt>
                <dd className="flex-1 font-medium text-slate-900">{quotation.clientName}</dd>
              </div>
              <div className="flex">
                <dt className="w-32 text-slate-600">Job Description:</dt>
                <dd className="flex-1 text-slate-900">{quotation.jobDescription}</dd>
              </div>
              <div className="flex">
                <dt className="w-32 text-slate-600">Contact Number:</dt>
                <dd className="flex-1 text-slate-900">{quotation.clientContact || "N/A"}</dd>
              </div>
              <div className="flex">
                <dt className="w-32 text-slate-600">Installation Address:</dt>
                <dd className="flex-1 text-slate-900">{quotation.installationAddress}</dd>
              </div>
              <div className="flex">
                <dt className="w-32 text-slate-600">Attention:</dt>
                <dd className="flex-1 text-slate-900">{quotation.attention}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-emerald-900 mb-3">SCOPE OF WORK</h3>
            
            {/* Items with prices - show first, using bullets */}
            {quotation.items && Array.isArray(quotation.items) && quotation.items.length > 0 && quotation.items.some((item: any) => item && (item.description || item.price)) ? (
              <div className="space-y-2 mb-4">
                {quotation.items
                  .filter((item: any) => item && (item.description || item.price))
                  .map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <p className="text-sm text-slate-900">
                        • {item.description || "N/A"}
                      </p>
                      <p className="text-sm font-semibold text-slate-900 ml-4 whitespace-nowrap">
                        {item.price ? formatCurrency(item.price) : "N/A"}
                      </p>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 mb-4">No description items added.</p>
            )}
            
            <p className="text-xs text-slate-500 mb-4">******** NOTHING FOLLOWS ********</p>
            
            <div className="mt-4 text-right">
              <p className="text-sm font-semibold text-slate-900">
                TOTAL DUE: <span className="text-red-600">
                  {quotation.items && Array.isArray(quotation.items) && quotation.items.some((item: any) => item && item.price && item.price.toString().trim() !== "") 
                    ? calculateTotalFromItems(quotation.items)
                    : formatCurrency(quotation.totalDue)}
                </span>
              </p>
            </div>
          </div>

          {/* Terms Template Preview */}
          <div className="rounded-lg bg-white border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Terms and Conditions Template
            </h3>
            <div className="mb-3">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                {(quotation.termsTemplate || 'template1') === 'template1' ? 'Template 1 - Loan Terms' : 'Template 2 - Downpayment Terms'}
              </span>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Preview:</h4>
              <div className="space-y-2">
                {getTermsTemplate(quotation.termsTemplate || 'template1', formatCurrency(quotation.totalDue)).terms.map((term: string, index: number) => (
                  <p key={index} className="text-sm text-slate-700">
                    <span className="font-semibold">{index + 1}.</span> {term}
                  </p>
                ))}
                {(quotation.termsTemplate || 'template1') === 'template2' && (
                  <div className="mt-3 pt-3 border-t border-slate-300">
                    <p className="text-sm text-slate-700 italic">
                      FCM Trading and Services proposes to furnish the items described and specified herein the above-mentioned buyers who accept and bind themselves to the specifications of the materials herein offered, terms and conditions of the proposal, for the sum of <span className="font-bold">{formatCurrency(quotation.totalDue)}</span>.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        </div>
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