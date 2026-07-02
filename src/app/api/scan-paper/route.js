import { NextResponse } from 'next/server';
import { extractPagesText } from '@/lib/extraction';

export const maxDuration = 120;

// Vercel serverless request bodies cap out around 4.5 MB, so anything larger
// never reaches us anyway — reject early with a clear message client-side too.
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
// Keep the extracted paper text well inside gpt-4o-mini's context window.
const MAX_TEXT_CHARS = 24000;

const ANALYSIS_PROMPT = (subjectCode, paperText) => `You are the Chief Examiner for Cambridge Assessment International Examinations, reviewing a past paper a student has uploaded${subjectCode ? ` for subject code "${subjectCode}"` : ''}.

${paperText ? `Here is the text extracted from the uploaded paper:\n"""\n${paperText}\n"""` : 'The paper is provided as attached page images.'}

First decide whether the upload contains the student's own attempt (handwritten/typed answers, workings, crossed-out work, or marks/ticks) or is a blank/unattempted paper.

- If it IS attempted: diagnose the student's weaknesses from their actual answers and mistakes.
- If it is NOT attempted: analyse the paper's topic composition and flag the topics/question styles that Cambridge candidates most commonly lose marks on in this paper.

Return a JSON object with exactly these keys:
- "subjectGuess": the 4-digit Cambridge subject code if identifiable (e.g. "9702"), else ""
- "paperInfo": short string identifying the paper if possible (e.g. "9702 Physics · Paper 2 · May/June 2023"), else ""
- "attempted": boolean — true if the upload contains student work
- "overallSummary": 2-4 plain-text sentences summarising the analysis
- "strengths": array of 0-4 short plain-text strings (topics/skills handled well; empty if unattempted or none evident)
- "weakPoints": array of 2-6 objects, ordered most urgent first, each with:
    - "topic": a concise syllabus topic name usable as a search term (e.g. "Kinematics", "Electrolysis", "Integration by parts")
    - "severity": "high" | "medium" | "low"
    - "evidence": 1-2 plain-text sentences pointing at what in the paper shows this weakness (question numbers where possible)
    - "focusAdvice": 1-2 plain-text sentences on what exactly to practise for this topic
- "nextSteps": 1-3 plain-text sentences telling the student to drill these weak topics with targeted topical practice.

Use plain text only (no markdown). Return ONLY the JSON object.`;

export async function POST(request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key is not configured. Please add your key to .env.local.' }, { status: 400 });
    }

    const form = await request.formData();
    const subjectCode = String(form.get('subjectCode') || '').replace(/[^A-Za-z0-9/]/g, '').trim();
    const files = form.getAll('files').filter((f) => f && typeof f.arrayBuffer === 'function');

    if (files.length === 0) {
      return NextResponse.json({ error: 'Upload a past paper first (PDF or photos of the pages).' }, { status: 400 });
    }

    let paperText = '';
    const imageParts = [];

    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json({ error: `"${file.name}" is too large. Keep each file under 4 MB.` }, { status: 400 });
      }
      const buffer = await file.arrayBuffer();
      const type = file.type || '';

      if (type.includes('pdf') || /\.pdf$/i.test(file.name || '')) {
        const pages = await extractPagesText(buffer);
        const text = pages.filter(Boolean).join('\n\n--- page break ---\n\n').trim();
        if (text) paperText += (paperText ? '\n\n' : '') + text;
      } else if (IMAGE_TYPES.includes(type)) {
        imageParts.push({
          type: 'image_url',
          image_url: { url: `data:${type};base64,${Buffer.from(buffer).toString('base64')}` },
        });
      } else {
        return NextResponse.json({ error: `Unsupported file type for "${file.name}". Upload a PDF or JPG/PNG/WEBP photos.` }, { status: 400 });
      }
    }

    if (paperText.length > MAX_TEXT_CHARS) {
      paperText = paperText.slice(0, MAX_TEXT_CHARS) + '\n\n[...paper truncated for analysis...]';
    }

    if (!paperText && imageParts.length === 0) {
      return NextResponse.json({
        error: 'Could not read any text from that PDF — it looks like a photo scan. Upload the pages as JPG/PNG images instead.',
      }, { status: 400 });
    }

    const userContent = [{ type: 'text', text: ANALYSIS_PROMPT(subjectCode, paperText) }, ...imageParts];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a technical API assistant that outputs strictly valid JSON objects. You have deep expertise in Cambridge International Examinations past papers, mark schemes and examiner reports.',
          },
          { role: 'user', content: userContent },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `OpenAI API Error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);

    if (!Array.isArray(analysis.weakPoints)) analysis.weakPoints = [];
    if (!Array.isArray(analysis.strengths)) analysis.strengths = [];

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Scan Paper Error:', error);
    return NextResponse.json({ error: `Paper scan failed: ${error.message}` }, { status: 500 });
  }
}
