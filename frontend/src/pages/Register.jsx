import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import AuthLayout from '../layouts/AuthLayout'
import { registerWithNexus } from '../services/nexusService'
import { getErrorMessage } from '../services/api'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', contactNumber: '' })
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = 'Enter your full name.'
    if (!form.email.trim()) next.email = 'Enter your email address.'
    else if (!EMAIL_RE.test(form.email.trim())) next.email = 'Enter a valid email address.'
    if (!form.contactNumber.trim()) next.contactNumber = 'Enter your contact number.'
    else if (!/^[0-9+\-\s()]{7,15}$/.test(form.contactNumber.trim())) next.contactNumber = 'Enter a valid contact number.'
    setErrors(next)
    setNotice('')
    if (Object.keys(next).length) return

    setSubmitting(true)
    try {
      await registerWithNexus(form)
    } catch (error) {
      setNotice(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="auth-card" style={{ padding: 0, boxShadow: 'none' }} noValidate>
        <div className="auth-card-head">
          <UserPlus size={32} strokeWidth={2} />
          <h2>Create Account</h2>
        </div>

        {notice && <div className="form-notice">{notice}</div>}

        <div className="field">
          <label htmlFor="name">
            Name <span className="req">*</span>
          </label>
          <input
            id="name"
            className={`input ${errors.name ? 'invalid' : ''}`}
            placeholder="Enter full name"
            value={form.name}
            onChange={set('name')}
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>

        <div className="field">
          <label htmlFor="email">
            Email Address <span className="req">*</span>
          </label>
          <input
            id="email"
            type="email"
            className={`input ${errors.email ? 'invalid' : ''}`}
            placeholder="Enter email address"
            value={form.email}
            onChange={set('email')}
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        <div className="field">
          <label htmlFor="contact">
            Contact Number <span className="req">*</span>
          </label>
          <input
            id="contact"
            type="tel"
            className={`input ${errors.contactNumber ? 'invalid' : ''}`}
            placeholder="Enter contact number"
            value={form.contactNumber}
            onChange={set('contactNumber')}
          />
          {errors.contactNumber && <span className="field-error">{errors.contactNumber}</span>}
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting && <span className="spinner" />}
          Register
        </button>

        <p className="auth-note">Login credentials will be emailed to you.</p>
      </form>
    </AuthLayout>
  )
}
