import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { subjectCode, topic, years } = await request.json();
    const cleanCode = subjectCode.replace(/[^A-Za-z0-9/]/g, '').trim();

    if (!cleanCode || cleanCode.length === 0) {
      return NextResponse.json({ error: 'Enter a valid subject code' }, { status: 400 });
    }
    if (!topic) {
      return NextResponse.json({ error: 'Missing topic parameter' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    if (!apiKey) {
      return NextResponse.json({
        error: 'OpenAI API key is not configured. Please add your key to .env.local.'
      }, { status: 400 });
    }

    const yearRange = years && years.length > 0 ? years.join(', ') : '2018-2023';

    const prompt = `You are the Chief Examiner for Cambridge Assessment International Examinations.

You have full access to all Question Papers and Mark Schemes for subject code "${cleanCode}", topic "${topic}", across years ${yearRange}.

Generate a JSON object with exactly these keys and **plain text** values (no markdown formatting like bold/italics, but use clear line breaks, bullet points, and spacing for readability):
- subjectCode
- topic
- yearsAnalyzed
- mostRepeatedQuestions: Detailed list of common/frequent question types on this topic, their mark allocations, and how the mark scheme structures points.
- scoringKeywords: An exhaustive, highly detailed guide of the specific keywords, technical terms, and phrases that the marking scheme ALWAYS requires for this topic. Include what words/phrases students MUST write to secure marks, how marks are awarded for specific terms, and which common alternative or vague terms are explicitly rejected by examiners (e.g., 'accept X, do not accept Y').
- examinerExpectations: Step-by-step breakdown of what examiners expect in candidate answers. Detail how marks are distributed (e.g., method marks vs. accuracy marks, formula/substitution scoring, units, error carried forward rules) and how to structure responses to score maximum marks.
- commonMistakes: Specific list of errors candidates make in this topic that cause them to lose marks, referencing examiner report feedback (e.g., wrong units, missing steps, vague descriptions).
- highYieldTips: Actionable exam techniques and strategies to maximize scoring potential specifically for this topic under exam conditions.

Return ONLY the JSON object, no surrounding text or markdown fences.`;

    const modelsToTry = [
      process.env.OPENAI_MODEL || 'gpt-4o-mini',
      'gpt-4o-mini'
    ].filter((m, i, arr) => arr.indexOf(m) === i);

    let response;
    let data;
    let lastError = null;

    for (const currentModel of modelsToTry) {
      try {
        response = await fetch('https://api.openai.com/v1/chat/completions', {
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
                content: 'You are a technical API assistant that outputs strictly valid JSON objects. You have deep expertise in Cambridge International Examinations past papers and mark schemes.'
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
          break; // Success, exit loop
        } else {
          const errorData = await response.json();
          lastError = new Error(errorData.error?.message || "OpenAI API Error: " + response.status);
          
          // If it's a rate limit error (429), log it and try the next model
          if (response.status === 429) {
            console.warn(`Rate limit hit for ${currentModel}. Falling back to next model...`);
            continue;
          }
          
          // If it's not a rate limit error, throw it immediately
          throw lastError;
        }
      } catch (err) {
        lastError = err;
        // Network or parsing errors -> let's just break or throw
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

    const notes = JSON.parse(data.choices[0].message.content);
    // Remove any question‑related fields from each topic, keeping only mark‑scheme data
    if (Array.isArray(notes.topics)) {
      notes.topics = notes.topics.map(topic => {
        const filtered = {};
        for (const [key, value] of Object.entries(topic)) {
          if (!key.toLowerCase().includes('question')) {
            filtered[key] = value;
          }
        }
        return filtered;
      });
    }
    // Return the cleaned notes
    return NextResponse.json(notes);
  } catch (error) {
    console.error('Generate Notes Error:', error);
    return NextResponse.json({ error: `Notes Generation Failed: ${error.message}` }, { status: 500 });
  }
}
