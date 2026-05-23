import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { subjectCode, year } = await request.json();

    if (!subjectCode) {
      return NextResponse.json({ error: 'Missing subjectCode parameter' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Groq API key is not configured. Please add your key to .env.local.' 
      }, { status: 400 });
    }

    const prompt = `
      You are an expert Cambridge A-Level and IGCSE examiner and academic tutor.
      Generate comprehensive, premium-grade Topical Revision Notes for Cambridge students studying the subject code: "${subjectCode}" for the exam year "${year || '2023'}".

      Structure the response beautifully using Markdown with the following sections:
      1. 📋 **Overview**: Brief summary of the syllabus focus for this subject code.
      2. 🔑 **Core Concepts & Definitions**: Clear bullet points of the absolute must-know terminology.
      3. 📐 **Essential Formulas & Equations** (if applicable): Formatted clearly.
      4. ⚠️ **Common Pitfalls**: Where students lose marks and exam techniques.
      5. 📝 **Practice Prompts**: 3 bulleted questions they should solve.
      
      Use rich formatting, bolding, and high-quality educational language.
    `;

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
            content: 'You are an elite academic curriculum designer for Cambridge International Examinations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Groq API Error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content;

    return NextResponse.json({ notes: text });
  } catch (error) {
    console.error('Groq Topicals Generation Error:', error);
    return NextResponse.json({ error: `Groq Generation Failed: ${error.message}` }, { status: 500 });
  }
}
