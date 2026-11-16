const pad = (n) => String(n).padStart(2, '0')

/** Quantities may arrive as numbers or decimal strings. Shows up to 3 decimals, trimmed. */
export function formatQty(value) {
  const n = Number(value)
  if (Number.isNaN(n)) return '0'
  return n.toLocaleString('en-IN', { maximumFractionDigits: 3 })
}

export const formatQtyWithUnit = (value, unitName) =>
  unitName ? `${formatQty(value)} ${unitName}` : formatQty(value)

/** dd-mm-yyyy */
export function formatDate(input) {
  const d = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(d.getTime())) return ''
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`
}

/** hh:mm AM/PM */
export function formatTime(input) {
  const d = input instanceof Date ? input : new Date(input)
  let h = d.getHours()
  const suffix = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${pad(h)}:${pad(d.getMinutes())} ${suffix}`
}

/** yyyy-mm-dd, as expected by the reports API and <input type="date"> */
export const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** The backend voucher_number is the voucher ID (e.g. "13"); the UI displays it as VCH-13. */
export const formatVoucher = (voucherNumber) => `VCH-${voucherNumber}`
