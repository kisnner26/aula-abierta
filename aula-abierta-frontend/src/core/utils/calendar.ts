/**
 * ICS / iCalendar utilities for Aula Abierta.
 * Generates valid RFC 5545 VCALENDAR data and triggers browser downloads.
 */

export interface ICSEvent {
  title: string
  start: Date
  end?: Date
  description?: string
  location?: string
}

/**
 * Formats a Date to iCal DTSTAMP / DTSTART / DTEND format (UTC, no separators).
 * e.g. 20240621T143000Z
 */
function toICSDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${date.getUTCFullYear()}` +
    `${pad(date.getUTCMonth() + 1)}` +
    `${pad(date.getUTCDate())}` +
    `T` +
    `${pad(date.getUTCHours())}` +
    `${pad(date.getUTCMinutes())}` +
    `${pad(date.getUTCSeconds())}` +
    `Z`
  )
}

/**
 * Escapes special characters in iCal text properties (RFC 5545 §3.3.11).
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

/**
 * Generates a simple UID for each event.
 * Format: <timestamp>-<random>@aulaabierta
 */
function generateUID(index: number): string {
  return `${Date.now()}-${index}-${Math.random().toString(36).slice(2)}@aulaabierta`
}

/**
 * Returns a valid .ics string (VCALENDAR + VEVENT blocks) for the given events.
 * Uses CRLF line endings as required by RFC 5545.
 */
export function buildICS(events: ICSEvent[]): string {
  const CRLF = '\r\n'
  const dtstamp = toICSDate(new Date())

  const veventBlocks = events.map((event, index) => {
    const dtstart = toICSDate(event.start)
    // Default end: 1 hour after start if not provided
    const dtend = toICSDate(event.end ?? new Date(event.start.getTime() + 60 * 60 * 1000))
    const uid = generateUID(index)

    const lines: string[] = [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${escapeICSText(event.title)}`,
    ]

    if (event.description) {
      lines.push(`DESCRIPTION:${escapeICSText(event.description)}`)
    }
    if (event.location) {
      lines.push(`LOCATION:${escapeICSText(event.location)}`)
    }

    lines.push('END:VEVENT')
    return lines.join(CRLF)
  })

  const parts: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Aula Abierta//LK App//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...veventBlocks,
    'END:VCALENDAR',
  ]

  return parts.join(CRLF) + CRLF
}

/**
 * Triggers a browser download of a .ics file built from `events`.
 */
export function downloadICS(filename: string, events: ICSEvent[]): void {
  const icsContent = buildICS(events)
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename.endsWith('.ics') ? filename : `${filename}.ics`
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()

  // Cleanup after the browser has had time to initiate the download
  setTimeout(() => {
    anchor.remove()
    URL.revokeObjectURL(url)
  }, 100)
}
