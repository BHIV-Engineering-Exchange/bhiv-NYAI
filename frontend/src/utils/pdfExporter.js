/**
 * NYAI Printable Legal Evaluation PDF Exporter
 * Generates a clean, formatted Printable PDF document window for any Legal Advice decision.
 */
export const generatePrintablePdfReport = (decision, currentQuery = '') => {
  if (!decision) return;

  const query = currentQuery || decision.query || decision.facts?.[0]?.statement || 'Submitted Legal Query';
  const jurisdiction = decision.jurisdiction_detected || decision.jurisdiction || 'IN';
  const domain = decision.domain || 'General';
  const analysis = decision.reasoning_trace?.legal_analysis || decision.legal_analysis || 'No legal analysis available';

  const statutes = decision.relevant_sections || decision.statutes || decision.applicable_laws || [];
  const remedies = decision.remedies || [];
  const proceduralSteps = decision.procedural_steps || [];
  const traceId = decision.trace_id || 'trace_gen';
  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const statuteHtml = Array.isArray(statutes) && statutes.length > 0
    ? statutes.map(s => {
        if (typeof s === 'string') return `<li><b>${s}</b></li>`;
        const act = s.act_name || s.act_id || s.act || 'Statute';
        const sec = s.section || s.section_number || s.section_id || '';
        const title = s.title || s.text || '';
        return `<li><b>${act} ${sec ? 'Section/Article ' + sec : ''}</b>: ${title}</li>`;
      }).join('')
    : '<li>No specific statutes matched.</li>';

  const remedyHtml = Array.isArray(remedies) && remedies.length > 0
    ? remedies.map(r => `<li>${r}</li>`).join('')
    : '<li>Consult qualified legal counsel for available remedies.</li>';

  const stepHtml = Array.isArray(proceduralSteps) && proceduralSteps.length > 0
    ? proceduralSteps.map(step => `<li>${step}</li>`).join('')
    : '<li>Follow standard judicial & administrative procedures.</li>';

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>NYAI Legal Evaluation - ${traceId}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 40px; color: #0f172a; background: #ffffff; }
    .header { border-bottom: 3px solid #1e3a8a; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
    .brand { font-size: 26px; font-weight: 800; color: #1e3a8a; letter-spacing: -0.5px; }
    .subbrand { font-size: 13px; color: #64748b; font-weight: 500; margin-top: 4px; }
    .meta-date { font-size: 13px; color: #475569; text-align: right; }
    .badges { margin-bottom: 20px; display: flex; gap: 10px; }
    .badge { background: #e0e7ff; color: #3730a3; padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .badge-domain { background: #dcfce7; color: #166534; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 5px solid #2563eb; border-radius: 8px; padding: 20px; margin-bottom: 24px; }
    .card-title { font-size: 13px; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
    .query-box { font-size: 18px; font-weight: 600; color: #0f172a; line-height: 1.5; }
    ul, ol { padding-left: 22px; line-height: 1.7; margin: 8px 0; }
    li { margin-bottom: 8px; color: #334155; }
    .analysis-text { white-space: pre-wrap; line-height: 1.7; color: #334155; font-size: 14.5px; }
    .footer { margin-top: 45px; padding-top: 18px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
    @media print {
      body { margin: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">NYAI Legal Intelligence Evaluation</div>
      <div class="subbrand">Autonomous Multi-Agent Sovereign Legal Engine</div>
    </div>
    <div class="meta-date">
      <b>Date:</b> ${dateStr}<br/>
      <b>Trace ID:</b> ${traceId}
    </div>
  </div>

  <div class="badges">
    <span class="badge">Jurisdiction: ${jurisdiction}</span>
    <span class="badge badge-domain">Domain: ${domain}</span>
  </div>

  <div class="card">
    <div class="card-title">Submitted Legal Query</div>
    <div class="query-box">"${query}"</div>
  </div>

  <div class="card">
    <div class="card-title">Applicable Statutes & Legal Provisions</div>
    <ul>${statuteHtml}</ul>
  </div>

  <div class="card">
    <div class="card-title">Legal Analysis & Statutory Evaluation</div>
    <div class="analysis-text">${analysis}</div>
  </div>

  <div class="card">
    <div class="card-title">Procedural Steps & Action Roadmap</div>
    <ol>${stepHtml}</ol>
  </div>

  <div class="card">
    <div class="card-title">Available Legal Remedies</div>
    <ul>${remedyHtml}</ul>
  </div>

  <div class="footer">
    CONFIDENTIAL & ADVISORY LEGAL EVALUATION REPORT • NYAYA AI PLATFORM
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(htmlContent);
    win.document.close();
  }
};
