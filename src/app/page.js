'use client'

import Link from 'next/link'
import { ArrowRight, BookOpenCheck, Bot, CheckCircle, ClipboardList, Download, Files, Search, Sparkles } from 'lucide-react'
import { useAuth } from '@/components/AuthContext'

const features = [
  {
    icon: Search,
    title: 'Precise topical search',
    text: 'Filter by syllabus, topic, year, paper, and variant without digging through archive folders.',
  },
  {
    icon: ClipboardList,
    title: 'Examiner intelligence',
    text: 'Review repeated question styles, scoring words, and mistakes before you start the set.',
  },
  {
    icon: Bot,
    title: 'Tutor on standby',
    text: 'Ask follow-up questions while you build packs and keep sessions organized by topic.',
  },
  {
    icon: Download,
    title: 'Clean exports',
    text: 'Download question papers and mark schemes as separate, practical revision PDFs.',
  },
]

const tasks = [
  ['9702', 'Circular motion', '74%'],
  ['9701', 'Equilibria', '58%'],
  ['9709', 'Integration', '92%'],
]

export default function HomePage() {
  const { user, loading } = useAuth()

  return (
    <div className="site-page">
      <section className="workspace-hero" aria-label="PastPaper workspace">
        <div className="hero-copy fade-in">
          <div className="eyebrow">
            <span className="status-dot" aria-hidden="true"></span>
            52.2053° N / 0.1218° E &nbsp;·&nbsp; Cambridge archive
          </div>

          <div>
            <p className="section-kicker">A revision workspace</p>
            <h1 className="section-heading">
              Past papers, made <em>useful</em>.
            </h1>
            <p className="section-copy">
              Quiet tools for ambitious students — build topical packs, read examiner notes, and study beside an AI tutor that stays out of the way.
            </p>
          </div>

          {!loading && (
            <div className="hero-actions">
              <Link href={user ? '/dashboard' : '/login'} className="btn-primary">
                {user ? 'Open Workspace' : 'Start Workspace'} <ArrowRight size={18} />
              </Link>
              <Link href="/subscription" className="btn-ghost">
                View Pass
              </Link>
            </div>
          )}
        </div>

        <div className="console-visual fade-in" aria-label="Study workspace preview">
          <div className="console-topbar">
            <div className="console-search">
              Search subject, topic, paper, or mark scheme
            </div>
            <Sparkles size={20} />
          </div>

          <div className="console-body">
            <aside className="console-rail" aria-label="Workspace sections">
              <div className="rail-item active">Extract</div>
              <div className="rail-item">Notes</div>
              <div className="rail-item">Tutor</div>
              <div className="rail-item">Library</div>
            </aside>

            <div className="console-main">
              <div className="metric-grid">
                <div className="metric-tile">
                  <strong>38</strong>
                  <span>pages matched</span>
                </div>
                <div className="metric-tile">
                  <strong>12</strong>
                  <span>papers scanned</span>
                </div>
                <div className="metric-tile">
                  <strong>2</strong>
                  <span>PDFs ready</span>
                </div>
              </div>

              <div className="console-card">
                <span>Active extraction queue</span>
                <div className="timeline">
                  {tasks.map(([code, topic, width]) => (
                    <div className="timeline-row" key={topic}>
                      <strong>{code}</strong>
                      <div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 850 }}>{topic}</div>
                        <div className="timeline-line" style={{ marginTop: 8 }}>
                          <div className="timeline-fill" style={{ width }}></div>
                        </div>
                      </div>
                      <span>{width}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="site-section split-section">
        <div>
          <p className="section-kicker">The workflow</p>
          <h2 className="section-heading">
            From topic to <em>printable</em> in one quiet loop.
          </h2>
          <p className="section-copy">
            The interface is arranged around the real exam-prep loop: search, extract, read examiner guidance, ask the tutor, then export the set.
          </p>
        </div>

        <div className="panel tool-surface">
          {[
            ['Choose syllabus', 'Enter a subject code and topic in the dashboard.'],
            ['Scan official papers', 'The system checks selected years, papers, and variants.'],
            ['Export and review', 'Download the pack and keep the session in your library.'],
          ].map(([title, text], index) => (
            <div className="tool-row" key={title}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <CheckCircle size={20} color="var(--success)" style={{ marginTop: 2 }} />
                <div>
                  <strong>{index + 1}. {title}</strong>
                  <div className="tool-meta">{text}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="site-section" style={{ paddingTop: 96 }}>
        <p className="section-kicker">The tools</p>
        <h2 className="section-heading">
          Organized like a <em>working desk</em>.
        </h2>
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
          <Files size={28} color="var(--accent-primary)" />
          <h2 style={{ marginTop: 18, fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Save each useful set as a reusable pack.</h2>
          <p className="section-copy" style={{ marginTop: 14 }}>
            Your library keeps completed topic packs available so a good extraction does not disappear after one session.
          </p>
        </div>

        <div className="panel">
          <BookOpenCheck size={28} color="var(--accent-secondary)" />
          <p className="section-kicker" style={{ marginTop: 18 }}>Premium pass</p>
          <h2 style={{ fontSize: 'clamp(2.4rem, 7vw, 5.2rem)', lineHeight: 0.9 }}>$5</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>USD for 30 days of full access.</p>
          <ul className="feature-list">
            <li className="feature-item"><CheckCircle size={18} color="var(--success)" /> Unlimited topical extractions</li>
            <li className="feature-item"><CheckCircle size={18} color="var(--success)" /> Examiner intelligence reports</li>
            <li className="feature-item"><CheckCircle size={18} color="var(--success)" /> AI tutor workspace</li>
          </ul>
          <Link href={user ? '/dashboard' : '/subscription'} className="btn-primary">
            {user ? 'Go to Workspace' : 'Unlock Pass'} <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  )
}
