import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { generatePaperList, PAPER_YEARS } from '@/lib/paperService';
import { pdfStore } from '@/lib/pdfStore';
import {
  fetchPdfBuffer,
  extractPagesText,
  extractQuestionsMetadata,
  mainQuestionNumber,
  segmentQuestions,
  copyPageRange,
  buildMsAnswerPageFilter,
  QP_FRONT_MATTER_RE,
} from '@/lib/extraction';

export const maxDuration = 300;

// pdf-lib's built-in fonts only encode WinAnsi (CP1252). AI-written solutions
// routinely contain Greek letters and maths symbols that fall outside it, which
// makes drawText throw. Transliterate the common ones to readable ASCII, keep
// the symbols WinAnsi already supports (° ± ² ³ µ × ÷ ·), and drop anything
// still unencodable so a stray glyph can never abort a render.
const WINANSI_MAP = {
  'Α': 'Alpha', 'Β': 'Beta', 'Γ': 'Gamma', 'Δ': 'Delta', 'Ε': 'Epsilon', 'Ζ': 'Zeta',
  'Η': 'Eta', 'Θ': 'Theta', 'Ι': 'Iota', 'Κ': 'Kappa', 'Λ': 'Lambda', 'Μ': 'Mu',
  'Ν': 'Nu', 'Ξ': 'Xi', 'Ο': 'Omicron', 'Π': 'Pi', 'Ρ': 'Rho', 'Σ': 'Sigma',
  'Τ': 'Tau', 'Υ': 'Upsilon', 'Φ': 'Phi', 'Χ': 'Chi', 'Ψ': 'Psi', 'Ω': 'Omega',
  'α': 'alpha', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta', 'ε': 'epsilon', 'ζ': 'zeta',
  'η': 'eta', 'θ': 'theta', 'ι': 'iota', 'κ': 'kappa', 'λ': 'lambda',
  'ν': 'nu', 'ξ': 'xi', 'ο': 'omicron', 'π': 'pi', 'ρ': 'rho', 'ς': 'sigma', 'σ': 'sigma',
  'τ': 'tau', 'υ': 'upsilon', 'φ': 'phi', 'χ': 'chi', 'ψ': 'psi', 'ω': 'omega',
  '→': '->', '←': '<-', '↔': '<->', '⇒': '=>', '⇐': '<=', '↑': 'up', '↓': 'down',
  '≈': '~=', '≤': '<=', '≥': '>=', '≠': '!=', '∝': ' proportional to ', '∴': ' therefore ',
  '√': 'sqrt', '∞': 'infinity', '∫': 'integral', '∑': 'sum', '∆': 'Delta', '∂': 'd',
  '⋅': '*', '∙': '*', '−': '-', '–': '-', '—': '--', '…': '...',
  '“': '"', '”': '"', '‘': "'", '’': "'", '•': '-', '°': ' deg ', '′': "'", '″': '"',
  '½': '1/2', '¼': '1/4', '¾': '3/4', '⁰': '^0', '¹': '^1', '⁴': '^4', '⁵': '^5',
  '⁶': '^6', '⁷': '^7', '⁸': '^8', '⁹': '^9', '₀': '_0', '₁': '_1', '₂': '_2',
  '₃': '_3', '₄': '_4', '₅': '_5', '₆': '_6', '₇': '_7', '₈': '_8', '₉': '_9',
};

function toWinAnsiSafe(input) {
  if (!input) return '';
  let out = '';
  for (const ch of input) {
    if (WINANSI_MAP[ch] !== undefined) {
      out += WINANSI_MAP[ch];
      continue;
    }
    const code = ch.codePointAt(0);
    // Keep printable ASCII and the WinAnsi-safe Latin-1 supplement (incl.
    // ² ³ µ × ÷). Convert tabs to spaces; drop everything else.
    if (code === 9) out += '  ';
    else if (code >= 0x20 && code <= 0x7e) out += ch;
    else if (code >= 0xa0 && code <= 0xff) out += ch;
    // anything else is silently dropped
  }
  return out;
}

function wrapText(text, fontSize, font, maxWidth) {
  const paragraphs = text.split('\n');
  const lines = [];

  for (const para of paragraphs) {
    if (para.trim() === '') {
      lines.push('');
      continue;
    }

    const words = para.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      if (!word) continue;
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, fontSize);
      if (width > maxWidth) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
  }
  return lines;
}

