import { NextResponse } from 'next/server';

/**
 * Helper to call OpenAI API with given messages.
 */
async function callOpenAI(apiKey, model, messages) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.3,
    }),
  });
  if (!response.ok) {
    const errData = await response.json();
    const errMsg = errData.error?.message || '';
    throw new Error(errMsg || `OpenAI API Error: ${response.status}`);
  }
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

export async function POST(request) {
  try {
    const { subjectCode } = await request.json();
    if (!subjectCode) {
      return NextResponse.json({ error: 'Missing subjectCode parameter' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const model = 'gpt-4o-mini';
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key is not configured. Please add your key to .env.local.' }, { status: 400 });
    }

    // Step 1: Generate questions (no markschemes yet)
    const questionPrompt = `You are the Head Examiner for Cambridge Assessment International Examinations.
Generate a JSON object with the following shape for subject code "${subjectCode}":
{
  "subjectCode": "${subjectCode}",
  "bookletTitle": "TOPICAL EXAM COMPANION: ${subjectCode}",
  "topics": [
    {
      "topicTitle": "Topic 1: [Name of Core Topic]",
      "questionMarkdown": "..."
    }
    // exactly 4 topics total
  ]
}
Only include the questions; do NOT include any markscheme fields.
Make each question a multi‑part past‑paper style problem with proper mark allocations.
`;
    const questionResponse = await callOpenAI(apiKey, model, [
      { role: 'system', content: 'You are a technical API assistant that outputs strictly valid JSON objects.' },
      { role: 'user', content: questionPrompt },
    ]);

    // Ensure we have topics array
    const topics = questionResponse.topics || [];

    // Step 2: For each topic, generate its markscheme based on the question
// Placeholder loop removed – markscheme generation handled in the fetch loop below

    // Implement inline fetch for markscheme generation:
    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      const msPrompt = `You are the Head Examiner for Cambridge Assessment International Examinations.
Based on the following exam question, produce the exact examiner Mark Scheme (C1, M1, B1, A1 marks and required keywords) in markdown.
Question Markdown:\n\n${topic.questionMarkdown}\n\nReturn ONLY the markdown string for the mark scheme.`;
      const msResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'You are a technical API assistant that outputs plain text.' },
            { role: 'user', content: msPrompt },
          ],
          temperature: 0.3,
        }),
      });
      if (!msResponse.ok) {
        const errData = await msResponse.json();
        const errMsg = errData.error?.message || '';
        throw new Error(errMsg || `OpenAI Markscheme API Error: ${msResponse.status}`);
      }
      const msData = await msResponse.json();
      const markschemeMarkdown = msData.choices[0].message.content; // plain text
      topic.markschemeMarkdown = markschemeMarkdown.trim();
    }

    // Assemble final booklet
    const booklet = {
      subjectCode: questionResponse.subjectCode,
      bookletTitle: questionResponse.bookletTitle,
      topics,
    };
    return NextResponse.json(booklet);
  } catch (error) {
    console.error('OpenAI Topical Booklet Error:', error);
    return NextResponse.json({ error: `Booklet Compilation Failed: ${error.message}` }, { status: 500 });
  }
}
