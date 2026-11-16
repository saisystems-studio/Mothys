import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function PasswordInput({ id, value, onChange, placeholder = 'Enter password', autoComplete, invalid }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="input-wrap" style={invalid ? { borderColor: 'var(--red)' } : undefined}>
      <input
        id={id}
        className="input"
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="eye-btn"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff size={22} /> : <Eye size={22} />}
      </button>
    </div>
  )
}