async function addTextPageToMaster(masterDoc, title, text) {
  // Guarantee every glyph is encodable before it reaches drawText/widthOf...
  title = toWinAnsiSafe(title);
  text = toWinAnsiSafe(text);
  const font = await masterDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await masterDoc.embedFont(StandardFonts.HelveticaBold);

  const fontSize = 10;
  const leading = 14;
  const margin = 50;
  const pageWidth = 595.276;
  const pageHeight = 841.89;
  const maxWidth = pageWidth - 2 * margin;

  const wrappedLines = wrapText(text, fontSize, font, maxWidth);

  let page = masterDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  page.setFont(boldFont);
  page.setFontSize(12);
  page.drawText(title, { x: margin, y: y, color: rgb(0, 0, 0) });
  y -= 25;

  page.setFont(font);
  page.setFontSize(fontSize);

  for (const line of wrappedLines) {
    if (y < margin + leading) {
      page = masterDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
      page.setFont(font);
      page.setFontSize(fontSize);
    }

    if (line !== '') {
      page.drawText(line, { x: margin, y: y, color: rgb(0.1, 0.1, 0.1) });
    }
    y -= leading;
  }
}

/**
 * Ask OpenAI which WHOLE-QUESTION numbers relate to the topic, judged by the
 * actual subject content rather than keyword presence. Returns a sorted array
 * of main question-number strings (e.g. ["3", "5"]).
 */
async function classifyTopicQuestions(pageTexts, topic, paperFileName, apiKey, model) {
  if (!pageTexts || pageTexts.length === 0) return [];

  const pageSummaries = pageTexts
    .map((text, i) => `PAGE ${i + 1}: ${(text || '').slice(0, 4000)}`)
    .join('\n\n---\n\n');

  const prompt = `
You are a Cambridge examiner assistant. Below is the text of each page of the past paper "${paperFileName}".

The student wants questions about the topic: "${topic}".

Identify the WHOLE-QUESTION numbers (the top-level numbers like 1, 2, 3 — never sub-parts such as "3a") whose subject matter is about "${topic}". Judge by the actual subject content of the question, not by whether the word merely appears somewhere on the page.

Return JSON exactly: { "questions": [3, 5] }
If none match, return { "questions": [] }.

PAGE TEXTS:
${pageSummaries}
`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a JSON-only API assistant. Output ONLY valid JSON.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const parsed = JSON.parse(data.choices[0].message.content);
    const nums = Array.isArray(parsed.questions) ? parsed.questions : [];
    return [...new Set(nums.map(mainQuestionNumber).filter(Boolean))];
  } catch {
    return [];
  }
}

/**
 * Produce a worked solution + mark-scoring explanation for a single question,
 * grounded in the question text and (when available) its mark scheme. Returns
 * { workedSolution, howToScore } as plain-text strings (newlines and "- "
 * bullets allowed) for the HTML solution guide. On any failure it returns a
 * graceful placeholder so one bad question never aborts the whole guide.
 */
async function generateSolutionForQuestion({ questionLabel, paperLabel, questionText, markSchemeText, subjectCode, apiKey, model }) {
  const hasMs = markSchemeText && markSchemeText.trim().length > 0;
  const fallback = (msg) => ({
    workedSolution: msg,
    howToScore: 'Please refer to the Question Paper and Mark Scheme PDFs.',
  });
  const prompt = `
You are an expert Cambridge International examiner and tutor for subject code "${subjectCode}".

Below is the text of ${questionLabel} from "${paperLabel}", followed by its official mark scheme (if available). Write a clear, exam-focused solution guide for THIS question only.

Return a JSON object with exactly these two keys, each a plain-text string:
- "workedSolution": a step-by-step solution. Show the method, formulae used, substitutions, and the final answer with correct units. Address each sub-part (a, b, c, ...) in order. Start each sub-part on a new line. Use "- " for bullet points where helpful.
- "howToScore": explain, against the mark scheme, exactly how the marks are awarded — which steps earn method vs accuracy marks, the specific keywords/phrases the examiner requires, acceptable alternatives, what is explicitly rejected, and rules like units, significant figures, or error-carried-forward. Tie each mark to the relevant step.

Write normal mathematical and scientific notation (Greek letters, units, etc. are fine). Use line breaks to separate steps; do NOT use markdown headings (#) or bold (**) markers.
${hasMs ? '' : 'NOTE: No mark scheme text was available, so base "howToScore" on standard Cambridge marking conventions for this kind of question and say so briefly.'}

QUESTION TEXT:
${(questionText || '').slice(0, 8000)}

MARK SCHEME TEXT:
${hasMs ? markSchemeText.slice(0, 8000) : '(not available)'}
`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a meticulous Cambridge examiner who writes clear, accurate worked solutions and explains the mark scheme. Output ONLY valid JSON.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });
    if (!res.ok) {
      console.warn(`[topical-extract] Solution generation failed for ${questionLabel} (HTTP ${res.status})`);
      return fallback('A worked solution could not be generated for this question (the AI service returned an error).');
    }
    const data = await res.json();
    const parsed = JSON.parse(data.choices[0].message.content);
    return {
      workedSolution: (parsed.workedSolution || '').toString().trim() || 'No solution content was returned for this question.',
      howToScore: (parsed.howToScore || '').toString().trim() || 'No mark-scoring guidance was returned for this question.',
    };
  } catch (err) {
    console.warn(`[topical-extract] Solution generation error for ${questionLabel}:`, err.message);
    return fallback('A worked solution could not be generated for this question due to an unexpected error.');
  }
}

