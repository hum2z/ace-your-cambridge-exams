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
        minHeight: '100vh', 
        background: 'linear-gradient(160deg, #7c3aed 0%, #6d28d9 40%, #4c1d95 100%)', 
        marginTop: '-100px', 
        paddingTop: '140px', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'flex-end',
        overflow: 'hidden' 
      }}>

        {/* Social trust badge — top left floating */}
        <div style={{ 
          position: 'absolute',
          top: '140px',
          left: '40px',
          display: 'flex', 
          flexDirection: 'column',
          gap: '10px',
          zIndex: 10
        }} className="fade-in">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1a1a2e', border: '2px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold', color: '#a855f7' }}>✦</div>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1a1a2e', border: '2px solid rgba(255,255,255,0.15)', marginLeft: '-10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold', color: '#c084fc' }}>✦</div>
          </div>
          <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', fontWeight: '600' }}>
            10k+ Students trust us
          </span>
        </div>

        {/* Small hanging card — top right */}
        <div style={{ 
          position: 'absolute',
          top: '120px',
          right: '40px',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }} className="float-anim-delay fade-in">
          <div style={{
            width: '1px',
            height: '40px',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.5), rgba(255,255,255,0))',
          }}></div>
          <div style={{
            width: '160px',
            background: 'rgba(10, 10, 10, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(15px)'
          }}>
            <img 
              src="/purple_ai_tutor.png" 
              alt="AI Study Companion" 
              style={{ 
                width: '100%', 
                borderRadius: '10px', 
                aspectRatio: '1', 
                objectFit: 'cover'
              }}
            />
            <div style={{ padding: '0 2px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'white', letterSpacing: '1px', textTransform: 'uppercase' }}>
                AI STUDY ENGINE
              </span>
              <br/>
              <span style={{ fontSize: '0.6rem', color: '#a78bfa', fontWeight: '600' }}>
                PASTPAPER
              </span>
            </div>
          </div>
        </div>

        {/* Central book — the dominant hero element */}
        <div style={{ 
          position: 'relative',
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'flex-end', 
          width: '100%',
          maxWidth: '650px',
          flex: '1',
          zIndex: 3,
          paddingBottom: '0'
        }} className="float-anim">
          {/* Radial glow behind book */}
          <div style={{
            position: 'absolute',
            width: '550px',
            height: '550px',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(168,85,247,0.5) 0%, rgba(124,58,237,0.2) 40%, transparent 70%)',
            filter: 'blur(40px)',
            zIndex: 0,
            pointerEvents: 'none'
          }}></div>

          <img 
            src="/purple_neon_book.png" 
            alt="Futuristic neon book" 
            style={{ 
              width: '100%', 
              maxWidth: '480px', 
              height: 'auto', 
              position: 'relative', 
              zIndex: 2,
              filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.6))',
              marginBottom: '-40px'
            }}
          />
        </div>

        {/* Giant overlapping text at the bottom — like "AGENCY" in the reference */}
        <div style={{
          position: 'relative',
          width: '100%',
          zIndex: 4,
          overflow: 'hidden',
          lineHeight: '0.85',
          paddingBottom: '20px'
        }}>
          <div style={{
            fontSize: 'min(20vw, 18rem)',
            fontWeight: '900',
            fontFamily: "'Outfit', sans-serif",
            color: 'rgba(255, 255, 255, 0.12)',
            letterSpacing: '-8px',
            userSelect: 'none',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            lineHeight: '0.85'
          }}>
            STUDY
          </div>
        </div>

        {/* CTA button floating at the bottom center */}
        <div style={{
          position: 'absolute',
          bottom: '50px',
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
                padding: '16px 36px', 
                borderRadius: '50px', 
                fontSize: '1rem', 
                fontWeight: '700', 
                background: 'white', 
                color: '#4c1d95',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 12px 35px rgba(0,0,0,0.4)' }}
              onMouseLeave={(e) => { e.target.style.transform = 'none'; e.target.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)' }}
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
