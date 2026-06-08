'use client'

import Link from 'next/link'
import { BookCopy, CheckCircle, ChevronRight, Cpu, FileText, Layers, Printer, Sparkles } from 'lucide-react'
import { useAuth } from '@/components/AuthContext'

const features = [
  {
    icon: BookCopy,
    title: 'Topical packs',
    text: 'Find the exact questions for a topic, then split questions and mark schemes into clean booklets.',
  },
  {
    icon: FileText,
    title: 'Examiner notes',
    text: 'Turn years of marking patterns into scoring phrases, repeated traps, and quick revision notes.',
  },
  {
    icon: Cpu,
    title: 'AI tutor',
    text: 'Ask syllabus questions while you work, with chat sessions kept separate for each study sprint.',
  },
  {
    icon: Printer,
    title: 'Print packs',
    text: 'Compile official paper archives into practical PDFs you can print, annotate, and master.',
  },
]

const workflow = [
  ['9702 Physics', 'Wave optics', '86% matched'],
  ['9701 Chemistry', 'Energetics', 'Ready to export'],
  ['9709 Maths', 'Vectors', 'Mark scheme found'],
]

export default function HomePage() {
  const { user, loading } = useAuth()

  return (
    <div className="site-page">
      <section className="hero-stage" aria-label="Past Paper study companion">
        <div className="hero-copy fade-in">
          <div className="eyebrow">
            <span className="avatar-stack" aria-hidden="true">
              <span className="avatar-dot"></span>
              <span className="avatar-dot"></span>
              <span className="avatar-dot"></span>
            </span>
            50k+ students trust us
          </div>

          <div>
            <p className="section-kicker">Cambridge study engine</p>
            <h1 className="section-heading">Ace your exams with less paper-chasing.</h1>
            <p className="section-copy">
              Generate topical past paper packs, examiner insights, and focused AI tutor sessions from one sharp workspace.
            </p>
          </div>

          {!loading && (
            <div className="hero-actions">
              <Link href={user ? '/dashboard' : '/login'} className="btn-primary">
                {user ? 'Open Dashboard' : 'Get Started'} <ChevronRight size={18} />
              </Link>
              <Link href="/subscription" className="btn-ghost">
                See Pricing
              </Link>
            </div>
          )}
        </div>

        <div className="hero-panel fade-in">
          <p>
            Live pack builder: subject code, topic, paper number, years, notes, and downloads stay in one workflow.
          </p>
          <div className="progress-track" style={{ marginTop: 14 }}>
            <div className="progress-fill" style={{ width: '76%' }}></div>
          </div>
        </div>

        <div className="hero-title" aria-hidden="true">
          <span>ACE</span>
          <span>EXAMS</span>
        </div>
        <img src="/vertical_book_transparent.png" alt="Past paper study book" className="hero-image float-anim" />
      </section>

      <section className="site-section split-section">
        <div>
          <p className="section-kicker">From topic to booklet</p>
          <h2 className="section-heading">A calmer way to work through past papers.</h2>
          <p className="section-copy">
            The interface is built for the real study loop: choose a syllabus, narrow the topic, scan the years, download the pack, then ask the tutor what still feels messy.
          </p>
        </div>

        <div className="panel tool-surface">
          {workflow.map(([subject, topic, status], index) => (
            <div className="tool-row" key={subject}>
              <div>
                <strong>{subject}</strong>
                <div className="tool-meta">{topic}</div>
              </div>
              <span className="section-kicker" style={{ margin: 0 }}>
                {status}
              </span>
              {index === 0 && (
                <div className="progress-track" style={{ gridColumn: '1 / -1' }}>
                  <div className="progress-fill" style={{ width: '86%' }}></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="site-section" style={{ paddingTop: 84 }}>
        <p className="section-kicker">What is inside</p>
        <h2 className="section-heading">Built around the jobs students actually repeat.</h2>
        <div className="feature-grid">
          {features.map(({ icon: Icon, title, text }) => (
            <article className="panel feature-card" key={title}>
              <Icon size={26} />
              <h3 style={{ marginTop: 20, marginBottom: 12, fontSize: '1.18rem' }}>{title}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section split-section">
        <div className="panel">
          <Layers size={28} color="var(--accent-soft)" />
          <h2 style={{ marginTop: 18, fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Your library keeps the useful work.</h2>
          <p className="section-copy" style={{ marginTop: 14 }}>
            Generated packs can be saved and opened again, so every extraction becomes part of a reusable revision shelf.
          </p>
        </div>

        <div className="panel">
          <p className="section-kicker">Premium pass</p>
          <h2 style={{ fontSize: 'clamp(2.4rem, 7vw, 5.2rem)', lineHeight: 0.9 }}>$5</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>USD for 30 days of full access.</p>
          <ul className="feature-list">
            <li className="feature-item"><CheckCircle size={18} color="var(--success)" /> Unlimited topical extractions</li>
            <li className="feature-item"><CheckCircle size={18} color="var(--success)" /> Examiner intelligence reports</li>
            <li className="feature-item"><CheckCircle size={18} color="var(--success)" /> AI tutor workspace</li>
          </ul>
          <Link href={user ? '/dashboard' : '/subscription'} className="btn-primary">
            {user ? 'Go to Dashboard' : 'Upgrade Now'} <ChevronRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  )
}
