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

      {/* Redesigned Premium Purple Hero Section */}
      <section style={{ 
        position: 'relative', 
        width: '100%', 
        minHeight: '95vh', 
        background: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)', 
        marginTop: '-100px', 
        paddingTop: '160px', 
        paddingBottom: '80px',
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        overflow: 'hidden' 
      }}>
        {/* Giant background text (behind book, centered) */}
        <div style={{
          position: 'absolute',
          bottom: '8%',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 'min(18vw, 15rem)',
          fontWeight: '900',
          fontFamily: "'Outfit', sans-serif",
          color: 'rgba(255, 255, 255, 0.08)',
          letterSpacing: '-6px',
          userSelect: 'none',
          zIndex: 1,
          whiteSpace: 'nowrap',
          pointerEvents: 'none'
        }}>
          CAMBRIDGE
        </div>

        {/* Content grid */}
        <div style={{ 
          width: '100%', 
          maxWidth: '1200px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '0 40px',
          position: 'relative',
          zIndex: 2,
          flexWrap: 'wrap',
          gap: '40px'
        }}>
          {/* Left Column: Social proof & CTA Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: '1 1 300px', maxWidth: '400px' }} className="fade-in">
            {/* Social trust badge */}
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '12px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '50px',
              padding: '8px 16px',
              alignSelf: 'flex-start'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#a855f7', border: '2px solid #7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 'bold' }}>A</div>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#c084fc', border: '2px solid #7c3aed', marginLeft: '-8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 'bold' }}>B</div>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#e9d5ff', border: '2px solid #7c3aed', marginLeft: '-8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 'bold' }}>C</div>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#f3f4f6', fontWeight: '600', letterSpacing: '0.2px' }}>
                10k+ Cambridge students trust us
              </span>
            </div>

            {/* Core Titles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h1 style={{ 
                fontSize: '3.8rem', 
                lineHeight: '1.05', 
                fontWeight: '900', 
                color: 'white',
                letterSpacing: '-2px',
                margin: 0
              }}>
                Ace Cambridge <br/>
                Exams with <span style={{ color: '#e9d5ff' }}>AI Intel</span>
              </h1>
              <p style={{ 
                fontSize: '1.1rem', 
                color: 'rgba(255, 255, 255, 0.85)', 
                margin: 0, 
                lineHeight: '1.6',
                maxWidth: '360px'
              }}>
                Extract topical past papers instantly, generate examiner intelligence reports, and study with an active AI Tutor 24/7.
              </p>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '8px' }}>
              {!loading && (
                <Link href={user ? "/dashboard" : "/login"}>
                  <button className="btn-primary" style={{ 
                    padding: '16px 36px', 
                    borderRadius: '50px', 
                    fontSize: '1rem', 
                    fontWeight: '700', 
                    background: 'white', 
                    color: '#4c1d95',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 12px 30px rgba(0,0,0,0.3)' }}
                  onMouseLeave={(e) => { e.target.style.transform = 'none'; e.target.style.boxShadow = '0 10px 25px rgba(0,0,0,0.25)' }}
                  >
                    {user ? "Go to Dashboard" : "Launch Study Engine"}
                  </button>
                </Link>
              )}
              <Link href="/subscription">
                <button className="btn-secondary" style={{ 
                  padding: '16px 36px', 
                  borderRadius: '50px', 
                  fontSize: '1rem', 
                  fontWeight: '700', 
                  background: 'rgba(255,255,255,0.15)', 
                  border: '1px solid rgba(255,255,255,0.3)', 
                  color: 'white', 
                  cursor: 'pointer', 
                  transition: 'all 0.2s' 
                }} 
                onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.25)'; e.target.style.transform = 'translateY(-2px)' }} 
                onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.15)'; e.target.style.transform = 'none' }}
                >
                  View Premium
                </button>
              </Link>
            </div>
          </div>

          {/* Center Column: Floating Neon Book */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            position: 'relative',
            flex: '1 1 350px',
            minHeight: '380px'
          }} className="float-anim">
            {/* Big radial soft purple glow */}
            <div style={{
              position: 'absolute',
              width: '450px',
              height: '450px',
              background: 'radial-gradient(circle, rgba(168,85,247,0.45) 0%, transparent 70%)',
              filter: 'blur(30px)',
              zIndex: 0
            }}></div>

            <img 
              src="/purple_neon_book.png" 
              alt="Futuristic neon book" 
              style={{ 
                width: '100%', 
                maxWidth: '360px', 
                height: 'auto', 
                position: 'relative', 
                zIndex: 2,
                filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.55))'
              }}
            />
          </div>

          {/* Right Column: Floating AI Tutor Card */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            flex: '1 1 200px',
            maxWidth: '240px'
          }} className="float-anim-delay">
            {/* Hanging cord line */}
            <div style={{
              width: '1px',
              height: '50px',
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), rgba(255,255,255,0))',
              marginBottom: '10px'
            }}></div>

            {/* Glass container */}
            <div style={{
              width: '100%',
              background: 'rgba(10, 10, 10, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '20px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(15px)'
            }}>
              <img 
                src="/purple_ai_tutor.png" 
                alt="Active AI Tutor" 
                style={{ 
                  width: '100%', 
                  borderRadius: '14px', 
                  aspectRatio: '1', 
                  objectFit: 'cover'
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 4px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'white', letterSpacing: '0.5px' }}>
                  ACTIVE TUTOR
                </span>
                <span style={{ fontSize: '0.7rem', color: '#c084fc', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span> ONLINE NOW
                </span>
              </div>
            </div>
          </div>
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
