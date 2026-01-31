/**
 * Arthur D. Little - Global Health Platform
 * Report Export Service
 * 
 * Generates professionally formatted PDF and Word documents
 * from Strategic Deep Dive reports.
 * 
 * Features:
 * - PDF generation with jsPDF
 * - Word document generation with docx
 * - ADL branding and styling
 * - Personalized filenames with user name, report details, and timestamp
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
} from "docx";
import { saveAs } from "file-saver";
import type { StrategicDeepDiveReport } from "./api";

// Types
interface ExportOptions {
  userName: string;
  countryName: string;
  topicName: string;
  report: StrategicDeepDiveReport;
}

// Color palette for consistent branding
const COLORS = {
  primary: "#6366f1", // Indigo
  secondary: "#8b5cf6", // Purple
  success: "#10b981", // Emerald
  warning: "#f59e0b", // Amber
  danger: "#ef4444", // Red
  dark: "#1e293b", // Slate 800
  light: "#f8fafc", // Slate 50
  muted: "#64748b", // Slate 500
};

/**
 * Generate filename with user name, report details, and timestamp
 */
export function generateFilename(
  userName: string,
  countryName: string,
  topicName: string,
  extension: "pdf" | "docx"
): string {
  // Clean and format components
  const cleanUserName = userName.replace(/[^a-zA-Z0-9]/g, "") || "User";
  const cleanCountryName = countryName.replace(/[^a-zA-Z0-9]/g, "");
  const cleanTopicName = topicName
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(" ")
    .slice(0, 3)
    .join("")
    .replace(/\s+/g, "");

  // Generate timestamp
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;

  return `${cleanUserName}_${cleanCountryName}_${cleanTopicName}_${timestamp}.${extension}`;
}

/**
 * Export report as PDF
 */
