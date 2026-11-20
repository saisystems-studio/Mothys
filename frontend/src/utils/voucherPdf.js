// import { formatDate, formatQtyWithUnit, formatTime, formatVoucher } from './format'
// import { getCompanyProfile, getCachedCompanyProfile } from '../services/companyService'

// const PAPER_KEY = 'mothys_paper_size'

// // White and grey only.
// const COLORS = {
//   background: [255, 255, 255],
//   watermark: [240, 240, 240],
//   primary: [60, 60, 60],
//   dark: [40, 40, 40],
//   text: [70, 70, 70],
//   border: [190, 190, 190],
//   header: [230, 230, 230],
//   alternate: [246, 246, 246],
//   white: [255, 255, 255],
// }

// export const PAPER_SIZES = {
//   a4: { label: 'A4', w: 210, h: 297 },
//   a5: { label: 'A5', w: 148, h: 210 },
// }

// export function getPaperSize() {
//   try {
//     const value = localStorage.getItem(PAPER_KEY)
//     if (value && PAPER_SIZES[value]) return value
//   } catch {
//     // Storage unavailable
//   }

//   return 'a4'
// }

// export function setPaperSize(value) {
//   if (!PAPER_SIZES[value]) return

//   try {
//     localStorage.setItem(PAPER_KEY, value)
//   } catch {
//     // Storage unavailable
//   }
// }

// // Keep totals separate for different units (kept for other pages that may use it).
// export function totalsByUnit(items = []) {
//   const map = new Map()

//   items.forEach((item) => {
//     const unit = item.unit || ''
//     const quantity = Number(item.quantity || 0)

//     map.set(unit, (map.get(unit) || 0) + quantity)
//   })

//   return [...map.entries()].map(([unit, total]) =>
//     formatQtyWithUnit(
//       Math.round(total * 1000) / 1000,
//       unit,
//     ),
//   )
// }

// // One clean total line for the voucher.
// //  - every item in the same unit  -> a real sum, e.g. "TOTAL  12 Kg"
// //  - mixed units (m, nos, rs ...) -> they cannot be added, so show "TOTAL ITEMS  3"
// export function getVoucherTotal(items = []) {
//   const units = new Set(items.map((item) => item.unit || ''))

//   if (units.size === 1) {
//     const [only] = totalsByUnit(items)
//     return { label: 'TOTAL', value: only }
//   }

//   return { label: 'TOTAL ITEMS', value: String(items.length) }
// }

// // --------------------------------------------------
// // IMAGES (logo / signature come from Settings > Company Details)
// // --------------------------------------------------

// const imageCache = new Map()

// // Takes a data URL, returns { dataUrl, w, h, format } or null when there is no image.
// async function prepareImage(dataUrl) {
//   if (!dataUrl) return null
//   if (imageCache.has(dataUrl)) return imageCache.get(dataUrl)

//   let result = null

//   try {
//     const dimensions = await new Promise((resolve, reject) => {
//       const image = new Image()
//       image.onload = () => resolve({ w: image.naturalWidth, h: image.naturalHeight })
//       image.onerror = reject
//       image.src = dataUrl
//     })

//     const format = dataUrl.startsWith('data:image/jpeg')
//       ? 'JPEG'
//       : dataUrl.startsWith('data:image/webp')
//         ? 'WEBP'
//         : 'PNG'

//     result = { dataUrl, w: dimensions.w, h: dimensions.h, format }
//   } catch {
//     // Unreadable image: the PDF is generated without it.
//     result = null
//   }

//   imageCache.set(dataUrl, result)
//   return result
// }

// // --------------------------------------------------
// // PAGE BACKGROUND AND WATERMARK
// // --------------------------------------------------

// function drawPageBackground(doc, W, H) {
//   doc.setFillColor(...COLORS.background)
//   doc.rect(0, 0, W, H, 'F')
// }

// function drawWatermark(doc, W, H, text) {
//   if (!text) return

//   doc.saveGraphicsState()

//   doc.setTextColor(...COLORS.watermark)
//   doc.setFont('helvetica', 'bold')
//   doc.setFontSize(W * 0.105 * Math.min(1, 8 / text.length))

//   const stepX = doc.getTextWidth(text) * 1.3 + 10

//   for (let y = -H * 0.15; y < H * 1.15; y += 48) {
//     for (let x = -W * 0.25; x < W * 1.1; x += stepX) {
//       doc.text(text, x, y, {
//         angle: 35,
//       })
//     }
//   }

//   doc.restoreGraphicsState()
// }

// function drawPageBase(doc, layout) {
//   drawPageBackground(doc, layout.W, layout.H)
//   drawWatermark(doc, layout.W, layout.H, layout.profile.name.toUpperCase())
// }

// // --------------------------------------------------
// // HEADING: company logo (optional), name, address, email, phone
// // --------------------------------------------------

// function drawVoucherHeading(doc, layout, leftText, rightText) {
//   const { W, margin, s, fscale, contentW, logo, profile } = layout

//   // Keep the centred text clear of the logo on the left.
//   const textW = contentW - 52 * s

//   let y = margin + 12 * s

//   // Company logo: TOP-LEFT, only when one was uploaded.
//   if (logo) {
//     const box = 20 * s
//     const scale = Math.min(box / logo.w, box / logo.h)

//     try {
//       doc.addImage(
//         logo.dataUrl,
//         logo.format,
//         margin,
//         y - 9 * s,
//         logo.w * scale,
//         logo.h * scale,
//       )
//     } catch {
//       // Skip unsupported logo format.
//     }
//   }

//   // Company name.
//   doc.setFont('helvetica', 'bold')
//   doc.setFontSize(22 * fscale)
//   doc.setTextColor(...COLORS.primary)

//   const nameLines = doc.splitTextToSize(profile.name.toUpperCase() || 'COMPANY', textW)

//   nameLines.forEach((line, i) => {
//     doc.text(line, W / 2, y + i * 9 * s, { align: 'center' })
//   })

//   y += (nameLines.length - 1) * 9 * s + 6 * s

//   // Address, email and contact number (each only if provided).
//   doc.setFont('helvetica', 'normal')
//   doc.setFontSize(8.5 * fscale)
//   doc.setTextColor(...COLORS.dark)

//   const details = []

//   if (profile.address) {
//     details.push(...doc.splitTextToSize(profile.address.replace(/\s*\n\s*/g, ', '), textW))
//   }

