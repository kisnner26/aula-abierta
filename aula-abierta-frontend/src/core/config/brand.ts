/**
 * Brand color constants for JS contexts (SVG stops, style objects, canvas,
 * theme defaults) where Tailwind classes can't reach.
 * Keep in sync with `tailwind.config.ts` — that file is the source of truth.
 */
export const BRAND = {
  blue:      '#1D95FB',
  blueLight: '#38A6FF',
  red:       '#D31A2A',
  yellow:    '#FED401',
  sky:       '#A1D5F8',
  turquoise: '#54C7F0',
  cream:     '#FFF5DD',
  neutral200: '#E8E6E1',
} as const
