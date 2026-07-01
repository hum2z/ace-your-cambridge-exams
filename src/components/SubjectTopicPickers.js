'use client'

import { useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { SUBJECT_LIST } from '@/lib/paperService'
import { getTopicsForSubject } from '@/lib/syllabusTopics'

// Shared combobox: a free-text input with a filtered suggestion dropdown.
// Typing anything is always allowed — the list just makes the common path fast.
function Combobox({ value, onChange, onSelect, onCommit, placeholder, options, renderOption, emptyHint, inputId }) {
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const blurTimer = useRef(null)

  const pick = (option) => {
    onSelect(option)
    setOpen(false)
    setHighlight(-1)
  }

  const handleKeyDown = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight(h => Math.min(h + 1, options.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight(h => Math.max(h - 1, 0))
    } else if (e.key === 'Enter' && open && highlight >= 0 && options[highlight]) {
      e.preventDefault()
      pick(options[highlight])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        id={inputId}
        className="search-input"
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        onChange={(e) => { onChange(e.target.value); setOpen(true); setHighlight(-1) }}
        onFocus={() => { if (blurTimer.current) clearTimeout(blurTimer.current); setOpen(true) }}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 150)
          if (onCommit) onCommit(value)
        }}
        onKeyDown={handleKeyDown}
        style={{ width: '100%', paddingRight: '34px' }}
      />
      <ChevronDown
        size={16}
        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
      />
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 50,
            maxHeight: '260px',
            overflowY: 'auto',
            background: 'var(--bg-panel, #10151d)',
            border: '1px solid rgba(239, 90, 43, 0.25)',
            borderRadius: '2px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
          }}
        >
          {options.length === 0 ? (
            <div style={{ padding: '12px 14px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {emptyHint}
            </div>
          ) : options.map((option, i) => (
            // onMouseDown so the pick lands before the input's blur closes the list
            <div
              key={option.key}
              onMouseDown={(e) => { e.preventDefault(); pick(option) }}
              onMouseEnter={() => setHighlight(i)}
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                background: i === highlight ? 'rgba(239, 90, 43, 0.12)' : 'transparent',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              {renderOption(option)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Searchable subject picker over every known Cambridge + Edexcel IAL code.
// value is the raw subject code string; onPick fires when a listed subject is chosen.
export function SubjectPicker({ value, onChange, onPick, onCommit }) {
  const options = useMemo(() => {
    const q = value.trim().toLowerCase()
    const list = q
      ? SUBJECT_LIST.filter(s =>
          s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
      : SUBJECT_LIST
    return list.slice(0, 40).map(s => ({ key: s.code, ...s }))
  }, [value])

  return (
    <Combobox
      inputId="subject-picker-input"
      value={value}
      onChange={onChange}
      onSelect={(option) => onPick(option.code)}
      onCommit={onCommit}
      placeholder="Search subject or code (e.g. 9702, Physics)"
      options={options}
      emptyHint="No match — you can still use any valid subject code."
      renderOption={(s) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{s.name}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{s.level}</span>
        </div>
      )}
    />
  )
}

// Topic picker fed by the official syllabus list for the chosen subject.
export function TopicPicker({ subjectCode, value, onChange }) {
  const topics = useMemo(() => getTopicsForSubject(subjectCode), [subjectCode])

  const options = useMemo(() => {
    const q = value.trim().toLowerCase()
    const list = q ? topics.filter(t => t.toLowerCase().includes(q)) : topics
    return list.map(t => ({ key: t, topic: t }))
  }, [topics, value])

  return (
    <Combobox
      inputId="topic-picker-input"
      value={value}
      onChange={onChange}
      onSelect={(option) => onChange(option.topic)}
      placeholder={topics.length ? 'Pick a syllabus topic or type your own' : 'Enter a topic (e.g. Kinematics)'}
      options={options}
      emptyHint={
        subjectCode.trim()
          ? 'No syllabus match — custom topics work too.'
          : 'Choose a subject first to see its syllabus topics.'
      }
      renderOption={(o) => (
        <span style={{ color: 'var(--text-primary)' }}>{o.topic}</span>
      )}
    />
  )
}