//   const contact = [
//     profile.email && `Email: ${profile.email}`,
//     profile.phone && `Phone: ${profile.phone}`,
//   ]
//     .filter(Boolean)
//     .join('   |   ')

//   if (contact) details.push(...doc.splitTextToSize(contact, textW))

//   details.forEach((line) => {
//     doc.text(line, W / 2, y, { align: 'center' })
//     y += 4.2 * s
//   })

//   y = Math.max(y + 1 * s, margin + 24 * s)

//   // Heading divider.
//   doc.setDrawColor(...COLORS.primary)
//   doc.setLineWidth(0.65)
//   doc.line(margin, y, W - margin, y)

//   y += 9 * s

//   // Voucher information box.
//   const infoH = 13 * s

//   doc.setFillColor(...COLORS.white)
//   doc.setDrawColor(...COLORS.border)
//   doc.setLineWidth(0.3)

//   doc.roundedRect(margin, y, contentW, infoH, 1.5 * s, 1.5 * s, 'FD')

//   doc.setFont('helvetica', 'bold')
//   doc.setFontSize(10.5 * fscale)
//   doc.setTextColor(...COLORS.dark)

//   doc.text(leftText, margin + 4 * s, y + 8 * s)
//   doc.text(rightText, W - margin - 4 * s, y + 8 * s, { align: 'right' })

//   return y + infoH + 7 * s
// }

// // --------------------------------------------------
// // TABLE HEADER
// // --------------------------------------------------

// function drawTableHeader(doc, layout, top) {
//   const {
//     margin,
//     contentW,
//     colW,
//     colX,
//     lineH,
//     vpad,
//     pad,
//     bodyPt,
//   } = layout

//   const height = lineH + vpad * 2

//   doc.setFillColor(...COLORS.header)
//   doc.setDrawColor(...COLORS.border)
//   doc.setLineWidth(0.3)

//   doc.rect(margin, top, contentW, height, 'FD')

//   doc.setFont('helvetica', 'bold')
//   doc.setFontSize(bodyPt)
//   doc.setTextColor(...COLORS.primary)

//   const baseline = top + vpad + lineH * 0.72

//   doc.text('S.No', colX[0] + pad, baseline)
//   doc.text('Particulars', colX[1] + pad, baseline)
//   doc.text('Quantity', colX[2] + colW[2] - pad, baseline, { align: 'right' })

//   doc.setDrawColor(...COLORS.border)

//   doc.line(colX[1], top, colX[1], top + height)
//   doc.line(colX[2], top, colX[2], top + height)

//   return top + height
// }

// // --------------------------------------------------
// // TABLE ROW
// // --------------------------------------------------

// function drawTableRow(doc, layout, item, index, top) {
//   const {
//     margin,
//     contentW,
//     colW,
//     colX,
//     lineH,
//     vpad,
//     pad,
//     bodyPt,
//   } = layout

//   const nameLines = doc.splitTextToSize(
//     String(item.name ?? ''),
//     colW[1] - pad * 2,
//   )

//   const rowH = Math.max(
//     lineH + vpad * 2,
//     nameLines.length * lineH + vpad * 2,
//   )

//   doc.setFillColor(...(index % 2 === 0 ? COLORS.white : COLORS.alternate))

//   doc.setDrawColor(...COLORS.border)
//   doc.setLineWidth(0.22)

//   doc.rect(margin, top, contentW, rowH, 'FD')

//   doc.line(colX[1], top, colX[1], top + rowH)
//   doc.line(colX[2], top, colX[2], top + rowH)

//   doc.setFont('helvetica', 'normal')
//   doc.setFontSize(bodyPt)
//   doc.setTextColor(...COLORS.text)

//   const baseline = top + vpad + lineH * 0.72

//   doc.text(String(index + 1), colX[0] + pad, baseline)
//   doc.text(nameLines, colX[1] + pad, baseline)

//   doc.text(
//     formatQtyWithUnit(Number(item.quantity), item.unit || ''),
//     colX[2] + colW[2] - pad,
//     baseline,
//     { align: 'right' },
//   )

//   return top + rowH
// }

// // --------------------------------------------------
// // TOTAL SECTION (always a single line)
// // --------------------------------------------------

// function getTotalHeight(layout) {
//   return layout.lineH + layout.vpad * 2
// }

// function drawTotal(doc, layout, total, top) {
//   const {
//     margin,
//     contentW,
//     colX,
//     colW,
//     lineH,
//     vpad,
//     pad,
//     bodyPt,
//   } = layout

//   const height = getTotalHeight(layout)

//   doc.setFillColor(...COLORS.header)
//   doc.setDrawColor(...COLORS.primary)
//   doc.setLineWidth(0.4)

//   doc.rect(margin, top, contentW, height, 'FD')

//   doc.line(colX[1], top, colX[1], top + height)
//   doc.line(colX[2], top, colX[2], top + height)

//   doc.setFont('helvetica', 'bold')
//   doc.setFontSize(bodyPt)
//   doc.setTextColor(...COLORS.primary)

//   const baseline = top + vpad + lineH * 0.72

//   doc.text(total.label, colX[1] + pad, baseline)
//   doc.text(total.value, colX[2] + colW[2] - pad, baseline, { align: 'right' })

//   return top + height
// }

// // --------------------------------------------------
// // SIGNATURE SECTION (removed completely when no signature was uploaded)
// // --------------------------------------------------

// function getSignatureHeight(layout) {
//   return layout.signature ? 30 * layout.s : 0
// }

// function drawSignature(doc, layout, top) {
//   const { W, margin, s, fscale, signature } = layout

//   if (!signature) return top

//   const lineWidth = 49 * s
//   const right = W - margin - 3 * s
//   const lineStart = right - lineWidth
//   const lineY = top + 16 * s

//   // Signature image sits just above the line.
//   const maxW = lineWidth - 4 * s
//   const maxH = 14 * s
//   const scale = Math.min(maxW / signature.w, maxH / signature.h)
//   const imgW = signature.w * scale
//   const imgH = signature.h * scale

//   try {
//     doc.addImage(
//       signature.dataUrl,
//       signature.format,
//       lineStart + (lineWidth - imgW) / 2,
//       lineY - imgH - 1 * s,
//       imgW,
//       imgH,
//     )
//   } catch {
//     // Skip unsupported signature format.
//   }

//   doc.setDrawColor(...COLORS.dark)
//   doc.setLineWidth(0.4)
//   doc.line(lineStart, lineY, right, lineY)

