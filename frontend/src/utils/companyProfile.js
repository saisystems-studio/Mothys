// Client company details used on every PDF (voucher, entry list, stock report).
// Stored in the browser, same approach as the paper-size setting.
// Put this file in: src/utils/companyProfile.js

const KEY = 'mothys_company_profile'

export const EMPTY_PROFILE = {
  name: '',
  address: '',
  email: '',
  phone: '',
  logo: '', // data URL, empty = no logo on PDFs
  signature: '', // data URL, empty = no signature block on PDFs
}

export function getCompanyProfile() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...EMPTY_PROFILE, ...JSON.parse(raw) }
  } catch {
    // Storage unavailable or corrupted
  }
  return { ...EMPTY_PROFILE }
}

// Throws if the browser storage is full or blocked.
export function saveCompanyProfile(profile) {
  const clean = {
    name: (profile.name || '').trim(),
    address: (profile.address || '').trim(),
    email: (profile.email || '').trim(),
    phone: (profile.phone || '').trim(),
    logo: profile.logo || '',
    signature: profile.signature || '',
  }
  localStorage.setItem(KEY, JSON.stringify(clean))
  return clean
}

// Reads an image file, shrinks it (keeps storage small) and returns a PNG data URL.
export function readImageFile(file, maxDim = 400) {
  return new Promise((resolve, reject) => {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      reject(new Error('Please choose a PNG, JPG or WEBP image.'))
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      reject(new Error('Image must be smaller than 3 MB.'))
      return
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the image.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('This image could not be opened.'))
      img.onload = () => {
  const MAX_BYTES = 280 * 1024 // server limit is 300 KB
  let scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight))
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  let dataUrl = ''

  for (let i = 0; i < 8; i += 1) {
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    dataUrl = canvas.toDataURL('image/png')
    const bytes = ((dataUrl.length - dataUrl.indexOf(',') - 1) * 3) / 4
    if (bytes <= MAX_BYTES) break
    scale *= 0.75 // still too big: shrink and try again
  }

  resolve(dataUrl)
}
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
