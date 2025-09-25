'use client'

import { useEffect } from 'react'

const SELECTORS = [
  '[data-nextjs-dev-tools-button]',
  '[data-next-badge]',
  '[data-next-badge-root]',
  '[data-next-mark]',
  '[data-nextjs-toast]',
  '[data-nextjs-toast-wrapper]',
]

function removeFromRoot(root: Document | ShadowRoot) {
  let removed = 0
  for (const selector of SELECTORS) {
    root
      .querySelectorAll<HTMLElement>(selector)
      .forEach((element) => {
        element.remove()
        removed += 1
      })
  }
  return removed
}

function removeDevToolsElements() {
  let removed = 0
  removed += removeFromRoot(document)

  document.querySelectorAll('nextjs-portal').forEach((portal) => {
    if (portal.shadowRoot) {
      removed += removeFromRoot(portal.shadowRoot)
    }
  })

  if (removed > 0) {
    console.debug(`DisableNextDevTools: removed ${removed} element${removed === 1 ? '' : 's'}`)
  }

  return removed
}

export default function DisableNextDevTools() {
  useEffect(() => {
    console.debug('DisableNextDevTools: removing Next.js dev tools elements')
    removeDevToolsElements()

    const intervalId = window.setInterval(() => {
      const removed = removeDevToolsElements()
      if (removed > 0) {
        window.clearInterval(intervalId)
      }
    }, 500)
    const timeoutId = window.setTimeout(() => {
      window.clearInterval(intervalId)
    }, 30000)

    const observer = new MutationObserver(() => {
      removeDevToolsElements()
    })

    const registerObserver = () => {
      const body = document.body
      if (!body) {
        return false
      }

      observer.observe(body, {
        childList: true,
        subtree: true,
      })

      return true
    }

    let registrationIntervalId: number | undefined
    if (!registerObserver()) {
      registrationIntervalId = window.setInterval(() => {
        if (registerObserver() && registrationIntervalId !== undefined) {
          window.clearInterval(registrationIntervalId)
          registrationIntervalId = undefined
        }
      }, 50)
    }

    return () => {
      observer.disconnect()
      window.clearInterval(intervalId)
      window.clearTimeout(timeoutId)
      if (registrationIntervalId !== undefined) {
        window.clearInterval(registrationIntervalId)
      }
    }
  }, [])

  return null
}
