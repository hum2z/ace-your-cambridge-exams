export const askTutor = async (question, context = "") => {
  try {
    const response = await fetch('/api/ask-tutor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, context }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to connect to AI Tutor');
    }

    const data = await response.json();
    return data.answer;
  } catch (error) {
    console.error("AI Tutor Error:", error);
    return `I'm sorry, I'm having trouble connecting to my brain right now. Error: ${error.message}`;
  }
};

export const generateTopicalNotes = async (subjectCode, year) => {
  try {
    const response = await fetch('/api/generate-topicals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subjectCode, year }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to generate notes');
    }

    const data = await response.json();
    return data.notes;
  } catch (error) {
    console.error("Topical Generation Error:", error);
    return `Failed to generate topical notes: ${error.message}`;
  }
};