//   doc.setFont('helvetica', 'bold')
//   doc.setFontSize(9 * fscale)
//   doc.setTextColor(...COLORS.dark)

//   doc.text('Authorized Signature', right, lineY + 5 * s, { align: 'right' })

//   return top + getSignatureHeight(layout)
// }

// // --------------------------------------------------
// // FOOTER
// // --------------------------------------------------

// function drawFooter(doc, layout, pageNumber, totalPages) {
//   const { W, H, margin, s, fscale, profile } = layout

//   doc.setDrawColor(...COLORS.border)
//   doc.setLineWidth(0.25)

//   doc.line(margin, H - margin - 5 * s, W - margin, H - margin - 5 * s)

//   doc.setFont('helvetica', 'normal')
//   doc.setFontSize(7.5 * fscale)
//   doc.setTextColor(...COLORS.dark)

//   doc.text(profile.name || 'Mothys Inventory Management', margin, H - margin)

//   doc.text(`Page ${pageNumber} of ${totalPages}`, W / 2, H - margin, { align: 'center' })
// }

// // Loads company details + images once per PDF.
// // Loads company details (from the backend) + images once per PDF.
// async function loadBranding() {
//   let profile
//   try {
//     profile = await getCompanyProfile()
//   } catch {
//     // Network problem: reuse the last loaded copy if there is one.
//     profile = getCachedCompanyProfile()
//     if (!profile.name) {
//       throw new Error('Could not load the company details. Check your connection and try again.')
//     }
//   }

//   const [logo, signature] = await Promise.all([
//     prepareImage(profile.logo),
//     prepareImage(profile.signature),
//   ])

//   return { profile, logo, signature }
// }

// // --------------------------------------------------
// // MAIN PDF GENERATOR
// // --------------------------------------------------

// export async function buildVoucherPdf({
//   voucherNumber,
//   date,
//   items,
//   paper,
// }) {
//   if (!items?.length) {
//     throw new Error('There is nothing to print.')
//   }

//   const paperKey = PAPER_SIZES[paper] ? paper : getPaperSize()
//   const size = PAPER_SIZES[paperKey]

//   const { jsPDF } = await import('jspdf')

//   const doc = new jsPDF({
//     unit: 'mm',
//     format: paperKey,
//     orientation: 'portrait',
//     compress: true,
//   })

//   const W = size.w
//   const H = size.h

//   const s = W / 210
//   const fscale = 0.8 + 0.2 * s

//   const margin = 14 * s
//   const contentW = W - margin * 2

//   const bodyPt = 10.5 * fscale
//   const lineH = 5.2 * fscale
//   const vpad = 2.2 * s
//   const pad = 2.6 * s

//   const colW = [
//     contentW * 0.12,
//     contentW * 0.60,
//     contentW * 0.28,
//   ]

//   const colX = [
//     margin,
//     margin + colW[0],
//     margin + colW[0] + colW[1],
//   ]

//   const { profile, logo, signature } = await loadBranding()

//   const layout = {
//     W,
//     H,
//     s,
//     fscale,
//     margin,
//     contentW,
//     bodyPt,
//     lineH,
//     vpad,
//     pad,
//     colW,
//     colX,
//     profile,
//     logo,
//     signature,
//   }

//   const total = getVoucherTotal(items)

//   // Reserve room for footer, total, and (if present) signature.
//   const footerReserve = 13 * s
//   const signatureReserve = getSignatureHeight(layout)
//   const totalReserve = getTotalHeight(layout)
//   const gapReserve = 5 * s

//   const finalRequired = totalReserve + signatureReserve + gapReserve

//   const bottomLimit = H - margin - footerReserve - finalRequired

//   let y = 0

//   function startPage(isFirstPage = false) {
//     drawPageBase(doc, layout)

//     y = isFirstPage
//       ? drawVoucherHeading(
//           doc,
//           layout,
//           // Entries printed before billing have no voucher number yet.
//           `Voucher ID: ${voucherNumber ? formatVoucher(voucherNumber) : 'Null'}`,
//           `Date: ${formatDate(date)}`,
//         )
//       : margin + 8 * s

//     y = drawTableHeader(doc, layout, y)
//   }

//   // First page.
//   startPage(true)

//   // Draw product rows.
//   items.forEach((item, index) => {
//     const nameLines = doc.splitTextToSize(
//       String(item.name ?? ''),
//       colW[1] - pad * 2,
//     )

//     const rowH = Math.max(
//       lineH + vpad * 2,
//       nameLines.length * lineH + vpad * 2,
//     )

//     if (y + rowH > bottomLimit) {
//       doc.addPage()
//       startPage(false)
//     }

//     y = drawTableRow(doc, layout, item, index, y)
//   })

//   // Ensure total and signature remain together.
//   const finalContentLimit = H - margin - footerReserve

//   if (y + finalRequired > finalContentLimit) {
//     doc.addPage()
//     startPage(false)
//   }

//   // Total directly below the table.
//   y = drawTotal(doc, layout, total, y + gapReserve)

//   // Signature directly below the total (only if uploaded).
//   if (signature) {
//     drawSignature(doc, layout, y + 2 * s)
//   }

//   // Footer on every page.
//   const totalPages = doc.getNumberOfPages()

//   for (let page = 1; page <= totalPages; page += 1) {
//     doc.setPage(page)
//     drawFooter(doc, layout, page, totalPages)
//   }

//   const safeVoucherNumber = voucherNumber
//     ? String(formatVoucher(voucherNumber)).replace(/[^a-zA-Z0-9-_]/g, '')
//     : 'Null'

//   return {
//     blob: doc.output('blob'),
//     fileName: `Mothys-Voucher-${safeVoucherNumber}.pdf`,
//   }
// }

// // Saves the voucher PDF to disk (nothing else).
// export async function downloadVoucherPdf(args) {
//   const { blob, fileName } = await buildVoucherPdf(args)
//   const url = URL.createObjectURL(blob)
//   const a = document.createElement('a')
//   a.href = url
//   a.download = fileName
//   document.body.appendChild(a)
//   a.click()
//   a.remove()
//   setTimeout(() => URL.revokeObjectURL(url), 10000)
// }

// // --------------------------------------------------
// // ENTRY LIST / STOCK LIST PDFs (A4, same look as the voucher)
// // --------------------------------------------------

