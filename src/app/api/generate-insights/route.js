import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { subjectCode, year } = await request.json();
    const cleanCode = subjectCode.replace(/[^A-Za-z0-9]/g, '').trim();

    if (!cleanCode) {
      return NextResponse.json({ error: 'Enter a valid subject code' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Groq API key is not configured. Please add your key to .env.local.' 
      }, { status: 400 });
    }

    const prompt = `
      You are an elite Syllabus Architect and Senior Examiner.
      Analyze the exam papers and past papers for subject code "${cleanCode}" for the year "${year || '2023'}".


      You MUST respond with a valid JSON object matching this exact structure:
      {
        "repeatedQuestions": "Markdown string containing a detailed bulleted analysis of the most frequently asked exam questions, topics, and structures that appear nearly every year. Focus on practical exam insights.",
        "keywords": "Markdown string listing the exact scoring keywords, definitions, and academic phrases that examiners require in markschemes to award full marks. Provide context on how to use them.",
        "notes": "Markdown string containing a detailed notes/observations tab showing unique observations, patterns, trends, examiner traps, typical pitfalls, and specific quirks noticed directly from analyzing the past papers of this subject code, NOT just standard generic syllabus details."
      }

      Do not include any text outside of the JSON object.
    `;

    const modelsToTry = [
      process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768'
    ];

    let response;
    let data;
    let lastError = null;

    for (const currentModel of modelsToTry) {
      try {
        response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: currentModel,
            messages: [
              {
                role: 'system',
                content: 'You are a technical API assistant that outputs strictly valid JSON objects.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
          }),
        });

        if (response.ok) {
          data = await response.json();
          break;
        } else {
          const errorData = await response.json();
          lastError = new Error(errorData.error?.message || `Groq API Error: ${response.status}`);
          
          if (response.status === 429) {
            console.warn(`Rate limit hit for ${currentModel}. Falling back to next model...`);
            continue;
          }
          throw lastError;
        }
      } catch (err) {
        lastError = err;
        if (err.message.includes('Rate limit')) {
           console.warn(`Rate limit hit for ${currentModel}. Falling back to next model...`);
           continue;
        }
        throw err;
      }
    }

    if (!data) {
      throw lastError || new Error('All model attempts failed.');
    }

    const insights = JSON.parse(data.choices[0].message.content);

    return NextResponse.json(insights);
  } catch (error) {
    console.error('Groq Insights Error:', error);
    return NextResponse.json({ error: `Insights Generation Failed: ${error.message}` }, { status: 500 });
  }
}
