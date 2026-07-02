'use client'

import { useState, useEffect, useRef } from 'react'
import { ScanLine, Upload, X, Layers, BookCopy, CheckSquare, Square, FileText, Download, Calendar, Loader, Target, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react'
import { PAPER_YEARS } from '@/lib/paperService'
import PremiumGate from '@/components/PremiumGate'
import { useAuth } from '@/components/AuthContext'
import { saveTopicalToFirebase, getSavedTopicals, deleteTopicalFromFirebase } from '@/lib/firebase'
import { Trash2 } from 'lucide-react'

// Safely coerce any AI-returned value into displayable text.
// gpt-4o-mini occasionally returns a field as an array or nested object,
// which would crash React ("Objects are not valid as a React child").
function asText(val) {
  if (val == null) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'number' || typeof val === 'boolean') return String(val)
  if (Array.isArray(val)) return val.map(asText).filter(Boolean).join('\n')
  if (typeof val === 'object') {
    return Object.entries(val)
      .map(([k, v]) => `${k}: ${asText(v)}`)
      .join('\n')
  }
  return String(val)
}

const SEVERITY_STYLES = {
  high: { label: 'High priority', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.12)', border: 'rgba(220, 38, 38, 0.3)' },
  medium: { label: 'Medium priority', color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)', border: 'rgba(217, 119, 6, 0.3)' },
  low: { label: 'Low priority', color: '#0f766e', bg: 'rgba(15, 118, 110, 0.12)', border: 'rgba(15, 118, 110, 0.3)' },
}