// function drawGridHeader(doc, layout, cols, top) {
//   const { margin, contentW, lineH, vpad, pad, bodyPt } = layout
//   const height = lineH + vpad * 2

//   doc.setFillColor(...COLORS.header)
//   doc.setDrawColor(...COLORS.border)
//   doc.setLineWidth(0.3)
//   doc.rect(margin, top, contentW, height, 'FD')

//   doc.setFont('helvetica', 'bold')
//   doc.setFontSize(bodyPt)
//   doc.setTextColor(...COLORS.primary)

//   const baseline = top + vpad + lineH * 0.72

//   cols.forEach((c, i) => {
//     if (c.align === 'right') {
//       doc.text(c.title, c.x + c.w - pad, baseline, { align: 'right' })
//     } else {
//       doc.text(c.title, c.x + pad, baseline)
//     }
//     if (i > 0) doc.line(c.x, top, c.x, top + height)
//   })

//   return top + height
// }

// function measureGridRow(doc, layout, cols, cells) {
//   const { lineH, vpad, pad, bodyPt } = layout

//   doc.setFont('helvetica', 'normal')
//   doc.setFontSize(bodyPt)

//   const lines = cells.map((text, i) =>
//     cols[i].wrap
//       ? doc.splitTextToSize(String(text), cols[i].w - pad * 2)
//       : [String(text)],
//   )

//   const count = Math.max(...lines.map((l) => l.length))

//   return { lines, height: Math.max(1, count) * lineH + vpad * 2 }
// }

// function drawGridRow(doc, layout, cols, cells, index, top) {
//   const { margin, contentW, lineH, vpad, pad, bodyPt } = layout
//   const { lines, height } = measureGridRow(doc, layout, cols, cells)

//   doc.setFillColor(...(index % 2 === 0 ? COLORS.white : COLORS.alternate))
//   doc.setDrawColor(...COLORS.border)
//   doc.setLineWidth(0.22)
//   doc.rect(margin, top, contentW, height, 'FD')

//   doc.setFont('helvetica', 'normal')
//   doc.setFontSize(bodyPt)
//   doc.setTextColor(...COLORS.text)

//   const baseline = top + vpad + lineH * 0.72

//   cols.forEach((c, i) => {
//     if (i > 0) doc.line(c.x, top, c.x, top + height)

//     if (c.align === 'right') {
//       doc.text(lines[i], c.x + c.w - pad, baseline, { align: 'right' })
//     } else {
//       doc.text(lines[i], c.x + pad, baseline)
//     }
//   })

//   return top + height
// }

// function drawGridTotal(doc, layout, cols, total, top) {
//   const { margin, contentW, lineH, vpad, pad, bodyPt } = layout
//   const height = lineH + vpad * 2

//   doc.setFillColor(...COLORS.header)
//   doc.setDrawColor(...COLORS.primary)
//   doc.setLineWidth(0.4)
//   doc.rect(margin, top, contentW, height, 'FD')

//   cols.forEach((c, i) => {
//     if (i > 0) doc.line(c.x, top, c.x, top + height)
//   })

//   doc.setFont('helvetica', 'bold')
//   doc.setFontSize(bodyPt)
//   doc.setTextColor(...COLORS.primary)

//   const baseline = top + vpad + lineH * 0.72

//   doc.text(total.label, cols[1].x + pad, baseline)
//   doc.text(total.value, cols[2].x + cols[2].w - pad, baseline, { align: 'right' })

//   return top + height
// }

// const localStamp = (d) => {
//   const x = new Date(d)
//   const p = (n) => String(n).padStart(2, '0')
//   return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`
// }

// // Shared A4 table builder used by the entry list and the stock list.
// //  defs   : [{ title, align, wrap }]   widths : fractions that add up to 1
// //  rows   : [[cell, cell, ...], ...]   total  : { label, value }
// async function buildGridPdf({ leftText, rightText, defs, widths, rows, total, fileName }) {
//   if (!rows?.length) {
//     throw new Error('There is nothing to print.')
//   }

//   const size = PAPER_SIZES.a4
//   const { jsPDF } = await import('jspdf')

//   const doc = new jsPDF({
//     unit: 'mm',
//     format: 'a4',
//     orientation: 'portrait',
//     compress: true,
//   })

//   const W = size.w
//   const H = size.h
//   const s = W / 210
//   const fscale = 0.8 + 0.2 * s
//   const margin = 14 * s
//   const contentW = W - margin * 2

//   const { profile, logo } = await loadBranding()

//   const layout = {
//     W,
//     H,
//     s,
//     fscale,
//     margin,
//     contentW,
//     bodyPt: 10.5 * fscale,
//     lineH: 5.2 * fscale,
//     vpad: 2.2 * s,
//     pad: 2.6 * s,
//     profile,
//     logo,
//     signature: null, // list reports have no signature block
//   }

//   let x = margin
//   const cols = defs.map((d, i) => {
//     const col = { ...d, x, w: contentW * widths[i] }
//     x += col.w
//     return col
//   })

//   const footerReserve = 13 * s
//   const totalH = layout.lineH + layout.vpad * 2
//   const gap = 5 * s
//   const bottomLimit = H - margin - footerReserve - totalH - gap

//   let y = 0

//   const startPage = (first) => {
//     drawPageBase(doc, layout)

//     y = first
//       ? drawVoucherHeading(doc, layout, leftText, rightText)
//       : margin + 8 * s

//     y = drawGridHeader(doc, layout, cols, y)
//   }

//   startPage(true)

//   rows.forEach((cells, index) => {
//     const { height } = measureGridRow(doc, layout, cols, cells)

//     if (y + height > bottomLimit) {
//       doc.addPage()
//       startPage(false)
//     }

//     y = drawGridRow(doc, layout, cols, cells, index, y)
//   })

//   drawGridTotal(doc, layout, cols, total, y + gap)

//   const totalPages = doc.getNumberOfPages()

//   for (let page = 1; page <= totalPages; page += 1) {
//     doc.setPage(page)
//     drawFooter(doc, layout, page, totalPages)
//   }

//   return { blob: doc.output('blob'), fileName }
// }

// // items: [{ name, quantity, unit, at }]  ->  { blob, fileName }
// export async function buildEntryListPdf({ items, date = new Date() }) {
//   if (!items?.length) {
//     throw new Error('There is nothing to print.')
//   }

