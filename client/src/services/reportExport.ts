/**
 * Arthur D. Little - Global Health Platform
 * Report Export Service
 * 
 * Generates professionally formatted PDF and Word documents
 * with personalized filenames including user name, report details, and timestamp
 * 
 * Re-applied: 2026-01-31
 */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from "docx";
import { saveAs } from "file-saver";

// ADL Brand Colors
const ADL_COLORS = {
  primary: "#6366f1", // Indigo
  secondary: "#8b5cf6", // Purple
  text: "#1e293b",
  lightText: "#64748b",
  background: "#f8fafc",
  accent: "#0ea5e9",
};

interface ExportOptions {
  userName: string;
  countryName: string;
  topicName: string;
  report: string;
}

/**
 * Generate filename with user name, report details and timestamp
 */
function generateFilename(userName: string, countryName: string, topicName: string, extension: string): string {
  const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_").substring(0, 30);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19);
  
  const safeUserName = sanitize(userName);
  const safeCountry = sanitize(countryName);
  const safeTopic = sanitize(topicName.split(" ").slice(0, 3).join(" "));
  
  return `${safeUserName}_${safeCountry}_${safeTopic}_${timestamp}.${extension}`;
}

/**
 * Parse markdown report into structured sections
 */
function parseReport(report: string): Array<{ level: number; title: string; content: string }> {
  const lines = report.split("\n");
  const sections: Array<{ level: number; title: string; content: string }> = [];
  let currentSection: { level: number; title: string; content: string } | null = null;
  let contentBuffer: string[] = [];

  for (const line of lines) {
    const h1Match = line.match(/^#\s+(.+)$/);
    const h2Match = line.match(/^##\s+(.+)$/);
    const h3Match = line.match(/^###\s+(.+)$/);

    if (h1Match || h2Match || h3Match) {
      if (currentSection) {
        currentSection.content = contentBuffer.join("\n").trim();
        sections.push(currentSection);
      }
      currentSection = {
        level: h1Match ? 1 : h2Match ? 2 : 3,
        title: h1Match?.[1] || h2Match?.[1] || h3Match?.[1] || "",
        content: "",
      };
      contentBuffer = [];
    } else {
      contentBuffer.push(line);
    }
  }

  if (currentSection) {
    currentSection.content = contentBuffer.join("\n").trim();
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Strip markdown formatting from text
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/^- /gm, "• ")
    .replace(/^#+\s*/gm, "");
}

/**
 * Export report as PDF
 */
export async function exportToPDF(options: ExportOptions): Promise<void> {
  const { userName, countryName, topicName, report } = options;
  const sections = parseReport(report);
  
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Helper to add new page if needed
  const checkPageBreak = (requiredSpace: number = 30) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Title page
  doc.setFillColor(99, 102, 241); // Indigo gradient start
  doc.rect(0, 0, pageWidth, 80, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("Arthur D. Little", margin, 25);
  doc.text("Global Occupational Health Intelligence Platform", margin, 32);
  
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(topicName, margin, 55, { maxWidth: contentWidth });
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(countryName, margin, 70);

  yPosition = 100;

  // Metadata box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, yPosition, contentWidth, 35, 3, 3, "F");
  
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.text("Prepared for:", margin + 5, yPosition + 10);
  doc.text("Generated:", margin + 5, yPosition + 20);
  doc.text("Report Type:", margin + 5, yPosition + 30);
  
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(userName, margin + 35, yPosition + 10);
  doc.text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }), margin + 35, yPosition + 20);
  doc.text("Country Deep Dive Analysis", margin + 35, yPosition + 30);

  yPosition += 50;

  // Content sections
  for (const section of sections) {
    checkPageBreak(40);

    // Section heading
    if (section.level === 1) {
      doc.setFillColor(99, 102, 241);
      doc.rect(margin, yPosition, 4, 8, "F");
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(section.title, margin + 8, yPosition + 6);
      yPosition += 15;
    } else if (section.level === 2) {
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(section.title, margin, yPosition + 5);
      yPosition += 12;
    } else {
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(section.title, margin, yPosition + 5);
      yPosition += 10;
    }

    // Section content
    if (section.content) {
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      const cleanContent = stripMarkdown(section.content);
      const lines = doc.splitTextToSize(cleanContent, contentWidth);
      
      for (const line of lines) {
        checkPageBreak(8);
        doc.text(line, margin, yPosition);
        yPosition += 5;
      }
      yPosition += 5;
    }
  }

  // Footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.text(
      `Arthur D. Little | ${countryName} - ${topicName} | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  // Save
  const filename = generateFilename(userName, countryName, topicName, "pdf");
  doc.save(filename);
}

/**
 * Export report as Word document
 */
export async function exportToWord(options: ExportOptions): Promise<void> {
  const { userName, countryName, topicName, report } = options;
  const sections = parseReport(report);

  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Arthur D. Little",
          bold: true,
          size: 20,
          color: "6366f1",
        }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Global Occupational Health Intelligence Platform",
          size: 18,
          color: "64748b",
        }),
      ],
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: topicName,
          bold: true,
          size: 48,
          color: "1e293b",
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: countryName,
          size: 28,
          color: "64748b",
        }),
      ],
      spacing: { after: 600 },
    })
  );

  // Metadata
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Prepared for: ", color: "64748b", size: 20 }),
        new TextRun({ text: userName, bold: true, size: 20 }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Generated: ", color: "64748b", size: 20 }),
        new TextRun({
          text: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          bold: true,
          size: 20,
        }),
      ],
      spacing: { after: 400 },
    })
  );

  // Add a divider
  children.push(
    new Paragraph({
      border: {
        bottom: { color: "e2e8f0", size: 1, style: BorderStyle.SINGLE },
      },
      spacing: { after: 400 },
    })
  );

  // Content sections
  for (const section of sections) {
    // Heading
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: section.title,
            bold: true,
            size: section.level === 1 ? 32 : section.level === 2 ? 26 : 22,
            color: section.level === 1 ? "6366f1" : "1e293b",
          }),
        ],
        heading: section.level === 1 ? HeadingLevel.HEADING_1 : section.level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
        spacing: { before: section.level === 1 ? 400 : 300, after: 200 },
      })
    );

    // Content paragraphs
    if (section.content) {
      const paragraphs = section.content.split("\n\n");
      for (const para of paragraphs) {
        const cleanPara = stripMarkdown(para.trim());
        if (cleanPara) {
          // Check for bullet points
          if (cleanPara.startsWith("•")) {
            const items = cleanPara.split("\n").filter((l) => l.trim());
            for (const item of items) {
              children.push(
                new Paragraph({
                  children: [new TextRun({ text: item, size: 22, color: "334155" })],
                  bullet: { level: 0 },
                  spacing: { after: 100 },
                })
              );
            }
          } else {
            children.push(
              new Paragraph({
                children: [new TextRun({ text: cleanPara, size: 22, color: "334155" })],
                spacing: { after: 200 },
              })
            );
          }
        }
      }
    }
  }

  // Footer
  children.push(
    new Paragraph({
      border: {
        top: { color: "e2e8f0", size: 1, style: BorderStyle.SINGLE },
      },
      spacing: { before: 600 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `© ${new Date().getFullYear()} Arthur D. Little. All rights reserved.`,
          size: 16,
          color: "94a3b8",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
    })
  );

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  // Generate and save
  const blob = await Packer.toBlob(doc);
  const filename = generateFilename(userName, countryName, topicName, "docx");
  saveAs(blob, filename);
}

// =============================================================================
// BEST PRACTICES EXPORT INTERFACES
// =============================================================================

export interface BestPracticeExportOptions {
  userName: string;
  pillarName: string;
  questionTitle: string;
  questionText: string;
  bestPracticeOverview: string;
  keyPrinciples: { title: string; description: string }[];
  implementationElements: { element: string; description: string; examples?: string }[];
  successFactors: string[];
  commonPitfalls: string[];
  topCountries: { name: string; rank: number; score: number; summary: string }[];
  generatedAt?: string;
}

export interface CountryBestPracticeExportOptions {
  userName: string;
  countryName: string;
  questionTitle: string;
  pillarName: string;
  rank?: number;
  score?: number;
  approachDescription: string;
  whyBestPractice: string;
  keyMetrics: { metric: string; value: string; context: string }[];
  policyHighlights: { policy: string; description: string; yearEnacted?: string }[];
  lessonsLearned: string;
  transferability: string;
  generatedAt?: string;
}

// =============================================================================
// BEST PRACTICE OVERVIEW EXPORT (PDF)
// =============================================================================

export async function exportBestPracticeToPDF(options: BestPracticeExportOptions): Promise<void> {
  const {
    userName,
    pillarName,
    questionTitle,
    questionText,
    bestPracticeOverview,
    keyPrinciples,
    implementationElements,
    successFactors,
    commonPitfalls,
    topCountries,
    generatedAt,
  } = options;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  const checkPageBreak = (requiredSpace: number = 30) => {
    if (yPosition + requiredSpace > pageHeight - margin - 15) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // ===== TITLE PAGE =====
  // Header gradient
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, pageWidth, 85, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Arthur D. Little", margin, 20);
  doc.setFontSize(9);
  doc.text("Global Occupational Health Intelligence Platform", margin, 26);

  // Document type badge
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, 35, 50, 8, 2, 2, "F");
  doc.setTextColor(99, 102, 241);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("BEST PRACTICE GUIDE", margin + 3, 40.5);

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(questionTitle, contentWidth);
  doc.text(titleLines, margin, 58);

  // Pillar name
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(pillarName, margin, 78);

  yPosition = 100;

  // Question box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, yPosition, contentWidth, 25, 3, 3, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, yPosition, contentWidth, 25, 3, 3, "S");

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("STRATEGIC QUESTION", margin + 5, yPosition + 7);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const questionLines = doc.splitTextToSize(questionText, contentWidth - 10);
  doc.text(questionLines, margin + 5, yPosition + 14);

  yPosition += 35;

  // Metadata
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.text(`Prepared for: ${userName}`, margin, yPosition);
  doc.text(`Generated: ${generatedAt ? new Date(generatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, margin + 80, yPosition);

  yPosition += 15;

  // ===== BEST PRACTICE OVERVIEW =====
  checkPageBreak(50);
  doc.setFillColor(99, 102, 241);
  doc.rect(margin, yPosition, 4, 10, "F");
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Best Practice Overview", margin + 8, yPosition + 7);
  yPosition += 18;

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const overviewLines = doc.splitTextToSize(bestPracticeOverview || "", contentWidth);
  for (const line of overviewLines) {
    checkPageBreak(6);
    doc.text(line, margin, yPosition);
    yPosition += 5;
  }
  yPosition += 10;

  // ===== KEY PRINCIPLES =====
  if (keyPrinciples && keyPrinciples.length > 0) {
    checkPageBreak(40);
    doc.setFillColor(99, 102, 241);
    doc.rect(margin, yPosition, 4, 10, "F");
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Key Principles", margin + 8, yPosition + 7);
    yPosition += 18;

    for (const principle of keyPrinciples) {
      checkPageBreak(20);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, yPosition, contentWidth, 18, 2, 2, "F");

      doc.setTextColor(99, 102, 241);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(principle.title, margin + 4, yPosition + 6);

      doc.setTextColor(71, 85, 105);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const descLines = doc.splitTextToSize(principle.description, contentWidth - 8);
      doc.text(descLines.slice(0, 2).join(" "), margin + 4, yPosition + 12);
      yPosition += 22;
    }
    yPosition += 5;
  }

  // ===== IMPLEMENTATION GUIDE =====
  if (implementationElements && implementationElements.length > 0) {
    checkPageBreak(40);
    doc.setFillColor(99, 102, 241);
    doc.rect(margin, yPosition, 4, 10, "F");
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Implementation Guide", margin + 8, yPosition + 7);
    yPosition += 18;

    implementationElements.forEach((elem, idx) => {
      checkPageBreak(25);

      // Step number circle
      doc.setFillColor(99, 102, 241);
      doc.circle(margin + 5, yPosition + 3, 4, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(String(idx + 1), margin + 3.5, yPosition + 5);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(elem.element, margin + 14, yPosition + 5);

      doc.setTextColor(71, 85, 105);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const elemLines = doc.splitTextToSize(elem.description, contentWidth - 14);
      yPosition += 10;
      for (const line of elemLines.slice(0, 3)) {
        doc.text(line, margin + 14, yPosition);
        yPosition += 4.5;
      }
      yPosition += 8;
    });
  }

  // ===== SUCCESS FACTORS =====
  if (successFactors && successFactors.length > 0) {
    checkPageBreak(40);
    doc.setFillColor(34, 197, 94);
    doc.rect(margin, yPosition, 4, 10, "F");
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Success Factors", margin + 8, yPosition + 7);
    yPosition += 18;

    for (const factor of successFactors) {
      checkPageBreak(10);
      doc.setTextColor(34, 197, 94);
      doc.setFontSize(10);
      doc.text("✓", margin, yPosition);
      doc.setTextColor(51, 65, 85);
      doc.setFont("helvetica", "normal");
      const factorLines = doc.splitTextToSize(factor, contentWidth - 10);
      doc.text(factorLines[0], margin + 6, yPosition);
      yPosition += 7;
    }
    yPosition += 5;
  }

  // ===== COMMON PITFALLS =====
  if (commonPitfalls && commonPitfalls.length > 0) {
    checkPageBreak(40);
    doc.setFillColor(239, 68, 68);
    doc.rect(margin, yPosition, 4, 10, "F");
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Common Pitfalls to Avoid", margin + 8, yPosition + 7);
    yPosition += 18;

    for (const pitfall of commonPitfalls) {
      checkPageBreak(10);
      doc.setTextColor(239, 68, 68);
      doc.setFontSize(10);
      doc.text("⚠", margin, yPosition);
      doc.setTextColor(51, 65, 85);
      doc.setFont("helvetica", "normal");
      const pitfallLines = doc.splitTextToSize(pitfall, contentWidth - 10);
      doc.text(pitfallLines[0], margin + 6, yPosition);
      yPosition += 7;
    }
    yPosition += 5;
  }

  // ===== GLOBAL LEADERS =====
  if (topCountries && topCountries.length > 0) {
    checkPageBreak(60);
    doc.setFillColor(99, 102, 241);
    doc.rect(margin, yPosition, 4, 10, "F");
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Global Leaders", margin + 8, yPosition + 7);
    yPosition += 18;

    autoTable(doc, {
      startY: yPosition,
      head: [["Rank", "Country", "Score", "Key Approach"]],
      body: topCountries.map((c) => [
        `#${c.rank}`,
        c.name,
        `${c.score}/100`,
        c.summary?.substring(0, 80) + (c.summary?.length > 80 ? "..." : ""),
      ]),
      theme: "grid",
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [51, 65, 85],
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 30 },
        2: { cellWidth: 20 },
        3: { cellWidth: "auto" },
      },
      margin: { left: margin, right: margin },
    });
  }

  // ===== FOOTER ON ALL PAGES =====
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7);
    doc.text(
      `Arthur D. Little | Best Practice Guide: ${questionTitle} | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 12,
      { align: "center" }
    );
    doc.text("Confidential", pageWidth / 2, pageHeight - 8, { align: "center" });
  }

  // Save
  const filename = generateFilename(userName, pillarName, questionTitle, "pdf");
  doc.save(filename);
}

// =============================================================================
// BEST PRACTICE OVERVIEW EXPORT (WORD)
// =============================================================================

export async function exportBestPracticeToWord(options: BestPracticeExportOptions): Promise<void> {
  const {
    userName,
    pillarName,
    questionTitle,
    questionText,
    bestPracticeOverview,
    keyPrinciples,
    implementationElements,
    successFactors,
    commonPitfalls,
    topCountries,
    generatedAt,
  } = options;

  const children: Paragraph[] = [];

  // Header
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Arthur D. Little", bold: true, size: 20, color: "6366f1" }),
      ],
      spacing: { after: 50 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Global Occupational Health Intelligence Platform", size: 18, color: "64748b" }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "BEST PRACTICE GUIDE", bold: true, size: 18, color: "6366f1" }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: questionTitle, bold: true, size: 44, color: "1e293b" }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: pillarName, size: 24, color: "64748b" }),
      ],
      spacing: { after: 300 },
    })
  );

  // Question box
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "STRATEGIC QUESTION: ", bold: true, size: 18, color: "64748b" }),
        new TextRun({ text: questionText, size: 20, color: "1e293b" }),
      ],
      spacing: { after: 200 },
      border: { bottom: { color: "e2e8f0", size: 1, style: BorderStyle.SINGLE } },
    })
  );

  // Metadata
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `Prepared for: ${userName}  |  Generated: ${generatedAt ? new Date(generatedAt).toLocaleDateString() : new Date().toLocaleDateString()}`, size: 18, color: "94a3b8" }),
      ],
      spacing: { after: 400 },
    })
  );

  // Best Practice Overview
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "Best Practice Overview", bold: true, size: 28, color: "6366f1" })],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: bestPracticeOverview || "", size: 22, color: "334155" })],
      spacing: { after: 300 },
    })
  );

  // Key Principles
  if (keyPrinciples && keyPrinciples.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Key Principles", bold: true, size: 28, color: "6366f1" })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );
    for (const principle of keyPrinciples) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: principle.title, bold: true, size: 22, color: "1e293b" }),
            new TextRun({ text: `: ${principle.description}`, size: 22, color: "475569" }),
          ],
          bullet: { level: 0 },
          spacing: { after: 150 },
        })
      );
    }
  }

  // Implementation Guide
  if (implementationElements && implementationElements.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Implementation Guide", bold: true, size: 28, color: "6366f1" })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );
    implementationElements.forEach((elem, idx) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${idx + 1}. ${elem.element}`, bold: true, size: 22, color: "1e293b" }),
          ],
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          children: [new TextRun({ text: elem.description, size: 20, color: "475569" })],
          spacing: { after: 100 },
        })
      );
      if (elem.examples) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Examples: ", italics: true, size: 18, color: "64748b" }),
              new TextRun({ text: elem.examples, italics: true, size: 18, color: "64748b" }),
            ],
            spacing: { after: 150 },
          })
        );
      }
    });
  }

  // Success Factors
  if (successFactors && successFactors.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Success Factors", bold: true, size: 28, color: "22c55e" })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );
    for (const factor of successFactors) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `✓ ${factor}`, size: 22, color: "334155" })],
          spacing: { after: 100 },
        })
      );
    }
  }

  // Common Pitfalls
  if (commonPitfalls && commonPitfalls.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Common Pitfalls to Avoid", bold: true, size: 28, color: "ef4444" })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );
    for (const pitfall of commonPitfalls) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `⚠ ${pitfall}`, size: 22, color: "334155" })],
          spacing: { after: 100 },
        })
      );
    }
  }

  // Global Leaders
  if (topCountries && topCountries.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Global Leaders", bold: true, size: 28, color: "6366f1" })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );
    for (const country of topCountries) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `#${country.rank} ${country.name}`, bold: true, size: 22, color: "1e293b" }),
            new TextRun({ text: ` (Score: ${country.score}/100)`, size: 20, color: "64748b" }),
          ],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [new TextRun({ text: country.summary || "", size: 20, color: "475569" })],
          spacing: { after: 200 },
        })
      );
    }
  }

  // Footer
  children.push(
    new Paragraph({
      border: { top: { color: "e2e8f0", size: 1, style: BorderStyle.SINGLE } },
      spacing: { before: 600 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `© ${new Date().getFullYear()} Arthur D. Little. All rights reserved. | Confidential`, size: 16, color: "94a3b8" }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
    })
  );

  const doc = new Document({ sections: [{ properties: {}, children }] });
  const blob = await Packer.toBlob(doc);
  const filename = generateFilename(userName, pillarName, questionTitle, "docx");
  saveAs(blob, filename);
}

