import { NextResponse } from 'next/server';
import { getAvailablePaperOptions } from '@/lib/paperService';

export const maxDuration = 30;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const subjectCode = searchParams.get('subjectCode');
  if (!subjectCode) {
    return NextResponse.json({ error: 'Missing subjectCode query parameter' }, { status: 400 });
  }
  try {
    const options = await getAvailablePaperOptions(subjectCode);
    return NextResponse.json(options);
  } catch (err) {
    console.error('[paper-options] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
