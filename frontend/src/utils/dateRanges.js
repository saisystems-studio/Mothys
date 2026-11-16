import { toISODate } from './format'

export const QUICK_RANGES = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'lastWeek', label: 'Last Week' },
  { key: 'thisWeek', label: 'This Week' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'custom', label: 'Custom' },
]

const addDays = (d, n) => {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

/** Monday of the week containing d. */
const startOfWeek = (d) => addDays(d, -((d.getDay() + 6) % 7))

/** Returns { from, to } as yyyy-mm-dd strings for a quick range key. */
export function getRange(key, today = new Date()) {
  switch (key) {
    case 'today':
      return { from: toISODate(today), to: toISODate(today) }
    case 'yesterday': {
      const y = addDays(today, -1)
      return { from: toISODate(y), to: toISODate(y) }
    }
    case 'thisWeek':
      return { from: toISODate(startOfWeek(today)), to: toISODate(today) }
    case 'lastWeek': {
      const start = addDays(startOfWeek(today), -7)
      return { from: toISODate(start), to: toISODate(addDays(start, 6)) }
    }
    case 'thisMonth':
    default:
      return {
        from: toISODate(new Date(today.getFullYear(), today.getMonth(), 1)),
        to: toISODate(today),
      }
  }
}

export const rangeLabel = (key) => QUICK_RANGES.find((r) => r.key === key)?.label ?? 'Custom'
