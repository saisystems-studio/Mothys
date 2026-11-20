// import { useState } from 'react'
// import { Link,useLocation, useNavigate } from 'react-router-dom'
// import { User } from 'lucide-react'
// import AuthLayout from '../layouts/AuthLayout'
// import PasswordInput from '../components/PasswordInput'
// import useAuth from '../hooks/useAuth'
// import useToast from '../hooks/useToast'
// import { getErrorMessage } from '../services/api'
// import { requestPasswordRecovery } from '../services/nexusService'

// export default function Login() {
//   const { login } = useAuth()
//   const toast = useToast()
//   const navigate = useNavigate()
//   const location = useLocation()
//   const [username, setUsername] = useState('')
//   const [password, setPassword] = useState('')
//   const [errors, setErrors] = useState({})
//   const [formError, setFormError] = useState('')
//   const [submitting, setSubmitting] = useState(false)

//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     const nextErrors = {}
//     if (!username.trim()) nextErrors.username = 'Enter your username or email.'
//     if (!password) nextErrors.password = 'Enter your password.'
//     setErrors(nextErrors)
//     setFormError('')
//     if (Object.keys(nextErrors).length) return

//     setSubmitting(true)
//     try {
//       await login(username.trim(), password)
//       navigate(location.state?.from?.pathname || '/dashboard', { replace: true })
//     } catch (error) {
//       setFormError(
//         error.response?.status === 401 ? 'Invalid username or password.' : getErrorMessage(error),
//       )
//       setSubmitting(false)
//     }
//   }

//   // Password recovery is handled by Nexus; no endpoint exists yet.
//   const handleForgot = async () => {
//     try {
//       await requestPasswordRecovery()
//     } catch (error) {
//       toast.info(getErrorMessage(error))
//     }
//   }

//   return (
//     <AuthLayout>
//       <form onSubmit={handleSubmit} className="auth-card" style={{ padding: 0, boxShadow: 'none' }} noValidate>
//         <div className="auth-card-head">
//           <User size={32} strokeWidth={2} />
//           <h2>Login</h2>
//         </div>

//         {formError && <div className="form-error">{formError}</div>}

//         <div className="field">
//           <label htmlFor="username">Username / Email</label>
//           <input
//             id="username"
//             className={`input ${errors.username ? 'invalid' : ''}`}
//             placeholder="Enter username or email"
//             value={username}
//             onChange={(e) => setUsername(e.target.value)}
//             autoComplete="username"
//             autoFocus
//           />
//           {errors.username && <span className="field-error">{errors.username}</span>}
//         </div>

//         <div className="field">
//           <label htmlFor="password">Password</label>
//           <PasswordInput
//             id="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             autoComplete="current-password"
//             invalid={Boolean(errors.password)}
//           />
//           {errors.password && <span className="field-error">{errors.password}</span>}
//         </div>

//         <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
//           {submitting && <span className="spinner" />}
//           Login
//         </button>
//         <p className="auth-note">
//   Don't have an account? <Link to="/register">Register here</Link>
// </p>
//         {/* <button type="button" className="auth-link" onClick={handleForgot}>
//           Forgot Password?
//         </button> */}
//       </form>
//     </AuthLayout>
//   )
// }




import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { User } from 'lucide-react'

import AuthLayout from '../layouts/AuthLayout'
import PasswordInput from '../components/PasswordInput'
import useAuth from '../hooks/useAuth'
import { getErrorMessage } from '../services/api'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    const nextErrors = {}

    if (!username.trim()) {
      nextErrors.username = 'Enter your username or email.'
    }

    if (!password) {
      nextErrors.password = 'Enter your password.'
    }

    setErrors(nextErrors)
    setFormError('')

    if (Object.keys(nextErrors).length) return

    setSubmitting(true)

    try {
      await login(username.trim(), password)

      navigate(
        location.state?.from?.pathname || '/dashboard',
        { replace: true }
      )
    } catch (error) {
      setFormError(
        error.response?.status === 401
          ? 'Invalid username or password.'
          : getErrorMessage(error)
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <form
        onSubmit={handleSubmit}
        className="auth-card"
        style={{ padding: 0, boxShadow: 'none' }}
        noValidate
      >
        <div className="auth-card-head">
          <User size={32} strokeWidth={2} />
          <h2>Login</h2>
        </div>

        {formError && (
          <div className="form-error">{formError}</div>
        )}

        <div className="field">
          <label htmlFor="username">Username / Email</label>

          <input
            id="username"
            className={`input ${errors.username ? 'invalid' : ''}`}
            placeholder="Enter username or email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
          />

          {errors.username && (
            <span className="field-error">{errors.username}</span>
          )}
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>

          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            invalid={Boolean(errors.password)}
          />

          {errors.password && (
            <span className="field-error">{errors.password}</span>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={submitting}
        >
          {submitting && <span className="spinner" />}
          Login
        </button>

        <p className="auth-note">
          Don't have an account?{' '}
          <Link to="/register">Register here</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
