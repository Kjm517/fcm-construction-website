'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import jsPDF from "jspdf";
import { quotationsAPI } from "@/lib/api";
import { formatCurrency, calculateTotalFromItems, formatDateForPDF, capitalizeFirstLetters } from "@/lib/utils";
import { getCurrentUserDisplayName } from "@/lib/auth";
import { getTermsTemplate, type TermsTemplate } from "@/lib/terms-templates";

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
  termsTemplate?: TermsTemplate;
  items?: QuotationItem[];
};

type Quotation = {
  id: string;
  quotationNumber: string;
  date: string;
  validUntil: string;
  clientName: string;
  jobDescription: string;
  clientContact?: string;
  installationAddress: string;
  attention: string;
  totalDue: string;
  terms?: string[];
  termsTemplate?: TermsTemplate;
  items?: QuotationItem[];
  createdAt: number;
  updatedAt?: number;
  lastEditedBy?: string;
};

export default function EditQuotationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const quotationId = params?.id ?? "";
  const [loading, setLoading] = useState(false);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [formData, setFormData] = useState<QuotationData>({
    quotationNumber: "",
    date: "",
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
    termsTemplate: 'template1',
    items: [
      { description: "", price: "" },
    ],
  });

  useEffect(() => {
    if (!quotationId) return;

    async function loadQuotation() {
      try {
        const found = await quotationsAPI.getById(quotationId);
        if (found) {
          setQuotation(found);
          
          const items = found.items && Array.isArray(found.items) && found.items.length > 0 
            ? found.items
            : [
                { description: "", price: "" },
              ];
          
          const calculatedTotal = items.some((item: any) => item && item.price && item.price.toString().trim() !== "") 
            ? calculateTotalFromItems(items)
            : found.totalDue || "Php 0.00";
          
          // Get the template and regenerate terms from it
          const template = found.termsTemplate || 'template1';
          const totalFormatted = calculatedTotal || "Php 0.00";
          const templateData = getTermsTemplate(template, totalFormatted);
          
          console.log('Loading quotation - Template:', template, 'Found termsTemplate:', found.termsTemplate);
          console.log('Regenerated terms:', templateData.terms);
          
          setFormData({
            quotationNumber: found.quotationNumber,
            date: found.date,
            validUntil: found.validUntil,
            clientName: found.clientName,
            jobDescription: found.jobDescription,
            clientContact: found.clientContact || "",
            installationAddress: found.installationAddress,
            attention: found.attention || "",
            totalDue: calculatedTotal,
            terms: templateData.terms, // Always use terms from the template
            termsTemplate: template,
            items: items,
          });
        }
      } catch (e) {
        console.error("Error loading quotation:", e);
      }
    }
    loadQuotation();
  }, [quotationId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const name = e.target.name;
    const value = e.target.value;
    
    // Auto-capitalize first letters for text fields when user leaves the field
    const fieldsToCapitalize = ['clientName', 'jobDescription', 'installationAddress', 'attention'];
    if (fieldsToCapitalize.includes(name) && value) {
      const capitalizedValue = capitalizeFirstLetters(value);
      if (capitalizedValue !== value) {
        setFormData((prev) => ({
          ...prev,
          [name]: capitalizedValue,
        }));
      }
    }
  };

  const handleTermChange = (index: number, value: string) => {
    setFormData((prev) => {
      const newTerms = [...prev.terms];
      newTerms[index] = value;
      return { ...prev, terms: newTerms };
    });
  };

  const handleTemplateChange = (template: TermsTemplate) => {
    const totalFormatted = formData.totalDue || "Php 0.00";
    const templateData = getTermsTemplate(template, totalFormatted);
    console.log('Template changed to:', template, 'Terms:', templateData.terms);
    setFormData((prev) => ({ 
      ...prev, 
      terms: templateData.terms,
      termsTemplate: template,
    }));
  };


  const handleItemChange = (index: number, field: "description" | "price", value: string) => {
    const updated = [...(formData.items || [])];
    if (!updated[index]) {
      updated[index] = { description: "", price: "" };
    }
    // Auto-capitalize first letters for descriptions
    const processedValue = field === "description" ? capitalizeFirstLetters(value) : value;
    updated[index] = { ...updated[index], [field]: processedValue };
    
    // Calculate total from all items
    const total = calculateTotalFromItems(updated);
    
    setFormData((prev) => ({ ...prev, items: updated, totalDue: total }));
  };

  const addItem = () => {
    const currentItems = formData.items || [];
    if (currentItems.length >= 6) {
      alert("Maximum of 6 items allowed per quotation.");
      return;
    }
    const newItems = [...currentItems, { description: "", price: "" }];
    const total = calculateTotalFromItems(newItems);
    setFormData((prev) => ({
      ...prev,
      items: newItems,
      totalDue: total,
    }));
  };

  const removeItem = (index: number) => {
    const updated = [...(formData.items || [])];
    updated.splice(index, 1);
    const finalItems = updated.length > 0 ? updated : [{ description: "", price: "" }];
    const total = calculateTotalFromItems(finalItems);
    setFormData((prev) => ({ ...prev, items: finalItems, totalDue: total }));
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

    // DATE + NUMBER
    doc.setFontSize(11);
    const formatDateNoTime = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    };
    const formattedDate = formatDateNoTime(formData.date);
    const formattedValidUntil = formatDateNoTime(formData.validUntil);
    const dateText = `DATE: ${formattedDate}`;
    const validUntilText = `Valid Until: ${formattedValidUntil}`;
    doc.text(dateText, margin + 3, y);
    const dateTextWidth = doc.getTextWidth(dateText);
    doc.text(validUntilText, margin + 3 + dateTextWidth + 20, y);
    doc.text(`#${formData.quotationNumber}`, pw - margin, y, { align: "right" });
    y += 8;

    // CLIENT INFO HEADER
    doc.setFillColor(0, 128, 0);
    doc.rect(margin, y - 4, pw - margin * 2, 6, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("CLIENT INFORMATION", pw / 2, y, { align: "center" });
    y += 9;

    // CLIENT FIELDS
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    const lineHeight = 5.5;
    
    // NAME
    doc.text("NAME: ", margin + 3, y);
    doc.setFont("helvetica", "bold");
    doc.text(formData.clientName, margin + 3 + doc.getTextWidth("NAME: "), y);
    doc.setFont("helvetica", "normal");
    y += lineHeight;
    
    // JOB DESCRIPTION
    doc.text("JOB DESCRIPTION: ", margin + 3, y);
    doc.setFont("helvetica", "bold");
    doc.text(formData.jobDescription, margin + 3 + doc.getTextWidth("JOB DESCRIPTION: "), y);
    doc.setFont("helvetica", "normal");
    y += lineHeight;
    
    // CONTACT NUMBER
    doc.text("CONTACT NUMBER: ", margin + 3, y);
    doc.setFont("helvetica", "bold");
    doc.text(formData.clientContact || "N/A", margin + 3 + doc.getTextWidth("CONTACT NUMBER: "), y);
    doc.setFont("helvetica", "normal");
    y += lineHeight;
    
    // INSTALLATION ADDRESS
    doc.text("INSTALLATION ADDRESS: ", margin + 3, y);
    doc.setFont("helvetica", "bold");
    doc.text(formData.installationAddress, margin + 3 + doc.getTextWidth("INSTALLATION ADDRESS: "), y);
    doc.setFont("helvetica", "normal");
    y += lineHeight;
    
    // ATTENTION
    doc.text("ATTENTION: ", margin + 3, y);
    doc.setFont("helvetica", "bold");
    doc.text(formData.attention, margin + 3 + doc.getTextWidth("ATTENTION: "), y);
    doc.setFont("helvetica", "normal");
    y += 9;

    // DESCRIPTION HEADER
    doc.setFillColor(0, 128, 0);
    doc.rect(margin, y - 4, pw - margin * 2, 6, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("DESCRIPTION", pw / 2, y, { align: "center" });
    y += 9;

    // DESCRIPTION - Show items from form
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    
    const validItems = (formData.items || []).filter(item => item.description || item.price);
    if (validItems.length > 0) {
      validItems.forEach((item, index) => {
        if (y > ph - 60) {
          doc.addPage();
          y = margin;
        }
        // Format: "• Item description          Price"
        const priceNum = parseFloat((item.price || "0").replace(/[^0-9.]/g, ""));
        const priceText = isNaN(priceNum) ? "Php 0" : `Php ${priceNum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const shouldNumber = validItems.length > 1;
        const itemText = shouldNumber ? `${index + 1}.) ${item.description || ""}` : `• ${item.description || ""}`;
        // Calculate actual price width and reserve space for it
        const priceWidth = doc.getTextWidth(priceText);
        const priceX = pw - margin - 3;
        const pricePadding = 10; // Space between description and price
        const descriptionWidth = priceX - margin - 3 - priceWidth - pricePadding;
        
        // Split description into lines that fit within the available width
        const lines = doc.splitTextToSize(itemText, Math.max(descriptionWidth, 50)); // Minimum 50 units width
        let firstLineY = y;
        
        // Draw item bullet/number and description
        lines.forEach((line: string) => {
          doc.text(line, margin + 3, y);
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

    // Check for page overflow
    if (y > ph - 60) {
      doc.addPage();
      y = margin;
    }

    // TOTAL
    const totalAmount = parseFloat(formData.totalDue.replace(/[^0-9.]/g, ""));
    const totalFormatted = formatCurrency(formData.totalDue);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL DUE", margin + 3, y);
    doc.text(totalFormatted, pw - margin - 3, y, { align: "right" });
    y += 7;

    // Check if we need a new page for terms and proposal
    if (y > ph - 70) {
      doc.addPage();
      y = margin;
    }

    // TERMS AND CONDITIONS
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
    
    // Get terms based on template
    const template = formData.termsTemplate || 'template1';
    const templateData = getTermsTemplate(template, totalFormatted);
    const termsToUse = formData.terms && formData.terms.length > 0 ? formData.terms : templateData.terms;
    
    // Display terms
    termsToUse.forEach((t, i) => {
      if (y > ph - 60) {
        doc.addPage();
        y = margin;
      }
      const lines = doc.splitTextToSize(`${i + 1}. ${t}`, pw - margin * 2 - 6);
      lines.forEach((l: string) => {
        doc.text(l, margin + 3, y);
        y += 3.5;
      });
      y += 1.5;
    });

    y += 3;

    // Display proposal text based on template
    if (template === 'template2' && templateData.proposalText) {
      // Template 2 has custom proposal text
      const proposalStart = templateData.proposalText;
      const proposalEnd = ".";
      
      const proposalStartLines = doc.splitTextToSize(proposalStart, pw - margin * 2 - 6);
      proposalStartLines.forEach((line: string, index: number) => {
        doc.text(line, margin + 3, y);
        if (index < proposalStartLines.length - 1) {
          y += 4;
        }
      });

      const lastLineWidth = doc.getTextWidth(proposalStartLines[proposalStartLines.length - 1] || "");
      const maxWidth = pw - margin * 2 - 6;
      const boldTextWidth = doc.getTextWidth(totalFormatted);
      if (lastLineWidth + boldTextWidth <= maxWidth) {
        doc.setFont("helvetica", "bold");
        doc.text(totalFormatted, margin + 3 + lastLineWidth, y);
        doc.setFont("helvetica", "normal");
        doc.text(proposalEnd, margin + 3 + lastLineWidth + boldTextWidth, y);
        y += 4;
      } else {
        y += 4;
        doc.setFont("helvetica", "bold");
        doc.text(totalFormatted, margin + 3, y);
        doc.setFont("helvetica", "normal");
        const endWidth = doc.getTextWidth(totalFormatted);
        doc.text(proposalEnd, margin + 3 + endWidth, y);
        y += 4;
      }
    } else {
      // Template 1 - standard proposal
      const proposalStart = "FCM Trading and Services proposes to furnish the items described and specified herein the above-mentioned buyers who accept and bind themselves to the specifications of the materials herein offered, terms and conditions of the proposal, for the sum of  ";
      const proposalEnd = ".";

      const proposalStartLines = doc.splitTextToSize(proposalStart, pw - margin * 2 - 6);
      proposalStartLines.forEach((line: string, index: number) => {
        doc.text(line, margin + 3, y);
        if (index < proposalStartLines.length - 1) {
          y += 4;
        }
      });

      const lastLineWidth = doc.getTextWidth(proposalStartLines[proposalStartLines.length - 1] || "");
      const maxWidth = pw - margin * 2 - 6;
      const boldTextWidth = doc.getTextWidth(totalFormatted);
      if (lastLineWidth + boldTextWidth <= maxWidth) {
        doc.setFont("helvetica", "bold");
        doc.text(totalFormatted, margin + 3 + lastLineWidth, y);
        doc.setFont("helvetica", "normal");
        doc.text(proposalEnd, margin + 3 + lastLineWidth + boldTextWidth, y);
        y += 4;
      } else {
        y += 4;
        doc.setFont("helvetica", "bold");
        doc.text(totalFormatted, margin + 3, y);
        doc.setFont("helvetica", "normal");
        const endWidth = doc.getTextWidth(totalFormatted);
        doc.text(proposalEnd, margin + 3 + endWidth, y);
        y += 4;
      }
    }
    y += 8;

    // ACCEPTANCE
    doc.setFontSize(11);
    doc.text("Customer Acceptance (sign below):", margin + 3, y);
    y += 6;
    doc.setFontSize(10);
    doc.text("X", margin + 3, y);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    const lineStartX = margin + 10;
    const lineEndX = pw - margin - 60;
    doc.line(lineStartX, y, lineEndX, y);
    
    y += 2;  // Further reduced from 3 to 2
    
    // SIGNATURE image (draw first, above everything)
    let signatureHeight = 0;
    try {
      const signatureResponse = await fetch('/images/signature.png');
      const signatureBlob = await signatureResponse.blob();
      const signatureUrl = URL.createObjectURL(signatureBlob);
      const sigImg = new Image();
      sigImg.src = signatureUrl;
      
      await new Promise((resolve) => {
        sigImg.onload = () => {
          const sigWidth = 55;
          const sigHeight = (sigImg.height / sigImg.width) * sigWidth;
          signatureHeight = sigHeight;
          const sigX = (pw - sigWidth) / 2;
          doc.addImage(sigImg, 'PNG', sigX, y, sigWidth, sigHeight);
          URL.revokeObjectURL(signatureUrl);
          resolve(null);
        };
        sigImg.onerror = () => {
          resolve(null);
        };
      });
    } catch (e) {
      // Signature image not found, continue without it
    }

    // Position CONFIRMED text below signature - extremely close
    y += signatureHeight + 0.5;  // Reduced from 1 to 0.5 for very close spacing

    // CONFIRMED TEXT
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
    doc.text("Thank you for your Business!", pw / 2, y, { align: "center" });

    const sanitizeFilename = (str: string) => str.replace(/[<>:"/\\|?*]/g, '-').trim();
    const filename = `${sanitizeFilename(formData.quotationNumber)} ${sanitizeFilename(formData.clientName)} - ${sanitizeFilename(formData.jobDescription)} (Final Quotation).pdf`;
    doc.save(filename);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotation) return;

    setLoading(true);

    try {
      // Filter out empty items before saving
      const itemsToSave = (formData.items || []).filter(item => item && (item.description || item.price));
      
      // Get current user display name
      const currentUser = await getCurrentUserDisplayName();
      
      // Regenerate terms from template to ensure they match
      const template = formData.termsTemplate || 'template1';
      const totalFormatted = formData.totalDue || "Php 0.00";
      const templateData = getTermsTemplate(template, totalFormatted);
      
      const dataToSave = {
        ...formData,
        items: itemsToSave.length > 0 ? itemsToSave : null,
        lastEditedBy: currentUser,
        termsTemplate: template,
        terms: templateData.terms, // Always use terms from the current template
      };
      
      console.log('Saving quotation with template:', template, 'Terms:', templateData.terms);
      console.log('Data to save:', JSON.stringify(dataToSave, null, 2));
      
      await quotationsAPI.update(quotationId, dataToSave);
      router.push(`/admin/quotations/${quotationId}`);
    } catch (error) {
      console.error("Error updating quotation:", error);
      alert("Failed to update quotation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!quotation) {
    return (
      <main className="min-h-screen bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-6 lg:py-10">
          <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-12 text-center">
            <p className="text-slate-600 mb-4">Loading quotation...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-6 lg:py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/quotations/${quotationId}`}
              className="rounded-md border-2 border-slate-400 p-2.5 text-slate-800 hover:border-slate-500 transition flex items-center justify-center bg-white shadow-sm"
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
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Edit Quotation</h1>
              <p className="text-sm text-slate-600 mt-1">Update quotation details for #{quotation.quotationNumber}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="quotationNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                  Quotation Number *
                </label>
                <input
                  type="text"
                  id="quotationNumber"
                  name="quotationNumber"
                  value={formData.quotationNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900 placeholder:text-gray-400"
                  placeholder="e.g., 300.42"
                />
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-semibold text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900"
                />
              </div>

              <div>
                <label htmlFor="validUntil" className="block text-sm font-semibold text-gray-700 mb-2">
                  Valid Until *
                </label>
                <input
                  type="date"
                  id="validUntil"
                  name="validUntil"
                  value={formData.validUntil}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900"
                />
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
                  <label htmlFor="clientName" className="block text-sm font-semibold text-gray-700 mb-2">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    id="clientName"
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900 placeholder:text-gray-400"
                    placeholder="e.g., Jollibee Car car branch"
                  />
                </div>

                <div>
                  <label htmlFor="clientContact" className="block text-sm font-semibold text-gray-700 mb-2">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    id="clientContact"
                    name="clientContact"
                    value={formData.clientContact}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900 placeholder:text-gray-400"
                    placeholder="e.g., +63 912 345 6789"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="jobDescription" className="block text-sm font-semibold text-gray-700 mb-2">
                    Job Description *
                  </label>
                  <input
                    type="text"
                    id="jobDescription"
                    name="jobDescription"
                    value={formData.jobDescription}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900 placeholder:text-gray-400"
                    placeholder="e.g., Repairing back wall using hardiflex, wall angle and repainting"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="installationAddress" className="block text-sm font-semibold text-gray-700 mb-2">
                    Installation Address *
                  </label>
                  <input
                    type="text"
                    id="installationAddress"
                    name="installationAddress"
                    value={formData.installationAddress}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900 placeholder:text-gray-400"
                    placeholder="e.g., Jollibee Car car"
                  />
                </div>

                <div>
                  <label htmlFor="attention" className="block text-sm font-semibold text-gray-700 mb-2">
                    Attention *
                  </label>
                  <input
                    type="text"
                    id="attention"
                    name="attention"
                    value={formData.attention}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900 placeholder:text-gray-400"
                    placeholder="e.g., Sir Athan"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Terms and Conditions Template *
                  </label>
                  <select
                    value={formData.termsTemplate || 'template1'}
                    onChange={(e) => handleTemplateChange(e.target.value as TermsTemplate)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900 bg-white"
                  >
                    <option value="template1">Template 1 - Loan Terms</option>
                    <option value="template2">Template 2 - Downpayment Terms</option>
                  </select>
                  <p className="mt-2 text-xs text-gray-500">
                    {formData.termsTemplate === 'template1' 
                      ? 'Standard billing and warranty terms'
                      : 'Payment-based terms with down payment and full payment conditions'}
                  </p>

                  {/* Preview Section */}
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">Template Preview:</h4>
                    <div className="space-y-2">
                      {formData.terms.map((term, index) => (
                        <p key={index} className="text-sm text-slate-700">
                          <span className="font-semibold">{index + 1}.</span> {term}
                        </p>
                      ))}
                      {formData.termsTemplate === 'template2' && (
                        <div className="mt-3 pt-3 border-t border-slate-300">
                          <p className="text-sm text-slate-700 italic">
                            FCM Trading and Services proposes to furnish the items described and specified herein the above-mentioned buyers who accept and bind themselves to the specifications of the materials herein offered, terms and conditions of the proposal, for the sum of <span className="font-bold">{formatCurrency(formData.totalDue)}</span>.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Description</h3>
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
              {(formData.items || []).length < 6 && (
                <button
                  type="button"
                  onClick={addItem}
                  className="mt-4 flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add Item
                </button>
              )}
              {(formData.items || []).length >= 6 && (
                <p className="mt-4 text-sm text-gray-500 italic">Maximum of 6 items reached.</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Link
                href={`/admin/quotations/${quotationId}`}
                className="rounded-md border border-slate-300 px-6 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}