export async function exportToPDF(options: ExportOptions): Promise<void> {
  const { userName, countryName, topicName, report } = options;
  
  // Create new PDF document
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  // Helper function to add new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin - 20) {
      doc.addPage();
      yPos = margin;
      addHeader();
    }
  };

  // Helper function to add header
  const addHeader = () => {
    doc.setFillColor(30, 41, 59); // Slate 800
    doc.rect(0, 0, pageWidth, 15, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("Arthur D. Little - Strategic Deep Dive Report", margin, 10);
    doc.text(countryName, pageWidth - margin, 10, { align: "right" });
    yPos = 25;
  };

  // Helper function to add footer
  const addFooter = (pageNum: number, totalPages: number) => {
    doc.setFillColor(248, 250, 252); // Slate 50
    doc.rect(0, pageHeight - 15, pageWidth, 15, "F");
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.setFontSize(8);
    doc.text(`Generated for ${userName}`, margin, pageHeight - 7);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: "right" });
  };

  // Title Page
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // ADL Branding
  doc.setTextColor(99, 102, 241); // Indigo
  doc.setFontSize(12);
  doc.text("ARTHUR D. LITTLE", pageWidth / 2, 40, { align: "center" });

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.text("Strategic Deep Dive", pageWidth / 2, pageHeight / 3, { align: "center" });

  // Subtitle (Topic)
  doc.setFontSize(16);
  doc.setTextColor(147, 51, 234); // Purple
  doc.text(topicName, pageWidth / 2, pageHeight / 3 + 15, { align: "center" });

  // Country
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text(countryName, pageWidth / 2, pageHeight / 2, { align: "center" });

  // Report date
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184); // Slate 400
  const reportDate = report.generated_at 
    ? new Date(report.generated_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  doc.text(reportDate, pageWidth / 2, pageHeight - 50, { align: "center" });

  // Prepared for
  doc.text(`Prepared for: ${userName}`, pageWidth / 2, pageHeight - 40, { align: "center" });

  // Start content pages
  doc.addPage();
  addHeader();

  // Executive Summary
  if (report.executive_summary) {
    checkPageBreak(40);
    
    doc.setTextColor(99, 102, 241);
    doc.setFontSize(16);
    doc.text("Executive Summary", margin, yPos);
    yPos += 10;

    doc.setTextColor(51, 65, 85); // Slate 700
    doc.setFontSize(10);
    const summaryLines = doc.splitTextToSize(report.executive_summary, contentWidth);
    doc.text(summaryLines, margin, yPos);
    yPos += summaryLines.length * 5 + 15;
  }

  // Key Findings
  if (report.key_findings && report.key_findings.length > 0) {
    checkPageBreak(30);
    
    doc.setTextColor(99, 102, 241);
    doc.setFontSize(16);
    doc.text("Key Findings", margin, yPos);
    yPos += 10;

    report.key_findings.forEach((finding, index) => {
      checkPageBreak(25);
      
      // Impact indicator
      const impactColor = finding.impact_level === "high" ? [239, 68, 68] : 
                          finding.impact_level === "medium" ? [245, 158, 11] : [100, 116, 139];
      doc.setFillColor(impactColor[0], impactColor[1], impactColor[2]);
      doc.rect(margin, yPos - 4, 3, 15, "F");

      // Title
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      doc.text(finding.title, margin + 6, yPos);
      
      // Impact badge
      doc.setFontSize(8);
      doc.setTextColor(impactColor[0], impactColor[1], impactColor[2]);
      doc.text(`[${finding.impact_level.toUpperCase()}]`, pageWidth - margin, yPos, { align: "right" });

      yPos += 6;

      // Description
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(9);
      const descLines = doc.splitTextToSize(finding.description, contentWidth - 10);
      doc.text(descLines, margin + 6, yPos);
      yPos += descLines.length * 4 + 8;
    });

    yPos += 10;
  }

  // SWOT Analysis
  if (report.strengths?.length || report.weaknesses?.length || 
      report.opportunities?.length || report.threats?.length) {
    checkPageBreak(80);
    
    doc.setTextColor(99, 102, 241);
    doc.setFontSize(16);
    doc.text("SWOT Analysis", margin, yPos);
    yPos += 12;

    const swotData = [
      { title: "Strengths", items: report.strengths || [], color: [16, 185, 129] },
      { title: "Weaknesses", items: report.weaknesses || [], color: [239, 68, 68] },
      { title: "Opportunities", items: report.opportunities || [], color: [245, 158, 11] },
      { title: "Threats", items: report.threats || [], color: [139, 92, 246] },
    ];

    const cellWidth = contentWidth / 2 - 3;
    const cellHeight = 60;

    swotData.forEach((section, index) => {
      const xOffset = index % 2 === 0 ? margin : margin + cellWidth + 6;
      const yOffset = index < 2 ? yPos : yPos + cellHeight + 5;

      // Box
      doc.setFillColor(section.color[0], section.color[1], section.color[2]);
      doc.setGlobalAlpha(0.1);
      doc.rect(xOffset, yOffset, cellWidth, cellHeight, "F");
      doc.setGlobalAlpha(1);

      // Border
      doc.setDrawColor(section.color[0], section.color[1], section.color[2]);
      doc.rect(xOffset, yOffset, cellWidth, cellHeight, "S");

      // Title
      doc.setTextColor(section.color[0], section.color[1], section.color[2]);
      doc.setFontSize(10);
      doc.text(section.title, xOffset + 3, yOffset + 6);

      // Items
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(8);
      let itemY = yOffset + 12;
      section.items.slice(0, 3).forEach((item) => {
        const itemText = `• ${item.title}`;
        const lines = doc.splitTextToSize(itemText, cellWidth - 6);
        doc.text(lines[0], xOffset + 3, itemY);
        itemY += 5;
      });
    });

    yPos += cellHeight * 2 + 20;
  }

  // Strategic Recommendations
  if (report.strategic_recommendations && report.strategic_recommendations.length > 0) {
    checkPageBreak(30);
    
    doc.setTextColor(99, 102, 241);
    doc.setFontSize(16);
    doc.text("Strategic Recommendations", margin, yPos);
    yPos += 10;

    report.strategic_recommendations.forEach((rec, index) => {
      checkPageBreak(25);
      
      // Priority color
      const priorityColor = rec.priority === "critical" ? [239, 68, 68] :
                           rec.priority === "high" ? [245, 158, 11] :
                           rec.priority === "medium" ? [59, 130, 246] : [100, 116, 139];
      
      doc.setFillColor(priorityColor[0], priorityColor[1], priorityColor[2]);
      doc.rect(margin, yPos - 4, 3, 15, "F");

      // Title
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      doc.text(rec.title, margin + 6, yPos);

      // Priority and timeline
      doc.setFontSize(8);
      doc.setTextColor(priorityColor[0], priorityColor[1], priorityColor[2]);
      doc.text(`${rec.priority.toUpperCase()} | ${rec.timeline}`, pageWidth - margin, yPos, { align: "right" });

      yPos += 6;

      // Description
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(9);
      const descLines = doc.splitTextToSize(rec.description, contentWidth - 10);
      doc.text(descLines, margin + 6, yPos);
      yPos += descLines.length * 4 + 8;
    });

    yPos += 10;
  }

  // Priority Interventions
  if (report.priority_interventions && report.priority_interventions.length > 0) {
    checkPageBreak(30);
    
    doc.setTextColor(99, 102, 241);
    doc.setFontSize(16);
    doc.text("Priority Interventions", margin, yPos);
    yPos += 10;

    report.priority_interventions.forEach((intervention, index) => {
      checkPageBreak(15);
      
      // Number circle
      doc.setFillColor(16, 185, 129);
      doc.circle(margin + 4, yPos - 1, 3.5, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text(String(index + 1), margin + 4, yPos + 0.5, { align: "center" });

      // Text
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(intervention, contentWidth - 15);
      doc.text(lines, margin + 12, yPos);
      yPos += lines.length * 5 + 5;
    });

    yPos += 10;
  }

  // Data Quality Notes
  if (report.data_quality_notes) {
    checkPageBreak(30);
    
    doc.setFillColor(241, 245, 249); // Slate 100
    doc.rect(margin, yPos - 5, contentWidth, 25, "F");
    
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.text("Data Quality Notes", margin + 5, yPos);
    yPos += 6;
    
    doc.setFontSize(8);
    const notesLines = doc.splitTextToSize(report.data_quality_notes, contentWidth - 10);
    doc.text(notesLines, margin + 5, yPos);
  }

  // Add page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i - 1, totalPages - 1);
  }

  // Save the PDF
  const filename = generateFilename(userName, countryName, topicName, "pdf");
  doc.save(filename);
}

