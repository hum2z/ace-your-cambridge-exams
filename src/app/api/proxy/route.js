import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const res = await fetch(targetUrl);
    
    if (!res.ok) {
      return NextResponse.json({ error: `Failed to fetch target URL: ${res.status}` }, { status: res.status });
    }

    const blob = await res.blob();
    const headers = new Headers();
    headers.set('Content-Type', res.headers.get('Content-Type') || 'application/pdf');
    headers.set('Content-Disposition', res.headers.get('Content-Disposition') || 'inline');

    // Enable CORS for our frontend
    headers.set('Access-Control-Allow-Origin', '*');

    return new NextResponse(blob, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Proxy Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
