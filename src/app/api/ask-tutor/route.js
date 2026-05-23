import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { question, context } = await request.json();

    if (!question) {
      return NextResponse.json({ error: 'Missing question parameter' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Groq API key is not configured. Please add your key to .env.local.' 
      }, { status: 400 });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: `You are an expert academic tutor for Cambridge A-Level and IGCSE subjects. 
            Provide clear, encouraging, and highly educational explanations. 
            Format your responses beautifully using Markdown (bolding, headers, lists, codeblocks, etc.) where appropriate.`
          },
          {
            role: 'user',
            content: `Subject/Syllabus Context: ${context || 'General Cambridge Study'}\n\nStudent Question: ${question}`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Groq API Error: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.choices[0].message.content;

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Groq AI Tutor Error:', error);
    return NextResponse.json({ error: `Tutor Request Failed: ${error.message}` }, { status: 500 });
  }
}
