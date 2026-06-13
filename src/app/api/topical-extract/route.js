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
      if (msBuffer) {
        const msPageMeta = await extractQuestionsMetadata(msBuffer, { layout: 'ms' });
        const msPageTexts = await extractPagesText(msBuffer);
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
