'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const SELECTOR = '.panel, .premium-card, .glow-card, .stat-card, .feature-card, .console-visual'

export default function ScrollReveal() {
  const pathname = usePathname()

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )

    const elements = document.querySelectorAll(SELECTOR)
    elements.forEach((el, index) => {
      if (el.classList.contains('is-visible')) return
      el.classList.add('reveal-init')
      el.style.transitionDelay = `${Math.min((index % 4) * 70, 280)}ms`
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [pathname])

  return null
}
