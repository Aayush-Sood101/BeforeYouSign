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

      const response = await fetch("http://localhost:3000/api/analyze", {
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
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let y = 0;
    let pageNumber = 1;

    // Color palette
    const colors = {
      primary: [79, 70, 229] as [number, number, number],      // Indigo
      background: [250, 250, 252] as [number, number, number], // Light gray
      white: [255, 255, 255] as [number, number, number],
      black: [17, 24, 39] as [number, number, number],
      gray: [107, 114, 128] as [number, number, number],
      lightGray: [229, 231, 235] as [number, number, number],
      critical: [220, 38, 38] as [number, number, number],     // Red
      high: [234, 88, 12] as [number, number, number],         // Orange
      medium: [202, 138, 4] as [number, number, number],       // Yellow/Amber
      low: [37, 99, 235] as [number, number, number],          // Blue
      success: [22, 163, 74] as [number, number, number],      // Green
      danger: [185, 28, 28] as [number, number, number],       // Dark red
    };

    const getSeverityColors = (severity: string): { bg: [number, number, number]; text: [number, number, number] } => {
      const sev = (severity || "").toUpperCase();
      if (sev.includes("CRITICAL")) return { bg: [254, 226, 226], text: colors.critical };
      if (sev.includes("HIGH")) return { bg: [255, 237, 213], text: colors.high };
      if (sev.includes("MEDIUM")) return { bg: [254, 249, 195], text: colors.medium };
      if (sev.includes("LOW")) return { bg: [219, 234, 254], text: colors.low };
      return { bg: colors.lightGray, text: colors.gray };
    };

    const addPageBackground = () => {
      pdf.setFillColor(...colors.background);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");
    };

    const addHeader = () => {
      // Header bar
      pdf.setFillColor(...colors.primary);
      pdf.rect(0, 0, pageWidth, 35, "F");
      
      // Title
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.setTextColor(...colors.white);
      pdf.text("Smart Contract Security Report", margin, 22);
      
      // Subtitle
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(200, 200, 255);
      pdf.text("BeforeYouSign Security Analysis", pageWidth - margin - 70, 22);
      
      y = 45;
    };

    const addFooter = () => {
      pdf.setDrawColor(...colors.lightGray);
      pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(...colors.gray);
      pdf.text("Generated by BeforeYouSign", margin, pageHeight - 8);
      pdf.text(`Page ${pageNumber}`, pageWidth - margin - 15, pageHeight - 8);
    };

    const checkNewPage = (requiredSpace: number = 30) => {
      if (y > pageHeight - requiredSpace - 20) {
        addFooter();
        pdf.addPage();
        pageNumber++;
        addPageBackground();
        y = 20;
      }
    };

    const addSectionHeader = (title: string, icon?: string) => {
      checkNewPage(40);
      y += 8;
      
      // Section background bar
      pdf.setFillColor(...colors.primary);
      pdf.roundedRect(margin, y - 5, contentWidth, 12, 2, 2, "F");
      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(...colors.white);
      pdf.text(`${icon ? icon + "  " : ""}${title}`, margin + 5, y + 3);
      y += 15;
    };

    const addInfoBox = (label: string, value: string, x: number, width: number, bgColor: [number, number, number] = colors.white) => {
      pdf.setFillColor(...bgColor);
      pdf.roundedRect(x, y, width, 20, 2, 2, "F");
      pdf.setDrawColor(...colors.lightGray);
      pdf.roundedRect(x, y, width, 20, 2, 2, "S");
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(...colors.gray);
      pdf.text(label, x + 4, y + 7);
      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(...colors.black);
      const truncatedValue = value.length > 25 ? value.substring(0, 22) + "..." : value;
      pdf.text(truncatedValue, x + 4, y + 15);
    };

    const addText = (text: string, x: number, options: {
      size?: number;
      bold?: boolean;
      color?: [number, number, number];
      maxWidth?: number;
    } = {}) => {
      const { size = 9, bold = false, color = colors.black, maxWidth = contentWidth - 10 } = options;
      pdf.setFont("helvetica", bold ? "bold" : "normal");
      pdf.setFontSize(size);
      pdf.setTextColor(...color);
      
      const lines = pdf.splitTextToSize(text, maxWidth);
      lines.forEach((line: string) => {
        checkNewPage(15);
        pdf.text(line, x, y);
        y += size * 0.45;
      });
    };

    const addBadge = (text: string, x: number, bgColor: [number, number, number], textColor: [number, number, number]) => {
      const badgeWidth = pdf.getTextWidth(text) + 8;
      pdf.setFillColor(...bgColor);
      pdf.roundedRect(x, y - 4, badgeWidth, 7, 1.5, 1.5, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.setTextColor(...textColor);
      pdf.text(text, x + 4, y);
      return badgeWidth;
    };

    // =========================================================================
    // START BUILDING PDF
    // =========================================================================

    addPageBackground();
    addHeader();

    // Report Info Row
    pdf.setFillColor(...colors.white);
    pdf.roundedRect(margin, y, contentWidth, 28, 3, 3, "F");
    pdf.setDrawColor(...colors.lightGray);
    pdf.roundedRect(margin, y, contentWidth, 28, 3, 3, "S");
    
    const infoY = y + 5;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...colors.gray);
    pdf.text("Repository", margin + 5, infoY + 5);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...colors.black);
    pdf.text(result.codeExtraction.repository, margin + 5, infoY + 13);
    
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...colors.gray);
    pdf.text("Generated", pageWidth - margin - 45, infoY + 5);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...colors.black);
    pdf.text(new Date().toLocaleDateString(), pageWidth - margin - 45, infoY + 13);
    
    y += 35;

    // Risk Score Section
    if (ai.riskScore) {
      const riskCls = (ai.riskScore.classification || "").toUpperCase();
      const isHighRisk = riskCls.includes("HIGH") || riskCls.includes("CRITICAL") || riskCls.includes("SCAM");
      const isMediumRisk = riskCls.includes("MEDIUM") || riskCls.includes("SUSPICIOUS");
      
      const riskBg: [number, number, number] = isHighRisk ? [254, 242, 242] : isMediumRisk ? [255, 251, 235] : [240, 253, 244];
      const riskBorder: [number, number, number] = isHighRisk ? colors.critical : isMediumRisk ? colors.medium : colors.success;
      const riskText: [number, number, number] = isHighRisk ? colors.danger : isMediumRisk ? colors.medium : colors.success;
      
      pdf.setFillColor(...riskBg);
      pdf.roundedRect(margin, y, contentWidth, 45, 4, 4, "F");
      pdf.setDrawColor(...riskBorder);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(margin, y, contentWidth, 45, 4, 4, "S");
      pdf.setLineWidth(0.2);
      
      // Risk Label
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(...colors.gray);
      pdf.text("RISK CLASSIFICATION", margin + 10, y + 12);
      
      // Risk Value
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(22);
      pdf.setTextColor(...riskText);
      pdf.text(ai.riskScore.classification || "Unknown", margin + 10, y + 30);
      
      // Trust Score
      const scoreColor = (ai.riskScore.overall ?? 0) >= 7 ? colors.success : (ai.riskScore.overall ?? 0) >= 4 ? colors.medium : colors.critical;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(...colors.gray);
      pdf.text("Trust Score", pageWidth - margin - 50, y + 12);
      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(28);
      pdf.setTextColor(...scoreColor);
      pdf.text(`${ai.riskScore.overall?.toFixed(1) ?? "N/A"}`, pageWidth - margin - 50, y + 32);
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      pdf.setTextColor(...colors.gray);
      pdf.text("/10", pageWidth - margin - 25, y + 32);
      
      y += 55;
    }

    // Statistics Cards
    const criticalCount = countBySeverity(ai.vulnerabilities, "CRITICAL") + countBySeverity(ai.discrepancies, "CRITICAL");
    const highCount = countBySeverity(ai.vulnerabilities, "HIGH") + countBySeverity(ai.discrepancies, "HIGH");
    const mediumCount = countBySeverity(ai.vulnerabilities, "MEDIUM");
    const lowCount = countBySeverity(ai.vulnerabilities, "LOW");
    const totalIssues = (ai.vulnerabilities?.length || 0) + (ai.discrepancies?.length || 0) + (ai.codeQualityIssues?.length || 0);

    const statWidth = (contentWidth - 20) / 5;
    const statCards = [
      { label: "Total Issues", value: totalIssues.toString(), bg: [241, 245, 249] as [number, number, number], color: colors.black },
      { label: "Critical", value: criticalCount.toString(), bg: [254, 226, 226] as [number, number, number], color: colors.critical },
      { label: "High", value: highCount.toString(), bg: [255, 237, 213] as [number, number, number], color: colors.high },
      { label: "Medium", value: mediumCount.toString(), bg: [254, 249, 195] as [number, number, number], color: colors.medium },
      { label: "Low", value: lowCount.toString(), bg: [219, 234, 254] as [number, number, number], color: colors.low },
    ];

    statCards.forEach((stat, idx) => {
      const x = margin + idx * (statWidth + 5);
      pdf.setFillColor(...stat.bg);
      pdf.roundedRect(x, y, statWidth, 25, 2, 2, "F");
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(...colors.gray);
      pdf.text(stat.label, x + 5, y + 8);
      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(...stat.color);
      pdf.text(stat.value, x + 5, y + 20);
    });
    
    y += 35;

    // Metadata Section
    addSectionHeader("Analysis Details");
    
    const metaBoxWidth = (contentWidth - 15) / 4;
    addInfoBox("AI Model", result.metadata.aiModel, margin, metaBoxWidth);
    addInfoBox("Mode", result.metadata.analysisMode, margin + metaBoxWidth + 5, metaBoxWidth);
    addInfoBox("Duration", result.metadata.duration, margin + (metaBoxWidth + 5) * 2, metaBoxWidth);
    addInfoBox("Files", result.codeExtraction.filesAnalyzed.toString(), margin + (metaBoxWidth + 5) * 3, metaBoxWidth);
    y += 28;

    // Summary
    if (ai.summary) {
      addSectionHeader("Executive Summary");
      pdf.setFillColor(...colors.white);
      pdf.roundedRect(margin, y, contentWidth, 35, 3, 3, "F");
      pdf.setDrawColor(...colors.lightGray);
      pdf.roundedRect(margin, y, contentWidth, 35, 3, 3, "S");
      y += 8;
      addText(ai.summary, margin + 8, { size: 9, color: colors.black, maxWidth: contentWidth - 16 });
      y += 10;
    }

    // Red Flags
    if (ai.redFlags && ai.redFlags.length > 0) {
      addSectionHeader("Red Flags", "⚠");
      
      pdf.setFillColor(254, 242, 242);
      const flagsStartY = y;
      y += 8;
      
      ai.redFlags.forEach((flag) => {
        checkNewPage(20);
        pdf.setFillColor(...colors.critical);
        pdf.circle(margin + 8, y - 1, 1.5, "F");
        addText(flag, margin + 15, { size: 9, color: colors.danger, maxWidth: contentWidth - 20 });
        y += 2;
      });
      
      const flagsHeight = y - flagsStartY + 5;
      pdf.setFillColor(254, 242, 242);
      pdf.roundedRect(margin, flagsStartY - 5, contentWidth, flagsHeight, 3, 3, "F");
      pdf.setDrawColor(252, 165, 165);
      pdf.roundedRect(margin, flagsStartY - 5, contentWidth, flagsHeight, 3, 3, "S");
      
      y += 5;
    }

    // Positive Aspects
    if (ai.positiveAspects && ai.positiveAspects.length > 0) {
      addSectionHeader("Positive Aspects", "✓");
      
      const posStartY = y;
      y += 8;
      
      ai.positiveAspects.forEach((aspect) => {
        checkNewPage(20);
        pdf.setFillColor(...colors.success);
        pdf.circle(margin + 8, y - 1, 1.5, "F");
        addText(aspect, margin + 15, { size: 9, color: [21, 128, 61], maxWidth: contentWidth - 20 });
        y += 2;
      });
      
      const posHeight = y - posStartY + 5;
      pdf.setFillColor(240, 253, 244);
      pdf.roundedRect(margin, posStartY - 5, contentWidth, posHeight, 3, 3, "F");
      pdf.setDrawColor(134, 239, 172);
      pdf.roundedRect(margin, posStartY - 5, contentWidth, posHeight, 3, 3, "S");
      
      y += 5;
    }

    // Discrepancies
    if (ai.discrepancies && ai.discrepancies.length > 0) {
      addSectionHeader(`Discrepancies (${ai.discrepancies.length})`);
      
      ai.discrepancies.forEach((disc) => {
        checkNewPage(60);
        
        const cardStartY = y;
        const sevColors = getSeverityColors(disc.severity);
        
        // Card background
        pdf.setFillColor(...colors.white);
        pdf.roundedRect(margin, y, contentWidth, 50, 3, 3, "F");
        pdf.setDrawColor(...colors.lightGray);
        pdf.roundedRect(margin, y, contentWidth, 50, 3, 3, "S");
        
        // Left accent bar
        pdf.setFillColor(...sevColors.text);
        pdf.rect(margin, y, 3, 50, "F");
        
        y += 10;
        
        // Badge
        addBadge(disc.severity || "UNKNOWN", margin + 10, sevColors.bg, sevColors.text);
        
        // Title
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(...colors.black);
        pdf.text(formatKey(disc.type || "Unknown"), margin + 45, y);
        y += 8;
        
        if (disc.description) {
          addText(disc.description, margin + 10, { size: 8, color: colors.gray, maxWidth: contentWidth - 20 });
        }
        
        if (disc.pdfClaim) {
          y += 2;
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(7);
          pdf.setTextColor(...colors.low);
          pdf.text("PDF Claim: ", margin + 10, y);
          pdf.setFont("helvetica", "normal");
          pdf.text(disc.pdfClaim.substring(0, 80), margin + 35, y);
          y += 4;
        }
        
        if (disc.codeReality) {
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(7);
          pdf.setTextColor(...colors.critical);
          pdf.text("Reality: ", margin + 10, y);
          pdf.setFont("helvetica", "normal");
          pdf.text(disc.codeReality.substring(0, 85), margin + 28, y);
        }
        
        y = cardStartY + 55;
      });
    }

    // Vulnerabilities
    if (ai.vulnerabilities && ai.vulnerabilities.length > 0) {
      addSectionHeader(`Security Vulnerabilities (${ai.vulnerabilities.length})`);
      
      const severityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      const sorted = [...ai.vulnerabilities].sort(
        (a, b) => (severityOrder[a.severity?.toUpperCase()] ?? 4) - (severityOrder[b.severity?.toUpperCase()] ?? 4)
      );
      
      sorted.forEach((vuln) => {
        checkNewPage(70);
        
        const cardStartY = y;
        const sevColors = getSeverityColors(vuln.severity);
        
        // Card
        pdf.setFillColor(...colors.white);
        pdf.roundedRect(margin, y, contentWidth, 60, 3, 3, "F");
        pdf.setDrawColor(...colors.lightGray);
        pdf.roundedRect(margin, y, contentWidth, 60, 3, 3, "S");
        
        // Accent
        pdf.setFillColor(...sevColors.text);
        pdf.rect(margin, y, 3, 60, "F");
        
        y += 10;
        
        // Badge and title
        addBadge(vuln.severity || "UNKNOWN", margin + 10, sevColors.bg, sevColors.text);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(...colors.black);
        pdf.text(formatKey(vuln.type || "Unknown"), margin + 45, y);
        y += 8;
        
        if (vuln.description) {
          addText(vuln.description.substring(0, 200), margin + 10, { size: 8, color: colors.gray, maxWidth: contentWidth - 20 });
        }
        
        y += 3;
        
        if (vuln.location) {
          pdf.setFillColor(243, 244, 246);
          pdf.roundedRect(margin + 10, y - 3, contentWidth - 25, 8, 1, 1, "F");
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(7);
          pdf.setTextColor(107, 33, 168);
          pdf.text(`Location: ${vuln.location}`, margin + 13, y + 2);
          y += 8;
        }
        
        if (vuln.recommendation) {
          y += 2;
          pdf.setFillColor(240, 253, 244);
          pdf.roundedRect(margin + 10, y - 3, contentWidth - 25, 10, 1, 1, "F");
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(7);
          pdf.setTextColor(...colors.success);
          const recText = vuln.recommendation.length > 100 ? vuln.recommendation.substring(0, 97) + "..." : vuln.recommendation;
          pdf.text(`Fix: ${recText}`, margin + 13, y + 3);
        }
        
        y = cardStartY + 65;
      });
    }

    // Code Quality Issues
    if (ai.codeQualityIssues && ai.codeQualityIssues.length > 0) {
      addSectionHeader(`Code Quality Issues (${ai.codeQualityIssues.length})`);
      
      ai.codeQualityIssues.forEach((issue) => {
        checkNewPage(35);
        
        const sevColors = getSeverityColors(issue.severity);
        
        pdf.setFillColor(...colors.white);
        pdf.roundedRect(margin, y, contentWidth, 28, 2, 2, "F");
        pdf.setDrawColor(...colors.lightGray);
        pdf.roundedRect(margin, y, contentWidth, 28, 2, 2, "S");
        pdf.setFillColor(...sevColors.text);
        pdf.rect(margin, y, 2, 28, "F");
        
        y += 8;
        addBadge(issue.severity || "UNKNOWN", margin + 8, sevColors.bg, sevColors.text);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.setTextColor(...colors.black);
        pdf.text(formatKey(issue.type || "Unknown"), margin + 40, y);
        y += 6;
        
        if (issue.description) {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8);
          pdf.setTextColor(...colors.gray);
          const desc = issue.description.length > 100 ? issue.description.substring(0, 97) + "..." : issue.description;
          pdf.text(desc, margin + 8, y + 2);
        }
        
        y += 18;
      });
    }

    // Tokenomics
    if (ai.tokenomicsVerification && Object.keys(ai.tokenomicsVerification).length > 0) {
      addSectionHeader("Tokenomics Verification");
      
      const entries = Object.entries(ai.tokenomicsVerification);
      const boolEntries = entries.filter(([, v]) => typeof v === "boolean");
      
      if (boolEntries.length > 0) {
        const colWidth = (contentWidth - 10) / 3;
        let col = 0;
        const startY = y;
        
        boolEntries.forEach(([key, value], idx) => {
          const isBadIfTrue = key.includes("Mismatch") || key.includes("unlimited") || 
            key.includes("canFreeze") || key.includes("canSeize") || 
            key.includes("Backdoor") || key.includes("Instant") || 
            key.includes("fake") || key.includes("has");
          const isBad = isBadIfTrue ? value : !value;
          
          const x = margin + col * (colWidth + 5);
          const boxY = startY + Math.floor(idx / 3) * 18;
          
          if (boxY > pageHeight - 40) {
            checkNewPage(30);
          }
          
          const bgColor: [number, number, number] = isBad ? [254, 242, 242] : [240, 253, 244];
          const textColor: [number, number, number] = isBad ? colors.critical : colors.success;
          
          pdf.setFillColor(...bgColor);
          pdf.roundedRect(x, boxY, colWidth, 14, 2, 2, "F");
          
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(7);
          pdf.setTextColor(...colors.gray);
          pdf.text(formatKey(key), x + 4, boxY + 5);
          
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(8);
          pdf.setTextColor(...textColor);
          pdf.text(value ? "Yes" : "No", x + colWidth - 15, boxY + 10);
          
          col = (col + 1) % 3;
          if (col === 0) y = boxY + 18;
        });
        
        y += 20;
      }
    }

    // Add footer to last page
    addFooter();

    // Save the PDF
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
