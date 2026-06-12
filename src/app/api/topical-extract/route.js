import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { generatePaperList, PAPER_YEARS } from '@/lib/paperService';
import { pdfStore } from '@/lib/pdfStore';

export const maxDuration = 300;

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/pdf,*/*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://bestexamhelp.com/',
};

async function filterExistingPapers(papers, concurrency = 15) {
  const results = [];
  for (let i = 0; i < papers.length; i += concurrency) {
    const chunk = papers.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map(async (paper) => {
        try {
          const res = await fetch(paper.url, { method: 'HEAD', headers: FETCH_HEADERS });
          if (res.ok) {
            return paper;
          }
        } catch (e) {
          console.warn(`[filterExistingPapers] HEAD check error for ${paper.fileName}:`, e.message);
        }
        return null;
      })
    );
    results.push(...chunkResults.filter(Boolean));
  }
  return results;
}

function sanitizeText(text) {
  if (!text) return '';
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/θ/g, 'theta')
    .replace(/λ/g, 'lambda')
    .replace(/π/g, 'pi')
    .replace(/Ω/g, 'ohms')
    .replace(/μ/g, 'micro')
    .replace(/α/g, 'alpha')
    .replace(/β/g, 'beta')
    .replace(/γ/g, 'gamma')
    .replace(/Δ/g, 'delta')
    .replace(/Φ/g, 'phi')
    .replace(/ρ/g, 'rho')
    .replace(/σ/g, 'sigma')
    .replace(/τ/g, 'tau')
    .replace(/±/g, '+/-')
    .replace(/°/g, ' degrees')
    .replace(/→/g, '->')
    .replace(/≈/g, 'approx. =')
    .replace(/≠/g, '!=')
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/×/g, 'x')
    .replace(/÷/g, '/')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/⁻¹/g, '^-1')
    .replace(/⁻²/g, '^-2')
    .replace(/⁻³/g, '^-3')
    .replace(/[^\x00-\x7F]/g, '?');
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
 * Downloads a PDF and returns its ArrayBuffer, or null on failure.
 */
