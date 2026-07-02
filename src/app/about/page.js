'use client'

import Link from 'next/link'
import { ArrowRight, Award, Heart, ShieldCheck, Sparkles } from 'lucide-react'

const stats = [
  ['250K+', 'Past papers indexed'],
  ['15K+', 'Topics synthesized'],
  ['98.4%', 'Reported study clarity'],
]

const values = [
  {
    icon: ShieldCheck,
    title: 'Authentic material',
    text: 'The platform works from real Cambridge paper archives instead of replacing practice with artificial questions.',
  },
  {
    icon: Sparkles,
    title: 'Less admin',
    text: 'Students should spend their best focus on solving questions, not assembling PDFs and hunting mark schemes.',
  },
  {
    icon: Heart,
    title: 'Accessible tools',
    text: 'A simple plan keeps the study engine affordable while covering the heavy document and AI work behind it.',
  },
]

export default function AboutPage() {
  return (
    <div className="site-page">
      <section className="site-section split-section">
        <div>
          <p className="section-kicker">About PastPaper</p>
          <h1 className="section-heading">Built for students who are done wrestling with archives.</h1>
        </div>
        <div className="panel">
          <Award size={30} color="var(--accent-soft)" />
          <p className="section-copy" style={{ marginTop: 18 }}>
            AceurExam turns raw Cambridge exam archives into practical study sessions: paper scanning, weakness analysis, and exact topical packs in the same workspace.
          </p>
        </div>
      </section>

      <section className="site-section" style={{ paddingTop: 68 }}>
        <div className="stat-container">
          {stats.map(([value, label]) => (
            <div className="stat-card" key={label}>
              <div className="stat-number">{value}</div>
              <div style={{ color: 'var(--text-secondary)', fontWeight: 800 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="site-section split-section">
        <div className="panel">
          <p className="section-kicker">The problem</p>
          <h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 3.2rem)', marginBottom: 16 }}>Manual paper prep steals study time.</h2>
          <p className="section-copy">
            Finding topic-specific questions across years, variants, and mark schemes is slow, repetitive work. It is important, but it should not consume the session.
          </p>
        </div>
        <div className="panel">
          <p className="section-kicker">The answer</p>
          <h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 3.2rem)', marginBottom: 16 }}>One workspace for the whole loop.</h2>
          <p className="section-copy">
            Scan your paper, review your weak points, extract the topicals, and save them — without leaving the flow.
          </p>
        </div>
      </section>

      <section className="site-section" style={{ paddingTop: 84 }}>
        <p className="section-kicker">Core pillars</p>
        <h2 className="section-heading">The product has three rules.</h2>
        <div className="feature-grid value-grid">
          {values.map(({ icon: Icon, title, text }) => (
            <article className="panel feature-card" key={title}>
              <Icon size={28} color="var(--accent-soft)" />
              <h3 style={{ marginTop: 20, marginBottom: 12, fontSize: '1.22rem' }}>{title}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section" style={{ paddingTop: 96, textAlign: 'center' }}>
        <p className="section-kicker" style={{ marginInline: 'auto' }}>Ready</p>
        <h2 className="section-heading">Open the study engine.</h2>
        <Link href="/dashboard" className="btn-primary">
          Start Studying <ArrowRight size={18} />
        </Link>
      </section>
    </div>
  )
}
