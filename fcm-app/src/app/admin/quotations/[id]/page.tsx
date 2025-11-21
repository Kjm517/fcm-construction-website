// VIEW QUOTATION PAGE – OPTIMIZED
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import jsPDF from "jspdf";

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
  items?: QuotationItem[];
  createdAt: number;
};

export default function ViewQuotationPage() {
  const params = useParams<{ id: string }>();
  const quotationId = params?.id ?? "";
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("quotations");
    if (stored) {
      try {
        const quotations: Quotation[] = JSON.parse(stored);
        const found = quotations.find((q) => q.id === quotationId);
        setQuotation(found || null);
      } catch (e) {
        console.error("Error loading quotation:", e);
      }
    }
  }, [quotationId]);

  const formatDate = (v: string) => {
    try {
      const d = new Date(v);
      return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(
        d.getDate()
      ).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`;
    } catch {
      return v;
    }
  };

  const formatCurrency = (amount: string) => {
    const n = parseFloat((amount || "").toString().replace(/[^0-9.]/g, ""));
    return isNaN(n)
      ? amount
      : `Php ${n.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
  };

  const generatePDF = async () => {
    if (!quotation) return;
    
    setPdfLoading(true);
    try {
      const doc = new jsPDF();
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();
      const margin = 10;
      let y = 10;

      // LOGO - Reduced to 22px
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
            URL.revokeObjectURL(url);
            resolve(null);
          };
        });
      } catch {
        // ignore if logo not present
      }

      // CONTACT INFO
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);  // Increased to 11pt
      doc.text("517-4428 / 516-2922 / 09239480967", pw / 2, y, { align: "center" });
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
      doc.setFontSize(11);  // Increased to 11pt
      doc.text(`DATE: ${formatDate(quotation.date)}`, margin, y);
      doc.text(`#${quotation.quotationNumber}`, pw - margin, y, { align: "right" });
      y += 5;
      doc.text(`Valid Until: ${formatDate(quotation.validUntil)}`, margin, y);
      y += 8;

      // CLIENT INFO HEADER - Reduced height to 6px
      doc.setFillColor(0, 128, 0);
      doc.rect(margin, y - 4, pw - margin * 2, 6, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);  // Increased to 12pt
      doc.text("CLIENT INFORMATION", pw / 2, y, { align: "center" });
      y += 9;

      // CLIENT FIELDS - Reduced line height to 5.5px
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);  // Increased to 11pt
      const lh = 5.5;
      
      // NAME
      doc.text("NAME: ", margin + 5, y);
      doc.setFont("helvetica", "bold");
      doc.text(quotation.clientName, margin + 5 + doc.getTextWidth("NAME: "), y);
      doc.setFont("helvetica", "normal");
      y += lh;
      
      // JOB DESCRIPTION
      doc.text("JOB DESCRIPTION: ", margin + 5, y);
      doc.setFont("helvetica", "bold");
      doc.text(quotation.jobDescription, margin + 5 + doc.getTextWidth("JOB DESCRIPTION: "), y);
      doc.setFont("helvetica", "normal");
      y += lh;
      
      // CONTACT
      doc.text("CONTACT: ", margin + 5, y);
      doc.setFont("helvetica", "bold");
      doc.text(quotation.clientContact || "N/A", margin + 5 + doc.getTextWidth("CONTACT: "), y);
      doc.setFont("helvetica", "normal");
      y += lh;
      
      // INSTALLATION ADDRESS
      doc.text("INSTALLATION ADDRESS: ", margin + 5, y);
      doc.setFont("helvetica", "bold");
      doc.text(quotation.installationAddress, margin + 5 + doc.getTextWidth("INSTALLATION ADDRESS: "), y);
      doc.setFont("helvetica", "normal");
      y += lh;
      
      // ATTENTION
      doc.text("ATTENTION: ", margin + 5, y);
      doc.setFont("helvetica", "bold");
      doc.text(quotation.attention, margin + 5 + doc.getTextWidth("ATTENTION: "), y);
      doc.setFont("helvetica", "normal");
      y += 9;

      // DESCRIPTION HEADER - Reduced height to 6px
      doc.setFillColor(0, 128, 0);
      doc.rect(margin, y - 4, pw - margin * 2, 6, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);  // Increased to 12pt
      doc.text("DESCRIPTION", pw / 2, y, { align: "center" });
      y += 9;

      // DESCRIPTION - Show items from quotation
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);  // Increased to 11pt
      
      const validItems = (quotation.items || []).filter(item => item.description || item.price);
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
          const priceX = pw - margin - 5;
          const descriptionWidth = priceX - margin - 5 - 20; // Leave space for bullet/number and price
          
          // Draw item bullet/number and description
          const lines = doc.splitTextToSize(itemText, descriptionWidth);
          let firstLineY = y;
          lines.forEach((l: string) => {
            doc.text(l, margin + 5, y);
            y += 4;
          });
          
          // Draw price aligned to the right on the first line
          doc.text(priceText, priceX, firstLineY, { align: "right" });
          y += 2;
        });
      }
      
      y += 3;
      doc.setFontSize(10);  // Increased to 10pt
      doc.text("******* NOTHING FOLLOWS *********", pw / 2, y, { align: "center" });
      y += 9;

      // TOTAL
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);  // Increased to 12pt
      doc.text("TOTAL DUE", margin + 5, y);
      doc.text(formatCurrency(quotation.totalDue), pw - margin - 5, y, { align: "right" });
      y += 9;

      // TERMS HEADER - Reduced height to 6px
      doc.setFillColor(0, 128, 0);
      doc.rect(margin, y - 4, pw - margin * 2, 6, "F");
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);  // Increased to 12pt
      doc.text("TERMS AND CONDITIONS", pw / 2, y, { align: "center" });
      y += 9;

      // TERMS AND CONDITIONS
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);  // Increased to 11pt
      doc.setTextColor(0, 0, 0);
      
      // Static terms - always display these
      const staticTerms = [
        "Customers will be billed after 30 days upon completion and turnover of work with 7 days warranty",
        "Please email the signed price quote to the address above.",
        "Any additional work shall be created with a new quotation.",
        "If there is any request for a contract bond or any expenses that are out of the price quotation, FCM Trading and Services will not be included in this quotation.",
      ];
      
      staticTerms.forEach((t, i) => {
        const lines = doc.splitTextToSize(`${i + 1}. ${t}`, pw - margin * 2 - 10);
        lines.forEach((l: string) => {
          doc.text(l, margin + 5, y);
          y += 4;
        });
        y += 2;
      });

      y += 4;

      // PROPOSAL PARAGRAPH
      const totalFormatted = formatCurrency(quotation.totalDue);

      // Proposal paragraph with bold total
      const proposalStart = "FCM Trading and Services proposes to furnish the items described and specified herein the above-mentioned buyers who accept and bind themselves to the specifications of the materials herein offered, terms and conditions of the proposal, for the sum of  ";
      const proposalEnd = ".";

      // Calculate text width to position bold text correctly
      const proposalStartLines = doc.splitTextToSize(proposalStart, pw - margin * 2 - 10);
      proposalStartLines.forEach((line: string, index: number) => {
        doc.text(line, margin + 5, y);
        if (index < proposalStartLines.length - 1) {
          y += 4;
        }
      });

      // Get the last line width to position bold text
      const lastLineWidth = doc.getTextWidth(proposalStartLines[proposalStartLines.length - 1] || "");
      const maxWidth = pw - margin * 2 - 10;
      
      // Check if bold text fits on same line
      const boldTextWidth = doc.getTextWidth(totalFormatted);
      if (lastLineWidth + boldTextWidth <= maxWidth) {
        // Same line
        doc.setFont("helvetica", "bold");
        doc.text(totalFormatted, margin + 5 + lastLineWidth, y);
        doc.setFont("helvetica", "normal");
        doc.text(proposalEnd, margin + 5 + lastLineWidth + boldTextWidth, y);
        y += 4;
      } else {
        // New line
        y += 4;
        doc.setFont("helvetica", "bold");
        doc.text(totalFormatted, margin + 5, y);
        doc.setFont("helvetica", "normal");
        const endWidth = doc.getTextWidth(totalFormatted);
        doc.text(proposalEnd, margin + 5 + endWidth, y);
        y += 4;
      }
      y += 8;

      // ACCEPTANCE
      doc.setFontSize(11);  // Increased to 11pt
      doc.text("Customer Acceptance (sign below):", margin + 5, y);
      y += 6;
      doc.setFontSize(10);
      doc.text("X", margin + 5, y);

      const xStart = margin + 12;
      const xEnd = pw - margin - 10;
      doc.line(xStart, y, xEnd, y);

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
            const sigX = (pw - w) / 2;
            doc.addImage(img, "PNG", sigX, y, w, h);
            URL.revokeObjectURL(url);
            resolve(null);
          };
          img.onerror = () => {
            resolve(null);
          };
        });
      } catch {
        // Signature image not found, continue without it
      }

      // Position CONFIRMED text below signature - extremely close
      y += signatureHeight + 0.5;  // Reduced from 1 to 0.5 for very close spacing

      // SIGNATURE NAME
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);  // Increased to 12pt
      doc.text("CONFIRMED : FLORENTINO MANA-AY JR.", pw / 2, y, { align: "center" });

      // FOOTER - minimal spacing
      y += 5;  // Further reduced from 6 to 5
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);  // Increased to 11pt
      doc.text("If you have any questions about this sales quotation, please contact", pw / 2, y, { align: "center" });
      y += 5;  // Further reduced from 4 to 3.5
      doc.text("Mr. Florentino Mana-ay Jr - 09239480967", pw / 2, y, { align: "center" });
      y += 6;  // Reduced from 7 to 6
       doc.setFont("helvetica", "bolditalic");
       doc.setFontSize(11);  // Increased to 11pt
       doc.text("Thank you for your Business!", pw / 2, y, { align: "center" });

      doc.save(`quotation-${quotation.quotationNumber}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  };

  if (!quotation) {
    return (
      <main className="p-12 text-center">
        <p>Quotation not found.</p>
        <Link href="/admin/quotations">Go Back</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left sidebar menu */}
          <aside className="lg:col-span-3">
            <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-4 flex flex-col gap-3 sticky top-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-lg font-bold">
                  F
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    FCM
                  </p>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Dashboard
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
                  Dashboard
                </Link>
                <Link
                  href="/admin/projects"
                  className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-50"
                >
                  Projects
                </Link>
                <span className="rounded-lg px-3 py-2 bg-emerald-50 text-emerald-700 font-medium">
                  Quotations
                </span>
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <div className="lg:col-span-9">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/quotations"
                  className="rounded-md border-2 border-slate-400 p-2.5 text-slate-800 hover:border-slate-500 transition flex items-center justify-center bg-white shadow-sm"
                  aria-label="Go back"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </Link>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Quotation #{quotation.quotationNumber}</h1>
                  <p className="text-sm text-slate-600">View quotation details</p>
                </div>
              </div>
          <div className="flex items-center gap-3">
            <Link href={`/admin/quotations/${quotationId}/edit`} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition">
              Edit
            </Link>
            <button 
              onClick={generatePDF} 
              disabled={pdfLoading}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {pdfLoading ? "Generating..." : "Download PDF"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div></div>
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
            <h3 className="text-sm font-semibold text-emerald-900 mb-3">DESCRIPTION</h3>
            
            {/* Items with prices - show first, using bullets */}
            {(quotation.items && quotation.items.length > 0 && quotation.items.some(item => item.description || item.price)) ? (
              <div className="space-y-2 mb-4">
                {quotation.items
                  .filter(item => item.description || item.price)
                  .map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <p className="text-sm text-slate-900">
                        • {item.description || "N/A"}
                      </p>
                      <p className="text-sm font-semibold text-slate-900 ml-4 whitespace-nowrap">
                        {item.price ? (item.price.toLowerCase().includes("php") || item.price.includes("₱") ? item.price : `Php ${item.price}`) : "N/A"}
                      </p>
                    </div>
                  ))}
              </div>
            ) : null}
            
            <p className="text-xs text-slate-500 mb-4">******** NOTHING FOLLOWS ********</p>
            
            <div className="mt-4 text-right">
              <p className="text-sm font-semibold text-slate-900">TOTAL DUE: {quotation.totalDue}</p>
            </div>
          </div>
        </div>
          </div>
        </div>
      </div>
    </main>
  );
}