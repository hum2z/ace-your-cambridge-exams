'use client'

import { useState } from 'react'
import { Search, Cpu, Send, ChevronDown, ChevronUp, MessageSquare, Plus, X, Sparkles, Printer, Layers, BookCopy, CheckSquare, Square, FileText } from 'lucide-react'
import { askTutor } from '@/lib/gemini'
import AuthGuard from '@/components/AuthGuard'

export default function Home() {
  const [subjectCode, setSubjectCode] = useState('')
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [compilationYear, setCompilationYear] = useState(2023)

  // Topical Extractor state
  const [topicInput, setTopicInput] = useState('')
  const [selectedYears, setSelectedYears] = useState([2023, 2022])
  const [selectedVariants, setSelectedVariants] = useState([])
  const [paperType, setPaperType] = useState('')
  const [variantType, setVariantType] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractStatus, setExtractStatus] = useState('')
  const [extractedFiles, setExtractedFiles] = useState(null)

  // Chat History Sidebar states
  const [chatSessions, setChatSessions] = useState([
    {
      id: 'session-default',
      title: 'AS/A-Level General Study',
      messages: [{ role: 'tutor', text: 'Hi! I am your AI tutor. Ask me any syllabus questions or open my session history list to start a new chat!' }]
    }
  ])
  const [activeSessionId, setActiveSessionId] = useState('session-default')
  const [tutorSidebarOpen, setTutorSidebarOpen] = useState(false)
  const [showHistoryList, setShowHistoryList] = useState(false)

  // Syllabus Insights tabs
  const [activeInsightTab, setActiveInsightTab] = useState('repeated')

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }))
    }, 4000)
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!subjectCode) return
    setLoading(true)
    setInsights(null)
    try {
      const response = await fetch('/api/generate-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectCode })
      })
      if (!response.ok) {
        throw new Error('Failed to generate syllabus insights.')
      }
      const data = await response.json()
      setInsights(data)
      showToast(`Generated syllabus insights for ${subjectCode}!`, 'success')
    } catch (error) {
      console.error("Search Insights Error:", error)
      showToast("Error generating insights. Check your Groq key config.", "error")
    } finally {
      setLoading(false)
    }
  }

  const activeSession = chatSessions.find(s => s.id === activeSessionId) || chatSessions[0]
  const chatMessages = activeSession ? activeSession.messages : []

  const handleCreateNewChat = () => {
    const newId = `session-${Date.now()}`
    const newTitle = subjectCode ? `${subjectCode} Exam Prep` : 'New Chat Session'
    const newSession = {
      id: newId,
      title: newTitle,
      messages: [{ role: 'tutor', text: `Hi! I am your AI tutor. Let's study and tackle doubts together!` }]
    }
    setChatSessions(prev => [newSession, ...prev])
    setActiveSessionId(newId)
    setShowHistoryList(false)
    showToast('Started new chat session!', 'success')
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!chatInput) return
    
    const userMsg = { role: 'user', text: chatInput }
    
    // Append user message
    setChatSessions(prev => prev.map(session => {
      if (session.id === activeSessionId) {
        let title = session.title
        if (title === 'New Chat Session' || title === 'AS/A-Level General Study') {
          title = chatInput.slice(0, 25) + (chatInput.length > 25 ? '...' : '')
        }
        return {
          ...session,
          title,
          messages: [...session.messages, userMsg]
        }
      }
      return session
    }))
    
    const currentInput = chatInput
    setChatInput('')
    
    try {
      const response = await askTutor(currentInput, `Subject: ${subjectCode || 'General Cambridge Study'}`)
      setChatSessions(prev => prev.map(session => {
        if (session.id === activeSessionId) {
          return {
            ...session,
            messages: [...session.messages, { role: 'tutor', text: response }]
          }
        }
        return session
      }))
    } catch (error) {
      console.error("Tutor Ask Error:", error)
      setChatSessions(prev => prev.map(session => {
        if (session.id === activeSessionId) {
          return {
            ...session,
            messages: [...session.messages, { role: 'tutor', text: 'Sorry, I failed to process your question. Make sure your API key is correctly configured.' }]
          }
        }
        return session
      }))
    }
  }

  // Examiner Notes state
  const [examinerNotes, setExaminerNotes] = useState(null)
  const [generatingNotes, setGeneratingNotes] = useState(false)
  const [activeNotesTab, setActiveNotesTab] = useState('repeated')

  const handleGenerateNotes = async () => {
    const cleanCode = subjectCode.trim()
    const cleanTopic = topicInput.trim()
    if (!cleanCode || !cleanTopic) {
      showToast('Please enter a subject code and topic name.', 'error')
      return
    }
    setGeneratingNotes(true)
    setExaminerNotes(null)
    showToast(`Analyzing papers for "${cleanTopic}"... This may take 15–30 seconds.`, 'info')
    try {
      const response = await fetch('/api/generate-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectCode: cleanCode, topic: cleanTopic, years: selectedYears })
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to generate notes')
      }
      const data = await response.json()
      setExaminerNotes(data)
      showToast('Examiner Intelligence Report generated!', 'success')
    } catch (error) {
      console.error('Generate notes error:', error)
      showToast(error.message || 'Notes generation failed.', 'error')
    } finally {
      setGeneratingNotes(false)
    }
  }

  const [compilingPdfs, setCompilingPdfs] = useState(false)

  const handleCompilePdfs = async () => {
    if (!subjectCode) return

    // Validate: must be a non‑empty subject code
    const cleanCode = subjectCode.trim()
    if (!cleanCode) {
      showToast('Please enter a subject code.', 'error')
      return
    }

    setCompilingPdfs(true)
    showToast(`Fetching ${cleanCode} ${compilationYear} papers... This may take ~20 seconds.`, 'info')
    
    try {
      // Fetch Question Papers
      const qpRes = await fetch('/api/compile-pdfs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectCode: cleanCode, year: compilationYear, type: 'qp' })
      })
      
      if (!qpRes.ok) throw new Error((await qpRes.json()).error || 'Failed to compile Question Papers')
      
      const qpBlob = await qpRes.blob()
      const qpUrl = window.URL.createObjectURL(qpBlob)
      const qpLink = document.createElement('a')
      qpLink.href = qpUrl
      qpLink.target = '_blank'
      document.body.appendChild(qpLink)
      qpLink.click()
      qpLink.remove()

      showToast('Question Papers merged! Now compiling Mark Schemes...', 'info')

      // Fetch Mark Schemes
      const msRes = await fetch('/api/compile-pdfs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectCode: cleanCode, year: compilationYear, type: 'ms' })
      })
      
      if (!msRes.ok) throw new Error((await msRes.json()).error || 'Failed to compile Mark Schemes')
      
      const msBlob = await msRes.blob()
      const msUrl = window.URL.createObjectURL(msBlob)
      const msLink = document.createElement('a')
      msLink.href = msUrl
      msLink.target = '_blank'
      document.body.appendChild(msLink)
      msLink.click()
      msLink.remove()

      showToast('Successfully downloaded Authentic Mega-PDFs!', 'success')
    } catch (error) {
      console.error('Compile error:', error)
      showToast(error.message || 'Failed to compile PDFs. Check console for details.', 'error')
    } finally {
      setCompilingPdfs(false)
    }
  }

  // Utility to trigger download and clean up object URL
  const downloadFile = (url, name) => {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Revoke after a short delay if it's a blob URL
    if (url && url.startsWith('blob:')) {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  const handleTopicalExtract = async () => {
    const cleanCode = subjectCode.trim();
    const cleanTopic = topicInput.trim();
    if (!cleanCode || !cleanTopic || selectedYears.length === 0) return;

    setExtracting(true);
    setExtractedFiles(null);
    setExtractStatus(`Scanning ${selectedYears.join(', ')} papers for "${cleanTopic}"... This may take 30–60 seconds.`);

    try {
      const res = await fetch('/api/topical-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectCode: cleanCode, topic: cleanTopic, years: selectedYears, variants: selectedVariants, paperType, variantType })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Extraction failed');
      }

      setExtractedFiles({
        qpUrl: data.qpUrl,
        qpName: `${cleanCode}_${cleanTopic.replace(/\s+/g, '_')}_Questions.pdf`,
        msUrl: data.msUrl,
        msName: data.msUrl ? `${cleanCode}_${cleanTopic.replace(/\s+/g, '_')}_MarkScheme.pdf` : null
      });

      setExtractStatus(`✅ Found ${data.qpPagesFound} question page(s) and ${data.msPagesFound} mark scheme page(s) for "${cleanTopic}"!`);
      showToast(`Topic extraction complete! Tap the buttons below to download.`, 'success');
    } catch (error) {
      console.error('Topical extract error:', error);
      setExtractStatus(`❌ ${error.message}`);
      showToast(error.message, 'error');
    } finally {
      setExtracting(false);
    }
  }

  return (
    <AuthGuard>
      <div style={{ padding: '0 40px', paddingBottom: '100px' }}>
      <section style={{ textAlign: 'center', marginTop: '100px' }}>
        <h2 style={{ fontSize: '4rem', marginBottom: '10px' }} className="fade-in">
          Unlock Your <span style={{ color: '#0070f3' }}>Potential</span>
        </h2>
        <p style={{ color: '#a0a0a0', fontSize: '1.2rem', marginBottom: '40px' }} className="fade-in">
          Generate custom topical notes and get dynamic syllabus insights with advanced AI.
        </p>
      </section>

      {/* Topical Snippet Extractor Card */}
      <section id="topical-extractor-card" style={{ maxWidth: '900px', margin: '40px auto 0' }} className="fade-in">
        <div className="premium-card" style={{ padding: '30px', border: '1px solid rgba(147,51,234,0.3)', background: 'rgba(147,51,234,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <BookCopy size={22} color="#a855f7" />
            <h3 style={{ fontSize: '1.5rem', margin: 0, color: 'white' }}>Topical Snippet Extractor</h3>
          </div>
          <p style={{ color: '#a0a0a0', fontSize: '0.9rem', marginBottom: '24px' }}>
            Scans authentic past papers, finds pages about your topic using AI, and compiles them into two precise PDFs — one Question Paper, one Mark Scheme.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Input grid for inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div>
                <p style={{ color: '#a0a0a0', fontSize: '0.85rem', marginBottom: '8px' }}>Subject Code:</p>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Enter subject code (e.g. 9702)"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <p style={{ color: '#a0a0a0', fontSize: '0.85rem', marginBottom: '8px' }}>Topic Name:</p>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Enter a topic (e.g. Kinematics, electricity)"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <p style={{ color: '#a0a0a0', fontSize: '0.85rem', marginBottom: '8px' }}>Paper Number (Optional):</p>
                <input
                  type="text"
                  className="search-input"
                  placeholder="e.g. 1 or 2 (default all)"
                  value={paperType}
                  onChange={(e) => setPaperType(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <p style={{ color: '#a0a0a0', fontSize: '0.85rem', marginBottom: '8px' }}>Variant (Optional):</p>
                <input
                  type="text"
                  className="search-input"
                  placeholder="e.g. 1 or 2 (default all)"
                  value={variantType}
                  onChange={(e) => setVariantType(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Year selector */}
            <div>
              <p style={{ color: '#a0a0a0', fontSize: '0.85rem', marginBottom: '10px' }}>Select years to scan:</p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {[2023, 2022, 2021, 2020, 2019, 2018].map(y => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setSelectedYears(prev =>
                        prev.includes(y) ? prev.filter(x => x !== y) : [...prev, y]
                      )
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: selectedYears.includes(y) ? '1px solid #a855f7' : '1px solid #333',
                      background: selectedYears.includes(y) ? 'rgba(168,85,247,0.15)' : 'transparent',
                      color: selectedYears.includes(y) ? '#a855f7' : '#a0a0a0',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: selectedYears.includes(y) ? '600' : '400',
                      transition: 'all 0.2s'
                    }}
                  >
                    {selectedYears.includes(y) ? <CheckSquare size={14} /> : <Square size={14} />}
                    {y}
                  </button>
                ))}
              </div>
            </div>

            {/* Status text */}
            {extractStatus && (
              <p style={{ fontSize: '0.85rem', color: '#a855f7', margin: 0 }}>{extractStatus}</p>
            )}

            {/* Action buttons row */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {/* Extract Topic Snippets button */}
              <button
                type="button"
                onClick={handleTopicalExtract}
                disabled={extracting || !topicInput.trim() || selectedYears.length === 0}
                style={{
                  padding: '14px 28px',
                  borderRadius: '12px',
                  background: extracting ? 'rgba(168,85,247,0.2)' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  border: 'none',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '1rem',
                  cursor: (extracting || !topicInput.trim() || selectedYears.length === 0) ? 'not-allowed' : 'pointer',
                  opacity: (!topicInput.trim() || selectedYears.length === 0) ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'all 0.2s'
                }}
              >
                {extracting ? (
                  <><div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderLeftColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div> Scanning Papers...</>
                ) : (
                  <><BookCopy size={18} /> Extract Topic Snippets (2 PDFs)</>
                )}
              </button>

              {/* Generate Notes button */}
              <button
                type="button"
                onClick={handleGenerateNotes}
                disabled={generatingNotes || !subjectCode.trim() || !topicInput.trim()}
                style={{
                  padding: '14px 28px',
                  borderRadius: '12px',
                  background: generatingNotes ? 'rgba(0,230,118,0.15)' : 'linear-gradient(135deg, #00b86b, #00e676)',
                  border: 'none',
                  color: generatingNotes ? '#aaa' : '#000',
                  fontWeight: '700',
                  fontSize: '1rem',
                  cursor: (generatingNotes || !subjectCode.trim() || !topicInput.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (!subjectCode.trim() || !topicInput.trim()) ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'all 0.2s'
                }}
              >
                {generatingNotes ? (
                  <><div style={{ width: '18px', height: '18px', border: '2px solid rgba(0,0,0,0.2)', borderLeftColor: '#000', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div> Analyzing Papers...</>
                ) : (
                  <><FileText size={18} /> Generate Notes</>
                )}
              </button>
            </div>
          </div>
          
          {extractedFiles && (
            <div style={{ display: 'flex', gap: '15px', marginTop: '20px', flexWrap: 'wrap' }} className="fade-in">
              {extractedFiles.qpUrl && (
                <button type="button" onClick={() => downloadFile(extractedFiles.qpUrl, extractedFiles.qpName)} className="btn-primary" style={{ textDecoration: 'none', background: 'linear-gradient(135deg, #0070f3, #0051a8)' }}>
                  📄 Download Question Paper
                </button>
              )}
              {extractedFiles.msUrl && (
                <button type="button" onClick={() => downloadFile(extractedFiles.msUrl, extractedFiles.msName)} className="btn-primary" style={{ textDecoration: 'none', background: 'linear-gradient(135deg, #7928ca, #4c1187)' }}>
                  📑 Download Mark Scheme
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Examiner Intelligence Report */}
      {examinerNotes && (
        <section style={{ maxWidth: '900px', margin: '40px auto 0' }} className="fade-in">
          <div className="premium-card" style={{ padding: '30px', border: '1px solid rgba(0,230,118,0.3)', background: 'rgba(0,230,118,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles color="#00e676" size={24} />
                <div>
                  <h3 style={{ fontSize: '1.6rem', margin: 0, color: 'white' }}>Examiner Intelligence Report</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#a0a0a0' }}>{examinerNotes.subjectCode} · {examinerNotes.topic} · {examinerNotes.yearsAnalyzed}</p>
                </div>
              </div>
              <button
                onClick={() => setExaminerNotes(null)}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #333', color: '#a0a0a0', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                <X size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Close
              </button>
            </div>

            {/* Notes Tabs */}
            <div className="insights-tab-container">
              <button
                className={`insights-tab ${activeNotesTab === 'repeated' ? 'active' : ''}`}
                onClick={() => setActiveNotesTab('repeated')}
              >
                📋 Repeated Questions
              </button>
              <button
                className={`insights-tab ${activeNotesTab === 'keywords' ? 'active' : ''}`}
                onClick={() => setActiveNotesTab('keywords')}
              >
                🔑 Scoring Keywords
              </button>
              <button
                className={`insights-tab ${activeNotesTab === 'expectations' ? 'active' : ''}`}
                onClick={() => setActiveNotesTab('expectations')}
              >
                🎯 Examiner Expects
              </button>
              <button
                className={`insights-tab ${activeNotesTab === 'mistakes' ? 'active' : ''}`}
                onClick={() => setActiveNotesTab('mistakes')}
              >
                ⚠️ Common Mistakes
              </button>
              <button
                className={`insights-tab ${activeNotesTab === 'tips' ? 'active' : ''}`}
                onClick={() => setActiveNotesTab('tips')}
              >
                💡 High-Yield Tips
              </button>
            </div>

            {/* Notes Content */}
            <div className="insights-content fade-in" key={activeNotesTab}>
              {activeNotesTab === 'repeated' && (
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {examinerNotes.mostRepeatedQuestions}
                </div>
              )}
              {activeNotesTab === 'keywords' && (
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {examinerNotes.scoringKeywords}
                </div>
              )}
              {activeNotesTab === 'expectations' && (
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {examinerNotes.examinerExpectations}
                </div>
              )}
              {activeNotesTab === 'mistakes' && (
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {examinerNotes.commonMistakes}
                </div>
              )}
              {activeNotesTab === 'tips' && (
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {examinerNotes.highYieldTips}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '60px' }} className="fade-in">
          <div className="spinner" style={{ border: '4px solid rgba(255,255,255,0.1)', width: '36px', height: '36px', borderRadius: '50%', borderLeftColor: '#0070f3', animation: 'spin 1s linear infinite' }}></div>
          <p style={{ marginTop: '15px', color: '#a0a0a0' }}>Compiling syllabus insights using Llama 3.3...</p>
        </div>
      )}

      {insights && (
        <section style={{ marginTop: '60px', maxWidth: '800px', margin: '60px auto 0' }} className="fade-in">
          <div className="premium-card" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles color="#0070f3" size={24} />
                <h3 style={{ fontSize: '2rem', margin: 0 }}>Syllabus Insights for {subjectCode}</h3>
              </div>
              <button 
                onClick={() => window.open(`/print-pack?subjectCode=${subjectCode}`, '_blank')}
                className="btn-primary" 
                style={{ 
                  borderRadius: '50px', 
                  padding: '10px 24px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  background: 'linear-gradient(135deg, #0070f3, #005bc2)', 
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  border: 'none'
                }}
              >
                <Printer size={16} /> Download Exam Pack (PDF)
              </button>
            </div>

            {/* Insights Tabs */}
            <div className="insights-tab-container">
              <button 
                className={`insights-tab ${activeInsightTab === 'repeated' ? 'active' : ''}`}
                onClick={() => setActiveInsightTab('repeated')}
              >
                📋 Most Repeated Questions
              </button>
              <button 
                className={`insights-tab ${activeInsightTab === 'keywords' ? 'active' : ''}`}
                onClick={() => setActiveInsightTab('keywords')}
              >
                🔑 Keywords to Use
              </button>
              <button 
                className={`insights-tab ${activeInsightTab === 'notes' ? 'active' : ''}`}
                onClick={() => setActiveInsightTab('notes')}
              >
                📝 Notes
              </button>
            </div>

            {/* Insights Content */}
            <div className="insights-content fade-in" key={activeInsightTab}>
              {activeInsightTab === 'repeated' && (
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {insights.repeatedQuestions}
                </div>
              )}
              {activeInsightTab === 'keywords' && (
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {insights.keywords}
                </div>
              )}
              {activeInsightTab === 'notes' && (
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {insights.notes}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Floating Toggle Button */}
      <button 
        className="sidebar-toggle-btn"
        onClick={() => setTutorSidebarOpen(!tutorSidebarOpen)}
      >
        {tutorSidebarOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Slide-out Sidebar Drawer (Chat History + Active Chat) */}
      <div className={`sidebar-drawer ${tutorSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu color="#0070f3" size={20} />
            <span style={{ fontWeight: '600', color: 'white' }}>AI Tutor Workspace</span>
          </div>
          <button className="sidebar-close-btn" onClick={() => setTutorSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Create New Chat session */}
        <button className="new-chat-btn" onClick={handleCreateNewChat}>
          <Plus size={16} style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }} />
          New Chat Session
        </button>

        {/* Collapsible Session List Header */}
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            cursor: 'pointer',
            padding: '5px 0 10px',
            color: '#a0a0a0',
            fontSize: '0.85rem',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            marginBottom: '10px'
          }}
          onClick={() => setShowHistoryList(!showHistoryList)}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <MessageSquare size={14} /> Session History ({chatSessions.length})
          </span>
          {showHistoryList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>

        {/* Session List body */}
        {showHistoryList && (
          <div className="chat-history-list">
            {chatSessions.map((session) => (
              <div 
                key={session.id} 
                className={`chat-session-item ${session.id === activeSessionId ? 'active' : ''}`}
                onClick={() => {
                  setActiveSessionId(session.id)
                  setShowHistoryList(false) // collapse after choice for clean screen
                }}
              >
                {session.title}
              </div>
            ))}
          </div>
        )}

        {/* Main active chat area inside sidebar */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', marginTop: '10px' }}>
          <div style={{ fontSize: '0.75rem', color: '#a0a0a0', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Active: {activeSession.title}
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '15px', paddingRight: '5px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {chatMessages.map((msg, i) => (
              <div key={i} style={{ textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                <div style={{ 
                  display: 'inline-block', 
                  padding: '10px 14px', 
                  borderRadius: '12px', 
                  background: msg.role === 'user' ? '#0070f3' : 'rgba(255,255,255,0.05)',
                  color: msg.role === 'user' ? 'white' : '#e0e0e0',
                  fontSize: '0.85rem',
                  lineHeight: '1.4',
                  maxWidth: '85%',
                  whiteSpace: 'pre-wrap',
                  textAlign: 'left'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} style={{ position: 'relative', marginTop: 'auto' }}>
            <input 
              type="text" 
              className="search-input" 
              style={{ padding: '12px 45px 12px 16px', fontSize: '0.85rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }} 
              placeholder="Ask a syllabus doubt..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button type="submit" style={{ position: 'absolute', right: '12px', top: '12px', background: 'transparent', border: 'none', color: '#0070f3', cursor: 'pointer' }}>
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>

      {/* Toast Notifications */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: toast.type === 'success' ? '#00e676' : toast.type === 'info' ? '#0070f3' : '#ff1744',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '12px',
          zIndex: 2000,
          fontWeight: '600',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          animation: 'fadeIn 0.3s ease'
        }}>
          {toast.message}
        </div>
      )}
      </div>
    </AuthGuard>
  )
}
