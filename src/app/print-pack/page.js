'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Printer, ArrowLeft } from 'lucide-react'

function PrintPackContent() {
  const searchParams = useSearchParams()
  const subjectCode = searchParams.get('subjectCode') || '9702'
  
  const [insights, setInsights] = useState(null)
  const [topicalNotes, setTopicalNotes] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch syllabus insights
        const insightsRes = await fetch('/api/generate-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subjectCode })
        })
        const insightsData = await insightsRes.json()
        setInsights(insightsData)

        // Fetch topical notes
        const notesRes = await fetch('/api/generate-topicals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subjectCode })
        })
        const notesData = await notesRes.json()
        setTopicalNotes(notesData.notes)
      } catch (err) {
        console.error("Print pack fetch error:", err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [subjectCode])

  // Automatically trigger browser print once data compiles
  useEffect(() => {
    if (!loading && insights && topicalNotes) {
      const timer = setTimeout(() => {
        window.print()
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [loading, insights, topicalNotes])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)', fontFamily: 'sans-serif' }}>
        <div style={{ border: '4px solid rgba(255,255,255,0.1)', width: '48px', height: '48px', borderRadius: '50%', borderLeftColor: '#2563eb', animation: 'spin 1s linear infinite' }}></div>
        <h2 style={{ marginTop: '20px', fontWeight: '500' }}>Compiling PDF Exam Pack...</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Gathering syllabus parameters, questions, and mark schemes for {subjectCode}</p>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}} />
      </div>
    )
  }

  return (
    <div className="print-document">
      {/* Non-printable Control bar */}
      <div className="print-controls">
        <button onClick={() => window.close()} className="btn-back">
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <button onClick={() => window.print()} className="btn-print">
          <Printer size={16} /> Print / Save as PDF
        </button>
      </div>

      {/* Page 1: COVER PAGE */}
      <div className="print-page cover-page">
        <div className="cover-border">
          <div className="cover-header">
            <h3>CAMBRIDGE INTERNATIONAL EXAMINATIONS</h3>
            <span className="exam-tag">PREMIUM STUDY TOOL</span>
          </div>
          
          <div className="cover-title-container">
            <h1 className="cover-title">SYLLABUS STUDY PACK</h1>
            <h2 className="cover-subtitle">Subject Code: {subjectCode}</h2>
          </div>

          <div className="cover-meta">
            <div className="meta-box">
              <span>DOCUMENT TYPE</span>
              <strong>Syllabus Insights, Repeated Questions & Mark Schemes</strong>
            </div>
            <div className="meta-box">
              <span>ACADEMIC FOCUS</span>
              <strong>AS / A-Level & IGCSE Prep</strong>
            </div>
          </div>

          <div className="cover-footer">
            <p>Powered by **Antigravity AI Tutor Engine**</p>
            <p className="confidential-tag">STRICTLY FOR CAMBRIDGE EXAM PREPARATION</p>
          </div>
        </div>
      </div>

      {/* Page 2: TOPICAL REVISION NOTES */}
      <div className="print-page">
        <div className="page-header">
          <span>SUBJECT CODE: {subjectCode}</span>
          <span>SECTION A: TOPICAL REVISION NOTES</span>
        </div>
        <h2 className="page-title">Section A: Topical Notes & Core Formulas</h2>
        <div className="markdown-body">
          {topicalNotes}
        </div>
        <div className="page-footer">
          Page 2 of 4
        </div>
      </div>

      {/* Page 3: MOST REPEATED QUESTIONS */}
      <div className="print-page">
        <div className="page-header">
          <span>SUBJECT CODE: {subjectCode}</span>
          <span>SECTION B: EXAM INSIGHTS</span>
        </div>
        <h2 className="page-title">Section B: Most Repeated Exam Questions</h2>
        <div className="markdown-body">
          {insights?.repeatedQuestions}
        </div>
        <div className="page-footer">
          Page 3 of 4
        </div>
      </div>

      {/* Page 4: KEYWORDS & MARK SCHEMES */}
      <div className="print-page">
        <div className="page-header">
          <span>SUBJECT CODE: {subjectCode}</span>
          <span>SECTION C: EXAM STRATEGY</span>
        </div>
        <h2 className="page-title">Section C: Marking Keywords & Mark Scheme Guidance</h2>
        <div className="markdown-body">
          {insights?.keywords}
        </div>
        <div className="page-footer">
          Page 4 of 4
        </div>
      </div>

      {/* Custom Stylesheet */}
      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --primary: #2563eb;
          --border: var(--text-secondary);
          --text: #222222;
        }

        body {
          margin: 0;
          background: #f5f5f5;
          color: var(--text);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          -webkit-print-color-adjust: exact;
        }

        .print-document {
          max-width: 800px;
          margin: 40px auto;
          box-shadow: 0 4px 30px rgba(0,0,0,0.1);
          background: white;
        }

        .print-controls {
          display: flex;
          justify-content: space-between;
          padding: 15px 30px;
          background: #111;
          color: white;
          position: sticky;
          top: 0;
          z-index: 100;
          border-bottom: 1px solid #222;
        }

        .btn-back, .btn-print {
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          transition: all 0.2s;
          border: none;
        }

        .btn-back {
          background: #222;
          color: var(--text-secondary);
          border: 1px solid rgba(16, 32, 51, 0.18);
        }

        .btn-back:hover {
          color: white;
          background: rgba(16, 32, 51, 0.18);
        }

        .btn-print {
          background: var(--primary);
          color: white;
        }

        .btn-print:hover {
          background: #1d4ed8;
        }

        /* Printable Page Layout */
        .print-page {
          background: white;
          padding: 60px 50px;
          min-height: 297mm; /* Standard A4 height */
          box-sizing: border-box;
          position: relative;
          border-bottom: 1px dashed var(--border);
          page-break-after: always;
        }

        .print-page:last-child {
          border-bottom: none;
          page-break-after: avoid;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: var(--text-muted);
          border-bottom: 1px solid var(--border);
          padding-bottom: 10px;
          margin-bottom: 30px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .page-title {
          font-size: 1.8rem;
          color: #111;
          margin-bottom: 25px;
          font-weight: 700;
          border-left: 5px solid var(--primary);
          padding-left: 15px;
        }

        .page-footer {
          position: absolute;
          bottom: 30px;
          left: 50px;
          right: 50px;
          display: flex;
          justify-content: center;
          font-size: 0.75rem;
          color: var(--text-muted);
          border-top: 1px solid var(--border);
          padding-top: 15px;
        }

        .markdown-body {
          line-height: 1.7;
          font-size: 0.95rem;
          color: rgba(16, 32, 51, 0.18);
          white-space: pre-wrap;
        }

        /* Cover Page Styling */
        .cover-page {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cover-border {
          border: 2px solid #000;
          padding: 60px 40px;
          width: 100%;
          height: 100%;
          min-height: 240mm;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-sizing: border-box;
        }

        .cover-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8rem;
          font-weight: 700;
          border-bottom: 2px solid #000;
          padding-bottom: 15px;
        }

        .exam-tag {
          background: #000;
          color: white;
          padding: 4px 10px;
          font-size: 0.7rem;
          letter-spacing: 1px;
        }

        .cover-title-container {
          text-align: center;
          margin: 60px 0;
        }

        .cover-title {
          font-size: 3rem;
          letter-spacing: -1.5px;
          line-height: 1;
          margin: 0 0 15px;
          font-weight: 900;
        }

        .cover-subtitle {
          font-size: 1.5rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .cover-meta {
          border-top: 2px solid #000;
          border-bottom: 2px solid #000;
          padding: 20px 0;
          display: flex;
          gap: 40px;
        }

        .meta-box {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .meta-box span {
          font-size: 0.7rem;
          color: var(--text-muted);
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .meta-box strong {
          font-size: 0.95rem;
          color: #000;
        }

        .cover-footer {
          text-align: center;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .confidential-tag {
          font-weight: 700;
          color: #000;
          letter-spacing: 2px;
          margin-top: 10px;
        }

        /* Print Media Rules */
        @media print {
          body {
            background: white;
          }
          
          .print-document {
            margin: 0;
            box-shadow: none;
            max-width: 100%;
          }

          .print-controls {
            display: none !important;
          }

          .print-page {
            border-bottom: none;
            padding: 0;
            margin: 0;
            page-break-after: always;
          }
        }
      `}} />
    </div>
  )
}

export default function PrintPack() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
        <h2>Loading Compiler Parameters...</h2>
      </div>
    }>
      <PrintPackContent />
    </Suspense>
  )
}
