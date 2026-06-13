import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { generatePaperList } from '@/lib/paperService';
import {
  fetchPdfBuffer,
  extractPagesText,
  extractQuestionsMetadata,
  segmentQuestions,
  buildMsAnswerPageFilter,
  QP_FRONT_MATTER_RE,
} from '@/lib/extraction';

export const maxDuration = 120;

/**
 * Diagnostic endpoint — runs the exact QP/MS fetch + segmentation pipeline on
 * a single paper and returns the per-page detection, the front-matter / answer
 * page classification, and the resulting question→page-range segments as JSON.
 * No OpenAI, no PDF assembly: this exists so the question/answer alignment can
 * be inspected on real papers (the server can fetch them; a local sandbox
 * cannot) instead of guessing from screenshots.
 *
 * GET /api/topical-debug?code=9702&year=2025&term=s&paper=4&variant=1
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = (searchParams.get('code') || '').replace(/[^A-Za-z0-9/]/g, '').trim();
    const year = parseInt(searchParams.get('year') || '2025');
    const term = searchParams.get('term') || 's';
    const paper = parseInt(searchParams.get('paper') || '4');
    const variant = parseInt(searchParams.get('variant') || '1');
    if (!code) return NextResponse.json({ error: 'Provide ?code=' }, { status: 400 });

    const all = generatePaperList(code, { years: [year], paperNumbers: [paper], variants: [variant] });
    const findOne = (comp) =>
      all.find(p => p.component.toLowerCase().includes(comp) && p.year === year && p.term === term && p.paperNumber === paper && p.variant === variant);
    const qpPaper = findOne('qp');
    const msPaper = all.filter(p => p.component.toLowerCase().includes('ms') && p.year === year && p.term === term && p.paperNumber === paper && p.variant === variant);

    const out = { request: { code, year, term, paper, variant } };

    // ---- Question paper ----
    if (!qpPaper) {
      out.qp = { error: 'No QP candidate generated for these params' };
    } else {
      const buf = await fetchPdfBuffer(qpPaper.url);
      if (!buf) {
        out.qp = { fileName: qpPaper.fileName, url: qpPaper.url, error: 'QP not fetched (404 or non-PDF)' };
      } else {
        const texts = await extractPagesText(buf);
        const meta = await extractQuestionsMetadata(buf, { collectRaw: true });
        const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
        const isEligible = (i) => !QP_FRONT_MATTER_RE.test(texts[i] || '');
        const segs = segmentQuestions(meta, isEligible);
        out.qp = {
          fileName: qpPaper.fileName,
          pageCount: doc.getPageCount(),
          pages: meta.map((m, i) => ({
            page: i + 1,
            frontMatter: !isEligible(i),
            detected: m.questions.map(q => ({ n: q.number, v: Math.round(q.v) })),
            rawNearMargin: (m.rawItems || []).slice(0, 12),
            textHead: (texts[i] || '').slice(0, 90),
          })),
          segments: [...segs.entries()].map(([q, r]) => ({ q, pages: `${r.startPage + 1}-${r.endPage + 1}` })),
        };
      }
    }

    // ---- Mark scheme ----
    let msBuf = null, msResolved = null;
    for (const c of msPaper) {
      const b = await fetchPdfBuffer(c.url);
      if (b) { msBuf = b; msResolved = c; break; }
    }
    if (!msBuf) {
      out.ms = { error: `No MS resolved (${msPaper.length} candidate(s) tried)` };
    } else {
      const texts = await extractPagesText(msBuf);
      const meta = await extractQuestionsMetadata(msBuf, { layout: 'ms', collectRaw: true });
      const doc = await PDFDocument.load(msBuf, { ignoreEncryption: true });
      const { isAnswerPage, isFrontMatterPage, hasAnswerHeader, firstAnswerPage } = buildMsAnswerPageFilter(texts);
      const segs = segmentQuestions(meta, isAnswerPage, 160);
      out.ms = {
        fileName: msResolved.fileName,
        pageCount: doc.getPageCount(),
        firstAnswerHeaderPage: firstAnswerPage === -1 ? null : firstAnswerPage + 1,
        pages: meta.map((m, i) => ({
          page: i + 1,
          answerPage: isAnswerPage(i),
          frontMatter: isFrontMatterPage[i],
          hasHeader: hasAnswerHeader[i],
          detected: m.questions.map(q => ({ n: q.number, v: Math.round(q.v) })),
          rawNearMargin: (m.rawItems || []).slice(0, 12),
          textHead: (texts[i] || '').slice(0, 90),
        })),
        segments: [...segs.entries()].map(([q, r]) => ({ q, pages: `${r.startPage + 1}-${r.endPage + 1}` })),
      };
    }

    return NextResponse.json(out);
  } catch (error) {
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
