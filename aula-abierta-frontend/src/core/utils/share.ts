/**
 * Web Share / clipboard utilities for Aula Abierta.
 * Used by the certificate page and any other feature that needs share-to-family flows.
 */

/**
 * Returns a wa.me deep-link URL that pre-fills the given text in WhatsApp.
 * Works on both mobile (opens app) and desktop (opens WhatsApp Web).
 */
export function whatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

/**
 * Shares `text` via the Web Share API if available in the current browser,
 * otherwise copies it to the clipboard.
 *
 * Resolves on success; rejects if the user cancels the native share sheet or
 * if clipboard write fails.
 */
export async function shareOrCopy(text: string): Promise<void> {
  if (typeof navigator === 'undefined') return

  if (typeof navigator.share === 'function') {
    // Web Share API is available (most mobile browsers, Safari 15.4+, Chrome 89+)
    await navigator.share({ text })
  } else if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    await navigator.clipboard.writeText(text)
  } else {
    // Fallback for very old browsers: select a temporary textarea
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    document.execCommand('copy')
    ta.remove()
  }
}