/** Escape a string for safe insertion into HTML text context. */
function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Render a plain-text block (newlines, "- "/"* " bullets, blank-line
 * paragraphs) into clean, escaped HTML. Consecutive bullet lines become a
 * <ul>; other runs become <p> with <br> between their lines.
 */
function renderTextBlock(text) {
  const lines = (text || '').replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let para = [];
  let bullets = [];
  const flushPara = () => {
    if (para.length) { html.push(`<p>${para.map(escapeHtml).join('<br>')}</p>`); para = []; }
  };
  const flushBullets = () => {
    if (bullets.length) { html.push(`<ul>${bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>`); bullets = []; }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const bulletMatch = line.match(/^\s*[-*•]\s+(.*)$/);
    if (line.trim() === '') { flushPara(); flushBullets(); continue; }
    if (bulletMatch) { flushPara(); bullets.push(bulletMatch[1]); }
    else { flushBullets(); para.push(line); }
  }
  flushPara();
  flushBullets();
  return html.join('\n') || '<p></p>';
}

/**
 * Build a self-contained, styled HTML solution guide. Renders maths symbols
 * natively (UTF-8) and includes a non-print "Save as PDF" toolbar.
 */
function buildSolutionGuideHtml({ subjectCode, topic, years, items }) {
  const sections = items.map((it, i) => `
    <section class="q-card">
      <header class="q-head">
        <span class="q-num">${i + 1}</span>
        <div>
          <h2>${escapeHtml(it.questionLabel)}</h2>
          <p class="q-paper">${escapeHtml(it.paperLabel)}</p>
        </div>
      </header>
      <div class="q-body">
        <div class="block solution">
          <h3>Worked Solution</h3>
          ${renderTextBlock(it.workedSolution)}
        </div>
        <div class="block scoring">
          <h3>How to Score the Marks</h3>
          ${renderTextBlock(it.howToScore)}
        </div>
      </div>
    </section>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Solution Guide — ${escapeHtml(topic)} (${escapeHtml(subjectCode)})</title>
<style>
  :root { --accent:#0f766e; --accent-2:#ef5a2b; --ink:#1a2230; --muted:#5b6675; --line:#e3e7ec; }
  * { box-sizing:border-box; }
  body { margin:0; background:#eef1f4; color:var(--ink);
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
    line-height:1.65; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .toolbar { position:sticky; top:0; z-index:10; display:flex; justify-content:space-between;
    align-items:center; gap:12px; padding:12px 20px; background:#0f1722; color:#fff; }
  .toolbar .brand { font-weight:700; font-size:.9rem; letter-spacing:.3px; }
  .toolbar .beta { background:rgba(239,90,43,.2); color:#ff8a5c; font-size:.6rem; font-weight:800;
    padding:2px 7px; border-radius:3px; margin-left:8px; text-transform:uppercase; letter-spacing:.05em; }
  .toolbar button { background:var(--accent); color:#fff; border:none; border-radius:6px;
    padding:9px 16px; font-weight:700; font-size:.85rem; cursor:pointer; }
  .toolbar button:hover { background:#0c5e57; }
  .sheet { max-width:820px; margin:28px auto; background:#fff; padding:0 0 40px;
    box-shadow:0 6px 30px rgba(0,0,0,.08); border-radius:4px; overflow:hidden; }
  .cover { padding:40px 48px; background:linear-gradient(135deg,#0f766e,#115e59); color:#fff; }
  .cover .kicker { font-size:.72rem; letter-spacing:.18em; text-transform:uppercase; opacity:.85; margin:0 0 10px; }
  .cover h1 { margin:0 0 6px; font-size:2.1rem; line-height:1.1; }
  .cover .meta { margin-top:16px; display:flex; flex-wrap:wrap; gap:10px 26px; font-size:.85rem; opacity:.95; }
  .cover .meta b { display:block; font-size:.64rem; text-transform:uppercase; letter-spacing:.1em; opacity:.8; font-weight:700; }
  .intro { padding:20px 48px; font-size:.86rem; color:var(--muted); border-bottom:1px solid var(--line); }
  .q-card { padding:30px 48px; border-bottom:1px solid var(--line); page-break-inside:avoid; }
  .q-head { display:flex; align-items:center; gap:14px; margin-bottom:18px; }
  .q-num { flex:0 0 auto; width:38px; height:38px; border-radius:50%; background:var(--accent-2); color:#fff;
    display:flex; align-items:center; justify-content:center; font-weight:800; }
  .q-head h2 { margin:0; font-size:1.25rem; }
  .q-paper { margin:2px 0 0; font-size:.78rem; color:var(--muted); }
  .block { margin-top:18px; padding:16px 18px; border-radius:6px; border:1px solid var(--line); }
  .block h3 { margin:0 0 8px; font-size:.95rem; text-transform:uppercase; letter-spacing:.04em; }
  .block.solution { background:#f6faf9; } .block.solution h3 { color:var(--accent); }
  .block.scoring { background:#fff7f3; } .block.scoring h3 { color:var(--accent-2); }
  .block p { margin:0 0 10px; } .block p:last-child { margin-bottom:0; }
  .block ul { margin:0 0 10px; padding-left:20px; } .block li { margin-bottom:5px; }
  .foot { padding:22px 48px 0; font-size:.72rem; color:var(--muted); }
  @media print {
    body { background:#fff; } .toolbar { display:none !important; }
    .sheet { margin:0; max-width:100%; box-shadow:none; border-radius:0; }
    .q-card { page-break-inside:avoid; }
  }
  @media (max-width:560px){ .cover,.intro,.q-card,.foot{ padding-left:22px; padding-right:22px; } }
</style>
</head>
<body>
  <div class="toolbar">
    <span class="brand">AceurExam · Solution Guide<span class="beta">Beta</span></span>
    <button onclick="window.print()">Save as PDF</button>
  </div>
  <div class="sheet">
    <div class="cover">
      <p class="kicker">Cambridge Topical Solution Guide</p>
      <h1>${escapeHtml(topic)}</h1>
      <div class="meta">
        <span><b>Subject</b>${escapeHtml(subjectCode)}</span>
        <span><b>Years</b>${escapeHtml((years || []).join(', '))}</span>
        <span><b>Questions</b>${items.length}</span>
      </div>
    </div>
    <div class="intro">
      This guide works through each extracted question step by step and explains how marks are awarded
      against the official mark scheme. Worked solutions are AI-generated for revision support — always
      cross-check against the Question Paper and Mark Scheme PDFs.
    </div>
    ${sections}
    <div class="foot">Generated by AceurExam · Beta feature · For Cambridge exam preparation.</div>
  </div>
</body>
</html>`;
}

/**
 * Parses an MCQ answer grid's text into a Map of question number → answer
 * letter. Cambridge grids list rows like "1 B 1" (question, answer, marks);
 * the trailing mark digit is skipped because the matcher needs a letter right
 * after the number. Keeps the first letter seen per number to ignore header
 * noise. Returns an empty Map when nothing parses.
 */
function parseMcqAnswers(text) {
  const map = new Map();
  if (!text) return map;
  const re = /\b(\d{1,2})\s+([A-Da-d])\b/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const n = parseInt(m[1], 10);
    if (n >= 1 && n <= 40 && !map.has(String(n))) {
      map.set(String(n), m[2].toUpperCase());
    }
  }
  return map;
}

