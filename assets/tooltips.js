import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// hints for specific elements, matched by id (edit the wording freely)
const byId = {
  name: 'Your name',
  email: 'Your email address so I can reply',
  subject: 'What your message is about (optional)',
  message: 'Write your message here',
  submitBtn: 'Send your message',
  'drop-btn': 'Start the game',
}

// turn "/curriculum-vitae" into "Curriculum Vitae"
function prettyRoute(href) {
  return href
    .slice(1)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

// work out what the tooltip should say, in order of priority
function tipFor(el) {
  if (el.dataset.tip) return el.dataset.tip // 1. data-tip="..."
  if (el.id && byId[el.id]) return byId[el.id] // 2. the id map above

  const title = el.getAttribute('title') // 3. title (e.g. "GitHub")
  if (title) return title

  if (!el.matches('input, textarea, select')) {
    const aria = el.getAttribute('aria-label') // 4. aria-label (icon buttons)
    if (aria) return aria
  }

  const href = el.getAttribute('href') || ''
  if (el.matches('a') && href.startsWith('/') && !href.startsWith('//') && href.length > 1) {
    return 'Go to ' + prettyRoute(href) // 5. page links
  }
  if (el.matches('a[download]')) return 'Download this file' // 6. downloads
  return ''
}

export default function Tooltips() {
  const { pathname } = useLocation()

  useEffect(() => {
    const Tooltip = window.bootstrap?.Tooltip
    if (!Tooltip) return // Bootstrap script not loaded

    const cleanups = []

    const targets = document.querySelectorAll(
      'a, button, input:not([type="hidden"]):not(#botcheck), textarea, select, #pageName'
    )

    targets.forEach(el => {
      if (Tooltip.getInstance(el)) return // never attach twice
      const text = tipFor(el)
      if (!text) return

      const isField = el.matches('input, textarea, select')

      // keep an accessible name on icon-only elements, then drop the native title
      // so the browser doesn't show a second tooltip on top of Bootstrap's
      if (el.hasAttribute('title')) {
        if (!el.hasAttribute('aria-label') && !el.textContent.trim() && !isField) {
          el.setAttribute('aria-label', el.getAttribute('title'))
        }
        el.removeAttribute('title')
      }

      const tip = new Tooltip(el, {
        title: text,
        placement: isField ? 'top' : 'bottom',
        trigger: isField ? 'hover' : 'hover focus', // fields: hover only
        container: 'body',
      })

      const hide = () => tip.hide()
      el.addEventListener('click', hide)
      if (isField) el.addEventListener('input', hide)

      cleanups.push(() => {
        el.removeEventListener('click', hide)
        el.removeEventListener('input', hide)
        tip.dispose()
      })
    })

    return () => cleanups.forEach(fn => fn())
  }, [pathname]) // re-run whenever the page changes

  return null
}