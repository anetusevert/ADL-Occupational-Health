/**
 * Arthur D. Little - Global Health Platform
 * PDF Export Service
 * 
 * Generates McKinsey-grade PDF reports for pillar analysis
 * and overall country summaries.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface PDFCountryData {
  iso_code: string;
  name: string;
  flag_url?: string;
  governance_score?: number | null;
  pillar1_score?: number | null;
  pillar2_score?: number | null;
  pillar3_score?: number | null;
  maturity_score?: number | null;
}

export interface PDFPillarData {
  pillar_id: string;
  pillar_name: string;
  score: number | null;
  questions: Array<{
    title: string;
    question: string;
    summary: string;
    status: "complete" | "partial" | "gap";
    score: number;
    bestPractices: Array<{
      country_name: string;
      score: number;
      key_lesson: string;
    }>;
  }>;
}

export interface PDFSummaryData {
  executive_summary: string[];
  strategic_priorities: Array<{
    priority: string;
    rationale: string;
    pillar: string;
    urgency: string;
  }>;
  overall_assessment: string;
}

// ============================================================================
// HTML TEMPLATE GENERATORS
// ============================================================================

function generateHeaderHTML(countryName: string, reportType: string): string {
  return `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px 30px; border-bottom: 2px solid #0ea5e9; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
      <div>
        <div style="font-size: 12px; color: #94a3b8; letter-spacing: 2px; margin-bottom: 4px;">ARTHUR D. LITTLE</div>
        <div style="font-size: 20px; font-weight: 700; color: white;">${countryName}</div>
        <div style="font-size: 12px; color: #0ea5e9; margin-top: 4px;">${reportType}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 10px; color: #64748b;">Generated ${new Date().toLocaleDateString()}</div>
        <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Confidential</div>
      </div>
    </div>
  `;
}

function generateScoreColor(score: number | null): string {
  if (score === null) return "#64748b";
  if (score >= 70) return "#10b981";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

function generateStatusBadgeHTML(status: string): string {
  const colors = {
    complete: { bg: "#10b98120", text: "#10b981", label: "Complete" },
    partial: { bg: "#f59e0b20", text: "#f59e0b", label: "Partial" },
    gap: { bg: "#ef444420", text: "#ef4444", label: "Gap" },
  };
  const config = colors[status as keyof typeof colors] || colors.gap;
  
  return `<span style="padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; background: ${config.bg}; color: ${config.text}; text-transform: uppercase;">${config.label}</span>`;
}

// ============================================================================
// PILLAR REPORT GENERATOR
// ============================================================================

function generatePillarReportHTML(
  country: PDFCountryData,
  pillar: PDFPillarData
): string {
  const questionsHTML = pillar.questions.map((q, i) => `
    <div style="margin-bottom: 24px; padding: 16px; background: #1e293b; border-radius: 8px; border: 1px solid #334155;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
        <div>
          <div style="font-size: 14px; font-weight: 600; color: white; margin-bottom: 4px;">
            Q${i + 1}: ${q.title}
          </div>
          <div style="font-size: 11px; color: #94a3b8; font-style: italic;">
            ${q.question}
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          ${generateStatusBadgeHTML(q.status)}
          <span style="font-size: 18px; font-weight: 700; color: ${generateScoreColor(q.score)};">${q.score.toFixed(0)}%</span>
        </div>
      </div>
      <div style="font-size: 12px; color: #cbd5e1; line-height: 1.6; margin-bottom: 16px;">
        ${q.summary}
      </div>
      ${q.bestPractices.length > 0 ? `
        <div style="border-top: 1px solid #334155; padding-top: 12px;">
          <div style="font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Best Practice Leaders</div>
          ${q.bestPractices.slice(0, 2).map((bp, idx) => `
            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #334155;">
              <div>
                <span style="font-size: 11px; font-weight: 500; color: white;">${idx + 1}. ${bp.country_name}</span>
                <span style="font-size: 10px; color: #64748b; margin-left: 8px;">${bp.score.toFixed(0)}%</span>
              </div>
              <div style="font-size: 10px; color: #94a3b8; max-width: 60%; text-align: right;">
                ${bp.key_lesson}
              </div>
            </div>
          `).join("")}
        </div>
      ` : ""}
    </div>
  `).join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${country.name} - ${pillar.pillar_name} Analysis</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: white; }
        @page { size: A4; margin: 0; }
      </style>
    </head>
    <body>
      ${generateHeaderHTML(country.name, `${pillar.pillar_name} Deep Analysis`)}
      
      <div style="padding: 24px 30px;">
        <!-- Pillar Overview -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding: 16px; background: linear-gradient(135deg, #7c3aed20 0%, #0ea5e920 100%); border-radius: 8px; border: 1px solid #7c3aed40;">
          <div>
            <div style="font-size: 18px; font-weight: 700; color: white;">${pillar.pillar_name}</div>
            <div style="font-size: 12px; color: #94a3b8;">Framework Pillar Analysis</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 32px; font-weight: 700; color: ${generateScoreColor(pillar.score)};">${pillar.score?.toFixed(0) || "—"}%</div>
            <div style="font-size: 10px; color: #64748b;">Overall Score</div>
          </div>
        </div>
        
        <!-- Strategic Questions -->
        <div style="margin-bottom: 16px;">
          <div style="font-size: 14px; font-weight: 600; color: #0ea5e9; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;">Strategic Assessment</div>
          ${questionsHTML}
        </div>
      </div>
      
      <!-- Footer -->
      <div style="position: fixed; bottom: 0; left: 0; right: 0; padding: 12px 30px; background: #0f172a; border-top: 1px solid #334155; display: flex; justify-content: space-between;">
        <div style="font-size: 9px; color: #475569;">Arthur D. Little — Occupational Health Intelligence Platform</div>
        <div style="font-size: 9px; color: #475569;">Confidential — Do Not Distribute</div>
      </div>
    </body>
    </html>
  `;
}

// ============================================================================
// SUMMARY REPORT GENERATOR
// ============================================================================

function generateSummaryReportHTML(
  country: PDFCountryData,
  summary: PDFSummaryData
): string {
  const pillars = [
    { name: "Governance", score: country.governance_score, color: "#a78bfa" },
    { name: "Hazard Control", score: country.pillar1_score, color: "#60a5fa" },
    { name: "Vigilance", score: country.pillar2_score, color: "#2dd4bf" },
    { name: "Restoration", score: country.pillar3_score, color: "#fbbf24" },
  ];

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${country.name} - Strategic Assessment</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: white; }
        @page { size: A4; margin: 0; }
      </style>
    </head>
    <body>
      ${generateHeaderHTML(country.name, "Strategic Assessment Report")}
      
      <div style="padding: 24px 30px;">
        <!-- Executive Summary -->
        <div style="margin-bottom: 24px;">
          <div style="font-size: 14px; font-weight: 600; color: #0ea5e9; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;">Executive Summary</div>
          <div style="background: #1e293b; border-radius: 8px; padding: 20px; border: 1px solid #334155;">
            ${summary.executive_summary.map(para => `
              <p style="font-size: 12px; color: #e2e8f0; line-height: 1.7; margin-bottom: 12px;">${para}</p>
            `).join("")}
          </div>
        </div>
        
        <!-- Framework Pillars -->
        <div style="margin-bottom: 24px;">
          <div style="font-size: 14px; font-weight: 600; color: #0ea5e9; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;">Framework Performance</div>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
            ${pillars.map(p => `
              <div style="background: ${p.color}15; border: 1px solid ${p.color}40; border-radius: 8px; padding: 16px; text-align: center;">
                <div style="font-size: 24px; font-weight: 700; color: ${generateScoreColor(p.score || null)};">${p.score?.toFixed(0) || "—"}%</div>
                <div style="font-size: 11px; color: ${p.color}; margin-top: 4px;">${p.name}</div>
              </div>
            `).join("")}
          </div>
        </div>
        
        <!-- Strategic Priorities -->
        <div style="margin-bottom: 24px;">
          <div style="font-size: 14px; font-weight: 600; color: #0ea5e9; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;">Strategic Priorities</div>
          ${summary.strategic_priorities.map((p, i) => `
            <div style="background: #1e293b; border-radius: 8px; padding: 16px; margin-bottom: 8px; border-left: 3px solid ${p.urgency === 'high' ? '#ef4444' : p.urgency === 'medium' ? '#f59e0b' : '#64748b'};">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                  <div style="font-size: 12px; font-weight: 600; color: white; margin-bottom: 4px;">${i + 1}. ${p.priority}</div>
                  <div style="font-size: 11px; color: #94a3b8;">${p.rationale}</div>
                </div>
                <div style="display: flex; gap: 8px;">
                  <span style="font-size: 9px; padding: 2px 6px; border-radius: 4px; background: #33415540; color: #94a3b8;">${p.pillar}</span>
                  <span style="font-size: 9px; padding: 2px 6px; border-radius: 4px; background: ${p.urgency === 'high' ? '#ef444420' : p.urgency === 'medium' ? '#f59e0b20' : '#64748b20'}; color: ${p.urgency === 'high' ? '#ef4444' : p.urgency === 'medium' ? '#f59e0b' : '#64748b'}; text-transform: uppercase;">${p.urgency}</span>
                </div>
              </div>
            </div>
          `).join("")}
        </div>
        
        <!-- Overall Assessment -->
        <div style="margin-bottom: 24px;">
          <div style="font-size: 14px; font-weight: 600; color: #0ea5e9; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;">Overall Assessment</div>
          <div style="background: linear-gradient(135deg, #0ea5e910 0%, #7c3aed10 100%); border: 1px solid #0ea5e940; border-radius: 8px; padding: 20px;">
            <p style="font-size: 12px; color: #e2e8f0; line-height: 1.7;">${summary.overall_assessment}</p>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="position: fixed; bottom: 0; left: 0; right: 0; padding: 12px 30px; background: #0f172a; border-top: 1px solid #334155; display: flex; justify-content: space-between;">
        <div style="font-size: 9px; color: #475569;">Arthur D. Little — Occupational Health Intelligence Platform</div>
        <div style="font-size: 9px; color: #475569;">Confidential — Do Not Distribute</div>
      </div>
    </body>
    </html>
  `;
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

/**
 * Export a pillar analysis as PDF
 */
export async function exportPillarToPDF(
  country: PDFCountryData,
  pillar: PDFPillarData
): Promise<void> {
  const html = generatePillarReportHTML(country, pillar);
  
  // Open in new window for printing
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for content to load then trigger print
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

/**
 * Export a summary report as PDF
 */
export async function exportSummaryToPDF(
  country: PDFCountryData,
  summary: PDFSummaryData
): Promise<void> {
  const html = generateSummaryReportHTML(country, summary);
  
  // Open in new window for printing
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for content to load then trigger print
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

/**
 * Download HTML as file (alternative to PDF)
 */
export function downloadAsHTML(
  content: string,
  filename: string
): void {
  const blob = new Blob([content], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
