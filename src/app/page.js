'use client'

import Link from 'next/link'
import { BookCopy, Sparkles, Cpu, Printer, ChevronRight, FileText, CheckCircle } from 'lucide-react'
import { useAuth } from '@/components/AuthContext'

export default function HomePage() {
  const { user, loading } = useAuth()

  return (
    <div style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', paddingBottom: '120px' }}>
      {/* Visual background accents */}
      <div className="grid-bg"></div>
      <div className="grid-lines"></div>

      {/* Premium Dark Hero Section (Reference Style) */}
      <section style={{ 
        position: 'relative', 
        width: '100%', 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #3E241B 0%, #1A0F0B 100%)', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        overflow: 'hidden' 
      }}>

        {/* Vertical SCROLL DOWN text on the left */}
        <div style={{
          position: 'absolute',
          left: '40px',
          top: '50%',
          transform: 'translateY(-50%) rotate(-90deg)',
          transformOrigin: 'left center',
          color: 'rgba(255,255,255,0.7)',
          fontSize: '0.8rem',
          fontWeight: '700',
          letterSpacing: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          zIndex: 10
        }} className="fade-in">
          <span>SCROLL DOWN</span>
          <div style={{ width: '40px', height: '1px', background: 'rgba(255,255,255,0.7)' }}></div>
        </div>

        {/* Giant background text — solid white, massive */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 2,
          pointerEvents: 'none',
          userSelect: 'none',
          whiteSpace: 'nowrap',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          lineHeight: '0.85',
          width: '100%'
        }}>
          <span style={{
            fontSize: 'min(22vw, 18rem)',
            fontWeight: '900',
            fontFamily: "'Inter', sans-serif",
            color: '#FFFFFF',
            letterSpacing: '-8px',
            textShadow: '0 20px 50px rgba(0,0,0,0.3)'
          }}>
            ACE UR
          </span>
          <span style={{
            fontSize: 'min(22vw, 18rem)',
            fontWeight: '900',
            fontFamily: "'Inter', sans-serif",
            color: '#FFFFFF',
            letterSpacing: '-8px',
            textShadow: '0 20px 50px rgba(0,0,0,0.3)'
          }}>
            EXAMS
          </span>
        </div>

        {/* Central book — vertical and overlapping text */}
        <div style={{ 
          position: 'relative',
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          width: '100%',
          maxWidth: '450px',
          zIndex: 3,
          marginTop: '20px'
        }} className="float-anim">
          <img 
            src="/vertical_book_transparent.png" 
            alt="Vertical textbook" 
            style={{ 
              width: '100%', 
              height: 'auto', 
              position: 'relative', 
              zIndex: 3,
              filter: 'drop-shadow(0 40px 80px rgba(0,0,0,0.8))'
            }}
          />
        </div>

        {/* Floating background chunks (mimicking reference style) */}
        <div style={{
          position: 'absolute', top: '15%', left: '20%', width: '80px', height: '80px', 
          background: 'rgba(62, 36, 27, 0.9)', transform: 'rotate(25deg)', borderRadius: '12px',
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5), 0 20px 40px rgba(0,0,0,0.4)', zIndex: 4, filter: 'blur(1px)'
        }} className="float-anim-delay"></div>
        
        <div style={{
          position: 'absolute', bottom: '15%', right: '15%', width: '120px', height: '100px', 
          background: 'rgba(62, 36, 27, 0.95)', transform: 'rotate(-15deg)', borderRadius: '16px',
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5), 0 30px 50px rgba(0,0,0,0.6)', zIndex: 4
        }} className="float-anim"></div>

        <div style={{
          position: 'absolute', bottom: '25%', left: '25%', width: '60px', height: '50px', 
          background: 'rgba(62, 36, 27, 0.8)', transform: 'rotate(45deg)', borderRadius: '8px',
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5), 0 15px 30px rgba(0,0,0,0.3)', zIndex: 4
        }} className="float-anim-delay"></div>


        {/* CTA button — bottom center */}
        <div style={{
          position: 'absolute',
          bottom: '60px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '16px',
          zIndex: 10,
          flexWrap: 'wrap',
          justifyContent: 'center'
        }} className="fade-in">
          {!loading && (
            <Link href={user ? "/dashboard" : "/login"}>
              <button style={{ 
                padding: '16px 40px', 
                borderRadius: '50px', 
                fontSize: '1rem', 
                fontWeight: '700', 
                background: 'white', 
                color: '#1A0F0B',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                transition: 'all 0.2s',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
              onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 12px 35px rgba(0,0,0,0.6)' }}
              onMouseLeave={(e) => { e.target.style.transform = 'none'; e.target.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)' }}
              >
                {user ? "Go to Dashboard" : "GET STARTED"}
              </button>
            </Link>
          )}
        </div>
      </section>

      {/* Floating features mockup */}
      <section style={{ maxWidth: '1000px', margin: '80px auto 0' }} className="fade-in">
        <div style={{
          background: 'rgba(10, 10, 10, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '24px',
          padding: '16px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 30px 60px rgba(0,0,0,0.8)'
        }}>
          {/* Mock dashboard window bar */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', paddingLeft: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }}></div>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }}></div>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }}></div>
          </div>
          {/* Mock app screenshot content */}
          <div style={{ 
            background: 'rgba(0,0,0,0.6)', 
            borderRadius: '16px', 
            padding: '30px', 
            border: '1px solid rgba(255,255,255,0.02)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(147,51,234,0.05)', border: '1px solid rgba(147,51,234,0.2)', padding: '20px', borderRadius: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><BookCopy size={16} color="#a855f7" /> <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>Topical Extractor</span></div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#a0a0a0' }}>Subject: 9702 (Physics) · Topic: Wave Optics</p>
              <div style={{ width: '100%', height: '4px', background: '#333', borderRadius: '2px', overflow: 'hidden' }}><div style={{ width: '80%', height: '100%', background: '#a855f7' }}></div></div>
              <span style={{ fontSize: '0.7rem', color: '#a855f7' }}>Merging Question & Mark Scheme pages...</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(0,230,118,0.03)', border: '1px solid rgba(0,230,118,0.2)', padding: '20px', borderRadius: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Sparkles size={16} color="#00e676" /> <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>Intelligence Report</span></div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#a0a0a0' }}>📋 Scoring Keywords: Coherence, Phase Difference, Diffraction Grating Formula</p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#a0a0a0' }}>⚠️ Common Mistakes: Mixing up double-slit and single-slit fringe width</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid Section */}
      <section style={{ maxWidth: '1000px', margin: '140px auto 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Powering Your Study Success</h2>
          <p style={{ color: '#a0a0a0', fontSize: '1.05rem', maxWidth: '550px', margin: '0 auto' }}>Four revolutionary pillars designed to transform raw PDF past papers into structured, high-yield learning.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '24px' }}>
          
          <div className="glow-card" style={{ padding: '30px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(147, 51, 234, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <BookCopy size={24} color="#a855f7" />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', color: 'white' }}>Topical Snippet Extractor</h3>
            <p style={{ color: '#a0a0a0', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>Scans authentic past paper databases, isolates specific topic pages, and compiles distinct Question & Answer booklets.</p>
          </div>

          <div className="glow-card" style={{ padding: '30px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0, 230, 118, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Sparkles size={24} color="#00e676" />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', color: 'white' }}>Examiner Intel Report</h3>
            <p style={{ color: '#a0a0a0', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>Leverages advanced AI models to synthesize years of examiners' reports into key scoring keywords, common errors, and tips.</p>
          </div>

          <div className="glow-card" style={{ padding: '30px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0, 112, 243, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Cpu size={24} color="#0070f3" />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', color: 'white' }}>Active AI Study Tutor</h3>
            <p style={{ color: '#a0a0a0', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>Engage with an intelligent sidebar tutor that retains session study history and resolves tough syllabus roadblocks instantly.</p>
          </div>

          <div className="glow-card" style={{ padding: '30px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(250, 204, 21, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Printer size={24} color="#facc15" />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', color: 'white' }}>Authentic Mega-PDFs</h3>
            <p style={{ color: '#a0a0a0', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>Compiles custom-formatted study booklets directly. Print them, mark them, and refine your study with true exam-standard material.</p>
          </div>

        </div>
      </section>

      {/* Pricing CTA Section */}
      <section style={{ maxWidth: '900px', margin: '140px auto 0', position: 'relative' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(0, 112, 243, 0.1), rgba(121, 40, 202, 0.1))',
          border: '1px solid rgba(0, 112, 243, 0.2)',
          borderRadius: '30px',
          padding: '60px 40px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          overflow: 'hidden'
        }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Supercharge Your Exam Preparation</h2>
          <p style={{ color: '#e0e0e0', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 36px', lineHeight: '1.6' }}>
            Get unlimited access to all AI compilation runs, examiner insights, and chat contexts. Just one plan, fully unlocked.
          </p>

          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '15px', 
            background: 'rgba(0,0,0,0.4)', 
            border: '1px solid rgba(255,255,255,0.05)', 
            borderRadius: '20px', 
            padding: '20px 40px', 
            marginBottom: '40px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.8rem', color: '#a0a0a0', textTransform: 'uppercase', letterSpacing: '1px' }}>PRO PLAN</div>
              <div style={{ fontSize: '2.2rem', fontWeight: '800', color: 'white' }}>$5 <span style={{ fontSize: '1rem', color: '#a0a0a0', fontWeight: '400' }}>/ month</span></div>
            </div>
            <div style={{ width: '1px', height: '40px', background: '#333', display: 'block' }}></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
              <div style={{ fontSize: '0.85rem', color: '#e0e0e0', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={14} color="#00e676" /> Unlimited Topical Extracts</div>
              <div style={{ fontSize: '0.85rem', color: '#e0e0e0', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={14} color="#00e676" /> Premium Llama 3.3 Insights</div>
            </div>
          </div>

          <div>
            {!loading && (
              <Link href={user ? "/dashboard" : "/subscription"}>
                <button className="btn-primary" style={{ padding: '16px 40px', borderRadius: '50px', fontSize: '1.05rem', fontWeight: '700', background: 'linear-gradient(135deg, #0070f3, #7928ca)', border: 'none', boxShadow: '0 10px 25px rgba(121,40,202,0.4)' }}>
                  {user ? "Go to Dashboard" : "Upgrade to Premium Now"}
                </button>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
