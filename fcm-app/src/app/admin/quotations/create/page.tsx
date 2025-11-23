"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import { quotationsAPI } from "@/lib/api";
import { formatCurrency, calculateTotalFromItems, formatDateForPDF } from "@/lib/utils";

type QuotationItem = {
  description: string;
  price: string;
};

type QuotationData = {
  quotationNumber: string;
  date: string;
  validUntil: string;
  clientName: string;
  jobDescription: string;
  clientContact: string;
  installationAddress: string;
  attention: string;
  totalDue: string;
  terms: string[];
  items?: QuotationItem[];
};

const getNextQuotationNumber = async (): Promise<string> => {
  try {
    const quotations = await quotationsAPI.getAll();
    if (quotations.length === 0) return "1";

    let maxNumber = 0;
    quotations.forEach((q: any) => {
      // Extract numeric value from quotation number (handle formats like "1", "2", "300.42", etc.)
      const numStr = (q.quotationNumber || "").toString().replace(/[^0-9.]/g, "");
      if (numStr.includes(".")) {
        // If it has a decimal, use the whole number part
        const whole = parseInt(numStr.split(".")[0]) || 0;
        if (whole > maxNumber) maxNumber = whole;
      } else {
        // If it's a whole number, use it directly
        const num = parseInt(numStr) || 0;
        if (num > maxNumber) maxNumber = num;
      }
    });

    // Increment by 1
    return (maxNumber + 1).toString();
  } catch {
    return "1";
  }
};

