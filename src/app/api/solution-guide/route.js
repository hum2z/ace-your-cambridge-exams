import { NextResponse } from 'next/server';

/**
 * Serves a Solution Guide HTML page inline in the browser.
 *
 * The guide is stored on Vercel Blob for durability, but Blob serves
 * text/html as a forced download (it won't render arbitrary HTML on its own
 * domain). This route fetches the stored HTML and returns it from our origin
 * with Content-Disposition: inline so it opens directly in the browser.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const src = searchParams.get('src');
  if (!src) {
    return NextResponse.json({ error: 'Missing src' }, { status: 400 });
  }

  let url;
  try {
    url = new URL(src);
  } catch {
    return NextResponse.json({ error: 'Invalid src' }, { status: 400 });
  }

  // SSRF guard: only proxy from Vercel Blob storage hosts.
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.blob.vercel-storage.com')) {
    return NextResponse.json({ error: 'Disallowed source' }, { status: 403 });
  }

  try {
    const res = await fetch(src, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ error: 'Solution guide not found or expired' }, { status: 404 });
    }
    const html = await res.text();
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'inline',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[solution-guide] Fetch error:', err);
    return NextResponse.json({ error: 'Failed to load solution guide' }, { status: 500 });
  }
}
