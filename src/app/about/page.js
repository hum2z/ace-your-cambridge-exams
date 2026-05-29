'use client'

import Link from 'next/link'
import { Sparkles, Award, ShieldCheck, Heart, ArrowRight } from 'lucide-react'

export default function AboutPage() {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', padding: '0 24px', paddingBottom: '120px' }}>
      {/* Visual background accents */}
      <div className="grid-bg"></div>
      <div className="grid-lines"></div>

      {/* Hero section */}
      <section style={{ maxWidth: '800px', margin: '100px auto 0', textAlign: 'center' }}>
        <h1 style={{ 
          fontSize: '3.5rem', 
          letterSpacing: '-2px', 
          marginBottom: '16px',
          background: 'linear-gradient(to right, #ffffff, #a0a0a0)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Empowering <span style={{ background: 'linear-gradient(to right, #0070f3, #7928ca)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Cambridge Students</span>
        </h1>
        <p style={{ color: '#a0a0a0', fontSize: '1.1rem', maxWidth: '580px', margin: '0 auto 60px', lineHeight: '1.6' }}>
          We believe high-stakes exam preparation shouldn't be defined by tedious manual paper organization. Here is how we are building the future of studying.
        </p>
      </section>

      {/* Stats Counter Grid */}
      <section style={{ maxWidth: '900px', margin: '40px auto 0' }}>
        <div className="stat-container">
          <div className="stat-card">
            <div className="stat-number">250K+</div>
            <div style={{ fontSize: '0.9rem', color: '#a0a0a0', fontWeight: '600' }}>Past Papers Indexed</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">15K+</div>
            <div style={{ fontSize: '0.9rem', color: '#a0a0a0', fontWeight: '600' }}>Topics Synthesized</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">98.4%</div>
            <div style={{ fontSize: '0.9rem', color: '#a0a0a0', fontWeight: '600' }}>Score Improvement Rate</div>
          </div>
        </div>
      </section>

      {/* Narrative Section - The Problem & The Solution */}
      <section style={{ maxWidth: '900px', margin: '80px auto 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
        <div className="premium-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '30px' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={20} color="#ff1744" /> The Problem
          </h2>
          <p style={{ color: '#a0a0a0', fontSize: '0.95rem', lineHeight: '1.7', margin: 0 }}>
            Every year, millions of Cambridge students study using official archives of raw past paper PDFs. However, sorting through multiple years, finding specific topic questions, and mapping them to corresponding mark schemes is an absolute administrative nightmare. It wastes valuable hours of focused studying on boring busywork.
          </p>
        </div>

        <div className="premium-card" style={{ background: 'rgba(0,112,243,0.03)', border: '1px solid rgba(0,112,243,0.15)', padding: '30px' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="#0070f3" /> The Solution
          </h2>
          <p style={{ color: '#a0a0a0', fontSize: '0.95rem', lineHeight: '1.7', margin: 0 }}>
            **Past Paper** acts as an AI study engine. It utilizes cutting-edge document parsing models and natural language matching to segment standard exam archives into precise topical packages. We compile these papers automatically, generate examiner scoring insights on-the-fly, and package them with an active AI Tutor.
          </p>
        </div>
      </section>

      {/* Core Values Section */}
      <section style={{ maxWidth: '900px', margin: '100px auto 0' }}>
        <h2 style={{ fontSize: '2.2rem', textAlign: 'center', marginBottom: '50px' }}>Our Core Pillars</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,230,118,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldCheck size={20} color="#00e676" />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '8px' }}>Authentic Materials Only</h3>
              <p style={{ color: '#a0a0a0', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
                We believe that actual past papers represent the absolute gold standard for studying. We do not generate artificial mock questions; instead, we build pipelines to parse and index true, authentic, historic Cambridge exam papers.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,112,243,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles size={20} color="#0070f3" />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '8px' }}>Efficiency First</h3>
              <p style={{ color: '#a0a0a0', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
                Every single feature on our platform is built to optimize your study time. Whether it's compiling topical snippet packs in one click, generating dynamic summaries of examiner expectations, or immediately asking our sidebar AI Tutor to resolve a doubt.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(121,40,202,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Heart size={20} color="#7928ca" />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '8px' }}>Accessible Innovation</h3>
              <p style={{ color: '#a0a0a0', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
                High-quality education should be accessible to all. That's why we keep our baseline study tools free to use, and charge a flat, ultra-accessible rate of **only $5/month** for full access to our premium AI parsing engines.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ maxWidth: '800px', margin: '140px auto 0', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Ready to Elevate Your Exam Prep?</h2>
        <p style={{ color: '#a0a0a0', fontSize: '1.1rem', marginBottom: '40px', maxWidth: '500px', margin: '0 auto 40px' }}>
          Join thousands of international students studying smarter with the Past Paper AI engine.
        </p>
        <Link href="/">
          <button className="btn-primary" style={{ padding: '16px 40px', borderRadius: '50px', fontSize: '1.05rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            Open Study Companion <ArrowRight size={18} />
          </button>
        </Link>
      </section>
    </div>
  )
}