export async function POST(request) {
  try {
    const { subjectCode, topic, years = PAPER_YEARS.slice(0, 2), variants = [], paperType, variantType, includeSolutionGuide = false } = await request.json();
    // Beta Solution Guide: opt-in AND never on the production main site.
    const sgEnabled = includeSolutionGuide && process.env.VERCEL_ENV !== 'production';
    const selectedVariants = Array.isArray(variants) ? variants.map(v => Number(v)) : [];
    const targetYears = years;

    if (!subjectCode || subjectCode.trim().length === 0) {
      return NextResponse.json({ error: 'Enter a valid subject code' }, { status: 400 });
    }
    if (!topic || topic.trim().length < 2) {
      return NextResponse.json({ error: 'Enter a topic name' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const model = 'gpt-4o-mini';
    const cleanCode = subjectCode.replace(/[^A-Za-z0-9/]/g, '').trim();
    const cleanTopic = topic.trim();

    let targetPaperNumbers = [1, 2, 3, 4, 5, 6];
    if (paperType && paperType.trim()) {
      const match = paperType.trim().match(/\d+/);
      if (match) {
        targetPaperNumbers = [parseInt(match[0])];
      }
    }

    let targetVariants = selectedVariants;
    if (variantType && variantType.trim()) {
      const match = variantType.trim().match(/\d+/);
      if (match) {
        targetVariants = [parseInt(match[0])];
      }
    }

    // Get all candidate papers
    const allPapers = generatePaperList(cleanCode, {
      years: targetYears,
      paperNumbers: targetPaperNumbers,
      variants: targetVariants.length > 0 ? targetVariants : [1, 2, 3]
    });

    const qpCandidates = allPapers.filter(p => p.component.toLowerCase().includes('qp') && targetYears.includes(p.year) && (targetVariants.length === 0 || targetVariants.includes(p.variant)));
    const msCandidates = allPapers.filter(p => p.component.toLowerCase().includes('ms') && targetYears.includes(p.year) && (targetVariants.length === 0 || targetVariants.includes(p.variant)));
    console.log(`[topical-extract] Scanning ${qpCandidates.length} QP candidates and ${msCandidates.length} MS candidates across years ${targetYears.join(', ')}.`);

    const existingQpCandidates = qpCandidates;
    const existingMsCandidates = msCandidates;

    const masterQP = await PDFDocument.create();
    const masterMS = await PDFDocument.create();

    let qpPagesAdded = 0;
    let msPagesAdded = 0;
    // Collected per-question inputs for the Solution Guide (only when enabled).
    const solutionInputs = [];

    for (const qpPaper of existingQpCandidates) {
      console.log(`[topical-extract] Scanning ${qpPaper.fileName}...`);

      // Step 1: Fetch QP binary
      const qpBuffer = await fetchPdfBuffer(qpPaper.url);
      if (!qpBuffer) {
        console.log(`[topical-extract] Skipped ${qpPaper.fileName} (not found or not a PDF)`);
        continue;
      }

      // Step 2: Extract page text and split the paper into whole-question
      // page ranges. The segmentation is the single source of truth for which
      // pages belong to each question, used for BOTH documents.
      const qpPageTexts = await extractPagesText(qpBuffer);
      const qpPageMeta = await extractQuestionsMetadata(qpBuffer);
      if (qpPageTexts.length === 0) continue;

      const qpSegments = segmentQuestions(qpPageMeta, (i) => !QP_FRONT_MATTER_RE.test(qpPageTexts[i] || ''));
      if (qpSegments.size === 0) {
        console.log(`[topical-extract] No question starts detected in ${qpPaper.fileName}, skipping`);
        continue;
      }

      // Step 3: Ask the AI which whole questions match the topic, then keep
      // only those we actually segmented.
      const topicQs = await classifyTopicQuestions(qpPageTexts, cleanTopic, qpPaper.fileName, apiKey, model);
      const targetQs = topicQs
        .filter(q => qpSegments.has(q))
        .sort((a, b) => parseInt(a) - parseInt(b));

      if (targetQs.length === 0) {
        console.log(`[topical-extract] No "${cleanTopic}" questions in ${qpPaper.fileName} (AI: [${topicQs.join(', ')}], segmented: [${[...qpSegments.keys()].join(', ')}])`);
        continue;
      }
      console.log(`[topical-extract] Target questions for ${qpPaper.fileName}: [${targetQs.join(', ')}]`);

      // Step 4: Find the corresponding Mark Scheme candidates.
      const matchingMsCandidates = existingMsCandidates.filter(ms =>
          ms.year === qpPaper.year &&
          ms.term === qpPaper.term &&
          ms.paperNumber === qpPaper.paperNumber &&
          ms.variant === qpPaper.variant
        );

      // Step 5: Fetch MS binary — try each candidate URL until one resolves to
      // a real PDF. A missing scheme does not skip the paper; the lockstep
      // emitter inserts labeled placeholders so nothing shifts.
      let msBuffer = null;
      let matchingMs = null;
      for (const candidate of matchingMsCandidates) {
        const buf = await fetchPdfBuffer(candidate.url);
        if (buf) {
          msBuffer = buf;
          matchingMs = candidate;
          break;
        }
      }
      if (!msBuffer) {
        console.log(`[topical-extract] No mark scheme PDF for ${qpPaper.fileName} (${matchingMsCandidates.length} candidate(s) tried)`);
      }

      // Step 6: Segment the mark scheme by question with the SAME routine used
      // for the question paper, after dropping its front matter.
      let msSegments = new Map();
      let msSrcDoc = null;
      let msEligiblePages = [];
      let msPageTexts = [];
      if (msBuffer) {
        const msPageMeta = await extractQuestionsMetadata(msBuffer, { layout: 'ms' });
        msPageTexts = await extractPagesText(msBuffer);
        const { isAnswerPage } = buildMsAnswerPageFilter(msPageTexts);

        msSegments = segmentQuestions(msPageMeta, isAnswerPage, 160);
        msEligiblePages = msPageMeta.filter(m => isAnswerPage(m.pageIndex)).map(m => m.pageIndex);
        try {
          msSrcDoc = await PDFDocument.load(msBuffer, { ignoreEncryption: true });
        } catch (err) {
          console.warn(`[topical-extract] Could not load MS PDF ${matchingMs.fileName}:`, err.message);
          msSrcDoc = null;
        }
        console.log(`[topical-extract] MS ${matchingMs.fileName}: segmented questions [${[...msSegments.keys()].join(', ')}]`);
      }

      // Step 7: Emit both documents question by question, in lockstep. Every
      // section starts with a labeled divider page, so it is always obvious
      // which answer belongs to which question.
      const qpSrcDoc = await PDFDocument.load(qpBuffer, { ignoreEncryption: true });
      const qpCopied = new Set();
      const msCopied = new Set();
      const paperLabel = `${qpPaper.year} ${qpPaper.termLabel} — Paper ${qpPaper.paperNumber} Variant ${qpPaper.variant}`;
      const msName = matchingMs ? matchingMs.fileName : qpPaper.fileName.replace(/_qp_/, '_ms_');

      // MCQ papers (e.g. science Paper 1) have ~40 short questions and a mark
      // scheme that is a single answer grid: it cannot be split per question,
      // and several questions share a QP page. Detecting this (many segmented
      // questions) lets us emit the selected question pages once and the answer
      // grid once — instead of the per-question splitting that duplicates the
      // grid under the first answer and drops the rest.
      const isMcq = qpSegments.size >= 20;
      if (isMcq) {
        const qpLabel = targetQs.length > 1 ? `Questions ${targetQs.join(', ')}` : `Question ${targetQs[0]}`;
        await addTextPageToMaster(masterQP, qpLabel, `${qpPaper.fileName}\n${paperLabel}`);
        for (const q of targetQs) {
          const seg = qpSegments.get(q);
          qpPagesAdded += await copyPageRange(masterQP, qpSrcDoc, seg.startPage, seg.endPage, qpCopied);
        }

        const gridText = msEligiblePages.length
          ? msEligiblePages.map(idx => msPageTexts[idx] || '').join('\n')
          : msPageTexts.join('\n');

        if (!msSrcDoc) {
          await addTextPageToMaster(
            masterMS,
            `Answer key unavailable — ${msName}`,
            `${paperLabel}\n\nThe mark scheme PDF could not be found or downloaded for question(s) ${targetQs.join(', ')}.`
          );
        } else {
          // Read just the answers for the selected questions out of the grid,
          // so the mark scheme shows "Question 3: B" instead of the whole key.
          const answerMap = parseMcqAnswers(gridText);
          const foundLines = [];
          const missing = [];
          for (const q of targetQs) {
            const a = answerMap.get(String(q));
            if (a) foundLines.push(`Question ${q}:  ${a}   (1 mark)`);
            else missing.push(q);
          }

          if (foundLines.length) {
            const note = missing.length
              ? `\n\nThe answer(s) for question(s) ${missing.join(', ')} could not be read automatically; the full answer grid is included after this page.`
              : '';
            await addTextPageToMaster(masterMS, `Answers — ${msName}`, `${paperLabel}\n\n${foundLines.join('\n')}${note}`);
            msPagesAdded += 1;
          }

          // Include the full grid only as a fallback: nothing parsed, or some
          // selected answers were not found.
          if (!foundLines.length || missing.length) {
            if (!foundLines.length) {
              await addTextPageToMaster(
                masterMS,
                `Answer key (MCQ) — ${msName}`,
                `${paperLabel}\n\nThe answer key could not be read automatically. The full grid follows; look up question(s) ${targetQs.join(', ')}.`
              );
            }
            const pagesToCopy = msEligiblePages.length
              ? msEligiblePages
              : Array.from({ length: msSrcDoc.getPageCount() }, (_, i) => i);
            for (const idx of pagesToCopy) {
              msPagesAdded += await copyPageRange(masterMS, msSrcDoc, idx, idx, msCopied);
            }
          }
        }

        if (sgEnabled) {
          for (const q of targetQs) {
            const seg = qpSegments.get(q);
            const questionText = qpPageTexts.slice(seg.startPage, seg.endPage + 1).join('\n');
            solutionInputs.push({ questionLabel: `Question ${q}`, paperLabel, questionText, markSchemeText: gridText });
          }
        }
        console.log(`[topical-extract] Emitted MCQ questions [${targetQs.join(', ')}] from ${qpPaper.fileName} (answer grid included once)`);
        continue;
      }

      // How to serve answers for this paper:
      //  'per-question' — answers located per question (structured papers)
      //  'whole'        — scheme exists but can't be split (e.g. MCQ answer
      //                   grids); include it once, clearly labeled
      //  'missing'      — no usable scheme; placeholders keep the lockstep
      const msMode = msSrcDoc ? (msSegments.size > 0 ? 'per-question' : 'whole') : 'missing';

      if (msMode === 'whole') {
        await addTextPageToMaster(
          masterMS,
          `Answers — ${msName}`,
          `${paperLabel}\n\nThis mark scheme could not be split into individual questions (it is likely an answer grid). The complete answer section follows; it covers question(s) ${targetQs.join(', ')}.`
        );
        const pagesToCopy = msEligiblePages.length
          ? msEligiblePages
          : Array.from({ length: msSrcDoc.getPageCount() }, (_, i) => i);
        for (const idx of pagesToCopy) {
          msPagesAdded += await copyPageRange(masterMS, msSrcDoc, idx, idx, msCopied);
        }
      } else if (msMode === 'missing') {
        await addTextPageToMaster(
          masterMS,
          `Mark scheme unavailable: ${msName}`,
          `${paperLabel}\n\nThe mark scheme PDF could not be found or downloaded. This placeholder stands in for the answers to question(s) ${targetQs.join(', ')} so questions and answers stay in the same order across both PDFs.`
        );
      }

      for (const q of targetQs) {
        const seg = qpSegments.get(q);
        await addTextPageToMaster(masterQP, `Question ${q}`, `${qpPaper.fileName}\n${paperLabel}`);
        qpPagesAdded += await copyPageRange(masterQP, qpSrcDoc, seg.startPage, seg.endPage, qpCopied);

        // Collect the text this question's Solution Guide page will be built
        // from (beta, only when enabled). Page ranges are 0-based inclusive.
        if (sgEnabled) {
          const questionText = qpPageTexts.slice(seg.startPage, seg.endPage + 1).join('\n');
          let markSchemeText = '';
          if (msMode === 'per-question') {
            const sgMsSeg = msSegments.get(q);
            if (sgMsSeg) markSchemeText = msPageTexts.slice(sgMsSeg.startPage, sgMsSeg.endPage + 1).join('\n');
          } else if (msMode === 'whole' && msEligiblePages.length) {
            markSchemeText = msEligiblePages.map(idx => msPageTexts[idx] || '').join('\n');
          }
          solutionInputs.push({ questionLabel: `Question ${q}`, paperLabel, questionText, markSchemeText });
        }

        if (msMode !== 'per-question') continue;

        const msSeg = msSegments.get(q);
        if (msSeg) {
          await addTextPageToMaster(masterMS, `Answer ${q}`, `${msName}\n${paperLabel}`);
          // Adds 0 pages only when this answer shares its page(s) with the
          // previous question's answers, which then sit directly above.
          msPagesAdded += await copyPageRange(masterMS, msSrcDoc, msSeg.startPage, msSeg.endPage, msCopied);
        } else {
          await addTextPageToMaster(
            masterMS,
            `Answer ${q} — not located`,
            `${msName}\n${paperLabel}\n\nThe answers to question ${q} could not be located in this mark scheme. This placeholder keeps questions and answers in the same order.`
          );
        }
      }
      console.log(`[topical-extract] Emitted questions [${targetQs.join(', ')}] from ${qpPaper.fileName} (MS mode: ${msMode})`);
    }

    if (qpPagesAdded === 0) {
      console.warn(`[topical-extract] No matching QP pages found for ${cleanTopic} in ${cleanCode}`);
    }

    // Build the beta Solution Guide as a styled, self-contained HTML page: one
    // worked-solution + scoring section per matched question. Token-heavy, so
    // it only runs when opted in and off production. Failures degrade to
    // placeholder text per question.
    let sgHtmlBytes = null;
    let sgPagesAdded = 0;
    if (sgEnabled && solutionInputs.length > 0) {
      console.log(`[topical-extract] Generating Solution Guide for ${solutionInputs.length} question(s).`);
      const items = [];
      for (const input of solutionInputs) {
        const solution = await generateSolutionForQuestion({ ...input, subjectCode: cleanCode, apiKey, model });
        items.push({ ...input, ...solution });
      }
      const html = buildSolutionGuideHtml({ subjectCode: cleanCode, topic: cleanTopic, years: targetYears, items });
      sgHtmlBytes = new TextEncoder().encode(html);
      sgPagesAdded = items.length;
    }

    // Serialize master PDFs
    const qpBytes = await masterQP.save();
    const msBytes = await masterMS.save();

    let qpUrl;
    let msUrl;
    let sgUrl = null;

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const isBlobConfigured = token && token !== 'vercel_BLOB_TOKEN_PLACEHOLDER';

    if (isBlobConfigured) {
      // Upload to Vercel Blob storage (public read) and get URLs
      const { put } = await import('@vercel/blob');
      const requestId = crypto.randomUUID();
      const qpBlob = await put(`${requestId}_qp.pdf`, qpBytes, { access: 'public', token });
      const msBlob = msBytes.length ? await put(`${requestId}_ms.pdf`, msBytes, { access: 'public', token }) : null;
      const sgBlob = sgHtmlBytes ? await put(`${requestId}_sg.html`, sgHtmlBytes, { access: 'public', token, contentType: 'text/html; charset=utf-8' }) : null;
      qpUrl = qpBlob.url;
      msUrl = msBlob?.url || null;
      // Blob serves text/html as a forced download, so open the guide through
      // our own origin (Content-Disposition: inline) instead of the blob URL.
      sgUrl = sgBlob ? `/api/solution-guide?src=${encodeURIComponent(sgBlob.url)}` : null;
    } else {
      console.log('[topical-extract] Vercel Blob token is missing or placeholder. Falling back to in-memory store.');
      // Fallback: save to in-memory store and serve via topical-download API
      const storeId = pdfStore.add({
        qp: qpBytes,
        ms: msBytes.length ? msBytes : undefined,
        sg: sgHtmlBytes || undefined
      });
      qpUrl = `/api/topical-download?requestId=${storeId}&type=qp`;
      msUrl = msBytes.length ? `/api/topical-download?requestId=${storeId}&type=ms` : null;
      sgUrl = sgHtmlBytes ? `/api/topical-download?requestId=${storeId}&type=sg` : null;
    }
    return NextResponse.json({
      topic: cleanTopic,
      subjectCode: cleanCode,
      years: targetYears,
      qpPagesFound: qpPagesAdded,
      msPagesFound: msPagesAdded,
      sgPagesFound: sgPagesAdded,
      qpUrl,
      msUrl,
      sgUrl,
    });

  } catch (error) {
    console.error('[topical-extract] Fatal error:', error);
    return NextResponse.json({ error: `Internal Error: ${error.message}` }, { status: 500 });
  }
}