export default function CreateQuotationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<QuotationData>({
    quotationNumber: "",
    date: new Date().toISOString().split("T")[0],
    validUntil: "",
    clientName: "",
    jobDescription: "",
    clientContact: "",
    installationAddress: "",
    attention: "",
    totalDue: "",
    terms: [
      "Customers will be billed after 30 days upon completion and turnover of work with 7 days warranty",
      "Please email the signed price quote to the address above.",
      "Any additional work shall be created with a new quotation.",
      "If there is any request for a contract bond or any expenses that are out of the price quotation, FCM trading and services will not be included in this quotation.",
    ],
    items: [
      { description: "", price: "" },
    ],
  });

  useEffect(() => {
    async function initializeForm() {
      const next = await getNextQuotationNumber();
      const today = new Date();
      const valid = new Date(today);
      valid.setDate(valid.getDate() + 30);

      setFormData((p) => {
        const initialItems = p.items || [{ description: "", price: "" }];
        const initialTotal = calculateTotalFromItems(initialItems);
        return {
          ...p,
          quotationNumber: next,
          validUntil: valid.toISOString().split("T")[0],
          totalDue: initialTotal,
        };
      });
    }
    initializeForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const name = e.target.name;
    const value = e.target.value;
    
    setFormData((p) => {
      const updated = {
        ...p,
        [name]: value,
      };
      
      // If date is changed, automatically set validUntil to one month later
      if (name === "date" && value) {
        const date = new Date(value);
        const validUntil = new Date(date);
        validUntil.setMonth(validUntil.getMonth() + 1);
        updated.validUntil = validUntil.toISOString().split("T")[0];
      }
      
      return updated;
    });
  };

  const handleTermChange = (index: number, value: string) => {
    const updated = [...formData.terms];
    updated[index] = value;
    setFormData((p) => ({ ...p, terms: updated }));
  };

  const handleItemChange = (index: number, field: "description" | "price", value: string) => {
    const updated = [...(formData.items || [])];
    if (!updated[index]) {
      updated[index] = { description: "", price: "" };
    }
    updated[index] = { ...updated[index], [field]: value };
    
    // Calculate total from all items
    const total = calculateTotalFromItems(updated);
    
    setFormData((p) => ({ ...p, items: updated, totalDue: total }));
  };
  
  const addItem = () => {
    const newItems = [...(formData.items || []), { description: "", price: "" }];
    const total = calculateTotalFromItems(newItems);
    setFormData((p) => ({
      ...p,
      items: newItems,
      totalDue: total,
    }));
  };

  const removeItem = (index: number) => {
    const updated = [...(formData.items || [])];
    updated.splice(index, 1);
    const finalItems = updated.length > 0 ? updated : [{ description: "", price: "" }];
    const total = calculateTotalFromItems(finalItems);
    setFormData((p) => ({ ...p, items: finalItems, totalDue: total }));
  };

  // ============================================================
  // OPTIMIZED PDF GENERATION - More compact layout
  // ============================================================
  const generatePDF = async () => {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const margin = 15;
    let y = margin;

    // LOGO - Smaller size
    try {
      const resp = await fetch("/images/fcmlogo.png");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.src = url;

      await new Promise((resolve) => {
        img.onload = () => {
          const w = 22;
          const h = (img.height / img.width) * w;
          doc.addImage(img, "PNG", (pw - w) / 2, y, w, h);
          y += h + 4;
          resolve(null);
        };
      });
    } catch {
      // ignore
    }

    // CONTACT INFO - No header text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("517-4428 / 516-2922 / 09239480967", pw / 2, y, { align: "center" });
    y += 4;
    doc.text("Simborio, Tayud, Lilo-an, Cebu, 6002", pw / 2, y, { align: "center" });
    y += 4;
    doc.text("fcmtradingservices@gmail.com", pw / 2, y, { align: "center" });
    y += 7;

    doc.setDrawColor(0, 128, 0);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pw - margin, y);
    y += 7; // Reduced spacing

    // DATE + NUMBER
    doc.setFontSize(11);
    doc.text(`DATE: ${formatDateForPDF(formData.date)}`, margin, y);
    doc.text(`#${formData.quotationNumber}`, pw - margin, y, { align: "right" });
    y += 5;
    doc.text(`Valid Until: ${formatDateForPDF(formData.validUntil)}`, margin, y);
    y += 8; // Reduced spacing

    // CLIENT INFO HEADER - More compact
    doc.setFillColor(0, 128, 0);
    doc.rect(margin, y - 4, pw - margin * 2, 6, "F"); // Reduced height
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text("CLIENT INFORMATION", pw / 2, y, { align: "center" });
    y += 9; // Reduced spacing

    // CLIENT DETAILS - More compact
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    const lh = 5.5; // Reduced line height

    // NAME
    doc.text("NAME: ", margin + 3, y);
    doc.setFont("helvetica", "bold");
    doc.text(formData.clientName, margin + 3 + doc.getTextWidth("NAME: "), y);
    doc.setFont("helvetica", "normal");
    y += lh;
    
    // JOB DESCRIPTION
    doc.text("JOB DESCRIPTION: ", margin + 3, y);
    doc.setFont("helvetica", "bold");
    doc.text(formData.jobDescription, margin + 3 + doc.getTextWidth("JOB DESCRIPTION: "), y);
    doc.setFont("helvetica", "normal");
    y += lh;
    
    // CONTACT
    doc.text("CONTACT: ", margin + 3, y);
    doc.setFont("helvetica", "bold");
    doc.text(formData.clientContact || "N/A", margin + 3 + doc.getTextWidth("CONTACT: "), y);
    doc.setFont("helvetica", "normal");
    y += lh;
    
    // INSTALLATION ADDRESS
    doc.text("INSTALLATION ADDRESS: ", margin + 3, y);
    doc.setFont("helvetica", "bold");
    doc.text(formData.installationAddress, margin + 3 + doc.getTextWidth("INSTALLATION ADDRESS: "), y);
    doc.setFont("helvetica", "normal");
    y += lh;
    
    // ATTENTION
    doc.text("ATTENTION: ", margin + 3, y);
    doc.setFont("helvetica", "bold");
    doc.text(formData.attention, margin + 3 + doc.getTextWidth("ATTENTION: "), y);
    doc.setFont("helvetica", "normal");
    y += 9; // Reduced spacing

    // DESCRIPTION HEADER
    doc.setFillColor(0, 128, 0);
    doc.rect(margin, y - 4, pw - margin * 2, 6, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text("DESCRIPTION", pw / 2, y, { align: "center" });
    y += 9;

    // DESCRIPTION - Show items from form
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    
    const validItems = (formData.items || []).filter(item => item.description || item.price);
    if (validItems.length > 0) {
      validItems.forEach((item, index) => {
        if (y > ph - 60) {
          doc.addPage();
          y = margin;
        }
        // Format: "• Item description          Price" or "1.) Item description          Price"
        const priceNum = parseFloat((item.price || "0").replace(/[^0-9.]/g, ""));
        const priceText = isNaN(priceNum) ? "Php 0" : `Php ${priceNum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const shouldNumber = validItems.length > 1;
        const itemText = shouldNumber ? `${index + 1}.) ${item.description || ""}` : `• ${item.description || ""}`;
        const priceX = pw - margin - 3;
        const descriptionWidth = priceX - margin - 3 - 20; // Leave space for bullet/number and price
        
        // Draw item bullet/number and description
        const lines = doc.splitTextToSize(itemText, descriptionWidth);
        let firstLineY = y;
        lines.forEach((l: string) => {
          doc.text(l, margin + 3, y);
          y += 4;
        });
        
        // Draw price aligned to the right on the first line
        doc.text(priceText, priceX, firstLineY, { align: "right" });
        y += 2;
      });
    }
    
    y += 3;
    doc.setFontSize(10);
    doc.text("******* NOTHING FOLLOWS *********", pw / 2, y, { align: "center" });
    y += 9;

    // TOTAL
    const totalFormatted = formatCurrency(formData.totalDue);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("TOTAL DUE", margin + 3, y);
    doc.text(totalFormatted, pw - margin - 3, y, { align: "right" });
    y += 9;

    y += 4;

    // Check if we need a new page for the proposal and signature
    if (y > ph - 70) {
      doc.addPage();
      y = margin;
    }

    // PROPOSAL PARAGRAPH with total
    const proposalText = `FCM Trading and Services proposes to furnish the items described and specified herein the above-mentioned buyers who accept and bind themselves to the specifications of the materials herein offered, terms and conditions of the proposal, for the sum of  ${totalFormatted}`;
    const proposalLines = doc.splitTextToSize(proposalText, pw - margin * 2 - 6);
    proposalLines.forEach((line: string) => {
      doc.text(line, margin + 3, y);
      y += 4;
    });
    y += 8;

    // ACCEPTANCE SIGNATURE
    doc.setFontSize(11);
    doc.text("Customer Acceptance (sign below):", margin + 3, y);
    y += 6;

    doc.setFontSize(10);
    doc.text("X", margin + 3, y);

    const sigLineStart = margin + 10;
    const sigLineEnd = pw - margin - 60;
    doc.line(sigLineStart, y, sigLineEnd, y);

    y += 2;  // Further reduced from 3 to 2

    // SIGNATURE image (draw first, above everything)
    let signatureHeight = 0;
    try {
      const resp = await fetch("/images/signature.png");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.src = url;

      await new Promise((resolve) => {
        img.onload = () => {
          const w = 55;
          const h = (img.height / img.width) * w;
          signatureHeight = h;
          const x = (pw - w) / 2;
          doc.addImage(img, "PNG", x, y, w, h);
          URL.revokeObjectURL(url);
          resolve(null);
        };
      });
    } catch {
      // ignore if signature not found
    }

    // Position CONFIRMED text below signature - extremely close
    y += signatureHeight + 0.5;  // Reduced from 1 to 0.5 for very close spacing

    // SIGNATURE NAME
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("CONFIRMED : FLORENTINO MANA-AY JR.", pw / 2, y, { align: "center" });

    // FOOTER - minimal spacing
    y += 5;  // Further reduced from 6 to 5
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("If you have any questions about this sales quotation, please contact", pw / 2, y, { align: "center" });
    y += 5;  // Further reduced from 4 to 3.5
    doc.text("Mr. Florentino Mana-ay Jr - 09239480967", pw / 2, y, { align: "center" });
    
    doc.setFont("helvetica", "italic");
    doc.setFontSize(12);
    y += 6;  // Reduced from 7 to 6
    doc.setFont("helvetica", "bolditalic");
    doc.text("Thank you for your business!", pw / 2, y, { align: "center" });

    // SAVE
    doc.save(`quotation-${formData.quotationNumber}.pdf`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Filter out empty items before saving
      const itemsToSave = (formData.items || []).filter(item => item && (item.description || item.price));
      
      // Get current user from localStorage (default to "Admin")
      const currentUser = typeof window !== 'undefined' 
        ? (localStorage.getItem('admin-username') || 'Admin')
        : 'Admin';
      
      const dataToSave = {
        ...formData,
        items: itemsToSave.length > 0 ? itemsToSave : null,
        createdBy: currentUser,
      };
      
      await quotationsAPI.create(dataToSave);
      router.push("/admin/quotations");
    } catch (error) {
      console.error("Error creating quotation:", error);
      alert("Failed to create quotation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-6 lg:py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/admin/quotations" className="rounded-md border-2 border-slate-400 p-2.5 text-slate-800 hover:border-slate-500 transition flex items-center justify-center bg-white shadow-sm" aria-label="Go back">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Create Quotation</h1>
              <p className="text-sm text-slate-600 mt-1">Fill in the quotation details</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="quotationNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                  Quotation Number * 
                  <span className="text-xs font-normal text-gray-500 ml-1">(Auto-generated from last quotation)</span>
                </label>
                <input 
                  type="text" 
                  id="quotationNumber" 
                  name="quotationNumber" 
                  value={formData.quotationNumber} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900 bg-emerald-50/30" 
                  placeholder="Auto-generated"
                />
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
                <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900" />
              </div>

              <div>
                <label htmlFor="validUntil" className="block text-sm font-semibold text-gray-700 mb-2">Valid Until *</label>
                <input type="date" id="validUntil" name="validUntil" value={formData.validUntil} onChange={handleChange} required className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900" />
              </div>

              <div>
                <label htmlFor="totalDue" className="block text-sm font-semibold text-gray-700 mb-2">
                  Total Due * 
                  <span className="text-xs font-normal text-gray-500 ml-1">(Auto-calculated from items)</span>
                </label>
                <input 
                  type="text" 
                  id="totalDue" 
                  name="totalDue" 
                  value={formData.totalDue} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900 placeholder:text-gray-400 bg-emerald-50/30 cursor-not-allowed" 
                  placeholder="e.g., Php 26,000.00"
                  readOnly
                />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Client Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="clientName" className="block text-sm font-semibold text-gray-700 mb-2">Client Name *</label>
                  <input type="text" id="clientName" name="clientName" value={formData.clientName} onChange={handleChange} required className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900 placeholder:text-gray-400" placeholder="e.g., Jollibee Car car branch" />
                </div>

                <div>
                  <label htmlFor="clientContact" className="block text-sm font-semibold text-gray-700 mb-2">Contact Number</label>
                  <input type="tel" id="clientContact" name="clientContact" value={formData.clientContact} onChange={handleChange} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900 placeholder:text-gray-400" placeholder="e.g., +63 912 345 6789" />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="jobDescription" className="block text-sm font-semibold text-gray-700 mb-2">Job Description *</label>
                  <input type="text" id="jobDescription" name="jobDescription" value={formData.jobDescription} onChange={handleChange} required className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900 placeholder:text-gray-400" placeholder="e.g., Repairing back wall using hardiflex, wall angle and repainting" />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="installationAddress" className="block text-sm font-semibold text-gray-700 mb-2">Installation Address *</label>
                  <input type="text" id="installationAddress" name="installationAddress" value={formData.installationAddress} onChange={handleChange} required className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900 placeholder:text-gray-400" placeholder="e.g., Jollibee Car car" />
                </div>

                <div>
                  <label htmlFor="attention" className="block text-sm font-semibold text-gray-700 mb-2">Attention *</label>
                  <input type="text" id="attention" name="attention" value={formData.attention} onChange={handleChange} required className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900 placeholder:text-gray-400" placeholder="e.g., Sir Athan" />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Description</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add Item
                </button>
              </div>
              <div className="space-y-4">
                {(formData.items || []).map((item, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4 relative">
                    {(formData.items || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="absolute top-4 right-4 text-red-600 hover:text-red-800 transition"
                        aria-label="Remove item"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Item {index + 1} *</label>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, "description", e.target.value)}
                          required
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900 placeholder:text-gray-400"
                          placeholder="e.g., Repainting of wall"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Price *</label>
                        <input
                          type="text"
                          value={item.price}
                          onChange={(e) => handleItemChange(index, "price", e.target.value)}
                          required
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900 placeholder:text-gray-400"
                          placeholder="e.g., Php 2,000.00"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Link href="/admin/quotations" className="rounded-md border border-slate-300 px-6 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition">Cancel</Link>
              <button type="submit" disabled={loading} className="rounded-md bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed">{loading ? "Saving..." : "Save Quotation"}</button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}