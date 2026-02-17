"use client";

import React, { useState } from "react";
import jsPDF from "jspdf";

// =============================================================================
// TYPE DEFINITIONS - Matching Backend Response Structure
// =============================================================================

interface Discrepancy {
  type: string;
  severity: string;
  pdfClaim?: string;
  codeReality?: string;
  description?: string;
  impact?: string;
  codeLocation?: string;
}

interface Vulnerability {
  type: string;
  severity: string;
  location?: string;
  description?: string;
  exploit?: string;
  codeSnippet?: string;
  financialImpact?: string;
  recommendation?: string;
}

interface CodeQualityIssue {
  type: string;
  severity: string;
  description?: string;
  location?: string;
  recommendation?: string;
}

interface TokenomicsVerification {
  documentedFee?: string;
  actualFee?: string;
  feeMismatch?: boolean;
  documentedLateFee?: string;
  actualLateFee?: string;
  lateFeeMismatch?: boolean;
  gracePeriodClaimed?: string;
  gracePeriodEnforced?: boolean;
  unlimitedMinting?: boolean;
  canFreezeAccounts?: boolean;
  canSeizeWithoutDefault?: boolean;
  hasBackdoorAdmin?: boolean;
  hasInstantUpgrade?: boolean;
  fakeMultisig?: boolean;
  [key: string]: string | boolean | undefined;
}

interface RiskScore {
  overall: number;
  classification: string;
  confidence?: string;
}

interface AIAnalysis {
  discrepancies?: Discrepancy[];
  vulnerabilities?: Vulnerability[];
  codeQualityIssues?: CodeQualityIssue[];
  tokenomicsVerification?: TokenomicsVerification;
  riskScore?: RiskScore;
  summary?: string;
  redFlags?: string[];
  positiveAspects?: string[];
  parseError?: boolean;
  error?: string;
  rawResponse?: string;
  tokenomicsAnalysis?: {
    totalSupply?: string;
    hasMintFunction?: boolean;
    hasBurnFunction?: boolean;
    transactionFees?: string;
    ownerPrivileges?: string[];
  };
}

interface AnalysisMetadata {
  analyzedAt: string;
  pdfFile?: string;
  pdfPages?: number;
  githubRepo: string;
  totalCodeFiles: number;
  totalCodeLines: number;
  aiModel: string;
  analysisMode: string;
  duration: string;
}

interface PdfExtraction {
  pages: number;
  sectionsFound: string[];
  textLength: number;
}

interface CodeExtraction {
  repository: string;
  filesAnalyzed: number;
  totalLines: number;
  categories?: Record<string, number>;
}

interface AnalysisResult {
  metadata: AnalysisMetadata;
  pdfExtraction?: PdfExtraction;
  codeExtraction: CodeExtraction;
  rawGeminiResponse?: string;
  aiAnalysis: AIAnalysis | null;
}