// =============================================================================
// COUNTRY BEST PRACTICE EXPORT (PDF)
// =============================================================================

export async function exportCountryBestPracticeToPDF(options: CountryBestPracticeExportOptions): Promise<void> {
  const {
    userName,
    countryName,
    questionTitle,
    pillarName,
    rank,
    score,
    approachDescription,
    whyBestPractice,
    keyMetrics,
    policyHighlights,
    lessonsLearned,
    transferability,
    generatedAt,
  } = options;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  const checkPageBreak = (requiredSpace: number = 30) => {
    if (yPosition + requiredSpace > pageHeight - margin - 15) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // ===== TITLE PAGE =====
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, pageWidth, 90, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Arthur D. Little", margin, 20);
  doc.setFontSize(9);
  doc.text("Global Occupational Health Intelligence Platform", margin, 26);

  // Document type badge
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, 35, 55, 8, 2, 2, "F");
  doc.setTextColor(99, 102, 241);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("COUNTRY CASE STUDY", margin + 3, 40.5);

  // Country name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text(countryName, margin, 62);

  // Rank and Score
  if (rank && score) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text(`Rank #${rank} | Score: ${score}/100`, margin, 75);
  }

  // Pillar
  doc.setFontSize(11);
  doc.text(pillarName, margin, 85);

  yPosition = 105;

  // Question box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, yPosition, contentWidth, 20, 3, 3, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, yPosition, contentWidth, 20, 3, 3, "S");

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("TOPIC", margin + 5, yPosition + 6);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const qLines = doc.splitTextToSize(questionTitle, contentWidth - 10);
  doc.text(qLines[0], margin + 5, yPosition + 14);

  yPosition += 30;

  // Metadata
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.text(`Prepared for: ${userName}  |  Generated: ${generatedAt ? new Date(generatedAt).toLocaleDateString() : new Date().toLocaleDateString()}`, margin, yPosition);
  yPosition += 15;

  // ===== HOW THEY ADDRESS IT =====
  checkPageBreak(50);
  doc.setFillColor(99, 102, 241);
  doc.rect(margin, yPosition, 4, 10, "F");
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("How They Address It", margin + 8, yPosition + 7);
  yPosition += 18;

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const approachLines = doc.splitTextToSize(approachDescription || "", contentWidth);
  for (const line of approachLines) {
    checkPageBreak(6);
    doc.text(line, margin, yPosition);
    yPosition += 5;
  }
  yPosition += 10;

  // ===== WHY IT'S BEST PRACTICE =====
  if (whyBestPractice) {
    checkPageBreak(50);
    doc.setFillColor(34, 197, 94);
    doc.rect(margin, yPosition, 4, 10, "F");
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Why It's Best Practice", margin + 8, yPosition + 7);
    yPosition += 18;

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const whyLines = doc.splitTextToSize(whyBestPractice, contentWidth);
    for (const line of whyLines) {
      checkPageBreak(6);
      doc.text(line, margin, yPosition);
      yPosition += 5;
    }
    yPosition += 10;
  }

  // ===== KEY METRICS =====
  if (keyMetrics && keyMetrics.length > 0) {
    checkPageBreak(60);
    doc.setFillColor(99, 102, 241);
    doc.rect(margin, yPosition, 4, 10, "F");
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Key Metrics", margin + 8, yPosition + 7);
    yPosition += 18;

    autoTable(doc, {
      startY: yPosition,
      head: [["Metric", "Value", "Context"]],
      body: keyMetrics.map((m) => [m.metric, m.value, m.context]),
      theme: "grid",
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: "bold",
      },
      bodyStyles: { fontSize: 9, textColor: [51, 65, 85] },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 30 },
        2: { cellWidth: "auto" },
      },
      margin: { left: margin, right: margin },
    });
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // ===== NOTABLE POLICIES =====
  if (policyHighlights && policyHighlights.length > 0) {
    checkPageBreak(40);
    doc.setFillColor(139, 92, 246);
    doc.rect(margin, yPosition, 4, 10, "F");
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Notable Policies", margin + 8, yPosition + 7);
    yPosition += 18;

    for (const policy of policyHighlights) {
      checkPageBreak(20);
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`• ${policy.policy}${policy.yearEnacted ? ` (${policy.yearEnacted})` : ""}`, margin, yPosition);
      yPosition += 6;
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const policyLines = doc.splitTextToSize(policy.description, contentWidth - 5);
      for (const line of policyLines.slice(0, 2)) {
        doc.text(line, margin + 3, yPosition);
        yPosition += 4.5;
      }
      yPosition += 5;
    }
  }

  // ===== LESSONS LEARNED =====
  if (lessonsLearned) {
    checkPageBreak(40);
    doc.setFillColor(245, 158, 11);
    doc.rect(margin, yPosition, 4, 10, "F");
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Lessons Learned", margin + 8, yPosition + 7);
    yPosition += 18;

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const lessonsLines = doc.splitTextToSize(lessonsLearned, contentWidth);
    for (const line of lessonsLines) {
      checkPageBreak(6);
      doc.text(line, margin, yPosition);
      yPosition += 5;
    }
    yPosition += 10;
  }

  // ===== HOW TO ADOPT =====
  if (transferability) {
    checkPageBreak(40);
    doc.setFillColor(14, 165, 233);
    doc.rect(margin, yPosition, 4, 10, "F");
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("How to Adopt This Approach", margin + 8, yPosition + 7);
    yPosition += 18;

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const transferLines = doc.splitTextToSize(transferability, contentWidth);
    for (const line of transferLines) {
      checkPageBreak(6);
      doc.text(line, margin, yPosition);
      yPosition += 5;
    }
  }

  // ===== FOOTER ON ALL PAGES =====
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7);
    doc.text(
      `Arthur D. Little | ${countryName} Case Study | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 12,
      { align: "center" }
    );
    doc.text("Confidential", pageWidth / 2, pageHeight - 8, { align: "center" });
  }

  const filename = generateFilename(userName, countryName, questionTitle, "pdf");
  doc.save(filename);
}

// =============================================================================
// COUNTRY BEST PRACTICE EXPORT (WORD)
// =============================================================================

export async function exportCountryBestPracticeToWord(options: CountryBestPracticeExportOptions): Promise<void> {
  const {
    userName,
    countryName,
    questionTitle,
    pillarName,
    rank,
    score,
    approachDescription,
    whyBestPractice,
    keyMetrics,
    policyHighlights,
    lessonsLearned,
    transferability,
    generatedAt,
  } = options;

  const children: Paragraph[] = [];

  // Header
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "Arthur D. Little", bold: true, size: 20, color: "6366f1" })],
      spacing: { after: 50 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Global Occupational Health Intelligence Platform", size: 18, color: "64748b" })],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "COUNTRY CASE STUDY", bold: true, size: 18, color: "6366f1" })],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: countryName, bold: true, size: 48, color: "1e293b" })],
      spacing: { after: 100 },
    })
  );

  // Rank and Score
  if (rank && score) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Rank #${rank} | Score: ${score}/100`, size: 24, color: "64748b" })],
        spacing: { after: 100 },
      })
    );
  }

  children.push(
    new Paragraph({
      children: [new TextRun({ text: pillarName, size: 22, color: "64748b" })],
      spacing: { after: 300 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Topic: ", bold: true, size: 20, color: "64748b" }),
        new TextRun({ text: questionTitle, size: 20, color: "1e293b" }),
      ],
      border: { bottom: { color: "e2e8f0", size: 1, style: BorderStyle.SINGLE } },
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Prepared for: ${userName}  |  Generated: ${generatedAt ? new Date(generatedAt).toLocaleDateString() : new Date().toLocaleDateString()}`, size: 18, color: "94a3b8" })],
      spacing: { after: 400 },
    })
  );

  // How They Address It
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "How They Address It", bold: true, size: 28, color: "6366f1" })],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: approachDescription || "", size: 22, color: "334155" })],
      spacing: { after: 300 },
    })
  );

  // Why It's Best Practice
  if (whyBestPractice) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Why It's Best Practice", bold: true, size: 28, color: "22c55e" })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: whyBestPractice, size: 22, color: "334155" })],
        spacing: { after: 300 },
      })
    );
  }

  // Key Metrics
  if (keyMetrics && keyMetrics.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Key Metrics", bold: true, size: 28, color: "6366f1" })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );
    for (const metric of keyMetrics) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${metric.metric}: `, bold: true, size: 22, color: "1e293b" }),
            new TextRun({ text: metric.value, bold: true, size: 22, color: "6366f1" }),
          ],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [new TextRun({ text: metric.context, size: 20, color: "64748b" })],
          spacing: { after: 150 },
        })
      );
    }
  }

  // Notable Policies
  if (policyHighlights && policyHighlights.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Notable Policies", bold: true, size: 28, color: "8b5cf6" })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );
    for (const policy of policyHighlights) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: policy.policy, bold: true, size: 22, color: "1e293b" }),
            new TextRun({ text: policy.yearEnacted ? ` (${policy.yearEnacted})` : "", size: 20, color: "64748b" }),
          ],
          bullet: { level: 0 },
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [new TextRun({ text: policy.description, size: 20, color: "475569" })],
          spacing: { after: 150 },
        })
      );
    }
  }

  // Lessons Learned
  if (lessonsLearned) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Lessons Learned", bold: true, size: 28, color: "f59e0b" })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: lessonsLearned, size: 22, color: "334155" })],
        spacing: { after: 300 },
      })
    );
  }

  // How to Adopt
  if (transferability) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "How to Adopt This Approach", bold: true, size: 28, color: "0ea5e9" })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: transferability, size: 22, color: "334155" })],
        spacing: { after: 300 },
      })
    );
  }

  // Footer
  children.push(
    new Paragraph({
      border: { top: { color: "e2e8f0", size: 1, style: BorderStyle.SINGLE } },
      spacing: { before: 600 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `© ${new Date().getFullYear()} Arthur D. Little. All rights reserved. | Confidential`, size: 16, color: "94a3b8" })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
    })
  );

  const doc = new Document({ sections: [{ properties: {}, children }] });
  const blob = await Packer.toBlob(doc);
  const filename = generateFilename(userName, countryName, questionTitle, "docx");
  saveAs(blob, filename);
}

export default { 
  exportToPDF, 
  exportToWord,
  exportBestPracticeToPDF,
  exportBestPracticeToWord,
  exportCountryBestPracticeToPDF,
  exportCountryBestPracticeToWord,
};