/**
 * Export report as Word document
 */
export async function exportToWord(options: ExportOptions): Promise<void> {
  const { userName, countryName, topicName, report } = options;

  const reportDate = report.generated_at 
    ? new Date(report.generated_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  // Create document sections
  const sections: Paragraph[] = [];

  // Title section
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "ARTHUR D. LITTLE",
          bold: true,
          size: 24,
          color: "6366f1",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Strategic Deep Dive Report",
          bold: true,
          size: 48,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: topicName,
          bold: true,
          size: 28,
          color: "8b5cf6",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: countryName,
          bold: true,
          size: 36,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Prepared for: ${userName}`,
          size: 22,
          color: "64748b",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: reportDate,
          size: 22,
          color: "64748b",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
    })
  );

  // Executive Summary
  if (report.executive_summary) {
    sections.push(
      new Paragraph({
        text: "Executive Summary",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: report.executive_summary,
            size: 24,
          }),
        ],
        spacing: { after: 400 },
      })
    );
  }

  // Key Findings
  if (report.key_findings && report.key_findings.length > 0) {
    sections.push(
      new Paragraph({
        text: "Key Findings",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    report.key_findings.forEach((finding) => {
      const impactColor = finding.impact_level === "high" ? "ef4444" :
                          finding.impact_level === "medium" ? "f59e0b" : "64748b";
      
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: finding.title,
              bold: true,
              size: 26,
            }),
            new TextRun({
              text: `  [${finding.impact_level.toUpperCase()}]`,
              bold: true,
              size: 20,
              color: impactColor,
            }),
          ],
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: finding.description,
              size: 22,
              color: "475569",
            }),
          ],
          spacing: { after: 200 },
        })
      );
    });
  }

  // SWOT Analysis
  if (report.strengths?.length || report.weaknesses?.length || 
      report.opportunities?.length || report.threats?.length) {
    sections.push(
      new Paragraph({
        text: "SWOT Analysis",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    const swotSections = [
      { title: "Strengths", items: report.strengths || [], color: "10b981" },
      { title: "Weaknesses", items: report.weaknesses || [], color: "ef4444" },
      { title: "Opportunities", items: report.opportunities || [], color: "f59e0b" },
      { title: "Threats", items: report.threats || [], color: "8b5cf6" },
    ];

    swotSections.forEach(({ title, items, color }) => {
      if (items.length > 0) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: title,
                bold: true,
                size: 26,
                color: color,
              }),
            ],
            spacing: { before: 200, after: 100 },
          })
        );

        items.forEach((item) => {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: "• ", size: 22 }),
                new TextRun({ text: item.title, bold: true, size: 22 }),
                new TextRun({ text: ` — ${item.description}`, size: 22, color: "64748b" }),
              ],
              spacing: { after: 100 },
            })
          );
        });
      }
    });
  }

  // Strategic Recommendations
  if (report.strategic_recommendations && report.strategic_recommendations.length > 0) {
    sections.push(
      new Paragraph({
        text: "Strategic Recommendations",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    report.strategic_recommendations.forEach((rec) => {
      const priorityColor = rec.priority === "critical" ? "ef4444" :
                           rec.priority === "high" ? "f59e0b" :
                           rec.priority === "medium" ? "3b82f6" : "64748b";
      
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: rec.title,
              bold: true,
              size: 26,
            }),
          ],
          spacing: { before: 200, after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Priority: ${rec.priority.toUpperCase()}`,
              bold: true,
              size: 20,
              color: priorityColor,
            }),
            new TextRun({
              text: `  |  Timeline: ${rec.timeline}`,
              size: 20,
              color: "64748b",
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: rec.description,
              size: 22,
              color: "475569",
            }),
          ],
          spacing: { after: 200 },
        })
      );
    });
  }

  // Priority Interventions
  if (report.priority_interventions && report.priority_interventions.length > 0) {
    sections.push(
      new Paragraph({
        text: "Priority Interventions",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    report.priority_interventions.forEach((intervention, index) => {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${index + 1}. `,
              bold: true,
              size: 22,
              color: "10b981",
            }),
            new TextRun({
              text: intervention,
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        })
      );
    });
  }

  // Data Quality Notes
  if (report.data_quality_notes) {
    sections.push(
      new Paragraph({
        text: "Data Quality Notes",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: report.data_quality_notes,
            size: 20,
            color: "64748b",
            italics: true,
          }),
        ],
        spacing: { after: 400 },
      })
    );
  }

  // Footer
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "—",
          size: 24,
          color: "e2e8f0",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Generated by Arthur D. Little Strategic Deep Dive Agent",
          size: 20,
          color: "94a3b8",
          italics: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
    })
  );

  // Create the document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch in twips
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: sections,
      },
    ],
  });

  // Generate and save the document
  const blob = await Packer.toBlob(doc);
  const filename = generateFilename(userName, countryName, topicName, "docx");
  saveAs(blob, filename);
}

export default {
  exportToPDF,
  exportToWord,
  generateFilename,
};
