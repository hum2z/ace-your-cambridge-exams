import { PDFDocument } from 'pdf-lib';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

export const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/pdf,*/*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://bestexamhelp.com/',
};

// Question paper front matter — cover instructions, data and formulae sheets,
// the periodic table, blank pages. These pages are never exam questions, but
// topic keywords often appear on them ("gravitational constant" lives on the
// physics data page), so they must be filtered from every match path.
export const QP_FRONT_MATTER_RE = /READ THESE INSTRUCTIONS|\bINSTRUCTIONS\b|INFORMATION FOR (CANDIDATES|EXAMINERS)|This document (has|consists of)|BLANK PAGE|acceleration of free fall|speed of light in free space|Periodic Table|List of formulae/;

/**
 * Downloads a PDF and returns its ArrayBuffer, or null on failure.
 */
export async function fetchPdfBuffer(url) {
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
export async function extractPagesText(buffer) {
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
 * layout 'qp' (default): question numbers sit hard against the left margin
 * as standalone number items ("1", "12", "3(a)…") — a number followed by
 * words ("2 kg") is data inside a question, not a question start.
 * layout 'ms': modern Cambridge/Edexcel mark schemes are tables whose
 * "Question" column labels ("1", "1(a)", "12(b)(ii)") are centered in the
 * column — they can start well past the QP margin cutoff — while the Answer
 * column often begins with numbers ("1.6 J"). So search a wider band but only
 * accept items that are exactly a question label.
 *
 * collectRaw: also report every text item near the left margin (for the
 * debug endpoint, to tune detection against real paper layouts).
 */
export async function extractQuestionsMetadata(buffer, { layout = 'qp', collectRaw = false } = {}) {
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
          const rawItems = [];
          items.forEach(item => {
             const str = item.str;
             const x = item.transform[4];
             const y = item.transform[5];

             const hCoord = isLandscape ? y : x;
             const vCoord = isLandscape ? x : y;

             if (collectRaw && hCoord < 200 && str.trim()) {
                 rawItems.push({ str: str.slice(0, 40), h: Math.round(hCoord), v: Math.round(vCoord) });
             }

             const maxH = isLandscape ? 120 : (layout === 'ms' ? 150 : 80);
             if (hCoord < maxH) {
                 let qLabel = null;
                 if (layout === 'ms') {
                     const match = str.trim().match(MS_LABEL_RE);
                     if (match) qLabel = match[1];
                 } else {
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
             rotation: rotation,
             ...(collectRaw ? { rawItems } : {})
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
 * Normalizes a question label like "4a", "Q3(b)(ii)" or 7 to its main
 * question number string ("4", "3", "7"). Returns '' when there is none.
 */
export function mainQuestionNumber(label) {
  const match = String(label).match(/\d+/);
  return match ? match[0] : '';
}

/**
 * Builds the answer-page eligibility filter for a mark scheme from its page
 * texts. Mark schemes open with front matter (cover, generic marking
 * principles, abbreviations, notes) whose numbered lists look exactly like
 * question labels, so those pages must never take part in segmentation.
 * A page carrying the Question/Answer/Marks (Cambridge) or Question Number/
 * Scheme/Marks (Edexcel) table header is always an answer page, even when
 * the tail of the front matter shares the page — otherwise question 1's
 * answers would be lost.
 */
export function buildMsAnswerPageFilter(msPageTexts) {
  const FRONT_MATTER_RE = /GENERIC MARKING PRINCIPLE|MARKING PRINCIPLES|MARK SCHEME NOTES|GENERAL MARKING GUIDANCE|ABBREVIATIONS|Maximum Mark/i;
  const isFrontMatterPage = msPageTexts.map(t => FRONT_MATTER_RE.test(t || ''));
  const hasAnswerHeader = msPageTexts.map(t => /Question\s+(Number\s+)?(Answer|Scheme)\s+Marks/i.test(t || ''));
  const firstAnswerPage = hasAnswerHeader.indexOf(true);
  const isAnswerPage = (pageIdx0) =>
    hasAnswerHeader[pageIdx0] ||
    (!isFrontMatterPage[pageIdx0] && (firstAnswerPage === -1 || pageIdx0 >= firstAnswerPage));
  return { isAnswerPage, isFrontMatterPage, hasAnswerHeader, firstAnswerPage };
}

/**
 * Splits a paper into whole-question page ranges using the detected question
 * start positions. Returns a Map of main question number → { startPage,
 * endPage } (0-based, inclusive). A question runs from the page where its
 * number first appears to the page where the next question begins — sharing
 * that boundary page unless the next question starts within the top band of
 * it. Mark scheme tables repeat a header row, so their callers pass a deeper
 * band.
 *
 * Question numbers must be strictly increasing through the document, which
 * drops false positives (a "2 kg" data value detected inside question 3
 * cannot start a new segment).
 */
export function segmentQuestions(pagesMeta, isEligiblePage = () => true, topBandPt = 110) {
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
export async function copyPageRange(masterDoc, srcDoc, startPage, endPage, alreadyCopied) {
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