export default function DashboardPage() {
  const { user, isPremium, isTrial, subscription, consumeTrialUse } = useAuth()
  const [subjectCode, setSubjectCode] = useState('')

  // Paper Scanner state
  const [scanFiles, setScanFiles] = useState([])
  const [scanning, setScanning] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const fileInputRef = useRef(null)
  const extractorRef = useRef(null)

  // Topical Extractor state
  const [topicInput, setTopicInput] = useState('')
  const [selectedYears, setSelectedYears] = useState(PAPER_YEARS.slice(0, 2))
  const [selectedVariants, setSelectedVariants] = useState([])
  const [paperType, setPaperType] = useState('')
  const [variantType, setVariantType] = useState('')
  const [includeSolutionGuide, setIncludeSolutionGuide] = useState(false)
  // Beta Solution Guide is preview-only: shown everywhere EXCEPT the production
  // site (aceurexam.com). Default false so it never flashes on production, then
  // enable client-side. Prefer VERCEL_ENV; fall back to hostname in case the
  // env var isn't exposed to the browser. The API is gated server-side too.
  const [solutionGuideEnabled, setSolutionGuideEnabled] = useState(false)
  useEffect(() => {
    const env = process.env.NEXT_PUBLIC_VERCEL_ENV
    if (env) {
      setSolutionGuideEnabled(env !== 'production')
      return
    }
    const host = window.location.hostname
    const isProd = host === 'aceurexam.com' || host === 'www.aceurexam.com'
    setSolutionGuideEnabled(!isProd)
  }, [])
  const [extracting, setExtracting] = useState(false)
  const [extractStatus, setExtractStatus] = useState('')
  const [extractedFiles, setExtractedFiles] = useState(null)

  // Saved Topicals state
  const [savedTopicals, setSavedTopicals] = useState([])
  const [loadingSaved, setLoadingSaved] = useState(false)

  // Load saved topicals on user mount
  useEffect(() => {
    async function loadSaved() {
      if (!user) return
      setLoadingSaved(true)
      try {
        const data = await getSavedTopicals(user.uid)
        setSavedTopicals(data)
      } catch (err) {
        console.error("Error loading saved topicals:", err)
      } finally {
        setLoadingSaved(false)
      }
    }
    loadSaved()
  }, [user])

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }))
    }, 4000)
  }

  const canUse = (kind) => {
    if (isPremium) return true
    // Older trial docs predate the scanner and lack scanUsesRemaining — give them the default of 1.
    const fallback = kind === 'scan' ? 1 : 0
    if (isTrial && (subscription?.[`${kind}UsesRemaining`] ?? fallback) > 0) return true
    return false
  }

  const handleScanFilesChange = (e) => {
    const files = Array.from(e.target.files || [])
    setScanFiles(files)
    setAnalysis(null)
  }

  const handleScanPaper = async () => {
    if (scanFiles.length === 0) {
      showToast('Choose a past paper file first (PDF or photos).', 'error')
      return
    }
    if (!canUse('scan')) {
      showToast('Trial limit reached. Upgrade to Premium for unlimited paper scans.', 'error')
      return
    }

    setScanning(true)
    setAnalysis(null)
    showToast('Scanning your paper... This may take 20–40 seconds.', 'info')

    try {
      const formData = new FormData()
      scanFiles.forEach(f => formData.append('files', f))
      if (subjectCode.trim()) formData.append('subjectCode', subjectCode.trim())

      const res = await fetch('/api/scan-paper', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Paper scan failed')

      setAnalysis(data)
      if (!subjectCode.trim() && data.subjectGuess) setSubjectCode(String(data.subjectGuess))
      if (!isPremium && isTrial) await consumeTrialUse('scan')
      showToast('Analysis ready! Review your weak points below.', 'success')
    } catch (error) {
      console.error('Scan paper error:', error)
      showToast(error.message || 'Paper scan failed.', 'error')
    } finally {
      setScanning(false)
    }
  }

  // From a weak point straight into the topical extractor, pre-filled.
  const handleFocusWeakPoint = (topic) => {
    setTopicInput(asText(topic))
    if (!subjectCode.trim() && analysis?.subjectGuess) setSubjectCode(String(analysis.subjectGuess))
    extractorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    showToast(`Topic set to "${asText(topic)}" — pick your years and generate the topical.`, 'info')
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

  const handleDeleteTopical = async (topical) => {
    if (!topical?.id) return;
    if (!confirm(`Delete saved topical "${topical.topic}" (${topical.subjectCode})?`)) return;
    const prev = savedTopicals;
    setSavedTopicals(prev.filter(t => t.id !== topical.id));
    const ok = await deleteTopicalFromFirebase(topical.id);
    if (!ok) {
      setSavedTopicals(prev);
      showToast('Failed to delete topical. Please retry.', 'error');
    } else {
      showToast('Topical deleted.', 'success');
    }
  };

  const handleTopicalExtract = async () => {
    const cleanCode = subjectCode.trim();
    const cleanTopic = topicInput.trim();
    if (!cleanCode || !cleanTopic || selectedYears.length === 0) return;

    if (!canUse('topical')) {
      showToast('Trial limit reached. Upgrade to Premium for unlimited extractions.', 'error');
      return;
    }

    setExtracting(true);
    setExtractedFiles(null);
    setExtractStatus(`Scanning ${selectedYears.join(', ')} papers for "${cleanTopic}"... This may take 30–60 seconds.`);

    try {
      const res = await fetch('/api/topical-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectCode: cleanCode, topic: cleanTopic, years: selectedYears, variants: selectedVariants, paperType, variantType, includeSolutionGuide: solutionGuideEnabled && includeSolutionGuide })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Extraction failed');
      }

      const fileResult = {
        qpUrl: data.qpUrl,
        qpName: `${cleanCode}_${cleanTopic.replace(/\s+/g, '_')}_Questions.pdf`,
        msUrl: data.msUrl,
        msName: data.msUrl ? `${cleanCode}_${cleanTopic.replace(/\s+/g, '_')}_MarkScheme.pdf` : null,
        sgUrl: data.sgUrl
      };
      setExtractedFiles(fileResult);

      setExtractStatus(`✅ Found ${data.qpPagesFound} question page(s) and ${data.msPagesFound} mark scheme page(s) for "${cleanTopic}"!${data.sgPagesFound ? ` Generated a Solution Guide for ${data.sgPagesFound} question(s).` : ''}`);
      if (!isPremium && isTrial) await consumeTrialUse('topical');
      showToast(`Topic extraction complete! Saved to your library.`, 'success');

      // Auto-save topical extraction to Firestore
      try {
        await saveTopicalToFirebase(user.uid, {
          topic: cleanTopic,
          subjectCode: cleanCode,
          years: selectedYears,
          qpUrl: data.qpUrl,
          msUrl: data.msUrl,
          sgUrl: data.sgUrl || null,
          qpPagesFound: data.qpPagesFound,
          msPagesFound: data.msPagesFound
        });
        // Reload saved topicals list
        const updatedData = await getSavedTopicals(user.uid);
        setSavedTopicals(updatedData);
      } catch (saveError) {
        console.error("Error saving topical snapshot to Firestore:", saveError);
      }
    } catch (error) {
      console.error('Topical extract error:', error);
      setExtractStatus(`❌ ${error.message}`);
      showToast(error.message, 'error');
    } finally {
      setExtracting(false);
    }
  }

  return (
    <PremiumGate>
      <div className="site-page" style={{ paddingBottom: '100px' }}>
        {/* Decorative Grid Accents */}
        <div className="grid-bg"></div>
        <div className="grid-lines"></div>

        <section className="site-section split-section" style={{ alignItems: 'end' }}>
          <div>
            <p className="section-kicker">Study dashboard</p>
            <h1 className="section-heading fade-in">
              Scan a paper. Find your weak points. Drill them.
            </h1>
          </div>
          <p className="section-copy fade-in">
            Upload a past paper for an instant weakness analysis, then turn each weak topic into a targeted topical pack with questions, mark scheme, and a solution guide.
          </p>
        </section>

        {/* Past Paper Scanner Card */}
        <section id="paper-scanner-card" className="site-section fade-in" style={{ marginTop: '28px' }}>
          <div className="premium-card" style={{ padding: '30px', border: '1px solid rgba(239,90,43,0.3)', background: 'rgba(239,90,43,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <ScanLine size={22} color="#ef5a2b" />
              <h3 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-primary)' }}>Past Paper Scanner</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
              Upload a past paper — ideally one you&apos;ve attempted or had marked — and the AI examiner analyzes it, pinpoints the topics you&apos;re losing marks on, and lines each one up for topical practice.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '18px' }}>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>Subject Code (Optional — auto-detected):</p>
                <input
                  type="text"
                  className="search-input"
                  placeholder="e.g. 9702"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>Your paper (PDF, or JPG/PNG photos of the pages):</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleScanFilesChange}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '2px',
                    border: '1px dashed rgba(239,90,43,0.5)',
                    background: 'rgba(239,90,43,0.05)',
                    color: scanFiles.length > 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.9rem',
                    textAlign: 'left'
                  }}
                >
                  <Upload size={16} color="#ef5a2b" />
                  {scanFiles.length === 0
                    ? 'Choose file(s)... (max 4 MB each)'
                    : scanFiles.length === 1
                      ? scanFiles[0].name
                      : `${scanFiles.length} files selected`}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleScanPaper}
              disabled={scanning || scanFiles.length === 0}
              style={{
                padding: '14px 28px',
                borderRadius: '2px',
                background: scanning ? 'rgba(239, 90, 43, 0.18)' : 'linear-gradient(135deg, #ef5a2b, #c93f17)',
                border: 'none',
                color: 'white',
                fontWeight: '700',
                fontSize: '1rem',
                cursor: (scanning || scanFiles.length === 0) ? 'not-allowed' : 'pointer',
                opacity: scanFiles.length === 0 ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.2s'
              }}
            >
              {scanning ? (
                <><div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderLeftColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div> Analyzing Your Paper...</>
              ) : (
                <><ScanLine size={18} /> Scan & Analyze Paper</>
              )}
            </button>

            {/* Analysis result */}
            {analysis && (
              <div className="fade-in" style={{ marginTop: '28px', borderTop: '1px solid rgba(239,90,43,0.2)', paddingTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <Target size={20} color="#ef5a2b" />
                      <h4 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>Your Weakness Analysis</h4>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '2px', textTransform: 'uppercase', letterSpacing: '0.04em',
                        background: analysis.attempted ? 'rgba(15,118,110,0.15)' : 'rgba(217,119,6,0.15)',
                        color: analysis.attempted ? '#0f766e' : '#d97706'
                      }}>
                        {analysis.attempted ? 'Attempted paper' : 'Unattempted paper'}
                      </span>
                    </div>
                    {asText(analysis.paperInfo) && (
                      <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{asText(analysis.paperInfo)}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setAnalysis(null)}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(16, 32, 51, 0.18)', color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: '2px', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    <X size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Clear
                  </button>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: '20px' }}>
                  {asText(analysis.overallSummary)}
                </p>

                {analysis.strengths.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f766e', marginBottom: '8px' }}>Holding strong</p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {analysis.strengths.map((s, i) => (
                        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#0f766e', background: 'rgba(15,118,110,0.1)', border: '1px solid rgba(15,118,110,0.25)', padding: '5px 10px', borderRadius: '2px' }}>
                          <CheckCircle2 size={13} /> {asText(s)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <p style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#dc2626', marginBottom: '10px' }}>Focus on these weak points</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {analysis.weakPoints.map((wp, i) => {
                    const sev = SEVERITY_STYLES[String(wp.severity || '').toLowerCase()] || SEVERITY_STYLES.medium
                    return (
                      <div key={i} style={{ border: `1px solid ${sev.border}`, background: sev.bg, borderRadius: '2px', padding: '16px 18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                          <div style={{ flex: '1 1 320px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                              <AlertTriangle size={15} color={sev.color} />
                              <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{asText(wp.topic)}</strong>
                              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: sev.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{sev.label}</span>
                            </div>
                            {asText(wp.evidence) && (
                              <p style={{ margin: '0 0 6px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{asText(wp.evidence)}</p>
                            )}
                            {asText(wp.focusAdvice) && (
                              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{asText(wp.focusAdvice)}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleFocusWeakPoint(wp.topic)}
                            style={{
                              background: 'linear-gradient(135deg, #ef5a2b, #c93f17)',
                              border: 'none',
                              color: 'white',
                              borderRadius: '2px',
                              padding: '10px 16px',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Generate Topical <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {asText(analysis.nextSteps) && (
                  <p style={{ marginTop: '18px', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {asText(analysis.nextSteps)}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Topical Snippet Extractor Card */}
        <section id="topical-extractor-card" ref={extractorRef} className="site-section fade-in" style={{ marginTop: '28px', scrollMarginTop: '90px' }}>
          <div className="premium-card" style={{ padding: '30px', border: '1px solid rgba(15,118,110,0.3)', background: 'rgba(15,118,110,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <BookCopy size={22} color="#ef5a2b" />
              <h3 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-primary)' }}>Topical Snippet Extractor</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
              Scans authentic past papers, finds pages about your topic using AI, and compiles them into two precise PDFs — one Question Paper, one Mark Scheme.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Input grid for inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>Subject Code:</p>
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
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>Topic Name:</p>
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
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>Paper Number (Optional):</p>
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
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>Variant (Optional):</p>
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
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '10px' }}>Select years to scan:</p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {PAPER_YEARS.map(y => (
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
                        borderRadius: '2px',
                        border: selectedYears.includes(y) ? '1px solid #ef5a2b' : '1px solid rgba(16, 32, 51, 0.18)',
                        background: selectedYears.includes(y) ? 'rgba(15,118,110,0.15)' : 'transparent',
                        color: selectedYears.includes(y) ? '#ef5a2b' : 'var(--text-secondary)',
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

              {/* Solution Guide opt-in (beta, preview-only) */}
              {solutionGuideEnabled && (
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', padding: '12px 14px', border: '1px dashed rgba(239,90,43,0.4)', borderRadius: '2px', background: 'rgba(239,90,43,0.05)' }}>
                  <input
                    type="checkbox"
                    checked={includeSolutionGuide}
                    onChange={(e) => setIncludeSolutionGuide(e.target.checked)}
                    style={{ marginTop: '3px', accentColor: '#ef5a2b', width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Also generate a Solution Guide</span>
                    <span style={{ background: 'rgba(239,90,43,0.18)', color: '#ef5a2b', fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px', borderRadius: '2px', marginLeft: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Beta</span>
                    <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '3px' }}>
                      A clean web page that works through each question step by step and explains how to score the marks (open it, then Save as PDF if you like). Uses more AI credits and adds time.
                    </span>
                  </span>
                </label>
              )}

              {/* Status text */}
              {extractStatus && (
                <p style={{ fontSize: '0.85rem', color: '#ef5a2b', margin: 0 }}>{extractStatus}</p>
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
                    borderRadius: '2px',
                    background: extracting ? 'rgba(239, 90, 43, 0.18)' : 'linear-gradient(135deg, #ef5a2b, #ef5a2b)',
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
                    <><BookCopy size={18} /> Extract Topic Snippets ({solutionGuideEnabled && includeSolutionGuide ? '2 PDFs + Guide' : '2 PDFs'})</>
                  )}
                </button>
              </div>
            </div>

            {extractedFiles && (
              <div style={{ display: 'flex', gap: '15px', marginTop: '20px', flexWrap: 'wrap' }} className="fade-in">
                {extractedFiles.qpUrl && (
                  <button type="button" onClick={() => downloadFile(extractedFiles.qpUrl, extractedFiles.qpName)} className="btn-primary" style={{ textDecoration: 'none', background: 'linear-gradient(135deg, var(--accent-primary), #c93f17)' }}>
                    <Download size={16} style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block' }} /> Download Question Paper
                  </button>
                )}
                {extractedFiles.msUrl && (
                  <button type="button" onClick={() => downloadFile(extractedFiles.msUrl, extractedFiles.msName)} className="btn-primary" style={{ textDecoration: 'none', background: 'linear-gradient(135deg, #ef5a2b, #c93f17)' }}>
                    <Download size={16} style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block' }} /> Download Mark Scheme
                  </button>
                )}
                {extractedFiles.sgUrl && (
                  <button type="button" onClick={() => window.open(extractedFiles.sgUrl, '_blank', 'noopener')} className="btn-primary" style={{ textDecoration: 'none', background: 'linear-gradient(135deg, #0f766e, #115e59)' }}>
                    <FileText size={16} style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block' }} /> Open Solution Guide <span style={{ fontSize: '0.65rem', opacity: 0.85, marginLeft: '4px' }}>BETA</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Saved Topicals Library Section */}
        <section style={{ maxWidth: '900px', margin: '40px auto 0' }} className="fade-in">
          <div style={{
            padding: '30px',
            borderRadius: '2px',
            background: 'var(--bg-panel)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Layers size={22} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-primary)' }}>My Compiled Library</h3>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {savedTopicals.length} booklet{savedTopicals.length !== 1 ? 's' : ''} saved
              </span>
            </div>

            {loadingSaved ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '10px' }}>
                <Loader className="spin" size={18} color="var(--accent-primary)" />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading saved topicals...</span>
              </div>
            ) : savedTopicals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: '2px' }}>
                <BookCopy size={32} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>No compiled booklets in your library yet.</p>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Extract a topic using the tool above to save it here automatically.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {savedTopicals.map((topical) => (
                  <div
                    key={topical.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                      borderRadius: '2px',
                      flexWrap: 'wrap',
                      gap: '15px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ background: 'rgba(96, 165, 250, 0.15)', color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: '700', padding: '2px 8px', borderRadius: '2px' }}>
                          {topical.subjectCode}
                        </span>
                        <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem', fontWeight: '600' }}>
                          {topical.topic}
                        </h4>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <span>Years: {Array.isArray(topical.years) ? topical.years.join(', ') : topical.years}</span>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} /> {new Date(topical.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      {topical.qpUrl && (
                        <button
                          onClick={() => downloadFile(topical.qpUrl, `${topical.subjectCode}_${topical.topic.replace(/\s+/g, '_')}_Questions.pdf`)}
                          style={{
                            background: 'rgba(96, 165, 250, 0.1)',
                            border: '1px solid rgba(96, 165, 250, 0.2)',
                            color: 'var(--accent-primary)',
                            borderRadius: '2px',
                            padding: '8px 14px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(96, 165, 250, 0.2)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(96, 165, 250, 0.1)'}
                        >
                          <Download size={12} /> QP
                        </button>
                      )}
                      {topical.msUrl && (
                        <button
                          onClick={() => downloadFile(topical.msUrl, `${topical.subjectCode}_${topical.topic.replace(/\s+/g, '_')}_MarkScheme.pdf`)}
                          style={{
                            background: 'rgba(168, 85, 247, 0.1)',
                            border: '1px solid rgba(168, 85, 247, 0.2)',
                            color: '#ef5a2b',
                            borderRadius: '2px',
                            padding: '8px 14px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)'}
                        >
                          <Download size={12} /> MS
                        </button>
                      )}
                      {topical.sgUrl && (
                        <button
                          onClick={() => window.open(topical.sgUrl, '_blank', 'noopener')}
                          style={{
                            background: 'rgba(15, 118, 110, 0.12)',
                            border: '1px solid rgba(15, 118, 110, 0.25)',
                            color: '#0f766e',
                            borderRadius: '2px',
                            padding: '8px 14px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(15, 118, 110, 0.22)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(15, 118, 110, 0.12)'}
                        >
                          <FileText size={12} /> Guide
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteTopical(topical)}
                        title="Delete saved topical"
                        style={{
                          background: 'rgba(220, 38, 38, 0.1)',
                          border: '1px solid rgba(220, 38, 38, 0.2)',
                          color: '#dc2626',
                          borderRadius: '2px',
                          padding: '8px 12px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220, 38, 38, 0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)'}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Toast Notifications */}
        {toast.show && (
          <div style={{
            position: 'fixed',
            top: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: toast.type === 'success' ? '#c93f17' : toast.type === 'info' ? 'var(--accent-primary)' : '#dc2626',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '2px',
            zIndex: 2000,
            fontWeight: '600',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            animation: 'fadeIn 0.3s ease'
          }}>
            {toast.message}
          </div>
        )}
      </div>
    </PremiumGate>
  )
}
