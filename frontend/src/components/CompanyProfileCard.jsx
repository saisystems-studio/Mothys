import { useCallback, useEffect, useRef, useState } from 'react'
import { Building2, Upload, Trash2, Check } from 'lucide-react'
import useToast from '../hooks/useToast'
import { getErrorMessage } from '../services/api'
import {
  EMPTY_COMPANY,
  getCompanyProfile,
  saveCompanyProfile,
  getCompanyErrors,
} from '../services/companyService'
// readImageFile (resize/convert to data URL) and the OLD browser-storage reader are still
// used from here: the old one only to offer a one-time import of previously saved details.
import { readImageFile, getCompanyProfile as getLocalCompanyProfile } from '../utils/companyProfile'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[+]?[\d\s()-]{7,20}$/

const FIELDS = ['name', 'address', 'email', 'phone', 'logo', 'signature']
const normalize = (p) => Object.fromEntries(FIELDS.map((k) => [k, p?.[k] ?? '']))

const fieldGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 20,
}

const sectionTitle = {
  margin: '0 0 12px',
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
}

const iconBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
}

function UploadTile({ title, hint, value, onPick, onRemove, disabled }) {
  const inputRef = useRef(null)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: 14,
        border: '1px solid #e3e7ee',
        borderRadius: 12,
        background: '#fff',
      }}
    >
      <div style={{ fontWeight: 600 }}>
        {title}{' '}
        <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 13 }}>(optional)</span>
      </div>

      <div
        style={{
          height: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1.5px dashed #c9cfdb',
          borderRadius: 10,
          background: '#fafbfc',
          overflow: 'hidden',
        }}
      >
        {value ? (
          <img
            src={value}
            alt={`${title} preview`}
            style={{ maxWidth: '85%', maxHeight: 90, objectFit: 'contain' }}
          />
        ) : (
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>No {title.toLowerCase()} added</span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) onPick(file)
        }}
      />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn btn-outline"
          style={iconBtn}
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={15} />
          {value ? 'Replace' : 'Upload'}
        </button>

        {value && (
          <button type="button" className="btn btn-outline" style={iconBtn} disabled={disabled} onClick={onRemove}>
            <Trash2 size={15} />
            Remove
          </button>
        )}
      </div>

      <span style={{ color: 'var(--muted)', fontSize: 12, lineHeight: 1.4 }}>{hint}</span>
    </div>
  )
}

