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
    await pdfParse(Buffer.from(buffer), {
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
 */
async function extractQuestionsMetadata(buffer) {
  const pagesData = [];
  try {
    let pageIndex = 0;
    await pdfParse(Buffer.from(buffer), {
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
             
             const maxH = isLandscape ? 120 : 80;
             if (hCoord < maxH) {
                 const match = str.trim().match(/^\s*(\d+)/);
                 if (match) {
                     const mainQNum = parseInt(match[1]);
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
 * Given a list of page matches and metadata, copy those exact pages from the source PDF
 * into the master document, cropping to the specific question if possible.
 */
async function copyPagesToMaster(masterDoc, pdfBuffer, matches, pagesMetadata) {
  if (!pdfBuffer || matches.length === 0) return 0;
  try {
    const srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    const totalPages = srcDoc.getPageCount();
    let copiedCount = 0;
    
    // Convert 1-based page numbers to 0-based indices, and bounds-check
    const validMatches = matches.filter(m => {
      const i = m.pageIndex - 1;
      return i >= 0 && i < totalPages;
    });
    
    if (validMatches.length === 0) return 0;
    
    const pageIndicesToCopy = validMatches.map(m => m.pageIndex - 1);
    const copiedPages = await masterDoc.copyPages(srcDoc, pageIndicesToCopy);
    
    for (let idx = 0; idx < copiedPages.length; idx++) {
      const page = copiedPages[idx];
      const match = validMatches[idx];
      const pageIndex0 = match.pageIndex - 1;
      
      const targetQuestionNums = match.questionNumbers || [];
      const pageMeta = pagesMetadata[pageIndex0] || { 
        questions: [], 
        isLandscape: false, 
        pageHeight: 841.89, 
        pageWidth: 595.27, 
        rotation: 0 
      };
      
      const isLandscape = pageMeta.isLandscape;
      const pageHeight = pageMeta.pageHeight;
      const pageWidth = pageMeta.pageWidth;
      const allQs = pageMeta.questions;
      
      if (targetQuestionNums.length > 0) {
          const intervals = [];
          if (allQs.length === 0) {
              // No questions detected, keep whole page
              intervals.push({
                  qNum: targetQuestionNums[0],
                  boundA: isLandscape ? 0 : pageHeight,
                  boundB: isLandscape ? pageHeight : 0
              });
          } else {
              // Interval 0 (continuation from previous page)
              const firstQVal = parseInt(allQs[0].number);
              const prevQNum = (isNaN(firstQVal) || firstQVal <= 1) ? allQs[0].number : String(firstQVal - 1);
              intervals.push({
                  qNum: prevQNum,
                  boundA: isLandscape ? 0 : pageHeight,
                  boundB: allQs[0].v
              });
              
              // Middle intervals
              for (let i = 0; i < allQs.length - 1; i++) {
                  intervals.push({
                      qNum: allQs[i].number,
                      boundA: allQs[i].v,
                      boundB: allQs[i + 1].v
                  });
              }
              
              // Last interval
              intervals.push({
                  qNum: allQs[allQs.length - 1].number,
                  boundA: allQs[allQs.length - 1].v,
                  boundB: isLandscape ? pageHeight : 0
              });
          }
          
          const keptIntervals = intervals.filter(int => 
              targetQuestionNums.map(String).includes(String(int.qNum))
          );
          
          if (keptIntervals.length > 0) {
              if (isLandscape) {
                  let xMin = Math.min(...keptIntervals.flatMap(i => [i.boundA, i.boundB]));
                  let xMax = Math.max(...keptIntervals.flatMap(i => [i.boundA, i.boundB]));
                  
                  // Apply visual cropping with padding
                  if (xMin > 0) xMin = Math.max(0, xMin - 20);
                  if (xMax < pageHeight) xMax = Math.max(0, xMax - 20);
                  
                  if (xMin > 0 || xMax < pageHeight) {
                      page.setCropBox(xMin, 0, xMax - xMin, pageWidth);
                  }
              } else {
                  let yMin = Math.min(...keptIntervals.flatMap(i => [i.boundA, i.boundB]));
                  let yMax = Math.max(...keptIntervals.flatMap(i => [i.boundA, i.boundB]));
                  
                  // Apply visual cropping with padding
                  if (yMax < pageHeight) yMax = Math.min(pageHeight, yMax + 20);
                  if (yMin > 0) yMin = Math.min(pageHeight, yMin + 20);
                  
                  if (yMin > 0 || yMax < pageHeight) {
                      const { width } = page.getSize();
                      page.setCropBox(0, yMin, width, yMax - yMin);
                  }
              }
          }
      }
      
      masterDoc.addPage(page);
      copiedCount++;
    }
    
    return copiedCount;
  } catch (err) {
    console.error('copyPagesToMaster error:', err.message);
    return 0;
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
      if (qpMatches.length === 0) {
        console.log(`[topical-extract] No "${cleanTopic}" pages in ${qpPaper.fileName}, including all pages as fallback`);
        // Fallback: include all pages when no matches are found
        qpMatches = qpPageTexts.map((_, idx) => ({ pageIndex: idx + 1, questionNumbers: [] }));
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

      // Step 4: Copy those exact visual pages (snippet) into master QP PDF
      const qpAdded = await copyPagesToMaster(masterQP, qpBuffer, qpMatches, qpPageMeta);
      qpPagesAdded += qpAdded;
      if (qpAdded === 0) {
        // Nothing from this paper made it into the QP PDF, so adding its mark
        // scheme would put orphaned answers in the MS PDF and shift alignment.
        console.log(`[topical-extract] No QP pages copied from ${qpPaper.fileName}, skipping its mark scheme`);
        continue;
      }

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

      // Questions from this paper are already in the QP PDF, so the MS PDF must
      // receive something for it too — otherwise every later answer shifts and
      // stops lining up with its question. Insert a placeholder when missing.
      const addMsPlaceholder = async (reason) => {
        await addTextPageToMaster(
          masterMS,
          `Mark scheme unavailable: ${qpPaper.fileName.replace(/_qp_/, '_ms_')}`,
          `${reason}\n\nThis page is a placeholder for the answers to question(s) ${questionNumbers.join(', ') || 'shown'} of ${qpPaper.fileName}, to keep questions and answers in the same order across both PDFs.`
        );
      };

      if (matchingMsCandidates.length === 0) {
        console.log(`[topical-extract] No matching MS for ${qpPaper.fileName}`);
        await addMsPlaceholder('No matching mark scheme was found for this paper.');
        continue;
      }

      // Step 6: Fetch MS binary — try each candidate URL until one resolves to a
      // real PDF. Misses on Pearson redirect to a small HTML 404 page, which
      // fetchPdfBuffer rejects via its content-type check, so this stays cheap.
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
        console.log(`[topical-extract] MS fetch failed for ${qpPaper.fileName} after trying ${matchingMsCandidates.length} candidate(s)`);
        await addMsPlaceholder('The mark scheme PDF could not be downloaded.');
        continue;
      }

      // Step 7: Extract MS page metadata and match by QUESTION NUMBER (not page number)
      const msPageMeta = await extractQuestionsMetadata(msBuffer);

      let msMatches = [];

      // PRIMARY STRATEGY: Match MS pages by question number
      // This is far more reliable than page-index mirroring or AI classification,
      // because QP page 3 does NOT correspond to MS page 3 — but Question 3 in the
      // QP always corresponds to Question 3 in the MS.
      // Normalize the target question numbers (strip sub-parts like "4a" → "4")
      const targetMainQNums = new Set(
        questionNumbers.map(q => String(q).replace(/[^0-9]/g, '')).filter(Boolean)
      );

      if (targetMainQNums.size > 0) {
        console.log(`[topical-extract] Looking for MS pages containing questions: [${[...targetMainQNums].join(', ')}] in ${matchingMs.fileName}`);

        // Scan every MS page's metadata to find pages that contain any of our target question numbers
        for (const pageMeta of msPageMeta) {
          const pageQNums = pageMeta.questions.map(q => String(q.number));
          const hasTargetQuestion = pageQNums.some(qn => targetMainQNums.has(qn));

          if (hasTargetQuestion) {
            // Only include the question numbers we actually care about on this page
            const matchedQNums = pageQNums.filter(qn => targetMainQNums.has(qn));
            msMatches.push({
              pageIndex: pageMeta.pageIndex + 1, // convert 0-based to 1-based
              questionNumbers: matchedQNums
            });
          }
        }

        // Also check for questions that span across pages (continuation pages).
        // If question N starts on page X and continues onto page X+1, page X+1 might
        // not have question N's number at the top. We detect this by checking if there's
        // a gap: if we found Q3 on page 5 and Q4 on page 7, page 6 is likely a
        // continuation of Q3.
        if (msMatches.length > 0 && msPageMeta.length > 0) {
          const matchedPageIndices = new Set(msMatches.map(m => m.pageIndex));
          const continuationPages = [];

          for (let i = 0; i < msPageMeta.length; i++) {
            const pageIdx1Based = msPageMeta[i].pageIndex + 1;
            if (matchedPageIndices.has(pageIdx1Based)) continue; // already matched

            const pageQNums = msPageMeta[i].questions.map(q => String(q.number));
            
            // A continuation page typically has no new question number, or only has
            // question numbers that are continuations of target questions.
            // Check if the previous page is matched and the next question hasn't started yet.
            if (matchedPageIndices.has(pageIdx1Based - 1)) {
              // Find what the "current" question is from the previous matched page
              const prevMatch = msMatches.find(m => m.pageIndex === pageIdx1Based - 1);
              if (prevMatch) {
                const lastQOnPrevPage = prevMatch.questionNumbers[prevMatch.questionNumbers.length - 1];
                
                // This page is a continuation if it has no questions, or its questions
                // are still within our target set
                if (pageQNums.length === 0) {
                  continuationPages.push({
                    pageIndex: pageIdx1Based,
                    questionNumbers: [lastQOnPrevPage]
                  });
                } else {
                  // Check if the first question on this page is still one of our targets
                  // or if it's the same question continuing
                  const firstQOnThisPage = pageQNums[0];
                  if (targetMainQNums.has(firstQOnThisPage) && !matchedPageIndices.has(pageIdx1Based)) {
                    // Already would be caught, but just in case
                    continuationPages.push({
                      pageIndex: pageIdx1Based,
                      questionNumbers: pageQNums.filter(qn => targetMainQNums.has(qn))
                    });
                  }
                }
              }
            }
          }

          msMatches.push(...continuationPages);
          // Sort by page index for proper ordering
          msMatches.sort((a, b) => a.pageIndex - b.pageIndex);
        }

        if (msMatches.length > 0) {
          console.log(`[topical-extract] Question-number matching found ${msMatches.length} MS pages in ${matchingMs.fileName}: pages [${msMatches.map(m => m.pageIndex).join(', ')}]`);
        }
      }

      // FALLBACK: If no question numbers were available from the QP, try OpenAI on the MS
      if (msMatches.length === 0) {
        console.log(`[topical-extract] No question numbers available for ${matchingMs.fileName}, falling back to OpenAI classification`);
        
        const msPageTexts = await extractPagesText(msBuffer);
        await new Promise(r => setTimeout(r, 500));

        try {
          // When we know which questions were extracted from the QP, ask for
          // those exact answers — matching by topic instead would pull in
          // answers to different questions and break QP↔MS alignment.
          const msGoal = targetMainQNums.size > 0
            ? `The student needs the mark scheme answers for question number(s): ${[...targetMainQNums].join(', ')}.

Identify ONLY the pages that contain the answers to those exact question numbers.`
            : `The student wants mark scheme pages related to the topic: "${cleanTopic}"

Identify ONLY the pages that contain mark scheme answers related to "${cleanTopic}".`;

          const msPrompt = `
You are a Cambridge examiner assistant. You are given text extracted from a mark scheme called "${matchingMs.fileName}".

${msGoal}

Return a JSON object:
{
  "matches": [
    { "pageIndex": 5, "questionNumbers": ["3"] }
  ]
}

If nothing matches, return: { "matches": [] }

PAGE TEXTS:
${msPageTexts.map((t, i) => `PAGE ${i + 1}: ${(t || '').slice(0, 4000)}`).join('\n\n---\n\n')}
`;

          const msRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: 'You are a JSON-only API assistant. Output ONLY valid JSON.' },
                { role: 'user', content: msPrompt }
              ],
              response_format: { type: 'json_object' },
              temperature: 0.1,
            }),
          });

          if (msRes.ok) {
            const msData = await msRes.json();
            const msParsed = JSON.parse(msData.choices[0].message.content);
            msMatches = msParsed.matches || [];
            console.log(`[topical-extract] OpenAI fallback found ${msMatches.length} MS pages in ${matchingMs.fileName}`);
          }
        } catch (err) {
          console.warn(`[topical-extract] OpenAI MS classification error for ${matchingMs.fileName}:`, err.message);
        }
        
        // Ensure fallback MS matches have question numbers populated from metadata
        msMatches.forEach(m => {
          if (!m.questionNumbers || m.questionNumbers.length === 0) {
            const meta = msPageMeta[m.pageIndex - 1];
            if (meta && meta.questions.length > 0) {
              m.questionNumbers = meta.questions.map(q => q.number);
            }
          }
        });
        msMatches.sort((a, b) => a.pageIndex - b.pageIndex);
      }

      // Copy actual MS PDF pages (not re-drawn text) into the master MS document
      if (msMatches.length > 0) {
        const msAdded = await copyPagesToMaster(masterMS, msBuffer, msMatches, msPageMeta);
        msPagesAdded += msAdded;
        console.log(`[topical-extract] Copied ${msAdded} actual MS pages from ${matchingMs.fileName}`);
      } else {
        console.log(`[topical-extract] No MS pages found for ${matchingMs.fileName} after all strategies`);
        await addMsPlaceholder('The matching answer pages could not be located inside the mark scheme.');
      }
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
