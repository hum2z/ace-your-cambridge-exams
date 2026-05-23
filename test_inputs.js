// Using native fetch

async function testNotesAPI(subjectCode, topic, years) {
  try {
    const response = await fetch('http://localhost:3000/api/generate-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subjectCode, topic, years })
    });
    const status = response.status;
    const data = await response.json();
    return { status, success: response.ok, data };
  } catch (error) {
    return { status: 500, success: false, error: error.message };
  }
}

async function runTests() {
  const tests = [
    { subjectCode: '9702', topic: 'Kinematics', years: [2023, 2022], desc: 'Valid physics topic' },
    { subjectCode: '9709', topic: 'Integration', years: [2023], desc: 'Valid math topic' },
    { subjectCode: '0455', topic: 'Microeconomics', years: [2023, 2022], desc: 'Valid econ topic' },
    { subjectCode: 'invalid_code', topic: 'Kinematics', years: [2023], desc: 'Invalid subject code format' },
    { subjectCode: '9702', topic: 'asdfjkl;', years: [2023], desc: 'Gibberish topic' },
    { subjectCode: '', topic: 'Kinematics', years: [2023], desc: 'Empty subject code' },
    { subjectCode: '9702', topic: '', years: [2023], desc: 'Empty topic' }
  ];

  const results = [];
  for (const t of tests) {
    console.log(`Testing: ${t.desc} (${t.subjectCode}, ${t.topic})`);
    const res = await testNotesAPI(t.subjectCode, t.topic, t.years);
    results.push({
      Description: t.desc,
      SubjectCode: `"${t.subjectCode}"`,
      Topic: `"${t.topic}"`,
      Status: res.status,
      Success: res.success,
      Response: res.success ? 'Success (JSON returned)' : res.data?.error || res.error
    });
    // Sleep a bit to avoid rate limits
    await new Promise(r => setTimeout(r, 2000));
  }

  console.table(results);
}

runTests();