//   return buildGridPdf({
//     leftText: `Entry List  (${items.length} ${items.length === 1 ? 'entry' : 'entries'})`,
//     rightText: `${formatDate(date)}   ${formatTime(date)}`,
//     defs: [
//       { title: 'S.No', align: 'left' },
//       { title: 'Product', align: 'left', wrap: true },
//       { title: 'Quantity', align: 'right' },
//       { title: 'Added At', align: 'right' },
//     ],
//     widths: [0.1, 0.46, 0.24, 0.2],
//     rows: items.map((item, i) => [
//       String(i + 1),
//       String(item.name ?? ''),
//       formatQtyWithUnit(Number(item.quantity), item.unit || ''),
//       item.at ? formatTime(new Date(item.at)) : '',
//     ]),
//     total: getVoucherTotal(items),
//     fileName: `Mothys-Entry-List-${localStamp(date)}.pdf`,
//   })
// }

// // items: [{ name, quantity, unit }]  ->  { blob, fileName }
// export async function buildStockListPdf({ items, date = new Date() }) {
//   if (!items?.length) {
//     throw new Error('There is nothing to print.')
//   }

//   return buildGridPdf({
//     leftText: `Stock Report  (${items.length} ${items.length === 1 ? 'item' : 'items'})`,
//     rightText: `As on ${formatDate(date)}   ${formatTime(date)}`,
//     defs: [
//       { title: 'S.No', align: 'left' },
//       { title: 'Product', align: 'left', wrap: true },
//       { title: 'Remaining Quantity', align: 'right' },
//     ],
//     widths: [0.12, 0.56, 0.32],
//     rows: items.map((item, i) => [
//       String(i + 1),
//       String(item.name ?? ''),
//       formatQtyWithUnit(Number(item.quantity), item.unit || ''),
//     ]),
//     total: getVoucherTotal(items),
//     fileName: `Mothys-Stock-${localStamp(date)}.pdf`,
//   })
// }






import { formatDate, formatQtyWithUnit, formatTime, formatVoucher } from './format'
import { getCompanyProfile, getCachedCompanyProfile } from '../services/companyService'

const PAPER_KEY = 'mothys_paper_size'

// White and grey only.
const COLORS = {
  background: [255, 255, 255],
  primary: [60, 60, 60],
  dark: [40, 40, 40],
  text: [70, 70, 70],
  border: [190, 190, 190],
  header: [230, 230, 230],
  alternate: [246, 246, 246],
  white: [255, 255, 255],
}

export const PAPER_SIZES = {
  a4: { label: 'A4', w: 210, h: 297 },
  a5: { label: 'A5', w: 148, h: 210 },
}

export function getPaperSize() {
  try {
    const value = localStorage.getItem(PAPER_KEY)
    if (value && PAPER_SIZES[value]) return value
  } catch {
    // Storage unavailable
  }

  return 'a4'
}

export function setPaperSize(value) {
  if (!PAPER_SIZES[value]) return

  try {
    localStorage.setItem(PAPER_KEY, value)
  } catch {
    // Storage unavailable
  }
}

// Keep totals separate for different units (kept for other pages that may use it).
export function totalsByUnit(items = []) {
  const map = new Map()

  items.forEach((item) => {
    const unit = item.unit || ''
    const quantity = Number(item.quantity || 0)

    map.set(unit, (map.get(unit) || 0) + quantity)
  })

  return [...map.entries()].map(([unit, total]) =>
    formatQtyWithUnit(
      Math.round(total * 1000) / 1000,
      unit,
    ),
  )
}

// One clean total line for the voucher.
//  - every item in the same unit  -> a real sum, e.g. "TOTAL  12 Kg"
//  - mixed units (m, nos, rs ...) -> they cannot be added, so show "TOTAL ITEMS  3"
export function getVoucherTotal(items = []) {
  const units = new Set(items.map((item) => item.unit || ''))

  if (units.size === 1) {
    const [only] = totalsByUnit(items)
    return { label: 'TOTAL', value: only }
  }

  return { label: 'TOTAL ITEMS', value: String(items.length) }
}

// --------------------------------------------------
// IMAGES (logo / signature come from Settings > Company Details)
// --------------------------------------------------

const imageCache = new Map()

// Takes a data URL, returns { dataUrl, w, h, format } or null when there is no image.
async function prepareImage(dataUrl) {
  if (!dataUrl) return null
  if (imageCache.has(dataUrl)) return imageCache.get(dataUrl)

  let result = null

  try {
    const dimensions = await new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve({ w: image.naturalWidth, h: image.naturalHeight })
      image.onerror = reject
      image.src = dataUrl
    })

    const format = dataUrl.startsWith('data:image/jpeg')
      ? 'JPEG'
      : dataUrl.startsWith('data:image/webp')
        ? 'WEBP'
        : 'PNG'

    result = { dataUrl, w: dimensions.w, h: dimensions.h, format }
  } catch {
    // Unreadable image: the PDF is generated without it.
    result = null
  }

  imageCache.set(dataUrl, result)
  return result
}

// --------------------------------------------------
// PAGE BACKGROUND (no watermark)
// --------------------------------------------------

function drawPageBase(doc, layout) {
  doc.setFillColor(...COLORS.background)
  doc.rect(0, 0, layout.W, layout.H, 'F')
}

// --------------------------------------------------
// HEADING: company logo (optional), name, address, email, phone
// --------------------------------------------------

