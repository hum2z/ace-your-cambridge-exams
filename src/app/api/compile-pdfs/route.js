import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { generatePaperList } from '@/lib/paperService';

// Allow this route to run longer since it's downloading and parsing many PDFs
export const maxDuration = 60;

// Headers that mimic a real browser so Cloudflare-protected sites don't block us
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

export async function POST(request) {
  try {
    const { subjectCode, year = 2023, type = 'qp' } = await request.json();
    const cleanCode = subjectCode.replace(/[^A-Za-z0-9]/g, '').trim();
    if (!cleanCode) {
      return NextResponse.json({ error: 'Enter a valid subject code' }, { status: 400 });
    }

    const allPapers = generatePaperList(cleanCode);
    
    // Filter for the requested year and exact component type (qp or ms)
    const targetPapers = allPapers.filter(
      p => p.year === parseInt(year) && p.component.toLowerCase().includes(type)
    );

    console.log(`[compile-pdfs] Targeting ${targetPapers.length} candidate ${type.toUpperCase()} papers for ${cleanCode} ${year}`);

    // Filter candidates by checking existence in parallel
    const existingPapers = await filterExistingPapers(targetPapers);

    console.log(`[compile-pdfs] Found existing: ${existingPapers.length}/${targetPapers.length}`);

    if (existingPapers.length === 0) {
      return NextResponse.json({ error: `No ${type.toUpperCase()} papers found for ${cleanCode} in ${year}` }, { status: 404 });
    }

    const masterDoc = await PDFDocument.create();
    let mergedCount = 0;
    let attemptedCount = 0;

    // Fetch and merge PDFs sequentially to prevent memory overload on the server
    for (const paper of existingPapers) {
      attemptedCount++;
      try {
        const response = await fetch(paper.url, { headers: FETCH_HEADERS });
        
        console.log(`[compile-pdfs] ${paper.fileName}: HTTP ${response.status}`);

        // Many variants simply don't exist — skip gracefully
        if (!response.ok) continue;
        
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('pdf')) {
          console.warn(`[compile-pdfs] ${paper.fileName}: Not a PDF (${contentType}), skipping.`);
          continue;
        }

        const arrayBuffer = await response.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        
        const copiedPages = await masterDoc.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => masterDoc.addPage(page));
        mergedCount++;
        console.log(`[compile-pdfs] Merged ${paper.fileName} (${pdf.getPageCount()} pages)`);
      } catch (err) {
        console.error(`[compile-pdfs] Skipped ${paper.fileName}: ${err.message}`);
      }
    }

    console.log(`[compile-pdfs] Done: ${mergedCount}/${attemptedCount} merged.`);

    if (mergedCount === 0) {
      return NextResponse.json({ 
        error: `Could not fetch any ${type.toUpperCase()} PDFs for ${cleanCode} ${year}. Attempted ${attemptedCount} URLs — all returned non-200 or non-PDF responses.`
      }, { status: 404 });
    }

    const pdfBytes = await masterDoc.save();

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${cleanCode}_${year}_Compiled_${type.toUpperCase()}.pdf"`,
      },
    });

  } catch (error) {
    console.error('[compile-pdfs] Fatal error:', error);
    return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

