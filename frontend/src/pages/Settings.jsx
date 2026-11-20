import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SlidersHorizontal, Pencil, KeyRound, Power } from 'lucide-react'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import PasswordInput from '../components/PasswordInput'
import TableState from '../components/TableState'
import useAsyncData from '../hooks/useAsyncData'
import useAuth from '../hooks/useAuth'
import useToast from '../hooks/useToast'
import { createUser, getUsers, resetUserPassword, setUserStatus, updateUser } from '../services/usersService'
import { getRoles } from '../services/rolesService'
import { getErrorMessage } from '../services/api'
import CompanyProfileCard from '../components/CompanyProfileCard'
const load = () => Promise.all([getUsers(), getRoles()])

export default function Settings() {
  const toast = useToast()
  const navigate = useNavigate()
  const { user: me } = useAuth()
  const { data, loading, error, reload } = useAsyncData(load)
  const [users, roles] = data ?? [[], []]
  const roleName = useMemo(() => Object.fromEntries(roles.map((r) => [r.id, r.role_name])), [roles])
  const defaultRoleId = String(roles.find((r) => r.role_name.toLowerCase() === 'user')?.id ?? '')

  const [form, setForm] = useState({ username: '', password: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const [editing, setEditing] = useState(null) // { user, name, username, roleId }
  const [resetting, setResetting] = useState(null) // { user, password }
  const [confirm, setConfirm] = useState(null) // { user, activate }
  const [modalError, setModalError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleCreate = async (e) => {
    e.preventDefault()
    const errs = {}
    const username = form.username.trim()
    if (!username) errs.username = 'Enter a username.'
    else if (users.some((u) => u.username.toLowerCase() === username.toLowerCase()))
      errs.username = 'This username already exists.'
    if (!form.password) errs.password = 'Enter a password.'
    setErrors(errs)
    if (Object.keys(errs).length) return

    // Every new user gets the default "User" role. Admin accounts are not created here.
    if (!defaultRoleId) {
      toast.error('The "User" role was not found. Please contact support.')
      return
    }

    setSaving(true)
    try {
      // The Create User screen only collects Username and Password; the role is
      // always "User", and the backend also requires a display name, so the
      // username is used for it.
      await createUser({
        username,
        name: username,
        password: form.password,
        role_id: Number(defaultRoleId),
      })
      toast.success(`User "${username}" created.`)
      setForm({ username: '', password: '' })
      reload()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const clearForm = () => {
    setForm({ username: '', password: '' })
    setErrors({})
    navigate('/dashboard')
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    const name = editing.name.trim()
    const username = editing.username.trim()
    if (!name || !username) return setModalError('Name and username are required.')
    setBusy(true)
    setModalError('')
    try {
      await updateUser(editing.user.id, { name, username, role_id: Number(editing.roleId) })
      toast.success('User updated.')
      setEditing(null)
      reload()
    } catch (err) {
      setModalError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    if (!resetting.password) return setModalError('Enter a new password.')
    setBusy(true)
    setModalError('')
    try {
      await resetUserPassword(resetting.user.id, resetting.password)
      toast.success(`Password reset for "${resetting.user.username}". They must change it at next login.`)
      setResetting(null)
      reload()
    } catch (err) {
      setModalError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const handleStatus = async () => {
    setBusy(true)
    try {
      await setUserStatus(confirm.user.id, confirm.activate)
      toast.success(`User "${confirm.user.username}" ${confirm.activate ? 'activated' : 'deactivated'}.`)
      setConfirm(null)
      reload()
    } catch (err) {
      toast.error(getErrorMessage(err))
      setConfirm(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="crumbs">
        <SlidersHorizontal size={24} />
        <span>Settings</span>
        <span className="sep">&gt;</span>
        <span>Create User</span>
      </div>

      <form className="card user-form" onSubmit={handleCreate} noValidate>
        <div className="field">
          <label htmlFor="u-name">
            Username <span className="req">*</span>
          </label>
          <input
            id="u-name"
            className={`input ${errors.username ? 'invalid' : ''}`}
            placeholder="Enter username"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            autoComplete="off"
          />
          {errors.username && <span className="field-error">{errors.username}</span>}
        </div>
        <div className="field">
          <label htmlFor="u-pass">
            Password <span className="req">*</span>
          </label>
          <PasswordInput
            id="u-pass"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            autoComplete="new-password"
            invalid={Boolean(errors.password)}
          />
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>

        <div className="field">
          <label htmlFor="u-role">Role</label>
          <input
            id="u-role"
            className="input"
            value={roleName[defaultRoleId] ?? 'User'}
            readOnly
            disabled
            title="New users always get the User role"
          />
        </div>

        <div className="info-strip">The new user signs in on the Login page with this Username and Password.</div>

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={clearForm} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving && <span className="spinner" />}
            Create User
          </button>
        </div>
      </form>
<div className="section-gap">
  <CompanyProfileCard />
</div>
      <div className="table-card section-gap">
        <div className="report-head" style={{ background: 'var(--table-head)' }}>
          Users
        </div>
        <div className="table-scroll">
          <table className="data" style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th>Username</th>
                <th>Name</th>
                <th>Role</th>
                <th>Type</th>
                <th>Status</th>
                <th className="center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isNexus = u.auth_provider !== 'LOCAL'
                const isMe = u.id === me?.id
                return (
                  <tr key={u.id} className={u.is_active ? '' : 'row-inactive'}>
                    <td>{u.username}</td>
                    <td>{u.name}</td>
                    <td>{roleName[u.role_id] ?? u.role_id}</td>
                    <td>
                      <span className={`badge ${isNexus ? 'badge-nexus' : 'badge-inactive'}`}>{u.auth_provider}</span>
                    </td>
                    <td>
                      <span className={`badge ${u.is_active ? 'badge-active' : 'badge-inactive'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="center">
                      <div className="actions">
                        <button
                          type="button"
                          className="icon-btn icon-btn-blue"
                          aria-label="Edit user"
                          title={isNexus ? 'Nexus accounts cannot be edited here' : 'Edit'}
                          disabled={isNexus}
                          onClick={() => {
                            setModalError('')
                            setEditing({ user: u, name: u.name, username: u.username, roleId: String(u.role_id) })
                          }}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn icon-btn-blue"
                          aria-label="Reset password"
                          title={isNexus ? 'Nexus accounts cannot be edited here' : 'Reset password'}
                          disabled={isNexus}
                          onClick={() => {
                            setModalError('')
                            setResetting({ user: u, password: '' })
                          }}
                        >
                          <KeyRound size={15} />
                        </button>
                        <button
                          type="button"
                          className={`icon-btn ${u.is_active ? 'icon-btn-red' : 'icon-btn-green'}`}
                          aria-label={u.is_active ? 'Deactivate user' : 'Activate user'}
                          title={isMe ? 'You cannot deactivate your own account' : u.is_active ? 'Deactivate' : 'Activate'}
                          disabled={isNexus || (isMe && u.is_active)}
                          onClick={() => setConfirm({ user: u, activate: !u.is_active })}
                        >
                          <Power size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <TableState
          loading={loading}
          error={error}
          empty={!loading && !error && users.length === 0}
          emptyText="No users found."
          onRetry={reload}
        />
      </div>

      {editing && (
        <Modal title="Edit User" onClose={() => !busy && setEditing(null)} busy={busy}>
          <form onSubmit={handleEdit} className="stack" style={{ gap: 16 }} noValidate>
            {modalError && <div className="form-error">{modalError}</div>}
            <div className="field">
              <label htmlFor="eu-username">Username</label>
              <input
                id="eu-username"
                className="input"
                value={editing.username}
                onChange={(e) => setEditing((s) => ({ ...s, username: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="eu-name">Name</label>
              <input
                id="eu-name"
                className="input"
                value={editing.name}
                onChange={(e) => setEditing((s) => ({ ...s, name: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="eu-role">Role</label>
              <input
                id="eu-role"
                className="input"
                value={roleName[editing.roleId] ?? editing.roleId}
                readOnly
                disabled
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setEditing(null)} disabled={busy}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy && <span className="spinner" />}
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {resetting && (
        <Modal title={`Reset password: ${resetting.user.username}`} onClose={() => !busy && setResetting(null)} busy={busy}>
          <form onSubmit={handleReset} className="stack" style={{ gap: 16 }} noValidate>
            {modalError && <div className="form-error">{modalError}</div>}
            <div className="field">
              <label htmlFor="rp-pass">New Password</label>
              <PasswordInput
                id="rp-pass"
                value={resetting.password}
                onChange={(e) => setResetting((s) => ({ ...s, password: e.target.value }))}
                placeholder="Enter new password"
                autoComplete="new-password"
              />
            </div>
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>The user will be asked to change it after signing in.</p>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setResetting(null)} disabled={busy}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy && <span className="spinner" />}
                Reset Password
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.activate ? 'Activate user?' : 'Deactivate user?'}
          message={
            confirm.activate
              ? `“${confirm.user.username}” will be able to sign in again.`
              : `“${confirm.user.username}” will no longer be able to sign in.`
          }
          confirmLabel={confirm.activate ? 'Activate' : 'Deactivate'}
          danger={!confirm.activate}
          busy={busy}
          onConfirm={handleStatus}
          onCancel={() => !busy && setConfirm(null)}
        />
      )}
    </>
  )
}