function drawVoucherHeading(doc, layout, leftText, rightText) {
  const { W, margin, s, fscale, contentW, logo, profile } = layout

  const logoBox = 20 * s
  const logoGap = 4 * s

  // Keep the centred text clear of the logo space on both sides.
  const textW = logo ? contentW - 2 * (logoBox + logoGap) : contentW

  let y = margin + 12 * s
  const topY = y

  // ---- Prepare company name lines ----
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22 * fscale)

  const nameLines = doc.splitTextToSize(profile.name.toUpperCase() || 'COMPANY', textW)
  const nameWidth = Math.max(...nameLines.map((line) => doc.getTextWidth(line)))

  // ---- Prepare address / contact lines ----
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5 * fscale)

  const details = []

  if (profile.address) {
    details.push(...doc.splitTextToSize(profile.address.replace(/\s*\n\s*/g, ', '), textW))
  }

  const contact = [
    profile.email && `Email: ${profile.email}`,
    profile.phone && `Phone: ${profile.phone}`,
  ]
    .filter(Boolean)
    .join('   |   ')

  if (contact) details.push(...doc.splitTextToSize(contact, textW))

  const detailsWidth = details.length
    ? Math.max(...details.map((line) => doc.getTextWidth(line)))
    : 0

  const blockWidth = Math.max(nameWidth, detailsWidth)

  // ---- Logo: placed just LEFT of the centred name block ----
  if (logo) {
    const scale = Math.min(logoBox / logo.w, logoBox / logo.h)
    const logoW = logo.w * scale
    const logoH = logo.h * scale

    const logoX = Math.max(margin, W / 2 - blockWidth / 2 - logoGap - logoW)
    const logoY = topY - 9 * s + (logoBox - logoH) / 2

    try {
      doc.addImage(logo.dataUrl, logo.format, logoX, logoY, logoW, logoH)
    } catch {
      // Skip unsupported logo format.
    }
  }

  // ---- Company name ----
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22 * fscale)
  doc.setTextColor(...COLORS.primary)

  nameLines.forEach((line, i) => {
    doc.text(line, W / 2, y + i * 9 * s, { align: 'center' })
  })

  y += (nameLines.length - 1) * 9 * s + 6 * s

  // ---- Address, email and contact number ----
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5 * fscale)
  doc.setTextColor(...COLORS.dark)

  details.forEach((line) => {
    doc.text(line, W / 2, y, { align: 'center' })
    y += 4.2 * s
  })

  y = Math.max(y + 1 * s, margin + 24 * s)

  // Heading divider.
  doc.setDrawColor(...COLORS.primary)
  doc.setLineWidth(0.65)
  doc.line(margin, y, W - margin, y)

  y += 9 * s

  // Voucher information box.
  const infoH = 13 * s

  doc.setFillColor(...COLORS.white)
  doc.setDrawColor(...COLORS.border)
  doc.setLineWidth(0.3)

  doc.roundedRect(margin, y, contentW, infoH, 1.5 * s, 1.5 * s, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5 * fscale)
  doc.setTextColor(...COLORS.dark)

  doc.text(leftText, margin + 4 * s, y + 8 * s)
  doc.text(rightText, W - margin - 4 * s, y + 8 * s, { align: 'right' })

  return y + infoH + 7 * s
}

// --------------------------------------------------
// TABLE HEADER
// --------------------------------------------------

function drawTableHeader(doc, layout, top) {
  const {
    margin,
    contentW,
    colW,
    colX,
    lineH,
    vpad,
    pad,
    bodyPt,
  } = layout

  const height = lineH + vpad * 2

  doc.setFillColor(...COLORS.header)
  doc.setDrawColor(...COLORS.border)
  doc.setLineWidth(0.3)

  doc.rect(margin, top, contentW, height, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(bodyPt)
  doc.setTextColor(...COLORS.primary)

  const baseline = top + vpad + lineH * 0.72

  doc.text('S.No', colX[0] + pad, baseline)
  doc.text('Particulars', colX[1] + pad, baseline)
  doc.text('Quantity', colX[2] + colW[2] - pad, baseline, { align: 'right' })

  doc.setDrawColor(...COLORS.border)

  doc.line(colX[1], top, colX[1], top + height)
  doc.line(colX[2], top, colX[2], top + height)

  return top + height
}

// --------------------------------------------------
// TABLE ROW
// --------------------------------------------------

function drawTableRow(doc, layout, item, index, top) {
  const {
    margin,
    contentW,
    colW,
    colX,
    lineH,
    vpad,
    pad,
    bodyPt,
  } = layout

  const nameLines = doc.splitTextToSize(
    String(item.name ?? ''),
    colW[1] - pad * 2,
  )

  const rowH = Math.max(
    lineH + vpad * 2,
    nameLines.length * lineH + vpad * 2,
  )

  doc.setFillColor(...(index % 2 === 0 ? COLORS.white : COLORS.alternate))

  doc.setDrawColor(...COLORS.border)
  doc.setLineWidth(0.22)

  doc.rect(margin, top, contentW, rowH, 'FD')

  doc.line(colX[1], top, colX[1], top + rowH)
  doc.line(colX[2], top, colX[2], top + rowH)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(bodyPt)
  doc.setTextColor(...COLORS.text)

  const baseline = top + vpad + lineH * 0.72

  doc.text(String(index + 1), colX[0] + pad, baseline)
  doc.text(nameLines, colX[1] + pad, baseline)

  doc.text(
    formatQtyWithUnit(Number(item.quantity), item.unit || ''),
    colX[2] + colW[2] - pad,
    baseline,
    { align: 'right' },
  )

  return top + rowH
}

// --------------------------------------------------
// TOTAL SECTION (always a single line)
// --------------------------------------------------

function getTotalHeight(layout) {
  return layout.lineH + layout.vpad * 2
}

function drawTotal(doc, layout, total, top) {
  const {
    margin,
    contentW,
    colX,
    colW,
    lineH,
    vpad,
    pad,
    bodyPt,
  } = layout

  const height = getTotalHeight(layout)

  doc.setFillColor(...COLORS.header)
  doc.setDrawColor(...COLORS.primary)
  doc.setLineWidth(0.4)

  doc.rect(margin, top, contentW, height, 'FD')

  doc.line(colX[1], top, colX[1], top + height)
  doc.line(colX[2], top, colX[2], top + height)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(bodyPt)
  doc.setTextColor(...COLORS.primary)

  const baseline = top + vpad + lineH * 0.72

  doc.text(total.label, colX[1] + pad, baseline)
  doc.text(total.value, colX[2] + colW[2] - pad, baseline, { align: 'right' })

  return top + height
}

// --------------------------------------------------
// SIGNATURE SECTION (removed completely when no signature was uploaded)
// --------------------------------------------------

function getSignatureHeight(layout) {
  return layout.signature ? 30 * layout.s : 0
}

function drawSignature(doc, layout, top) {
  const { W, margin, s, fscale, signature } = layout

  if (!signature) return top

  const lineWidth = 49 * s
  const right = W - margin - 3 * s
  const lineStart = right - lineWidth
  const lineY = top + 16 * s

  // Signature image sits just above the line.
  const maxW = lineWidth - 4 * s
  const maxH = 14 * s
  const scale = Math.min(maxW / signature.w, maxH / signature.h)
  const imgW = signature.w * scale
  const imgH = signature.h * scale

  try {
    doc.addImage(
      signature.dataUrl,
      signature.format,
      lineStart + (lineWidth - imgW) / 2,
      lineY - imgH - 1 * s,
      imgW,
      imgH,
    )
  } catch {
    // Skip unsupported signature format.
  }

  doc.setDrawColor(...COLORS.dark)
  doc.setLineWidth(0.4)
  doc.line(lineStart, lineY, right, lineY)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9 * fscale)
  doc.setTextColor(...COLORS.dark)

  doc.text('Authorized Signature', right, lineY + 5 * s, { align: 'right' })

  return top + getSignatureHeight(layout)
}

