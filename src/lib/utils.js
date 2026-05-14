export function fmt(h) {
  const n = Number(h)
  if (isNaN(n)) return '0h'
  return n % 1 === 0 ? n + 'h' : n.toFixed(1) + 'h'
}

export function fmtKr(n) {
  return Math.round(n).toLocaleString('sv-SE') + ' kr'
}

export const SERVICES = [
  'Gräsklippning', 'Sophållning', 'Grävning',
  'Lövblåsning', 'Dumper', 'Gatusopmning', 'Annat'
]

export const MONTHS = [
  'Januari','Februari','Mars','April','Maj','Juni',
  'Juli','Augusti','September','Oktober','November','December'
]