export default function CompanyProfileCard() {
  const toast = useToast()

  const [saved, setSaved] = useState(normalize(EMPTY_COMPANY))
  const [form, setForm] = useState(normalize(EMPTY_COMPANY))
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)

  const dirty = JSON.stringify(form) !== JSON.stringify(saved)
  const locked = loading || saving

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const server = normalize(await getCompanyProfile())
      setSaved(server)

      // One-time import: if the server has nothing yet but this browser still has the
      // old locally-saved details, prefill the form so the admin only has to press Save.
      let next = server
      if (!server.name && !server.address && !server.phone) {
        try {
          const local = normalize(getLocalCompanyProfile())
          if (local.name || local.address || local.phone) next = local
        } catch {
          /* ignore: no usable local data */
        }
      }
      setForm(next)
    } catch (err) {
      setLoadError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const pickImage = (key, maxDim) => async (file) => {
    try {
      const dataUrl = await readImageFile(file, maxDim)
      setForm((f) => ({ ...f, [key]: dataUrl }))
    } catch (err) {
      toast.error(err.message || 'Could not read image.')
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()

    const errs = {}

    if (!form.name?.trim()) {
      errs.name = 'Enter the company name.'
    }

    if (!form.phone?.trim()) {
      errs.phone = 'Contact number is required.'
    } else if (!PHONE_RE.test(form.phone.trim())) {
      errs.phone = 'Enter a valid contact number.'
    }

    if (!form.address?.trim()) {
      errs.address = 'Company address is required.'
    }

    if (form.email?.trim() && !EMAIL_RE.test(form.email.trim())) {
      errs.email = 'Enter a valid email address.'
    }

    setErrors(errs)

    if (Object.keys(errs).length > 0) {
      toast.error('Please fill in all required fields correctly.')
      return
    }

    setSaving(true)
    try {
      const result = normalize(
        await saveCompanyProfile({
          name: form.name.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          email: form.email.trim(),
          logo: form.logo, // "" removes it on the server
          signature: form.signature,
        }),
      )

      setSaved(result)
      setForm(result)
      setErrors({})
      toast.success('Company details saved successfully.')
    } catch (err) {
      const serverErrors = getCompanyErrors(err)
      const { _form, ...fieldErrors } = serverErrors
      setErrors(fieldErrors)
      // Image errors have no inline spot in the form, so they are shown in the toast.
      const first = _form || Object.values(fieldErrors)[0]
      toast.error(first || getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      className="card"
      onSubmit={handleSave}
      noValidate
      style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#eef2ff',
            color: '#1d4ed8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Building2 size={22} />
        </div>

        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Company Details</h2>
          <p style={{ margin: '2px 0 0', color: 'var(--muted)', fontSize: 13 }}>
            Printed in the header of every PDF: voucher, entry list and stock report.
          </p>
        </div>

        {dirty && !loading && (
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 12,
              fontWeight: 600,
              color: '#b45309',
              background: '#fef3c7',
              padding: '4px 10px',
              borderRadius: 999,
            }}
          >
            Unsaved changes
          </span>
        )}
      </div>

      {loading && <div className="info-strip">Loading company details…</div>}

      {loadError && (
        <div className="form-error" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>Could not load company details: {loadError}</span>
          <button type="button" className="btn btn-outline" onClick={load}>
            Retry
          </button>
        </div>
      )}

      {/* Business Information */}
      <section>
        <h3 style={sectionTitle}>Business Information</h3>

        <div style={fieldGrid}>
          <div className="field">
            <label htmlFor="c-name">
              Company Name <span className="req">*</span>
            </label>
            <input
              id="c-name"
              className={`input ${errors.name ? 'invalid' : ''}`}
              placeholder="Enter company name"
              value={form.name}
              onChange={set('name')}
              disabled={locked}
              maxLength={150}
              required
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="field">
            <label htmlFor="c-phone">
              Contact Number <span className="req">*</span>
            </label>
            <input
              id="c-phone"
              type="tel"
              className={`input ${errors.phone ? 'invalid' : ''}`}
              placeholder="Enter contact number"
              value={form.phone}
              onChange={set('phone')}
              disabled={locked}
              required
            />
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </div>

          <div className="field">
            <label htmlFor="c-email">Email</label>
            <input
              id="c-email"
              type="email"
              className={`input ${errors.email ? 'invalid' : ''}`}
              placeholder="Enter email"
              value={form.email}
              onChange={set('email')}
              disabled={locked}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="c-address">
              Company Address <span className="req">*</span>
            </label>
            <textarea
              id="c-address"
              className={`input ${errors.address ? 'invalid' : ''}`}
              rows={5}
              placeholder="Enter complete company address"
              value={form.address}
              onChange={set('address')}
              disabled={locked}
              maxLength={1000}
              required
              style={{
                fontFamily: 'inherit',
                resize: 'vertical',
                minHeight: 140,
                width: '100%',
                lineHeight: 1.6,
                padding: '12px 14px',
              }}
            />
            {errors.address && <span className="field-error">{errors.address}</span>}
          </div>
        </div>
      </section>

      {/* Branding */}
      <section>
        <h3 style={sectionTitle}>Branding</h3>

        <div style={{ ...fieldGrid, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          <UploadTile
            title="Logo"
            hint="PNG, JPG or WEBP, max 300 KB. Printed at the top-left of the PDF header."
            value={form.logo}
            disabled={locked}
            onPick={pickImage('logo', 400)}
            onRemove={() => setForm((f) => ({ ...f, logo: '' }))}
          />

          <UploadTile
            title="Signature"
            hint="A PNG with a transparent background looks best. Max 300 KB. Printed above the Authorized Signature line on the voucher."
            value={form.signature}
            disabled={locked}
            onPick={pickImage('signature', 500)}
            onRemove={() => setForm((f) => ({ ...f, signature: '' }))}
          />
        </div>
      </section>

      <div className="info-strip">
        Logo and signature are optional. Company name, contact number and address are mandatory.
      </div>

      {/* Save */}
      <div className="form-actions" style={{ alignItems: 'center' }}>
        {!dirty && !loading && saved.name && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#15803d', fontSize: 13 }}>
            <Check size={16} />
            Saved
          </span>
        )}

        <button type="submit" className="btn btn-primary" disabled={!dirty || locked}>
          {saving && <span className="spinner" />}
          Save Company Details
        </button>
      </div>
    </form>
  )
}