// --------------------------------------------------
// FOOTER
// --------------------------------------------------

function drawFooter(doc, layout, pageNumber, totalPages) {
  const { W, H, margin, s, fscale, profile } = layout

  doc.setDrawColor(...COLORS.border)
  doc.setLineWidth(0.25)

  doc.line(margin, H - margin - 5 * s, W - margin, H - margin - 5 * s)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5 * fscale)
  doc.setTextColor(...COLORS.dark)

  doc.text(profile.name || 'Mothys Inventory Management', margin, H - margin)

  doc.text(`Page ${pageNumber} of ${totalPages}`, W / 2, H - margin, { align: 'center' })
}

// Loads company details (from the backend) + images once per PDF.
async function loadBranding() {
  let profile
  try {
    profile = await getCompanyProfile()
  } catch {
    // Network problem: reuse the last loaded copy if there is one.
    profile = getCachedCompanyProfile()
    if (!profile.name) {
      throw new Error('Could not load the company details. Check your connection and try again.')
    }
  }

  const [logo, signature] = await Promise.all([
    prepareImage(profile.logo),
    prepareImage(profile.signature),
  ])

  return { profile, logo, signature }
}

// --------------------------------------------------
// MAIN PDF GENERATOR
// --------------------------------------------------

export async function buildVoucherPdf({
  voucherNumber,
  date,
  items,
  paper,
}) {
  if (!items?.length) {
    throw new Error('There is nothing to print.')
  }

  const paperKey = PAPER_SIZES[paper] ? paper : getPaperSize()
  const size = PAPER_SIZES[paperKey]

  const { jsPDF } = await import('jspdf')

  const doc = new jsPDF({
    unit: 'mm',
    format: paperKey,
    orientation: 'portrait',
    compress: true,
  })

  const W = size.w
  const H = size.h

  const s = W / 210
  const fscale = 0.8 + 0.2 * s

  const margin = 14 * s
  const contentW = W - margin * 2

  const bodyPt = 10.5 * fscale
  const lineH = 5.2 * fscale
  const vpad = 2.2 * s
  const pad = 2.6 * s

  const colW = [
    contentW * 0.12,
    contentW * 0.60,
    contentW * 0.28,
  ]

  const colX = [
    margin,
    margin + colW[0],
    margin + colW[0] + colW[1],
  ]

  const { profile, logo, signature } = await loadBranding()

  const layout = {
    W,
    H,
    s,
    fscale,
    margin,
    contentW,
    bodyPt,
    lineH,
    vpad,
    pad,
    colW,
    colX,
    profile,
    logo,
    signature,
  }

  const total = getVoucherTotal(items)

  // Reserve room for footer, total, and (if present) signature.
  const footerReserve = 13 * s
  const signatureReserve = getSignatureHeight(layout)
  const totalReserve = getTotalHeight(layout)
  const gapReserve = 5 * s

  const finalRequired = totalReserve + signatureReserve + gapReserve

  const bottomLimit = H - margin - footerReserve - finalRequired

  let y = 0

  function startPage(isFirstPage = false) {
    drawPageBase(doc, layout)

    y = isFirstPage
      ? drawVoucherHeading(
          doc,
          layout,
          // Entries printed before billing have no voucher number yet.
          `Voucher ID: ${voucherNumber ? formatVoucher(voucherNumber) : 'Null'}`,
          `Date: ${formatDate(date)}`,
        )
      : margin + 8 * s

    y = drawTableHeader(doc, layout, y)
  }

  // First page.
  startPage(true)

  // Draw product rows.
  items.forEach((item, index) => {
    const nameLines = doc.splitTextToSize(
      String(item.name ?? ''),
      colW[1] - pad * 2,
    )

    const rowH = Math.max(
      lineH + vpad * 2,
      nameLines.length * lineH + vpad * 2,
    )

    if (y + rowH > bottomLimit) {
      doc.addPage()
      startPage(false)
    }

    y = drawTableRow(doc, layout, item, index, y)
  })

  // Ensure total and signature remain together.
  const finalContentLimit = H - margin - footerReserve

  if (y + finalRequired > finalContentLimit) {
    doc.addPage()
    startPage(false)
  }

  // Total directly below the table.
  y = drawTotal(doc, layout, total, y + gapReserve)

  // Signature directly below the total (only if uploaded).
  if (signature) {
    drawSignature(doc, layout, y + 2 * s)
  }

  // Footer on every page.
  const totalPages = doc.getNumberOfPages()

  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page)
    drawFooter(doc, layout, page, totalPages)
  }

  const safeVoucherNumber = voucherNumber
    ? String(formatVoucher(voucherNumber)).replace(/[^a-zA-Z0-9-_]/g, '')
    : 'Null'

  return {
    blob: doc.output('blob'),
    fileName: `Mothys-Voucher-${safeVoucherNumber}.pdf`,
  }
}

