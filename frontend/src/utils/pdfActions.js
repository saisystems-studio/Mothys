// Three separate PDF actions. None of them ever calls another as a fallback:
// if one cannot work, it throws a clear error instead of doing something else.

// Can this browser share PDF files? (Chrome/Edge on Windows, Android, Safari.)
export function canSharePdf() {
  try {
    const probe = new File([new Blob(['x'], { type: 'application/pdf' })], 'probe.pdf', {
      type: 'application/pdf',
    })
    return typeof navigator.canShare === 'function' && navigator.canShare({ files: [probe] })
  } catch {
    return false
  }
}

// DOWNLOAD: saves the file, nothing else.
export function downloadPdfBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

// PRINT: opens the browser print dialog directly. Does not save a file.
export function printPdfBlob(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const frame = document.createElement('iframe')
    frame.setAttribute('aria-hidden', 'true')
    frame.style.cssText =
      'position:fixed;left:-10000px;top:0;width:794px;height:1123px;border:0;visibility:hidden'

    let handled = false
    const cleanup = () =>
      setTimeout(() => {
        frame.remove()
        URL.revokeObjectURL(url)
      }, 5 * 60 * 1000)

    frame.onload = () => {
      if (handled) return
      handled = true
      // Give Chrome's PDF viewer a moment to finish loading before printing.
      setTimeout(() => {
        try {
          frame.contentWindow.focus()
          frame.contentWindow.print()
          resolve()
        } catch {
          reject(new Error('Could not open the print dialog in this browser.'))
        } finally {
          cleanup()
        }
      }, 700)
    }

    frame.onerror = () => {
      cleanup()
      reject(new Error('Could not load the PDF for printing.'))
    }

    frame.src = url
    document.body.appendChild(frame)
  })
}

// SHARE: opens the device share menu. Does not save a file.
// Returns false if the person closed the menu without sharing.
export async function sharePdfBlob(blob, fileName, title) {
  const file = new File([blob], fileName, { type: 'application/pdf' })

  if (typeof navigator.canShare !== 'function' || !navigator.canShare({ files: [file] })) {
    throw new Error('Sharing files is not supported in this browser or device.')
  }

  try {
    await navigator.share({ files: [file], title })
    return true
  } catch (err) {
    if (err?.name === 'AbortError') return false
    throw err
  }
}

// EXPORT CSV: rows is an array of arrays (first row = headings). Opens fine in Excel.
export function downloadCsv(fileName, rows) {
  const cell = (value) => {
    const text = String(value ?? '')
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }

  const csv = '\uFEFF' + rows.map((row) => row.map(cell).join(',')).join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

// yyyy-mm-dd in local time, for file names.
export function todayStamp() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
