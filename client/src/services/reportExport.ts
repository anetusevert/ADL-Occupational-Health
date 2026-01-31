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

export default { exportToPDF, exportToWord };