// Saves the voucher PDF to disk (nothing else).
export async function downloadVoucherPdf(args) {
  const { blob, fileName } = await buildVoucherPdf(args)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

// --------------------------------------------------
// ENTRY LIST / STOCK LIST PDFs (A4, same look as the voucher)
// --------------------------------------------------

function drawGridHeader(doc, layout, cols, top) {
  const { margin, contentW, lineH, vpad, pad, bodyPt } = layout
  const height = lineH + vpad * 2

  doc.setFillColor(...COLORS.header)
  doc.setDrawColor(...COLORS.border)
  doc.setLineWidth(0.3)
  doc.rect(margin, top, contentW, height, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(bodyPt)
  doc.setTextColor(...COLORS.primary)

  const baseline = top + vpad + lineH * 0.72

  cols.forEach((c, i) => {
    if (c.align === 'right') {
      doc.text(c.title, c.x + c.w - pad, baseline, { align: 'right' })
    } else {
      doc.text(c.title, c.x + pad, baseline)
    }
    if (i > 0) doc.line(c.x, top, c.x, top + height)
  })

  return top + height
}

function measureGridRow(doc, layout, cols, cells) {
  const { lineH, vpad, pad, bodyPt } = layout

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(bodyPt)

  const lines = cells.map((text, i) =>
    cols[i].wrap
      ? doc.splitTextToSize(String(text), cols[i].w - pad * 2)
      : [String(text)],
  )

  const count = Math.max(...lines.map((l) => l.length))

  return { lines, height: Math.max(1, count) * lineH + vpad * 2 }
}

function drawGridRow(doc, layout, cols, cells, index, top) {
  const { margin, contentW, lineH, vpad, pad, bodyPt } = layout
  const { lines, height } = measureGridRow(doc, layout, cols, cells)

  doc.setFillColor(...(index % 2 === 0 ? COLORS.white : COLORS.alternate))
  doc.setDrawColor(...COLORS.border)
  doc.setLineWidth(0.22)
  doc.rect(margin, top, contentW, height, 'FD')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(bodyPt)
  doc.setTextColor(...COLORS.text)

  const baseline = top + vpad + lineH * 0.72

  cols.forEach((c, i) => {
    if (i > 0) doc.line(c.x, top, c.x, top + height)

    if (c.align === 'right') {
      doc.text(lines[i], c.x + c.w - pad, baseline, { align: 'right' })
    } else {
      doc.text(lines[i], c.x + pad, baseline)
    }
  })

  return top + height
}

function drawGridTotal(doc, layout, cols, total, top) {
  const { margin, contentW, lineH, vpad, pad, bodyPt } = layout
  const height = lineH + vpad * 2

  doc.setFillColor(...COLORS.header)
  doc.setDrawColor(...COLORS.primary)
  doc.setLineWidth(0.4)
  doc.rect(margin, top, contentW, height, 'FD')

  cols.forEach((c, i) => {
    if (i > 0) doc.line(c.x, top, c.x, top + height)
  })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(bodyPt)
  doc.setTextColor(...COLORS.primary)

  const baseline = top + vpad + lineH * 0.72

  doc.text(total.label, cols[1].x + pad, baseline)
  doc.text(total.value, cols[2].x + cols[2].w - pad, baseline, { align: 'right' })

  return top + height
}

const localStamp = (d) => {
  const x = new Date(d)
  const p = (n) => String(n).padStart(2, '0')
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`
}

// Shared A4 table builder used by the entry list and the stock list.
//  defs   : [{ title, align, wrap }]   widths : fractions that add up to 1
//  rows   : [[cell, cell, ...], ...]   total  : { label, value }
async function buildGridPdf({ leftText, rightText, defs, widths, rows, total, fileName }) {
  if (!rows?.length) {
    throw new Error('There is nothing to print.')
  }

  const size = PAPER_SIZES.a4
  const { jsPDF } = await import('jspdf')

  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
    compress: true,
  })

  const W = size.w
  const H = size.h
  const s = W / 210
  const fscale = 0.8 + 0.2 * s
  const margin = 14 * s
  const contentW = W - margin * 2

  const { profile, logo } = await loadBranding()

  const layout = {
    W,
    H,
    s,
    fscale,
    margin,
    contentW,
    bodyPt: 10.5 * fscale,
    lineH: 5.2 * fscale,
    vpad: 2.2 * s,
    pad: 2.6 * s,
    profile,
    logo,
    signature: null, // list reports have no signature block
  }

  let x = margin
  const cols = defs.map((d, i) => {
    const col = { ...d, x, w: contentW * widths[i] }
    x += col.w
    return col
  })

  const footerReserve = 13 * s
  const totalH = layout.lineH + layout.vpad * 2
  const gap = 5 * s
  const bottomLimit = H - margin - footerReserve - totalH - gap

  let y = 0

  const startPage = (first) => {
    drawPageBase(doc, layout)

    y = first
      ? drawVoucherHeading(doc, layout, leftText, rightText)
      : margin + 8 * s

    y = drawGridHeader(doc, layout, cols, y)
  }

  startPage(true)

  rows.forEach((cells, index) => {
    const { height } = measureGridRow(doc, layout, cols, cells)

    if (y + height > bottomLimit) {
      doc.addPage()
      startPage(false)
    }

    y = drawGridRow(doc, layout, cols, cells, index, y)
  })

  drawGridTotal(doc, layout, cols, total, y + gap)

  const totalPages = doc.getNumberOfPages()

  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page)
    drawFooter(doc, layout, page, totalPages)
  }

  return { blob: doc.output('blob'), fileName }
}

// items: [{ name, quantity, unit, at }]  ->  { blob, fileName }
export async function buildEntryListPdf({ items, date = new Date() }) {
  if (!items?.length) {
    throw new Error('There is nothing to print.')
  }

  return buildGridPdf({
    leftText: `Entry List  (${items.length} ${items.length === 1 ? 'entry' : 'entries'})`,
    rightText: `${formatDate(date)}   ${formatTime(date)}`,
    defs: [
      { title: 'S.No', align: 'left' },
      { title: 'Product', align: 'left', wrap: true },
      { title: 'Quantity', align: 'right' },
      { title: 'Added At', align: 'right' },
    ],
    widths: [0.1, 0.46, 0.24, 0.2],
    rows: items.map((item, i) => [
      String(i + 1),
      String(item.name ?? ''),
      formatQtyWithUnit(Number(item.quantity), item.unit || ''),
      item.at ? formatTime(new Date(item.at)) : '',
    ]),
    total: getVoucherTotal(items),
    fileName: `Mothys-Entry-List-${localStamp(date)}.pdf`,
  })
}

// items: [{ name, quantity, unit }]  ->  { blob, fileName }
export async function buildStockListPdf({ items, date = new Date() }) {
  if (!items?.length) {
    throw new Error('There is nothing to print.')
  }

  return buildGridPdf({
    leftText: `Stock Report  (${items.length} ${items.length === 1 ? 'item' : 'items'})`,
    rightText: `As on ${formatDate(date)}   ${formatTime(date)}`,
    defs: [
      { title: 'S.No', align: 'left' },
      { title: 'Product', align: 'left', wrap: true },
      { title: 'Remaining Quantity', align: 'right' },
    ],
    widths: [0.12, 0.56, 0.32],
    rows: items.map((item, i) => [
      String(i + 1),
      String(item.name ?? ''),
      formatQtyWithUnit(Number(item.quantity), item.unit || ''),
    ]),
    total: getVoucherTotal(items),
    fileName: `Mothys-Stock-${localStamp(date)}.pdf`,
  })
}