async function fetchPdfBuffer(url) {
  try {
    const res = await fetch(url, { headers: FETCH_HEADERS });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('pdf')) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

/**
 * Extracts text from each page of a PDF buffer.
 * Returns an array of strings, one per page.
 */
async function extractPagesText(buffer) {
  const pageTexts = [];
  try {
    let pageIndex = 0;
    // Pass a plain Uint8Array, not a Node Buffer: pdf-parse's bundled pdf.js
    // resolves sub-streams via bytes.buffer while ignoring byteOffset, so a
    // pooled Buffer (byteOffset != 0) shifts every xref offset and corrupts
    // or aborts parsing.
    await pdfParse(new Uint8Array(buffer), {
      pagerender: (pageData) => {
        return pageData.getTextContent().then((textContent) => {
          const text = textContent.items.map(item => item.str).join(' ');
          pageTexts[pageIndex] = text;
          pageIndex++;
          return text;
        });
      }
    });
  } catch (err) {
    console.warn('pdf-parse extraction warning:', err.message);
  }
  return pageTexts;
}

/**
 * Extracts question bounding boxes from each page.
 * Returns an array of objects per page, containing question numbers and their Y coordinates.
 *
 * layout 'qp' (default): question numbers sit hard against the left margin,
 * so accept any digit-leading text item close to the edge.
 * layout 'ms': modern Cambridge/Edexcel mark schemes are tables whose
 * "Question" column labels ("1", "1(a)", "12(b)(ii)") are centered in the
 * column — they can start well past the QP margin cutoff — while the Answer
 * column often begins with numbers ("1.6 J"). So search a wider band but only
 * accept items that are exactly a question label.
 */
async function extractQuestionsMetadata(buffer, { layout = 'qp' } = {}) {
  const pagesData = [];
  const MS_LABEL_RE = /^(\d{1,2})(\s*\([a-z0-9]{1,4}\))*$/i;
  try {
    let pageIndex = 0;
    // Plain Uint8Array for the same byteOffset reason as extractPagesText
    await pdfParse(new Uint8Array(buffer), {
      pagerender: (pageData) => {
        return pageData.getTextContent().then((textContent) => {
          const items = textContent.items;
          const rotation = pageData.pageInfo.rotate || 0;
          const view = pageData.pageInfo.view || [0, 0, 595.27, 841.89];
          const isLandscape = (rotation === 90 || rotation === 270);

          const questionsOnPage = [];
          items.forEach(item => {
             const str = item.str;
             const x = item.transform[4];
             const y = item.transform[5];

             const hCoord = isLandscape ? y : x;
             const vCoord = isLandscape ? x : y;

             const maxH = isLandscape ? 120 : (layout === 'ms' ? 150 : 80);
             if (hCoord < maxH) {
                 let qLabel = null;
                 if (layout === 'ms') {
                     const match = str.trim().match(MS_LABEL_RE);
                     if (match) qLabel = match[1];
                 } else {
                     // A question start is a standalone number item ("1", "12",
                     // "3(a)…") — the bold number is its own text run in real
                     // papers. A number followed by words ("2 kg") is data
                     // inside a question, not a question start.
                     const match = str.trim().match(/^(\d{1,2})\s*(\(.*)?$/);
                     if (match) qLabel = match[1];
                 }
                 if (qLabel) {
                     const mainQNum = parseInt(qLabel);
                     if (mainQNum >= 1 && mainQNum <= 40) {
                         questionsOnPage.push({ number: String(mainQNum), v: vCoord });
                     }
                 }
             }
          });
          
          // Sort from visual top to bottom
          if (isLandscape) {
              questionsOnPage.sort((a, b) => a.v - b.v);
          } else {
              questionsOnPage.sort((a, b) => b.v - a.v);
          }
          
          // Deduplicate to keep only first occurrence of each question number
          const uniqueQs = [];
          const seen = new Set();
          for (const q of questionsOnPage) {
              if (!seen.has(q.number)) {
                  seen.add(q.number);
                  uniqueQs.push(q);
              }
          }
          
          pagesData.push({
             pageIndex: pageIndex,
             questions: uniqueQs,
             isLandscape: isLandscape,
             pageHeight: isLandscape ? view[2] : view[3],
             pageWidth: isLandscape ? view[3] : view[2],
             rotation: rotation
          });
          pageIndex++;
          return '';
        });
      }
    });
  } catch (err) {
    console.warn('pdf-parse extraction warning:', err.message);
  }
  return pagesData;
}

/**
 * Ask OpenAI to identify which page indices are about the requested topic.
 * Returns an array of { pageIndex, questionNumbers } objects.
 */
async function classifyPages(pageTexts, topic, paperFileName, apiKey, model) {
  if (!pageTexts || pageTexts.length === 0) return [];

  // Build a complete summary of each page for classification
  const pageSummaries = pageTexts
    .map((text, i) => `PAGE ${i + 1}: ${(text || '').slice(0, 4000)}`)
    .join('\n\n---\n\n');

  const prompt = `
You are a Cambridge examiner assistant. You are given text extracted from a past paper called "${paperFileName}".

The student wants questions about the topic: "${topic}"

Below are snippets of text from each page. Identify ONLY the pages that contain actual exam questions (not answer space, not headers) related to "${topic}".

Return a JSON object with this exact structure:
{
  "matches": [
    { "pageIndex": 2, "questionNumbers": ["3", "4a"] },
    { "pageIndex": 3, "questionNumbers": ["4b", "4c"] }
  ]
}

If NO pages match, return: { "matches": [] }

PAGE TEXTS:
${pageSummaries}
`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
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
  try {
    const parsed = JSON.parse(data.choices[0].message.content);
    return parsed.matches || [];
  } catch {
    return [];
  }
}

/**
 * Extract question numbers from page text using common Cambridge exam patterns.
 * Looks for patterns like "1 ", "2 (a)", "Question 3", "3(b)(i)" etc.
 */
function extractQuestionNumbersFromText(pageTexts, pageIndices) {
  const questionNums = new Set();
  for (const idx of pageIndices) {
    const text = pageTexts[idx - 1] || '';
    // Match patterns like: "1 ", "2 ", "3(a)", "4 (b)", "Question 5", etc.
    // Cambridge papers typically use bold numbers at the start of questions
    const patterns = [
      /(?:^|\n)\s*(\d{1,2})\s*(?:\(|\s)/gm,          // "3 (" or "3 " at line start
      /Question\s+(\d{1,2})/gi,                        // "Question 3"
      /(?:^|\n)\s*(\d{1,2})\s*$/gm,                    // lone number at line start
    ];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const num = parseInt(match[1]);
        if (num >= 1 && num <= 40) {  // reasonable question number range
          questionNums.add(String(num));
        }
      }
    }
  }
  return [...questionNums].sort((a, b) => parseInt(a) - parseInt(b));
}

/**
 * Normalizes a question label like "4a", "Q3(b)(ii)" or 7 to its main
 * question number string ("4", "3", "7"). Returns '' when there is none.
 */
function mainQuestionNumber(label) {
  const match = String(label).match(/\d+/);
  return match ? match[0] : '';
}

/**
 * Splits a paper into whole-question page ranges using the detected question
 * start positions. Returns a Map of main question number → { startPage,
 * endPage } (0-based, inclusive). A question runs from the page where its
 * number first appears to the page where the next question begins — sharing
 * that boundary page unless the next question starts at the very top of it.
 *
 * Question numbers must be strictly increasing through the document, which
 * drops false positives (a "2 kg" data value detected inside question 3
 * cannot start a new segment).
 */
function segmentQuestions(pagesMeta, isEligiblePage = () => true, topBandPt = 110) {
  const starts = [];
  let lastEligiblePage = -1;
  let lastNum = 0;
  for (const meta of pagesMeta) {
    if (!isEligiblePage(meta.pageIndex)) continue;
    lastEligiblePage = meta.pageIndex;
    for (const q of meta.questions) {
      const main = mainQuestionNumber(q.number);
      const n = parseInt(main);
      if (!main || isNaN(n) || n <= lastNum) continue;
      lastNum = n;
      starts.push({ qNum: main, pageIndex: meta.pageIndex, v: q.v, meta });
    }
  }

  const segments = new Map();
  for (let i = 0; i < starts.length; i++) {
    const cur = starts[i];
    const next = starts[i + 1];
    let endPage;
    if (!next) {
      endPage = lastEligiblePage;
    } else if (next.pageIndex > cur.pageIndex) {
      // If the next question starts within the top band of its page, the
      // current question ended on the page before; otherwise the page is
      // shared. Mark scheme tables repeat a header row, so their callers
      // pass a deeper band.
      const nextStartsAtTop = next.meta.isLandscape
        ? next.v <= topBandPt
        : next.v >= next.meta.pageHeight - topBandPt;
      endPage = nextStartsAtTop ? next.pageIndex - 1 : next.pageIndex;
    } else {
      endPage = cur.pageIndex;
    }
    segments.set(cur.qNum, { startPage: cur.pageIndex, endPage: Math.max(endPage, cur.pageIndex) });
  }
  return segments;
}

/**
 * Copies a 0-based inclusive page range from srcDoc into masterDoc, skipping
 * pages already contributed by this paper (adjacent questions can share a
 * boundary page). Returns the number of pages added.
 */
async function copyPageRange(masterDoc, srcDoc, startPage, endPage, alreadyCopied) {
  const total = srcDoc.getPageCount();
  const indices = [];
  for (let i = Math.max(0, startPage); i <= endPage && i < total; i++) {
    if (alreadyCopied.has(i)) continue;
    alreadyCopied.add(i);
    indices.push(i);
  }
  if (indices.length === 0) return 0;
  const pages = await masterDoc.copyPages(srcDoc, indices);
  pages.forEach((p) => masterDoc.addPage(p));
  return pages.length;
}

export async function POST(request) {
  try {
    const { subjectCode, topic, years = PAPER_YEARS.slice(0, 2), variants = [], paperType, variantType } = await request.json();
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

    // Skip HEAD existence check; use all candidates directly
    const existingQpCandidates = qpCandidates;
    const existingMsCandidates = msCandidates;


    const masterQP = await PDFDocument.create();
    const masterMS = await PDFDocument.create();

    let qpPagesAdded = 0;
    let msPagesAdded = 0;

    for (const qpPaper of existingQpCandidates) {
      console.log(`[topical-extract] Scanning ${qpPaper.fileName}...`);

      // Step 1: Fetch QP binary
      const qpBuffer = await fetchPdfBuffer(qpPaper.url);
      if (!qpBuffer) {
        console.log(`[topical-extract] Skipped ${qpPaper.fileName} (not found or not a PDF)`);
        continue;
      }

      // Step 2: Extract text per page (for AI identification only)
      const qpPageTexts = await extractPagesText(qpBuffer);
      const qpPageMeta = await extractQuestionsMetadata(qpBuffer);
      if (qpPageTexts.length === 0) continue;

      // Step 3: Classify which pages are about the topic
      let qpMatches = await classifyPages(qpPageTexts, cleanTopic, qpPaper.fileName, apiKey, model);
      // Fallback: enhanced keyword search if OpenAI finds nothing
      if (qpMatches.length === 0) {
        const topicLower = cleanTopic.toLowerCase();
        const stem = topicLower.slice(0, Math.max(3, Math.floor(topicLower.length * 0.7)));
        const syns = {
          "kinematics": ["motion", "vector", "displacement"],
          "dynamics": ["force", "newton", "momentum"],
          "electricity": ["circuit", "current", "voltage", "resistance"]
        };
        const extra = syns[topicLower] || [];
        const searchTerms = [topicLower, stem, ...extra];
        
        const keywordMatches = [];
        qpPageTexts.forEach((text, idx) => {
          if (!text) return;
          const lower = text.toLowerCase();
          if (searchTerms.some(term => lower.includes(term))) {
            keywordMatches.push({ pageIndex: idx + 1, questionNumbers: [] });
          }
        });
        qpMatches = keywordMatches;
      }
      // Question papers open with front matter — cover instructions, data and
      // formulae sheets, the periodic table, blank pages. Topic keywords often
      // appear there ("gravitational constant" lives on the physics data page),
      // so the keyword fallback and even the AI can match them. Strip those
      // pages from every match path: they are never exam questions.
      const QP_FRONT_MATTER_RE = /READ THESE INSTRUCTIONS|\bINSTRUCTIONS\b|INFORMATION FOR (CANDIDATES|EXAMINERS)|This document (has|consists of)|BLANK PAGE|acceleration of free fall|speed of light in free space|Periodic Table|List of formulae/;
      qpMatches = qpMatches.filter(m => !QP_FRONT_MATTER_RE.test(qpPageTexts[m.pageIndex - 1] || ''));

      if (qpMatches.length === 0) {
        // Nothing about this topic in this paper. Skip it entirely — padding
        // the pack with the whole paper would bury the topic in unrelated
        // questions and answers.
        console.log(`[topical-extract] No "${cleanTopic}" pages in ${qpPaper.fileName}, skipping paper`);
        continue;
      }

      // Merge duplicate page entries and sort by page index so questions are
      // copied in document order — the AI's match order isn't guaranteed, and
      // out-of-order QP pages break the QP↔MS correspondence.
      const qpByPage = new Map();
      for (const m of qpMatches) {
        const existing = qpByPage.get(m.pageIndex);
        if (existing) {
          existing.questionNumbers = [...new Set([...existing.questionNumbers, ...(m.questionNumbers || [])])];
        } else {
          qpByPage.set(m.pageIndex, { pageIndex: m.pageIndex, questionNumbers: [...(m.questionNumbers || [])] });
        }
      }
      qpMatches = [...qpByPage.values()].sort((a, b) => a.pageIndex - b.pageIndex);

      const qpPageIndices = qpMatches.map(m => m.pageIndex);
      let questionNumbers = qpMatches.flatMap(m => m.questionNumbers || []);

      // If OpenAI didn't return question numbers (fallback paths), extract them from the QP page text
      if (questionNumbers.length === 0) {
        // We didn't get question numbers from OpenAI. 
        // Let's populate them from qpPageMeta for the matched pages!
        qpMatches.forEach(m => {
           const meta = qpPageMeta[m.pageIndex - 1];
           if (meta && meta.questions.length > 0) {
               m.questionNumbers = meta.questions.map(q => q.number);
           }
        });
        questionNumbers = qpMatches.flatMap(m => m.questionNumbers || []);
        
        if (questionNumbers.length === 0) {
          questionNumbers = extractQuestionNumbersFromText(qpPageTexts, qpPageIndices);
        }
        if (questionNumbers.length > 0) {
          console.log(`[topical-extract] Extracted question numbers [${questionNumbers}] from QP page text for ${qpPaper.fileName}`);
        }
      }
      console.log(`[topical-extract] Found pages [${qpPageIndices}] for "${cleanTopic}" in ${qpPaper.fileName} — questions: ${questionNumbers.join(', ')}`);

      // Step 4: Split the question paper into whole-question page ranges.
      // The ranges — from where each question number first appears to where
      // the next begins — are the single source of truth for BOTH output
      // documents, so questions and answers cannot drift apart.
      const qpSegments = segmentQuestions(qpPageMeta, (i) => !QP_FRONT_MATTER_RE.test(qpPageTexts[i] || ''));
      const targetQs = [...new Set(questionNumbers.map(mainQuestionNumber).filter(Boolean))]
        .filter(q => qpSegments.has(q))
        .sort((a, b) => parseInt(a) - parseInt(b));

      if (targetQs.length === 0) {
        console.log(`[topical-extract] Could not locate question starts for [${questionNumbers.join(', ')}] in ${qpPaper.fileName}, skipping paper`);
        continue;
      }
      console.log(`[topical-extract] Target questions for ${qpPaper.fileName}: [${targetQs.join(', ')}]`);

      // Step 5: Find the corresponding Mark Scheme.
      // Match by year, series, paper number, and variant. For Cambridge there is
      // exactly one MS candidate per match. For Edexcel the MS filename embeds a
      // publish date that differs from the QP (mark schemes are released months
      // after the exam), so there are many date-guess candidates — we must try
      // each until one actually resolves, exactly like the QP loop above.
      const matchingMsCandidates = existingMsCandidates.filter(ms =>
          ms.year === qpPaper.year &&
          ms.term === qpPaper.term &&
          ms.paperNumber === qpPaper.paperNumber &&
          ms.variant === qpPaper.variant
        );

      // Step 6: Fetch MS binary — try each candidate URL until one resolves to a
      // real PDF. Misses on Pearson redirect to a small HTML 404 page, which
      // fetchPdfBuffer rejects via its content-type check, so this stays cheap.
      // A missing mark scheme no longer skips the paper: the lockstep emitter
      // below inserts labeled placeholders instead so nothing shifts.
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

      // Step 7: Segment the mark scheme by question with the SAME routine used
      // for the question paper, after dropping its front matter.
      let msSegments = new Map();
      let msSrcDoc = null;
      let msEligiblePages = [];
      if (msBuffer) {
        const msPageMeta = await extractQuestionsMetadata(msBuffer, { layout: 'ms' });
        const msPageTexts = await extractPagesText(msBuffer);

        // Mark schemes open with several pages of front matter (cover, generic
        // marking principles, abbreviations, notes). Those pages contain
        // numbered lists ("1 Examiners should consider…") that look exactly
        // like question labels, so they must never take part in segmentation.
        const FRONT_MATTER_RE = /GENERIC MARKING PRINCIPLE|MARKING PRINCIPLES|MARK SCHEME NOTES|GENERAL MARKING GUIDANCE|ABBREVIATIONS|Maximum Mark/i;
        const isFrontMatterPage = msPageTexts.map(t => FRONT_MATTER_RE.test(t || ''));
        // The answer table starts at the first page with a Question/Answer/Marks
        // (Cambridge) or Question Number/Scheme/Marks (Edexcel) header. A page
        // carrying that header is always an answer page, even when the tail of
        // the front matter (e.g. the abbreviations list) shares the page —
        // otherwise question 1's answers would be lost.
        const hasAnswerHeader = msPageTexts.map(t => /Question\s+(Number\s+)?(Answer|Scheme)\s+Marks/i.test(t || ''));
        const firstAnswerPage = hasAnswerHeader.indexOf(true);
        const isAnswerPage = (pageIdx0) =>
          hasAnswerHeader[pageIdx0] ||
          (!isFrontMatterPage[pageIdx0] && (firstAnswerPage === -1 || pageIdx0 >= firstAnswerPage));

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

      // Step 8: Emit both documents question by question, in lockstep. Every
      // section starts with a labeled divider page, so it is always obvious
      // which answer belongs to which question — even when a page could not
      // be found and a placeholder stands in.
      const qpSrcDoc = await PDFDocument.load(qpBuffer, { ignoreEncryption: true });
      const qpCopied = new Set();
      const msCopied = new Set();
      const paperLabel = `${qpPaper.year} ${qpPaper.termLabel} — Paper ${qpPaper.paperNumber} Variant ${qpPaper.variant}`;
      const msName = matchingMs ? matchingMs.fileName : qpPaper.fileName.replace(/_qp_/, '_ms_');

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
      // Proceed to return empty PDFs instead of 404 error
    }

    // Serialize both master PDFs
    const qpBytes = await masterQP.save();
    const msBytes = await masterMS.save();

    let qpUrl;
    let msUrl;

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const isBlobConfigured = token && token !== 'vercel_BLOB_TOKEN_PLACEHOLDER';

    if (isBlobConfigured) {
      // Upload PDFs to Vercel Blob storage (public read) and get URLs
      const { put } = await import('@vercel/blob');
      const requestId = crypto.randomUUID();
      const qpBlob = await put(`${requestId}_qp.pdf`, qpBytes, { access: 'public', token });
      const msBlob = msBytes.length ? await put(`${requestId}_ms.pdf`, msBytes, { access: 'public', token }) : null;
      qpUrl = qpBlob.url;
      msUrl = msBlob?.url || null;
    } else {
      console.log('[topical-extract] Vercel Blob token is missing or placeholder. Falling back to in-memory store.');
      // Fallback: save to in-memory store and serve via topical-download API
      const storeId = pdfStore.add({
        qp: qpBytes,
        ms: msBytes.length ? msBytes : undefined
      });
      qpUrl = `/api/topical-download?requestId=${storeId}&type=qp`;
      msUrl = msBytes.length ? `/api/topical-download?requestId=${storeId}&type=ms` : null;
    }
    return NextResponse.json({
      topic: cleanTopic,
      subjectCode: cleanCode,
      years: targetYears,
      qpPagesFound: qpPagesAdded,
      msPagesFound: msPagesAdded,
      qpUrl,
      msUrl,
    });

  } catch (error) {
    console.error('[topical-extract] Fatal error:', error);
    return NextResponse.json({ error: `Internal Error: ${error.message}` }, { status: 500 });
  }
}
