import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { generatePaperList } from '@/lib/paperService';
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
          const questionsOnPage = [];
          items.forEach(item => {
             const str = item.str;
             const x = item.transform[4];
             const y = item.transform[5];
             
             if (x < 80 && /^\s*\d+\s*$/.test(str)) {
                 questionsOnPage.push({ number: str.trim(), y: y, x: x });
             } else if (/^Question\s+\d+/i.test(str)) {
                 const numMatch = str.match(/\d+/);
                 if (numMatch) {
                     questionsOnPage.push({ number: numMatch[0], y: y, x: x });
                 }
             } else if (x < 80 && /^\s*\d+\([a-z]\)\s*$/.test(str)) {
                 const numMatch = str.match(/\d+/);
                 if (numMatch) {
                     questionsOnPage.push({ number: numMatch[0], y: y, x: x });
                 }
             }
          });
          questionsOnPage.sort((a, b) => b.y - a.y);
          pagesData.push({
             pageIndex: pageIndex,
             questions: questionsOnPage,
             pageHeight: pageData.view ? pageData.view[3] : 841.89
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
 * Ask Groq to identify which page indices are about the requested topic.
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

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
      const pageMeta = pagesMetadata[pageIndex0] || { questions: [], pageHeight: 841.89 };
      
      let cropTop = pageMeta.pageHeight;
      let cropBottom = 0;
      
      if (targetQuestionNums.length > 0 && pageMeta.questions.length > 0) {
          const allQs = pageMeta.questions; // already sorted descending by Y
          const cropRegions = [];
          
          for (const targetQNum of targetQuestionNums) {
              const qIndex = allQs.findIndex(q => q.number === String(targetQNum));
              if (qIndex !== -1) {
                  const qTop = allQs[qIndex].y + 20; // 20 units above the question text
                  const qBottom = (qIndex + 1 < allQs.length) ? allQs[qIndex + 1].y - 20 : 0;
                  cropRegions.push({ top: qTop, bottom: qBottom });
              }
          }
          
          if (cropRegions.length > 0) {
              cropTop = Math.min(pageMeta.pageHeight, Math.max(...cropRegions.map(r => r.top)));
              cropBottom = Math.max(0, Math.min(...cropRegions.map(r => r.bottom)));
          }
      }
      
      if (cropTop < pageMeta.pageHeight || cropBottom > 0) {
          const { width } = page.getSize();
          page.setCropBox(0, cropBottom, width, cropTop - cropBottom);
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
    const { subjectCode, topic, years = [2023, 2022], variants = [], paperType, variantType } = await request.json();
    const selectedVariants = Array.isArray(variants) ? variants.map(v => Number(v)) : [];
    const targetYears = years;

    if (!subjectCode || subjectCode.trim().length === 0) {
      return NextResponse.json({ error: 'Enter a valid subject code' }, { status: 400 });
    }
    if (!topic || topic.trim().length < 2) {
      return NextResponse.json({ error: 'Enter a topic name' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    const cleanCode = subjectCode.replace(/[^A-Za-z0-9]/g, '').trim();
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
      // Fallback: enhanced keyword search if Groq finds nothing
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

      const qpPageIndices = qpMatches.map(m => m.pageIndex);
      let questionNumbers = qpMatches.flatMap(m => m.questionNumbers || []);

      // If Groq didn't return question numbers (fallback paths), extract them from the QP page text
      if (questionNumbers.length === 0) {
        // We didn't get question numbers from Groq. 
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

      // Step 5: Find the corresponding Mark Scheme
      // Match by year, series, paper number, and variant
      const matchingMs = existingMsCandidates.find(ms =>
          ms.year === qpPaper.year &&
          ms.term === qpPaper.term &&
          ms.paperNumber === qpPaper.paperNumber &&
          ms.variant === qpPaper.variant
        );

      if (!matchingMs) {
        console.log(`[topical-extract] No matching MS for ${qpPaper.fileName}`);
        continue;
      }

      // Step 6: Fetch MS binary
      const msBuffer = await fetchPdfBuffer(matchingMs.url);
      if (!msBuffer) {
        console.log(`[topical-extract] MS fetch failed for ${matchingMs.fileName} (not found or not a PDF)`);
        continue;
      }

      // Step 7: Extract MS text and classify pages
      const msPageTexts = await extractPagesText(msBuffer);
      const msPageMeta = await extractQuestionsMetadata(msBuffer);

      let msMatches = [];

      // Try Groq classification first (with a small delay to avoid rate limiting)
      await new Promise(r => setTimeout(r, 500));

      try {
        // Build MS prompt: use question numbers if available, otherwise classify by topic
        let msPrompt;
        if (questionNumbers.length > 0) {
          msPrompt = `
You are a Cambridge examiner assistant. You are given text extracted from a mark scheme called "${matchingMs.fileName}".

Find the pages that contain the mark scheme for these specific question numbers: ${questionNumbers.join(', ')}

Return a JSON object:
{
  "matches": [
    { "pageIndex": 5, "questionNumbers": ["3", "4a"] }
  ]
}

If nothing matches, return: { "matches": [] }

PAGE TEXTS:
${msPageTexts.map((t, i) => `PAGE ${i + 1}: ${(t || '').slice(0, 4000)}`).join('\n\n---\n\n')}
`;
        } else {
          msPrompt = `
You are a Cambridge examiner assistant. You are given text extracted from a mark scheme called "${matchingMs.fileName}".

The student wants mark scheme pages related to the topic: "${cleanTopic}"

Identify ONLY the pages that contain mark scheme answers related to "${cleanTopic}".

Return a JSON object:
{
  "matches": [
    { "pageIndex": 5, "questionNumbers": [] }
  ]
}

If nothing matches, return: { "matches": [] }

PAGE TEXTS:
${msPageTexts.map((t, i) => `PAGE ${i + 1}: ${(t || '').slice(0, 4000)}`).join('\n\n---\n\n')}
`;
        }

        const msRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
          console.log(`[topical-extract] Groq found ${msMatches.length} MS pages in ${matchingMs.fileName}`);
        } else {
          console.warn(`[topical-extract] Groq MS request failed (${msRes.status}) for ${matchingMs.fileName}`);
        }
      } catch (err) {
        console.warn(`[topical-extract] Groq MS classification error for ${matchingMs.fileName}:`, err.message);
      }

      // Fallback 1: keyword search on MS page text
      if (msMatches.length === 0 && msPageTexts.length > 0) {
        const topicLower = cleanTopic.toLowerCase();
        const stem = topicLower.slice(0, Math.max(3, Math.floor(topicLower.length * 0.7)));
        const syns = {
          "kinematics": ["motion", "vector", "displacement"],
          "dynamics": ["force", "newton", "momentum"],
          "electricity": ["circuit", "current", "voltage", "resistance"],
          "database": ["database", "table", "query", "record", "field", "sql", "primary key"],
        };
        const extra = syns[topicLower] || [];
        const searchTerms = [topicLower, stem, ...extra];
        msPageTexts.forEach((text, idx) => {
          if (!text) return;
          const lower = text.toLowerCase();
          if (searchTerms.some(term => lower.includes(term))) {
             msMatches.push({ pageIndex: idx + 1, questionNumbers: [] });
          }
        });
        if (msMatches.length > 0) {
          console.log(`[topical-extract] MS keyword fallback found ${msMatches.length} pages in ${matchingMs.fileName}`);
        }
      }

      // Fallback 2: use the same page indices as the QP (mark schemes often mirror QP structure)
      if (msMatches.length === 0 && qpMatches.length > 0) {
        const msTotalPages = msPageTexts.length || 0;
        msMatches = qpMatches.filter(m => m.pageIndex >= 1 && m.pageIndex <= msTotalPages);
        if (msMatches.length > 0) {
          console.log(`[topical-extract] MS mirroring QP matches for ${matchingMs.fileName}`);
        }
      }
      
      // Ensure MS matches have question numbers populated
      msMatches.forEach(m => {
          if (!m.questionNumbers || m.questionNumbers.length === 0) {
              const meta = msPageMeta[m.pageIndex - 1];
              if (meta && meta.questions.length > 0) {
                  m.questionNumbers = meta.questions.map(q => q.number);
              } else if (questionNumbers.length > 0) {
                  m.questionNumbers = questionNumbers; // fallback to QP question numbers
              }
          }
      });

      // Copy actual MS PDF pages (not re-drawn text) into the master MS document
      if (msMatches.length > 0) {
        const msAdded = await copyPagesToMaster(masterMS, msBuffer, msMatches, msPageMeta);
        msPagesAdded += msAdded;
        console.log(`[topical-extract] Copied ${msAdded} actual MS pages from ${matchingMs.fileName}`);
      } else {
        console.log(`[topical-extract] No MS pages found for ${matchingMs.fileName} after all fallbacks`);
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
