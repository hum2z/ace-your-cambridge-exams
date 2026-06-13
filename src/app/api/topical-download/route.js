import { NextResponse } from 'next/server';
import { pdfStore } from '@/lib/pdfStore';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');
    const type = searchParams.get('type'); // 'qp', 'ms', or 'sg'

    if (!requestId || !type) {
      return NextResponse.json({ error: 'Missing requestId or type' }, { status: 400 });
    }

    const entry = pdfStore.get(requestId);
    if (!entry) {
      return NextResponse.json({ error: 'PDF not found or expired' }, { status: 404 });
    }

    let bytes;
    if (type === 'qp') {
      bytes = entry.qp;
    } else if (type === 'ms') {
      bytes = entry.ms;
    } else if (type === 'sg') {
      bytes = entry.sg;
    } else {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

    if (!bytes) {
      return NextResponse.json({ error: `${type.toUpperCase()} file not available` }, { status: 404 });
    }

    // The solution guide is a self-contained HTML page meant to open in the
    // browser; QP/MS are PDFs offered as downloads.
    if (type === 'sg') {
      return new NextResponse(bytes, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': 'inline',
          'Cache-Control': 'no-store',
        },
      });
    }

    return new NextResponse(bytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${requestId}_${type}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[topical-download] Fatal error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