interface APIResponse {
  success: boolean;
  analysis?: AnalysisResult;
  error?: string;
  timestamp: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function ContractAnalysis() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [githubUrl, setGithubUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRawResponse, setShowRawResponse] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile || !githubUrl) {
      setError("Please provide both a PDF file and GitHub repository URL");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("pdf", pdfFile);
      formData.append("githubRepo", githubUrl);

      console.log("[ContractAnalysis] Sending request to API...");
      console.log("[ContractAnalysis] PDF file:", pdfFile.name, "Size:", pdfFile.size);
      console.log("[ContractAnalysis] GitHub Repo:", githubUrl);

      const apiUrl = process.env.NEXT_PUBLIC_CONTRACT_ANALYZER_API_URL || "http://localhost:3000";
      const response = await fetch(`${apiUrl}/api/analyze`, {
        method: "POST",
        body: formData,
      });

      console.log("[ContractAnalysis] Response status:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[ContractAnalysis] API Error Response:", errorText);
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || errorJson.message || `API error: ${response.status} ${response.statusText}`);
        } catch {
          throw new Error(`API error: ${response.status} ${response.statusText}. ${errorText}`);
        }
      }

      const data: APIResponse = await response.json();
      console.log("[ContractAnalysis] Analysis complete. Response:", data);
      
      if (data.success && data.analysis) {
        setResult(data.analysis);
      } else {
        throw new Error(data.error || "Analysis failed");
      }
    } catch (err) {
      console.error("[ContractAnalysis] Error:", err);
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("Unable to connect to the analysis server. Please ensure the backend is running on http://localhost:3000");
      } else {
        setError(err instanceof Error ? err.message : "An unexpected error occurred during analysis");
      }
    } finally {
      setLoading(false);
    }
  };

  // =============================================================================
  // HELPER FUNCTIONS
  // =============================================================================

  const getSeverityColor = (severity: string): string => {
    const sev = (severity || "").toUpperCase();
    if (sev.includes("CRITICAL")) return "bg-red-600 text-white";
    if (sev.includes("HIGH")) return "bg-orange-500 text-white";
    if (sev.includes("MEDIUM")) return "bg-yellow-500 text-black";
    if (sev.includes("LOW")) return "bg-blue-500 text-white";
    return "bg-zinc-600 text-white";
  };

  const getRiskClassColor = (classification: string): string => {
    const cls = (classification || "").toUpperCase();
    if (cls.includes("HIGH") || cls.includes("CRITICAL")) return "text-red-400 border-red-500 bg-red-950/50";
    if (cls.includes("SUSPICIOUS") || cls.includes("MEDIUM")) return "text-orange-400 border-orange-500 bg-orange-950/50";
    if (cls.includes("SAFE") || cls.includes("LOW")) return "text-green-400 border-green-500 bg-green-950/50";
    return "text-zinc-400 border-zinc-600 bg-zinc-800";
  };

  const getScoreColor = (score: number): string => {
    if (score >= 7) return "text-green-400";
    if (score >= 4) return "text-orange-400";
    return "text-red-400";
  };

  const formatKey = (key: string): string => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const cleanCodeSnippet = (snippet: string): string => {
    return snippet
      .replace(/```solidity\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
  };

  const countBySeverity = (items: { severity?: string }[] | undefined, severity: string): number => {
    if (!items) return 0;
    return items.filter(item => item.severity?.toUpperCase() === severity.toUpperCase()).length;
  };

  // =============================================================================
  // PDF DOWNLOAD FUNCTION
  // =============================================================================

  const downloadPDF = () => {
    if (!result || !ai) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;
    let y = 0;
    let pageNumber = 0;
    const totalPagesPlaceholder = "##TOTAL##";

    // ── Refined Color Palette ────────────────────────────────────────────────
    const C = {
      brand:     [15,  23,  42]  as [number, number, number],  // Slate-900
      brandAlt:  [30,  41,  59]  as [number, number, number],  // Slate-800
      accent:    [99, 102, 241]  as [number, number, number],  // Indigo-500
      accentLt:  [224, 231, 255] as [number, number, number],  // Indigo-100
      pageBg:    [248, 250, 252] as [number, number, number],  // Slate-50
      cardBg:    [255, 255, 255] as [number, number, number],  // White
      text:      [15,  23,  42]  as [number, number, number],  // Slate-900
      textMuted: [100, 116, 139] as [number, number, number],  // Slate-500
      textLight: [148, 163, 184] as [number, number, number],  // Slate-400
      border:    [226, 232, 240] as [number, number, number],  // Slate-200
      borderLt:  [241, 245, 249] as [number, number, number],  // Slate-100
      critical:  [220,  38,  38] as [number, number, number],
      critBg:    [254, 226, 226] as [number, number, number],
      high:      [234,  88,  12] as [number, number, number],
      highBg:    [255, 237, 213] as [number, number, number],
      medium:    [161, 98,   7]  as [number, number, number],
      mediumBg:  [254, 249, 195] as [number, number, number],
      low:       [37,  99,  235] as [number, number, number],
      lowBg:     [219, 234, 254] as [number, number, number],
      safe:      [21,  128,  61] as [number, number, number],
      safeBg:    [220, 252, 231] as [number, number, number],
      white:     [255, 255, 255] as [number, number, number],
    };

    type RGB = [number, number, number];

    const sevStyle = (severity: string): { bg: RGB; fg: RGB; label: string } => {
      const s = (severity || "").toUpperCase();
      if (s.includes("CRITICAL")) return { bg: C.critBg,   fg: C.critical, label: "CRITICAL" };
      if (s.includes("HIGH"))     return { bg: C.highBg,   fg: C.high,     label: "HIGH" };
      if (s.includes("MEDIUM"))   return { bg: C.mediumBg, fg: C.medium,   label: "MEDIUM" };
      if (s.includes("LOW"))      return { bg: C.lowBg,    fg: C.low,      label: "LOW" };
      return { bg: C.borderLt, fg: C.textMuted, label: s || "UNKNOWN" };
    };

    // ── Utility helpers ──────────────────────────────────────────────────────

    /** Measure how many lines `text` will wrap into at `maxW` */
    const measureLines = (text: string, fontSize: number, maxW: number, bold = false): string[] => {
      pdf.setFont("helvetica", bold ? "bold" : "normal");
      pdf.setFontSize(fontSize);
      return pdf.splitTextToSize(text, maxW) as string[];
    };

    const lineH = (fontSize: number) => fontSize * 0.5;

    // ── Page primitives ──────────────────────────────────────────────────────

    const addPageBg = () => {
      pdf.setFillColor(...C.pageBg);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");
    };

    const addPageHeader = () => {
      // Thin accent stripe
      pdf.setFillColor(...C.accent);
      pdf.rect(0, 0, pageWidth, 3, "F");

      // Brand bar
      pdf.setFillColor(...C.brand);
      pdf.rect(0, 3, pageWidth, 22, "F");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(...C.white);
      pdf.text("BeforeYouSign", margin, 17);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(...C.textLight);
      pdf.text("Smart Contract Security Report", pageWidth - margin - 58, 17);

      y = 32;
    };

    const addPageFooter = () => {
      const footerY = pageHeight - 12;
      pdf.setDrawColor(...C.border);
      pdf.setLineWidth(0.3);
      pdf.line(margin, footerY - 3, pageWidth - margin, footerY - 3);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(...C.textLight);
      pdf.text("Confidential  |  Generated by BeforeYouSign AI Security Analyzer", margin, footerY);
      pdf.text(`Page ${pageNumber} of ${totalPagesPlaceholder}`, pageWidth - margin - 28, footerY);
    };

    const newPage = () => {
      if (pageNumber > 0) {
        addPageFooter();
        pdf.addPage();
      }
      pageNumber++;
      addPageBg();
      addPageHeader();
    };

    const ensureSpace = (need: number) => {
      if (y + need > pageHeight - 22) {
        addPageFooter();
        pdf.addPage();
        pageNumber++;
        addPageBg();
        addPageHeader();
      }
    };

    // ── Drawing helpers ──────────────────────────────────────────────────────

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfExt = pdf as unknown as Record<string, any>;

    const drawCard = (x: number, cardY: number, w: number, h: number, opts?: { accentColor?: RGB }) => {
      // Shadow
      pdf.setFillColor(0, 0, 0);
      pdf.setGState(new pdfExt.GState({ opacity: 0.04 }));
      pdf.roundedRect(x + 1, cardY + 1, w, h, 3, 3, "F");
      pdf.setGState(new pdfExt.GState({ opacity: 1 }));

      // Card
      pdf.setFillColor(...C.cardBg);
      pdf.roundedRect(x, cardY, w, h, 3, 3, "F");
      pdf.setDrawColor(...C.border);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(x, cardY, w, h, 3, 3, "S");

      // Left accent
      if (opts?.accentColor) {
        pdf.setFillColor(...opts.accentColor);
        pdf.rect(x, cardY + 3, 3, h - 6, "F");
      }
    };

    const drawBadge = (text: string, x: number, badgeY: number, bg: RGB, fg: RGB): number => {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(6.5);
      const tw = pdf.getTextWidth(text);
      const bw = tw + 8;
      pdf.setFillColor(...bg);
      pdf.roundedRect(x, badgeY - 4.5, bw, 7, 2, 2, "F");
      pdf.setTextColor(...fg);
      pdf.text(text, x + 4, badgeY);
      return bw;
    };

    const drawWrappedText = (text: string, x: number, options: {
      size?: number; bold?: boolean; color?: RGB; maxWidth?: number; spacing?: number;
    } = {}): number => {
      const { size = 9, bold = false, color = C.text, maxWidth = contentWidth - (x - margin) - 6, spacing } = options;
      const lh = spacing ?? lineH(size);
      const lines = measureLines(text, size, maxWidth, bold);
      pdf.setFont("helvetica", bold ? "bold" : "normal");
      pdf.setFontSize(size);
      pdf.setTextColor(...color);
      let drawn = 0;
      for (const line of lines) {
        ensureSpace(lh + 4);
        pdf.text(line, x, y);
        y += lh;
        drawn++;
      }
      return drawn;
    };

    const drawSectionTitle = (title: string) => {
      ensureSpace(20);
      y += 6;
      // Accent left bar
      pdf.setFillColor(...C.accent);
      pdf.roundedRect(margin, y - 5, 3, 12, 1, 1, "F");
      // Background
      pdf.setFillColor(...C.accentLt);
      pdf.roundedRect(margin + 4, y - 5, contentWidth - 4, 12, 2, 2, "F");
      // Text
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(...C.brand);
      pdf.text(title, margin + 10, y + 3);
      y += 16;
    };

    const drawSubLabel = (label: string, x: number, labelY: number) => {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(...C.textLight);
      pdf.text(label.toUpperCase(), x, labelY);
    };



    // ======================================================================
    //  PAGE 1 — COVER PAGE
    // ======================================================================

    pageNumber++;
    // Full-bleed dark cover
    pdf.setFillColor(...C.brand);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");

    // Decorative accent stripe
    pdf.setFillColor(...C.accent);
    pdf.rect(0, 0, pageWidth, 5, "F");

    // Geometric decoration (subtle angled lines)
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(0.15);
    pdf.setGState(new pdfExt.GState({ opacity: 0.06 }));
    for (let i = 0; i < 12; i++) {
      pdf.line(pageWidth - 80 + i * 8, 0, pageWidth - 40 + i * 8, pageHeight);
    }
    pdf.setGState(new pdfExt.GState({ opacity: 1 }));

    // Shield icon (drawn with shapes)
    const shieldX = pageWidth / 2;
    const shieldY = 72;
    pdf.setFillColor(...C.accent);
    pdf.circle(shieldX, shieldY, 20, "F");
    pdf.setFillColor(...C.brand);
    pdf.circle(shieldX, shieldY, 16, "F");
    pdf.setFillColor(...C.accent);
    pdf.circle(shieldX, shieldY, 11, "F");
    // Checkmark in shield
    pdf.setDrawColor(...C.white);
    pdf.setLineWidth(2.5);
    pdf.line(shieldX - 5, shieldY + 1, shieldX - 1, shieldY + 5);
    pdf.line(shieldX - 1, shieldY + 5, shieldX + 7, shieldY - 5);
    pdf.setLineWidth(0.2);

    // Title
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(32);
    pdf.setTextColor(...C.white);
    pdf.text("Security Audit Report", pageWidth / 2, 115, { align: "center" });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    pdf.setTextColor(...C.textLight);
    pdf.text("Smart Contract Vulnerability Assessment", pageWidth / 2, 128, { align: "center" });

    // Horizontal rule
    pdf.setDrawColor(...C.accent);
    pdf.setLineWidth(1);
    pdf.line(pageWidth / 2 - 40, 140, pageWidth / 2 + 40, 140);
    pdf.setLineWidth(0.2);

    // Repository name
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.setTextColor(...C.white);
    const repoDisplayName = result.codeExtraction.repository || "Unknown Repository";
    pdf.text(repoDisplayName, pageWidth / 2, 158, { align: "center" });

    // Cover info cards
    const coverCardW = 50;
    const coverCardH = 38;
    const coverInfoItems = [
      { label: "FILES ANALYZED", value: result.codeExtraction.filesAnalyzed.toString() },
      { label: "LINES OF CODE", value: result.codeExtraction.totalLines.toLocaleString() },
      { label: "AI MODEL", value: result.metadata.aiModel },
    ];
    const coverCardsStartX = (pageWidth - (coverCardW * 3 + 16)) / 2;
    coverInfoItems.forEach((item, idx) => {
      const cx = coverCardsStartX + idx * (coverCardW + 8);
      pdf.setFillColor(...C.brandAlt);
      pdf.roundedRect(cx, 175, coverCardW, coverCardH, 3, 3, "F");
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.5);
      pdf.setTextColor(...C.textLight);
      pdf.text(item.label, cx + coverCardW / 2, 187, { align: "center" });
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(...C.white);
      const val = item.value.length > 10 ? item.value.substring(0, 9) + ".." : item.value;
      pdf.text(val, cx + coverCardW / 2, 201, { align: "center" });
    });

    // Risk classification badge on cover
    if (ai.riskScore) {
      const riskCls = (ai.riskScore.classification || "UNKNOWN").toUpperCase();
      const isHighRisk = riskCls.includes("HIGH") || riskCls.includes("CRITICAL") || riskCls.includes("SCAM");
      const isMedRisk = riskCls.includes("MEDIUM") || riskCls.includes("SUSPICIOUS") || riskCls.includes("CAUTION");
      const riskBadgeBg: RGB = isHighRisk ? C.critical : isMedRisk ? [202, 138, 4] : C.safe;

      pdf.setFillColor(...riskBadgeBg);
      pdf.roundedRect(pageWidth / 2 - 45, 230, 90, 28, 5, 5, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(...C.white);
      const classText = ai.riskScore.classification || "UNKNOWN";
      pdf.text(classText, pageWidth / 2, 244, { align: "center" });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.text(`Trust Score: ${ai.riskScore.overall?.toFixed(1) ?? "N/A"}/10`, pageWidth / 2, 253, { align: "center" });
    }

    // Footer on cover
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(...C.textLight);
    pdf.text("Generated by BeforeYouSign", pageWidth / 2, pageHeight - 30, { align: "center" });
    pdf.setFontSize(8);
    pdf.text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), pageWidth / 2, pageHeight - 22, { align: "center" });

    // ======================================================================
    //  PAGE 2 — OVERVIEW
    // ======================================================================

    newPage();

    // ── Risk Assessment Card ─────────────────────────────────────────────
    if (ai.riskScore) {
      const riskCls = (ai.riskScore.classification || "").toUpperCase();
      const isHigh = riskCls.includes("HIGH") || riskCls.includes("CRITICAL") || riskCls.includes("SCAM");
      const isMed = riskCls.includes("MEDIUM") || riskCls.includes("SUSPICIOUS") || riskCls.includes("CAUTION");

      const rBg: RGB = isHigh ? [254, 242, 242] : isMed ? [255, 251, 235] : [240, 253, 244];
      const rFg: RGB = isHigh ? C.critical : isMed ? C.medium : C.safe;

      pdf.setFillColor(...rBg);
      pdf.roundedRect(margin, y, contentWidth, 40, 4, 4, "F");
      pdf.setDrawColor(...rFg);
      pdf.setLineWidth(0.6);
      pdf.roundedRect(margin, y, contentWidth, 40, 4, 4, "S");
      pdf.setLineWidth(0.2);

      // Left side — classification
      drawSubLabel("RISK CLASSIFICATION", margin + 10, y + 11);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(20);
      pdf.setTextColor(...rFg);
      pdf.text(ai.riskScore.classification || "Unknown", margin + 10, y + 28);

      // Right side — score
      const scoreVal = ai.riskScore.overall ?? 0;
      const scoreClr: RGB = scoreVal >= 7 ? C.safe : scoreVal >= 4 ? C.medium : C.critical;
      drawSubLabel("TRUST SCORE", pageWidth - margin - 48, y + 11);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(26);
      pdf.setTextColor(...scoreClr);
      pdf.text(`${ai.riskScore.overall?.toFixed(1) ?? "N/A"}`, pageWidth - margin - 48, y + 30);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(...C.textLight);
      pdf.text("/10", pageWidth - margin - 22, y + 30);

      y += 48;
    }

    // ── Severity Statistics Bar ───────────────────────────────────────────
    const critCount = countBySeverity(ai.vulnerabilities, "CRITICAL") + countBySeverity(ai.discrepancies, "CRITICAL");
    const highCount = countBySeverity(ai.vulnerabilities, "HIGH") + countBySeverity(ai.discrepancies, "HIGH");
    const medCount = countBySeverity(ai.vulnerabilities, "MEDIUM");
    const lowCount = countBySeverity(ai.vulnerabilities, "LOW");
    const totalIssues = (ai.vulnerabilities?.length || 0) + (ai.discrepancies?.length || 0) + (ai.codeQualityIssues?.length || 0);

    const stats = [
      { label: "Total Issues", val: totalIssues.toString(), bg: C.borderLt, fg: C.text },
      { label: "Critical",     val: critCount.toString(),   bg: C.critBg,   fg: C.critical },
      { label: "High",         val: highCount.toString(),   bg: C.highBg,   fg: C.high },
      { label: "Medium",       val: medCount.toString(),    bg: C.mediumBg, fg: C.medium },
      { label: "Low",          val: lowCount.toString(),    bg: C.lowBg,    fg: C.low },
    ];

    const statW = (contentWidth - 16) / 5;
    stats.forEach((s, i) => {
      const sx = margin + i * (statW + 4);
      pdf.setFillColor(...s.bg);
      pdf.roundedRect(sx, y, statW, 28, 3, 3, "F");
      drawSubLabel(s.label, sx + 5, y + 9);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.setTextColor(...s.fg);
      pdf.text(s.val, sx + 5, y + 23);
    });
    y += 36;

    // ── Analysis Metadata ─────────────────────────────────────────────────
    drawSectionTitle("Analysis Details");

    const metaCols = 4;
    const metaW = (contentWidth - (metaCols - 1) * 5) / metaCols;
    const metaItems = [
      { label: "Repository",  value: result.codeExtraction.repository },
      { label: "AI Model",    value: result.metadata.aiModel },
      { label: "Duration",    value: result.metadata.duration },
      { label: "Date",        value: new Date(result.metadata.analyzedAt).toLocaleDateString() },
    ];
    metaItems.forEach((m, i) => {
      const mx = margin + i * (metaW + 5);
      pdf.setFillColor(...C.cardBg);
      pdf.roundedRect(mx, y, metaW, 22, 2, 2, "F");
      pdf.setDrawColor(...C.border);
      pdf.roundedRect(mx, y, metaW, 22, 2, 2, "S");
      drawSubLabel(m.label, mx + 5, y + 8);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(...C.text);
      const mv = m.value.length > 22 ? m.value.substring(0, 20) + ".." : m.value;
      pdf.text(mv, mx + 5, y + 17);
    });
    y += 30;

    // Additional metadata row
    if (result.pdfExtraction) {
      const extraItems = [
        { label: "PDF File",      value: result.metadata.pdfFile || "N/A" },
        { label: "PDF Pages",     value: result.pdfExtraction.pages.toString() },
        { label: "Files Analyzed", value: result.codeExtraction.filesAnalyzed.toString() },
        { label: "Total Lines",   value: result.codeExtraction.totalLines.toLocaleString() },
      ];
      extraItems.forEach((m, i) => {
        const mx = margin + i * (metaW + 5);
        pdf.setFillColor(...C.borderLt);
        pdf.roundedRect(mx, y, metaW, 22, 2, 2, "F");
        drawSubLabel(m.label, mx + 5, y + 8);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(...C.text);
        const mv = m.value.length > 22 ? m.value.substring(0, 20) + ".." : m.value;
        pdf.text(mv, mx + 5, y + 17);
      });
      y += 30;
    }

    // ── Executive Summary ─────────────────────────────────────────────────
    if (ai.summary) {
      drawSectionTitle("Executive Summary");
      const summaryLines = measureLines(ai.summary, 9, contentWidth - 20);
      const boxH = Math.max(20, summaryLines.length * lineH(9) + 16);
      ensureSpace(boxH + 4);
      drawCard(margin, y, contentWidth, boxH);
      y += 10;
      drawWrappedText(ai.summary, margin + 10, { size: 9, color: C.text, maxWidth: contentWidth - 20 });
      y += 8;
    }

    // ── Red Flags ─────────────────────────────────────────────────────────
    if (ai.redFlags && ai.redFlags.length > 0) {
      drawSectionTitle(`Red Flags (${ai.redFlags.length})`);

      // Pre-measure total height
      let flagsTotalH = 10;
      ai.redFlags.forEach(f => {
        const fl = measureLines(f, 8.5, contentWidth - 28);
        flagsTotalH += fl.length * lineH(8.5) + 5;
      });

      ensureSpace(Math.min(flagsTotalH + 10, 100));

      const flagsBoxY = y;

      // Draw background + border FIRST
      pdf.setFillColor(254, 242, 242);
      pdf.roundedRect(margin, flagsBoxY, contentWidth, flagsTotalH, 3, 3, "F");
      pdf.setDrawColor(252, 165, 165);
      pdf.setLineWidth(0.4);
      pdf.roundedRect(margin, flagsBoxY, contentWidth, flagsTotalH, 3, 3, "S");
      pdf.setLineWidth(0.2);
      // Accent bar
      pdf.setFillColor(...C.critical);
      pdf.rect(margin, flagsBoxY + 3, 3, flagsTotalH - 6, "F");

      y = flagsBoxY + 8;

      ai.redFlags.forEach((flag) => {
        ensureSpace(16);
        // Bullet
        pdf.setFillColor(...C.critical);
        pdf.circle(margin + 10, y - 1.2, 1.5, "F");
        drawWrappedText(flag, margin + 16, { size: 8.5, color: [153, 27, 27], maxWidth: contentWidth - 28 });
        y += 3;
      });

      y += 6;
    }

    // ── Positive Aspects ──────────────────────────────────────────────────
    if (ai.positiveAspects && ai.positiveAspects.length > 0) {
      drawSectionTitle(`Positive Aspects (${ai.positiveAspects.length})`);

      let posTotalH = 10;
      ai.positiveAspects.forEach(a => {
        const al = measureLines(a, 8.5, contentWidth - 28);
        posTotalH += al.length * lineH(8.5) + 5;
      });

      ensureSpace(Math.min(posTotalH + 10, 100));

      const posBoxY = y;

      pdf.setFillColor(240, 253, 244);
      pdf.roundedRect(margin, posBoxY, contentWidth, posTotalH, 3, 3, "F");
      pdf.setDrawColor(134, 239, 172);
      pdf.setLineWidth(0.4);
      pdf.roundedRect(margin, posBoxY, contentWidth, posTotalH, 3, 3, "S");
      pdf.setLineWidth(0.2);
      pdf.setFillColor(...C.safe);
      pdf.rect(margin, posBoxY + 3, 3, posTotalH - 6, "F");

      y = posBoxY + 8;

      ai.positiveAspects.forEach((aspect) => {
        ensureSpace(16);
        pdf.setFillColor(...C.safe);
        pdf.circle(margin + 10, y - 1.2, 1.5, "F");
        drawWrappedText(aspect, margin + 16, { size: 8.5, color: [21, 128, 61], maxWidth: contentWidth - 28 });
        y += 3;
      });

      y += 6;
    }

    // ── Discrepancies ─────────────────────────────────────────────────────
    if (ai.discrepancies && ai.discrepancies.length > 0) {
      drawSectionTitle(`PDF vs Code Discrepancies (${ai.discrepancies.length})`);

      ai.discrepancies.forEach((disc) => {
        // Pre-measure card height
        let cardH = 18;
        if (disc.description) {
          const dl = measureLines(disc.description, 8, contentWidth - 24);
          cardH += dl.length * lineH(8) + 4;
        }
        if (disc.pdfClaim) {
          const pl = measureLines(`PDF Claim: ${disc.pdfClaim}`, 7.5, contentWidth - 28);
          cardH += pl.length * lineH(7.5) + 4;
        }
        if (disc.codeReality) {
          const rl = measureLines(`Code Reality: ${disc.codeReality}`, 7.5, contentWidth - 28);
          cardH += rl.length * lineH(7.5) + 4;
        }
        if (disc.impact) {
          const il = measureLines(`Impact: ${disc.impact}`, 7.5, contentWidth - 28);
          cardH += il.length * lineH(7.5) + 4;
        }
        cardH += 6;

        ensureSpace(cardH + 6);

        const sev = sevStyle(disc.severity);
        drawCard(margin, y, contentWidth, cardH, { accentColor: sev.fg });

        const cardTop = y;
        y += 10;

        // Badge + Title
        const bw = drawBadge(sev.label, margin + 10, y, sev.bg, sev.fg);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9.5);
        pdf.setTextColor(...C.text);
        pdf.text(formatKey(disc.type || "Unknown"), margin + 12 + bw + 4, y);
        y += 6;

        if (disc.description) {
          drawWrappedText(disc.description, margin + 10, { size: 8, color: C.textMuted, maxWidth: contentWidth - 24 });
          y += 2;
        }

        if (disc.pdfClaim) {
          pdf.setFillColor(...C.lowBg);
          const claimLines = measureLines(`PDF Claim: ${disc.pdfClaim}`, 7.5, contentWidth - 28);
          const claimH = claimLines.length * lineH(7.5) + 6;
          pdf.roundedRect(margin + 8, y - 2, contentWidth - 18, claimH, 2, 2, "F");
          y += 2;
          drawWrappedText(`PDF Claim: ${disc.pdfClaim}`, margin + 12, { size: 7.5, color: C.low, maxWidth: contentWidth - 28 });
          y += 2;
        }

        if (disc.codeReality) {
          pdf.setFillColor(...C.critBg);
          const realLines = measureLines(`Code Reality: ${disc.codeReality}`, 7.5, contentWidth - 28);
          const realH = realLines.length * lineH(7.5) + 6;
          pdf.roundedRect(margin + 8, y - 2, contentWidth - 18, realH, 2, 2, "F");
          y += 2;
          drawWrappedText(`Code Reality: ${disc.codeReality}`, margin + 12, { size: 7.5, color: C.critical, maxWidth: contentWidth - 28 });
          y += 2;
        }

        if (disc.impact) {
          y += 1;
          drawWrappedText(`Impact: ${disc.impact}`, margin + 10, { size: 7.5, color: [153, 27, 27], maxWidth: contentWidth - 24 });
        }

        y = cardTop + cardH + 5;
      });
    }

    // ── Security Vulnerabilities ──────────────────────────────────────────
    if (ai.vulnerabilities && ai.vulnerabilities.length > 0) {
      drawSectionTitle(`Security Vulnerabilities (${ai.vulnerabilities.length})`);

      const severityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      const sorted = [...ai.vulnerabilities].sort(
        (a, b) => (severityOrder[a.severity?.toUpperCase()] ?? 4) - (severityOrder[b.severity?.toUpperCase()] ?? 4)
      );

      sorted.forEach((vuln) => {
        // Pre-measure
        let cardH = 18;
        if (vuln.description) {
          const dl = measureLines(vuln.description, 8, contentWidth - 24);
          cardH += dl.length * lineH(8) + 4;
        }
        if (vuln.location) cardH += 12;
        if (vuln.exploit) {
          const el = measureLines(`Exploit: ${vuln.exploit}`, 7.5, contentWidth - 28);
          cardH += el.length * lineH(7.5) + 6;
        }
        if (vuln.recommendation) {
          const rl = measureLines(`Recommendation: ${vuln.recommendation}`, 7.5, contentWidth - 28);
          cardH += rl.length * lineH(7.5) + 6;
        }
        if (vuln.financialImpact) {
          const fl = measureLines(`Financial Impact: ${vuln.financialImpact}`, 7.5, contentWidth - 28);
          cardH += fl.length * lineH(7.5) + 6;
        }
        cardH += 8;

        ensureSpace(cardH + 6);

        const sev = sevStyle(vuln.severity);
        drawCard(margin, y, contentWidth, cardH, { accentColor: sev.fg });

        const cardTop = y;
        y += 10;

        // Badge + title
        const bw = drawBadge(sev.label, margin + 10, y, sev.bg, sev.fg);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9.5);
        pdf.setTextColor(...C.text);
        pdf.text(formatKey(vuln.type || "Unknown"), margin + 12 + bw + 4, y);
        y += 6;

        if (vuln.description) {
          drawWrappedText(vuln.description, margin + 10, { size: 8, color: C.textMuted, maxWidth: contentWidth - 24 });
          y += 2;
        }

        if (vuln.location) {
          pdf.setFillColor(...C.borderLt);
          pdf.roundedRect(margin + 8, y - 2, contentWidth - 18, 10, 2, 2, "F");
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(7);
          pdf.setTextColor(107, 33, 168);
          pdf.text(`Location: ${vuln.location}`, margin + 12, y + 4);
          y += 12;
        }

        if (vuln.exploit) {
          pdf.setFillColor(...C.highBg);
          const exLines = measureLines(`Exploit: ${vuln.exploit}`, 7.5, contentWidth - 28);
          const exH = exLines.length * lineH(7.5) + 6;
          pdf.roundedRect(margin + 8, y - 2, contentWidth - 18, exH, 2, 2, "F");
          y += 2;
          drawWrappedText(`Exploit: ${vuln.exploit}`, margin + 12, { size: 7.5, color: C.high, maxWidth: contentWidth - 28 });
          y += 2;
        }

        if (vuln.financialImpact) {
          pdf.setFillColor(...C.critBg);
          const fiLines = measureLines(`Financial Impact: ${vuln.financialImpact}`, 7.5, contentWidth - 28);
          const fiH = fiLines.length * lineH(7.5) + 6;
          pdf.roundedRect(margin + 8, y - 2, contentWidth - 18, fiH, 2, 2, "F");
          y += 2;
          drawWrappedText(`Financial Impact: ${vuln.financialImpact}`, margin + 12, { size: 7.5, color: C.critical, maxWidth: contentWidth - 28 });
          y += 2;
        }

        if (vuln.recommendation) {
          pdf.setFillColor(...C.safeBg);
          const rcLines = measureLines(`Recommendation: ${vuln.recommendation}`, 7.5, contentWidth - 28);
          const rcH = rcLines.length * lineH(7.5) + 6;
          pdf.roundedRect(margin + 8, y - 2, contentWidth - 18, rcH, 2, 2, "F");
          y += 2;
          drawWrappedText(`Recommendation: ${vuln.recommendation}`, margin + 12, { size: 7.5, color: C.safe, maxWidth: contentWidth - 28 });
          y += 2;
        }

        y = cardTop + cardH + 5;
      });
    }

    // ── Code Quality Issues ───────────────────────────────────────────────
    if (ai.codeQualityIssues && ai.codeQualityIssues.length > 0) {
      drawSectionTitle(`Code Quality Issues (${ai.codeQualityIssues.length})`);

      ai.codeQualityIssues.forEach((issue) => {
        let cardH = 16;
        if (issue.description) {
          const dl = measureLines(issue.description, 8, contentWidth - 24);
          cardH += dl.length * lineH(8) + 2;
        }
        if (issue.location) cardH += 10;
        if (issue.recommendation) {
          const rl = measureLines(`Fix: ${issue.recommendation}`, 7.5, contentWidth - 28);
          cardH += rl.length * lineH(7.5) + 6;
        }
        cardH += 8;

        ensureSpace(cardH + 4);

        const sev = sevStyle(issue.severity);
        drawCard(margin, y, contentWidth, cardH, { accentColor: sev.fg });

        const cardTop = y;
        y += 10;

        const bw = drawBadge(sev.label, margin + 10, y, sev.bg, sev.fg);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.setTextColor(...C.text);
        pdf.text(formatKey(issue.type || "Unknown"), margin + 12 + bw + 4, y);
        y += 6;

        if (issue.description) {
          drawWrappedText(issue.description, margin + 10, { size: 8, color: C.textMuted, maxWidth: contentWidth - 24 });
          y += 2;
        }

        if (issue.location) {
          pdf.setFillColor(...C.borderLt);
          pdf.roundedRect(margin + 8, y - 2, contentWidth - 18, 8, 1, 1, "F");
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(7);
          pdf.setTextColor(107, 33, 168);
          pdf.text(`Location: ${issue.location}`, margin + 12, y + 3);
          y += 10;
        }

        if (issue.recommendation) {
          pdf.setFillColor(...C.safeBg);
          const rl = measureLines(`Fix: ${issue.recommendation}`, 7.5, contentWidth - 28);
          const rH = rl.length * lineH(7.5) + 6;
          pdf.roundedRect(margin + 8, y - 2, contentWidth - 18, rH, 2, 2, "F");
          y += 2;
          drawWrappedText(`Fix: ${issue.recommendation}`, margin + 12, { size: 7.5, color: C.safe, maxWidth: contentWidth - 28 });
          y += 2;
        }

        y = cardTop + cardH + 4;
      });
    }

    // ── Tokenomics Verification ───────────────────────────────────────────
    if (ai.tokenomicsVerification && Object.keys(ai.tokenomicsVerification).length > 0) {
      drawSectionTitle("Tokenomics Verification");

      const entries = Object.entries(ai.tokenomicsVerification);
      const boolEntries = entries.filter(([, v]) => typeof v === "boolean") as [string, boolean][];
      const strEntries = entries.filter(([, v]) => typeof v === "string") as [string, string][];

      if (boolEntries.length > 0) {
        const colW = (contentWidth - 10) / 3;
        boolEntries.forEach(([key, value], idx) => {
          const col = idx % 3;
          if (col === 0) ensureSpace(20);
          const x = margin + col * (colW + 5);

          const isBadIfTrue = key.includes("Mismatch") || key.includes("unlimited") ||
            key.includes("canFreeze") || key.includes("canSeize") ||
            key.includes("Backdoor") || key.includes("Instant") ||
            key.includes("fake") || key.includes("has");
          const isBad = isBadIfTrue ? value : !value;

          const bg: RGB = isBad ? C.critBg : C.safeBg;
          const fg: RGB = isBad ? C.critical : C.safe;

          pdf.setFillColor(...bg);
          pdf.roundedRect(x, y, colW, 16, 2, 2, "F");
          drawSubLabel(formatKey(key), x + 5, y + 6);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(8);
          pdf.setTextColor(...fg);
          pdf.text(value ? "Yes" : "No", x + colW - 16, y + 12);

          if (col === 2 || idx === boolEntries.length - 1) y += 20;
        });
      }

      if (strEntries.length > 0) {
        const strColW = (contentWidth - 5) / 2;
        strEntries.forEach(([key, value], idx) => {
          const col = idx % 2;
          if (col === 0) ensureSpace(20);
          const x = margin + col * (strColW + 5);

          pdf.setFillColor(...C.cardBg);
          pdf.roundedRect(x, y, strColW, 16, 2, 2, "F");
          pdf.setDrawColor(...C.border);
          pdf.roundedRect(x, y, strColW, 16, 2, 2, "S");
          drawSubLabel(formatKey(key), x + 5, y + 6);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8);
          pdf.setTextColor(...C.text);
          const sv = value.length > 35 ? value.substring(0, 32) + "..." : value;
          pdf.text(sv, x + 5, y + 13);

          if (col === 1 || idx === strEntries.length - 1) y += 20;
        });
      }
    }

    // ── Tokenomics Analysis (quick mode) ──────────────────────────────────
    if (ai.tokenomicsAnalysis) {
      drawSectionTitle("Tokenomics Analysis");
      const ta = ai.tokenomicsAnalysis;

      const taItems = [
        ta.totalSupply && { label: "Total Supply", value: ta.totalSupply },
        ta.transactionFees && { label: "Tx Fees", value: ta.transactionFees },
        { label: "Mint Function", value: ta.hasMintFunction ? "Yes (Risk)" : "No" },
        { label: "Burn Function", value: ta.hasBurnFunction ? "Yes" : "No" },
      ].filter(Boolean) as { label: string; value: string }[];

      const taW = (contentWidth - (taItems.length - 1) * 5) / taItems.length;
      ensureSpace(28);
      taItems.forEach((item, i) => {
        const x = margin + i * (taW + 5);
        pdf.setFillColor(...C.cardBg);
        pdf.roundedRect(x, y, taW, 22, 2, 2, "F");
        pdf.setDrawColor(...C.border);
        pdf.roundedRect(x, y, taW, 22, 2, 2, "S");
        drawSubLabel(item.label, x + 5, y + 8);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(...C.text);
        const v = item.value.length > 18 ? item.value.substring(0, 16) + ".." : item.value;
        pdf.text(v, x + 5, y + 17);
      });
      y += 28;

      if (ta.ownerPrivileges && ta.ownerPrivileges.length > 0) {
        ensureSpace(ta.ownerPrivileges.length * 7 + 16);
        y += 4;
        drawSubLabel("OWNER PRIVILEGES", margin + 5, y);
        y += 5;
        ta.ownerPrivileges.forEach(priv => {
          ensureSpace(8);
          pdf.setFillColor(...C.highBg);
          pdf.circle(margin + 8, y - 1, 1.2, "F");
          drawWrappedText(priv, margin + 14, { size: 8, color: C.high, maxWidth: contentWidth - 20 });
          y += 2;
        });
        y += 4;
      }
    }

    // ── Final footer on last page ─────────────────────────────────────────
    addPageFooter();

    // ── Stamp total page count ────────────────────────────────────────────
    const totalPages = pdf.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      pdf.setPage(p);
      // Replace placeholder with actual total
      // This is a bit of a workaround - we will use putTotalPages
    }

    // jsPDF putTotalPages support
    if (typeof pdfExt.putTotalPages === "function") {
      pdfExt.putTotalPages(totalPagesPlaceholder);
    }

    // ── Save ──────────────────────────────────────────────────────────────
    const repoName = result.codeExtraction.repository.split("/").pop() || "contract";
    const timestamp = new Date().toISOString().split("T")[0];
    pdf.save(`${repoName}-security-report-${timestamp}.pdf`);
  };

  // Extract aiAnalysis from result
  const ai = result?.aiAnalysis;

  // =============================================================================
  // RENDER COMPONENTS
  // =============================================================================

  const renderMetadataCard = () => {
    if (!result) return null;
    const { metadata, pdfExtraction, codeExtraction } = result;

    return (
      <div className="bg-zinc-800/60 rounded-xl p-5 border border-zinc-700/50 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-xl">📊</span> Analysis Metadata
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900/50 rounded-lg p-3">
            <p className="text-xs text-zinc-400 mb-1">AI Model</p>
            <p className="text-white font-mono text-sm">{metadata.aiModel}</p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-3">
            <p className="text-xs text-zinc-400 mb-1">Analysis Mode</p>
            <p className="text-white font-mono text-sm capitalize">{metadata.analysisMode}</p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-3">
            <p className="text-xs text-zinc-400 mb-1">Duration</p>
            <p className="text-white font-mono text-sm">{metadata.duration}</p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-3">
            <p className="text-xs text-zinc-400 mb-1">Analyzed At</p>
            <p className="text-white font-mono text-sm">{new Date(metadata.analyzedAt).toLocaleString()}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* PDF Info */}
          {pdfExtraction && (
            <div className="bg-blue-950/30 border border-blue-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-blue-400">📄</span>
                <span className="text-blue-400 font-medium">PDF Extraction</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-zinc-400">File</p>
                  <p className="text-white text-sm truncate">{metadata.pdfFile}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">Pages</p>
                  <p className="text-white text-sm">{pdfExtraction.pages}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">Text Length</p>
                  <p className="text-white text-sm">{pdfExtraction.textLength.toLocaleString()}</p>
                </div>
              </div>
              {pdfExtraction.sectionsFound.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-zinc-400 mb-1">Sections Found</p>
                  <div className="flex flex-wrap gap-1">
                    {pdfExtraction.sectionsFound.map((section, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-blue-900/50 text-blue-300 text-xs rounded">
                        {section}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Code Info */}
          <div className="bg-violet-950/30 border border-violet-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-violet-400">💻</span>
              <span className="text-violet-400 font-medium">Code Extraction</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-zinc-400">Repository</p>
                <p className="text-white text-sm truncate">{codeExtraction.repository}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Files</p>
                <p className="text-white text-sm">{codeExtraction.filesAnalyzed}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Lines</p>
                <p className="text-white text-sm">{codeExtraction.totalLines.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRiskScore = () => {
    if (!ai?.riskScore) return null;
    const { overall, classification, confidence } = ai.riskScore;

    return (
      <div className={`p-6 rounded-xl border-2 ${getRiskClassColor(classification)} mb-6`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-1">Risk Assessment</h3>
            <p className="text-4xl font-bold">{classification || "Unknown"}</p>
          </div>
          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-zinc-400 text-xs uppercase tracking-wide mb-1">Trust Score</p>
              <p className={`text-4xl font-bold ${getScoreColor(overall)}`}>
                {overall?.toFixed(1) ?? "N/A"}
                <span className="text-lg text-zinc-500"></span>
              </p>
            </div>
            {confidence && (
              <div className="text-center">
                <p className="text-zinc-400 text-xs uppercase tracking-wide mb-1">Confidence</p>
                <p className="text-xl font-semibold text-white">{confidence}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSummary = () => {
    if (!ai?.summary) return null;

    return (
      <div className="bg-zinc-800/80 rounded-xl p-5 border border-zinc-700/50 mb-6">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <span className="text-xl">📋</span> Summary
        </h3>
        <p className="text-zinc-300 leading-relaxed">{ai.summary}</p>
      </div>
    );
  };

  const renderStatsSummary = () => {
    if (!ai) return null;

    const criticalVulns = countBySeverity(ai.vulnerabilities, "CRITICAL");
    const highVulns = countBySeverity(ai.vulnerabilities, "HIGH");
    const mediumVulns = countBySeverity(ai.vulnerabilities, "MEDIUM");
    const lowVulns = countBySeverity(ai.vulnerabilities, "LOW");
    
    const criticalDisc = countBySeverity(ai.discrepancies, "CRITICAL");
    const highDisc = countBySeverity(ai.discrepancies, "HIGH");

    const totalIssues = (ai.vulnerabilities?.length || 0) + 
                       (ai.discrepancies?.length || 0) + 
                       (ai.codeQualityIssues?.length || 0);

    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-zinc-800/60 rounded-lg p-4 border border-zinc-700/50 text-center">
          <p className="text-3xl font-bold text-white">{totalIssues}</p>
          <p className="text-xs text-zinc-400 mt-1">Total Issues</p>
        </div>
        <div className="bg-red-950/40 rounded-lg p-4 border border-red-900/50 text-center">
          <p className="text-3xl font-bold text-red-400">{criticalVulns + criticalDisc}</p>
          <p className="text-xs text-zinc-400 mt-1">Critical</p>
        </div>
        <div className="bg-orange-950/40 rounded-lg p-4 border border-orange-900/50 text-center">
          <p className="text-3xl font-bold text-orange-400">{highVulns + highDisc}</p>
          <p className="text-xs text-zinc-400 mt-1">High</p>
        </div>
        <div className="bg-yellow-950/40 rounded-lg p-4 border border-yellow-900/50 text-center">
          <p className="text-3xl font-bold text-yellow-400">{mediumVulns}</p>
          <p className="text-xs text-zinc-400 mt-1">Medium</p>
        </div>
        <div className="bg-blue-950/40 rounded-lg p-4 border border-blue-900/50 text-center">
          <p className="text-3xl font-bold text-blue-400">{lowVulns}</p>
          <p className="text-xs text-zinc-400 mt-1">Low</p>
        </div>
      </div>
    );
  };

  const renderRedFlags = () => {
    if (!ai?.redFlags || ai.redFlags.length === 0) return null;

    return (
      <div className="bg-red-950/30 rounded-xl p-5 border border-red-800/50 mb-6">
        <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
          <span className="text-xl">🚩</span> Red Flags ({ai.redFlags.length})
        </h3>
        <ul className="space-y-2 max-h-64 overflow-y-auto">
          {ai.redFlags.map((flag, idx) => (
            <li key={idx} className="flex items-start gap-3 text-zinc-300 text-sm">
              <span className="text-red-500 mt-0.5 flex-shrink-0">✖</span>
              <span>{flag}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderPositiveAspects = () => {
    if (!ai?.positiveAspects || ai.positiveAspects.length === 0) return null;

    return (
      <div className="bg-green-950/30 rounded-xl p-5 border border-green-800/50 mb-6">
        <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
          <span className="text-xl">✅</span> Positive Aspects ({ai.positiveAspects.length})
        </h3>
        <ul className="space-y-2">
          {ai.positiveAspects.map((aspect, idx) => (
            <li key={idx} className="flex items-start gap-3 text-zinc-300 text-sm">
              <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
              <span>{aspect}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderDiscrepancy = (disc: Discrepancy, idx: number) => (
    <details key={idx} className="bg-zinc-800/80 rounded-lg overflow-hidden border border-zinc-700/50 group">
      <summary className="p-4 cursor-pointer hover:bg-zinc-700/50 flex items-center gap-3 transition-colors">
        <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide ${getSeverityColor(disc.severity)}`}>
          {disc.severity || "UNKNOWN"}
        </span>
        <span className="text-white font-medium flex-1">{formatKey(disc.type || "Unknown Type")}</span>
        <svg className="w-5 h-5 text-zinc-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="p-4 border-t border-zinc-700 space-y-4 bg-zinc-900/50">
        {disc.description && (
          <div>
            <p className="text-sm font-medium text-zinc-400 mb-1">Description</p>
            <p className="text-zinc-200">{disc.description}</p>
          </div>
        )}
        {disc.pdfClaim && (
          <div className="bg-blue-950/40 border border-blue-800/50 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-400 mb-1">📄 PDF Claim</p>
            <p className="text-zinc-300 text-sm">{disc.pdfClaim}</p>
          </div>
        )}
        {disc.codeReality && (
          <div className="bg-red-950/40 border border-red-800/50 rounded-lg p-3">
            <p className="text-sm font-medium text-red-400 mb-1">⚠️ Code Reality</p>
            <p className="text-zinc-300 text-sm">{disc.codeReality}</p>
          </div>
        )}
        {disc.impact && (
          <div>
            <p className="text-sm font-medium text-zinc-400 mb-1">Impact</p>
            <p className="text-red-300">{disc.impact}</p>
          </div>
        )}
        {disc.codeLocation && (
          <div>
            <p className="text-sm font-medium text-zinc-400 mb-1">Location</p>
            <code className="text-violet-400 text-sm bg-zinc-900 px-2 py-1 rounded">{disc.codeLocation}</code>
          </div>
        )}
      </div>
    </details>
  );

  const renderVulnerability = (vuln: Vulnerability, idx: number) => (
    <details key={idx} className="bg-zinc-800/80 rounded-lg overflow-hidden border border-zinc-700/50 group">
      <summary className="p-4 cursor-pointer hover:bg-zinc-700/50 flex items-center gap-3 transition-colors">
        <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide ${getSeverityColor(vuln.severity)}`}>
          {vuln.severity || "UNKNOWN"}
        </span>
        <span className="text-white font-medium flex-1">{formatKey(vuln.type || "Unknown Type")}</span>
        <svg className="w-5 h-5 text-zinc-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="p-4 border-t border-zinc-700 space-y-4 bg-zinc-900/50">
        {vuln.description && (
          <div>
            <p className="text-sm font-medium text-zinc-400 mb-1">Description</p>
            <p className="text-zinc-200">{vuln.description}</p>
          </div>
        )}
        {vuln.exploit && (
          <div className="bg-orange-950/40 border border-orange-800/50 rounded-lg p-3">
            <p className="text-sm font-medium text-orange-400 mb-1">🔓 Exploit Vector</p>
            <p className="text-zinc-300 text-sm">{vuln.exploit}</p>
          </div>
        )}
        {vuln.financialImpact && (
          <div className="bg-red-950/40 border border-red-800/50 rounded-lg p-3">
            <p className="text-sm font-medium text-red-400 mb-1">💰 Financial Impact</p>
            <p className="text-zinc-300 text-sm">{vuln.financialImpact}</p>
          </div>
        )}
        {vuln.location && (
          <div>
            <p className="text-sm font-medium text-zinc-400 mb-1">Location</p>
            <code className="text-violet-400 text-sm bg-zinc-900 px-2 py-1 rounded">{vuln.location}</code>
          </div>
        )}
        {vuln.codeSnippet && (
          <div>
            <p className="text-sm font-medium text-zinc-400 mb-1">Code Snippet</p>
            <pre className="mt-1 p-4 bg-black rounded-lg text-xs text-green-400 overflow-x-auto font-mono border border-zinc-700 max-h-64 overflow-y-auto">
              {cleanCodeSnippet(vuln.codeSnippet)}
            </pre>
          </div>
        )}
        {vuln.recommendation && (
          <div className="bg-green-950/40 border border-green-800/50 rounded-lg p-3">
            <p className="text-sm font-medium text-green-400 mb-1">💡 Recommendation</p>
            <p className="text-zinc-300 text-sm">{vuln.recommendation}</p>
          </div>
        )}
      </div>
    </details>
  );

  const renderCodeQualityIssue = (issue: CodeQualityIssue, idx: number) => (
    <div key={idx} className="bg-zinc-800/60 rounded-lg p-4 border border-zinc-700/50">
      <div className="flex items-center gap-3 mb-2">
        <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide ${getSeverityColor(issue.severity)}`}>
          {issue.severity || "UNKNOWN"}
        </span>
        <span className="text-white font-medium">{formatKey(issue.type || "Unknown")}</span>
      </div>
      {issue.description && <p className="text-zinc-300 text-sm mb-2">{issue.description}</p>}
      {issue.location && (
        <code className="text-violet-400 text-xs bg-zinc-900 px-2 py-1 rounded block mb-2">{issue.location}</code>
      )}
      {issue.recommendation && (
        <p className="text-green-400 text-sm">💡 {issue.recommendation}</p>
      )}
    </div>
  );

  const renderTokenomicsVerification = () => {
    if (!ai?.tokenomicsVerification || typeof ai.tokenomicsVerification !== "object") return null;

    const tokenomics = ai.tokenomicsVerification;
    const entries = Object.entries(tokenomics);
    const booleanFields = entries.filter(([, v]) => typeof v === "boolean") as [string, boolean][];
    const stringFields = entries.filter(([, v]) => typeof v === "string") as [string, string][];

    if (booleanFields.length === 0 && stringFields.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-xl">📊</span> Tokenomics Verification
        </h3>
        <div className="space-y-4">
          {/* Boolean flags grid */}
          {booleanFields.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {booleanFields.map(([key, value]) => {
                // Determine if this flag being true is BAD
                const isBadIfTrue = key.includes("Mismatch") || key.includes("unlimited") || 
                  key.includes("canFreeze") || key.includes("canSeize") || 
                  key.includes("Backdoor") || key.includes("Instant") || 
                  key.includes("fake") || key.includes("has");
                const isBad = isBadIfTrue ? value : !value;
                
                return (
                  <div
                    key={key}
                    className={`p-3 rounded-lg border ${
                      isBad ? "bg-red-950/40 border-red-800/50" : "bg-green-950/40 border-green-800/50"
                    }`}
                  >
                    <p className="text-xs text-zinc-400 mb-1">{formatKey(key)}</p>
                    <p className={`font-semibold ${isBad ? "text-red-400" : "text-green-400"}`}>
                      {value ? "Yes" : "No"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* String fields */}
          {stringFields.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stringFields.map(([key, value]) => (
                <div key={key} className="bg-zinc-800/60 p-3 rounded-lg border border-zinc-700/50">
                  <p className="text-xs text-zinc-400 mb-1">{formatKey(key)}</p>
                  <p className="text-zinc-200 text-sm">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTokenomicsAnalysis = () => {
    if (!ai?.tokenomicsAnalysis) return null;
    const ta = ai.tokenomicsAnalysis;

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-xl">🪙</span> Tokenomics Analysis
        </h3>
        <div className="bg-zinc-800/60 rounded-lg p-4 border border-zinc-700/50 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ta.totalSupply && (
              <div>
                <p className="text-xs text-zinc-400 mb-1">Total Supply</p>
                <p className="text-white font-mono">{ta.totalSupply}</p>
              </div>
            )}
            {ta.transactionFees && (
              <div>
                <p className="text-xs text-zinc-400 mb-1">Transaction Fees</p>
                <p className="text-white">{ta.transactionFees}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-zinc-400 mb-1">Mint Function</p>
              <p className={ta.hasMintFunction ? "text-orange-400" : "text-green-400"}>
                {ta.hasMintFunction ? "Yes (Risk)" : "No"}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 mb-1">Burn Function</p>
              <p className="text-white">{ta.hasBurnFunction ? "Yes" : "No"}</p>
            </div>
          </div>
          {ta.ownerPrivileges && ta.ownerPrivileges.length > 0 && (
            <div>
              <p className="text-xs text-zinc-400 mb-2">Owner Privileges</p>
              <ul className="space-y-1">
                {ta.ownerPrivileges.map((priv, idx) => (
                  <li key={idx} className="text-orange-300 text-sm flex items-center gap-2">
                    <span className="text-orange-500">⚠</span>
                    {priv}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDiscrepancies = () => {
    if (!ai?.discrepancies || ai.discrepancies.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-xl">⚖️</span> PDF vs Code Discrepancies ({ai.discrepancies.length})
        </h3>
        <div className="space-y-3">
          {ai.discrepancies.map((disc, idx) => renderDiscrepancy(disc, idx))}
        </div>
      </div>
    );
  };

  const renderVulnerabilities = () => {
    if (!ai?.vulnerabilities || ai.vulnerabilities.length === 0) return null;

    // Sort by severity: CRITICAL > HIGH > MEDIUM > LOW
    const severityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    const sorted = [...ai.vulnerabilities].sort(
      (a, b) => (severityOrder[a.severity?.toUpperCase()] ?? 4) - (severityOrder[b.severity?.toUpperCase()] ?? 4)
    );

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-xl">🔓</span> Security Vulnerabilities ({ai.vulnerabilities.length})
        </h3>
        <div className="space-y-3">
          {sorted.map((vuln, idx) => renderVulnerability(vuln, idx))}
        </div>
      </div>
    );
  };

  const renderCodeQualityIssues = () => {
    if (!ai?.codeQualityIssues || ai.codeQualityIssues.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-xl">🛠️</span> Code Quality Issues ({ai.codeQualityIssues.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ai.codeQualityIssues.map((issue, idx) => renderCodeQualityIssue(issue, idx))}
        </div>
      </div>
    );
  };

  const renderRawResponse = () => {
    if (!result?.rawGeminiResponse) return null;

    return (
      <div className="mb-6">
        <button
          onClick={() => setShowRawResponse(!showRawResponse)}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-3"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showRawResponse ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span className="text-sm">Show Raw AI Response</span>
        </button>
        {showRawResponse && (
          <pre className="bg-black rounded-lg p-4 text-xs text-green-400 overflow-x-auto font-mono border border-zinc-700 max-h-96 overflow-y-auto whitespace-pre-wrap">
            {result.rawGeminiResponse}
          </pre>
        )}
      </div>
    );
  };

  const renderParseError = () => {
    if (!ai?.parseError) return null;

    return (
      <div className="bg-orange-950/50 border border-orange-800 rounded-xl p-5 mb-6">
        <h3 className="text-lg font-semibold text-orange-400 mb-2 flex items-center gap-2">
          <span className="text-xl">⚠️</span> Response Parsing Warning
        </h3>
        <p className="text-zinc-300 text-sm mb-3">
          {ai.error || "The AI response could not be fully parsed. Some data may be missing."}
        </p>
        <p className="text-zinc-400 text-sm">
          Please review the raw response below for complete analysis details.
        </p>
      </div>
    );
  };

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
      <h2 className="text-2xl font-bold text-white mb-4">Smart Contract Security Analysis</h2>
      <p className="text-zinc-400 mb-6">
        Upload a contract PDF and provide the GitHub repository link for AI-powered vulnerability analysis.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Contract PDF / Whitepaper</label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white file:text-black hover:file:bg-zinc-200 cursor-pointer"
          />
          {pdfFile && (
            <p className="text-zinc-400 text-sm mt-2">
              Selected: {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">GitHub Repository URL</label>
          <input
            type="url"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/username/repo"
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-6 bg-white hover:bg-zinc-200 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed text-black font-semibold rounded-lg transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Analyzing Contract (this may take 30-60 seconds)...
            </span>
          ) : (
            "Analyze Contract"
          )}
        </button>
      </form>

      {error && (
        <div className="mt-6 p-4 bg-red-950/50 border border-red-800 rounded-lg">
          <p className="text-red-300 font-medium">Error</p>
          <p className="text-red-400 text-sm mt-1">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-8">
          {/* Download PDF Button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={downloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF Report
            </button>
          </div>

          {/* Parse Error Warning */}
          {renderParseError()}

          {/* Metadata */}
          {renderMetadataCard()}

          {/* Risk Score - Most Important */}
          {renderRiskScore()}

          {/* Stats Summary */}
          {renderStatsSummary()}

          {/* Summary */}
          {renderSummary()}

          {/* Red Flags */}
          {renderRedFlags()}

          {/* Positive Aspects */}
          {renderPositiveAspects()}

          {/* Discrepancies (PDF vs Code) */}
          {renderDiscrepancies()}

          {/* Vulnerabilities */}
          {renderVulnerabilities()}

          {/* Code Quality Issues */}
          {renderCodeQualityIssues()}

          {/* Tokenomics Verification */}
          {renderTokenomicsVerification()}

          {/* Tokenomics Analysis (for quick mode) */}
          {renderTokenomicsAnalysis()}

          {/* Raw Response Toggle */}
          {renderRawResponse()}
        </div>
      )}
    </div>
  );
}
