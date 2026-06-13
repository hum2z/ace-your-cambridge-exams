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

    let pdfBytes;
    if (type === 'qp') {
      pdfBytes = entry.qp;
    } else if (type === 'ms') {
      pdfBytes = entry.ms;
    } else if (type === 'sg') {
      pdfBytes = entry.sg;
    } else {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

    if (!pdfBytes) {
      return NextResponse.json({ error: `${type.toUpperCase()} PDF not available` }, { status: 404 });
    }

    const filename = `${requestId}_${type}.pdf`;
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        // Prevent caching of temporary files
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[topical-download] Fatal error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
