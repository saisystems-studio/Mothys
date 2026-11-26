import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  SlidersHorizontal,
  Pencil,
  KeyRound,
  Power,
  LayoutDashboard,
  Package,
  Layers,
  PackagePlus,
  ShoppingCart,
  Database,
  BarChart3,
  Check,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'

import { getSubscription } from '../services/subscriptionService'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import PasswordInput from '../components/PasswordInput'
import TableState from '../components/TableState'
import useAsyncData from '../hooks/useAsyncData'
import useAuth from '../hooks/useAuth'
import useToast from '../hooks/useToast'

import {
  createUser,
  getUsers,
  resetUserPassword,
  setUserStatus,
  updateUser,
} from '../services/usersService'

import { getRoles } from '../services/rolesService'
import { getErrorMessage } from '../services/api'
import CompanyProfileCard from '../components/CompanyProfileCard'

const load = () => Promise.all([getUsers(), getRoles()])

const PAGE_PERMISSIONS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'products', label: 'Products', icon: Package },
  { key: 'units', label: 'Units', icon: Layers },
  { key: 'products_in', label: 'Products IN', icon: PackagePlus },
  { key: 'billing', label: 'Billing', icon: ShoppingCart },
  { key: 'stock', label: 'Stock', icon: Database },
  { key: 'reports', label: 'Reports', icon: BarChart3 },
]

const EMPTY_PERMISSIONS = {
  dashboard: false,
  products: false,
  units: false,
  products_in: false,
  billing: false,
  stock: false,
  reports: false,
}

const normalizePermissions = (permissions) => {
  if (!permissions || typeof permissions !== 'object') {
    return { ...EMPTY_PERMISSIONS }
  }

  return Object.fromEntries(
    PAGE_PERMISSIONS.map(({ key }) => [
      key,
      permissions[key] === true,
    ])
  )
}

// =====================================================
// PERMISSION SELECTOR (card style)
// =====================================================

const PERMISSION_STYLES = `
.perm-field { grid-column: 1 / -1; gap: 4px; }

.perm-panel {
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 8px;
  padding: 8px 10px;
  background: var(--surface, #fff);
}

.perm-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.perm-chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--border, #d5dbe5);
  border-radius: 999px;
  background: transparent;
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition: background .12s, border-color .12s, color .12s;
}

.perm-chip:hover { border-color: #2563eb; }

.perm-chip input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.perm-chip:has(input:focus-visible) {
  outline: 2px solid #2563eb;
  outline-offset: 1px;
}

.perm-chip.is-on {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
}

.perm-bulk {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  font-size: 12px;
}

.perm-bulk button {
  border: 0;
  background: transparent;
  color: #2563eb;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 4px;
  cursor: pointer;
}

.perm-bulk button:hover:not(:disabled) { text-decoration: underline; }
.perm-bulk button:disabled { opacity: .4; cursor: not-allowed; }

.perm-note {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 6px;
  font-size: 11.5px;
  color: var(--muted, #64748b);
}
`

function PermissionSelector({ permissions, onChange }) {
  const selectedCount = PAGE_PERMISSIONS.filter(
    ({ key }) => permissions[key] === true
  ).length

  const allSelected = selectedCount === PAGE_PERMISSIONS.length
  const noneSelected = selectedCount === 0

  const setAll = (value) =>
    onChange(
      Object.fromEntries(
        PAGE_PERMISSIONS.map(({ key }) => [key, value])
      )
    )

  return (
    <div className="field perm-field">
      <style>{PERMISSION_STYLES}</style>

      <label>
        Page Permissions{' '}
        <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 12 }}>
          ({selectedCount}/{PAGE_PERMISSIONS.length})
        </span>
      </label>

      <div className="perm-panel">
        <div className="perm-row">
          {PAGE_PERMISSIONS.map(({ key, label, icon: Icon }) => {
            const checked = permissions[key] === true

            return (
              <label
                key={key}
                className={`perm-chip ${checked ? 'is-on' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) =>
                    onChange({
                      ...permissions,
                      [key]: e.target.checked,
                    })
                  }
                />

                {checked ? <Check size={13} strokeWidth={3} /> : <Icon size={13} />}
                <span>{label}</span>
              </label>
            )
          })}

          <span className="perm-bulk">
            <button
              type="button"
              onClick={() => setAll(true)}
              disabled={allSelected}
            >
              Select all
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => setAll(false)}
              disabled={noneSelected}
            >
              Clear
            </button>
          </span>
        </div>

        <div className="perm-note">
          <ShieldCheck size={12} />
          Settings access is reserved for the registered Admin.
        </div>
      </div>
    </div>
  )
}

const SUB_STYLES = `
.sub-card {
  width: 100%;
  margin-top: 12px;
  background: var(--surface, #fff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 10px;
  padding: 12px 16px;
}

.sub-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.sub-title {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: .01em;
}

.sub-refresh {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 11px;
  border: 1px solid var(--border, #d5dbe5);
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background .12s, border-color .12s, color .12s;
}

.sub-refresh:hover:not(:disabled) {
  border-color: #2563eb;
  color: #2563eb;
  background: #eff6ff;
}

.sub-refresh:disabled { opacity: .55; cursor: not-allowed; }
.sub-refresh.spin svg { animation: sub-spin .8s linear infinite; }

@keyframes sub-spin { to { transform: rotate(360deg); } }

.sub-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 8px;
}

.sub-item {
  padding: 8px 12px;
  border: 1px solid var(--border, #e8edf3);
  border-radius: 8px;
  background: #f8fafc;
  min-width: 0;
}

.sub-item span {
  display: block;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .04em;
  color: var(--muted, #64748b);
  margin-bottom: 2px;
}

.sub-item strong {
  display: block;
  font-size: 13.5px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sub-msg {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
}

.sub-msg.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
}

.sub-msg.loading {
  background: #f8fafc;
  border: 1px solid var(--border, #e8edf3);
  color: var(--muted, #64748b);
}

.sub-msg .sub-retry {
  margin-left: auto;
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 12.5px;
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
}
`

export default function Settings() {
  const toast = useToast()
  const navigate = useNavigate()
  const { user: me } = useAuth()

  const [subscription, setSubscription] = useState(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)
  const [subscriptionError, setSubscriptionError] = useState('')

  const loadSubscription = async () => {
    setSubscriptionLoading(true)
    setSubscriptionError('')

    try {
      const result = await getSubscription()
      setSubscription(result)
    } catch (error) {
      setSubscriptionError('Unable to load subscription details.')
    } finally {
      setSubscriptionLoading(false)
    }
  }

  useEffect(() => {
    loadSubscription()
  }, [])

  const { data, loading, error, reload } = useAsyncData(load)
  const [users, roles] = data ?? [[], []]

  const roleName = useMemo(
    () => Object.fromEntries(
      roles.map((r) => [r.id, r.role_name])
    ),
    [roles]
  )

  const defaultRoleId = String(
    roles.find(
      (r) => r.role_name.toLowerCase() === 'user'
    )?.id ?? ''
  )

  const [form, setForm] = useState({
    username: '',
    password: '',
    permissions: { ...EMPTY_PERMISSIONS },
  })

  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const [editing, setEditing] = useState(null)
  const [resetting, setResetting] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const [modalError, setModalError] = useState('')
  const [busy, setBusy] = useState(false)

  // =====================================================
  // CREATE USER
  // =====================================================

  const handleCreate = async (e) => {
    e.preventDefault()

    const errs = {}
    const username = form.username.trim()

    if (!username) {
      errs.username = 'Enter a username.'
    } else if (
      users.some(
        (u) => u.username.toLowerCase() === username.toLowerCase()
      )
    ) {
      errs.username = 'This username already exists.'
    }

    if (!form.password) {
      errs.password = 'Enter a password.'
    }

    setErrors(errs)

    if (Object.keys(errs).length) return

    if (!defaultRoleId) {
      toast.error(
        'The "User" role was not found. Please contact support.'
      )
      return
    }

    setSaving(true)

    try {
      await createUser({
        username,
        name: username,
        password: form.password,
        role_id: Number(defaultRoleId),
        permissions: normalizePermissions(form.permissions),
      })

      toast.success(`User "${username}" created.`)

      setForm({
        username: '',
        password: '',
        permissions: { ...EMPTY_PERMISSIONS },
      })

      setErrors({})
      reload()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const clearForm = () => {
    setForm({
      username: '',
      password: '',
      permissions: { ...EMPTY_PERMISSIONS },
    })

    setErrors({})
    navigate('/dashboard')
  }

  // =====================================================
  // EDIT USER
  // =====================================================

  const handleEdit = async (e) => {
    e.preventDefault()

    const name = editing.name.trim()
    const username = editing.username.trim()

    if (!name || !username) {
      return setModalError('Name and username are required.')
    }

    setBusy(true)
    setModalError('')

    try {
      await updateUser(editing.user.id, {
        name,
        username,
        role_id: Number(editing.roleId),
        permissions: normalizePermissions(editing.permissions),
      })

      toast.success('User updated.')
      setEditing(null)
      reload()
    } catch (err) {
      setModalError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  // =====================================================
  // RESET PASSWORD
  // =====================================================

  const handleReset = async (e) => {
    e.preventDefault()

    if (!resetting.password) {
      return setModalError('Enter a new password.')
    }

    setBusy(true)
    setModalError('')

    try {
      await resetUserPassword(
        resetting.user.id,
        resetting.password
      )

      toast.success(
        `Password reset for "${resetting.user.username}". They must change it at next login.`
      )

      setResetting(null)
      reload()
    } catch (err) {
      setModalError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  // =====================================================
  // ACTIVATE / DEACTIVATE USER
  // =====================================================

  const handleStatus = async () => {
    setBusy(true)

    try {
      await setUserStatus(
        confirm.user.id,
        confirm.activate
      )

      toast.success(
        `User "${confirm.user.username}" ${
          confirm.activate ? 'activated' : 'deactivated'
        }.`
      )

      setConfirm(null)
      reload()
    } catch (err) {
      toast.error(getErrorMessage(err))
      setConfirm(null)
    } finally {
      setBusy(false)
    }
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <>
      <div className="settings-top">
        <div className="crumbs">
          <SlidersHorizontal size={24} />
          <span>Settings</span>
          <span className="sep">&gt;</span>
          <span>Create User</span>
        </div>

        <div className="sub-card">
          <style>{SUB_STYLES}</style>

          <div className="sub-head">
            <span className="sub-title">Subscription Details</span>

            <button
              type="button"
              className={`sub-refresh ${subscriptionLoading ? 'spin' : ''}`}
              onClick={loadSubscription}
              disabled={subscriptionLoading}
            >
              <RefreshCw size={13} />
              Refresh
            </button>
          </div>

          {subscriptionLoading ? (
            <div className="sub-msg loading">
              Loading subscription...
            </div>
          ) : subscriptionError ? (
            <div className="sub-msg error" role="alert">
              <AlertCircle size={16} />
              {subscriptionError}

              <button
                type="button"
                className="sub-retry"
                onClick={loadSubscription}
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="sub-grid">
              <div className="sub-item">
                <span>License</span>
                <strong>{subscription?.license_type || 'N/A'}</strong>
              </div>

              <div className="sub-item">
                <span>Status</span>
                <strong>{subscription?.status || 'N/A'}</strong>
              </div>

              <div className="sub-item">
                <span>Activation</span>
                <strong>
                  {subscription?.starts_at
                    ? new Date(subscription.starts_at).toLocaleString(
                        'en-IN',
                        { timeZone: 'Asia/Kolkata' }
                      )
                    : 'N/A'}
                </strong>
              </div>

              <div className="sub-item">
                <span>Expiry</span>
                <strong>
                  {subscription?.expires_at
                    ? new Date(
                        subscription.expires_at
                      ).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }) + ' IST'
                    : 'Lifetime / No expiry'}
                </strong>
              </div>

              <div className="sub-item">
                <span>Remaining Days</span>
                <strong>
                  {subscription?.remaining_days ?? 'Unlimited / N/A'}
                </strong>
              </div>

              <div className="sub-item">
                <span>Authorized Devices</span>
                <strong>
                  {subscription?.active_devices ?? 0}
                  {' / '}
                  {subscription?.device_limit ?? 'N/A'}
                </strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CREATE USER FORM */}

      <form
        className="card user-form"
        onSubmit={handleCreate}
        noValidate
      >
        <div className="field">
          <label htmlFor="u-name">
            Username <span className="req">*</span>
          </label>

          <input
            id="u-name"
            className={`input ${errors.username ? 'invalid' : ''}`}
            placeholder="Enter username"
            value={form.username}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                username: e.target.value,
              }))
            }
            autoComplete="off"
          />

          {errors.username && (
            <span className="field-error">
              {errors.username}
            </span>
          )}
        </div>

        <div className="field">
          <label htmlFor="u-pass">
            Password <span className="req">*</span>
          </label>

          <PasswordInput
            id="u-pass"
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                password: e.target.value,
              }))
            }
            autoComplete="new-password"
            invalid={Boolean(errors.password)}
          />

          {errors.password && (
            <span className="field-error">
              {errors.password}
            </span>
          )}
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

        <PermissionSelector
          permissions={form.permissions}
          onChange={(permissions) =>
            setForm((current) => ({
              ...current,
              permissions,
            }))
          }
        />

        <div className="info-strip">
          The new user signs in on the Login page with this Username and Password.
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={clearForm}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving && <span className="spinner" />}
            Create User
          </button>
        </div>
      </form>

      {/* COMPANY PROFILE */}

      <div className="section-gap">
        <CompanyProfileCard />
      </div>

      {/* USERS TABLE */}

      <div className="table-card section-gap">
        <div
          className="report-head"
          style={{ background: 'var(--table-head)' }}
        >
          Users
        </div>

        <div className="table-scroll">
          <table
            className="data"
            style={{ minWidth: 720 }}
          >
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
                  <tr
                    key={u.id}
                    className={u.is_active ? '' : 'row-inactive'}
                  >
                    <td>{u.username}</td>
                    <td>{u.name}</td>
                    <td>{roleName[u.role_id] ?? u.role_id}</td>

                    <td>
                      <span
                        className={`badge ${
                          isNexus
                            ? 'badge-nexus'
                            : 'badge-inactive'
                        }`}
                      >
                        {u.auth_provider}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          u.is_active
                            ? 'badge-active'
                            : 'badge-inactive'
                        }`}
                      >
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="center">
                      <div className="actions">
                        <button
                          type="button"
                          className="icon-btn icon-btn-blue"
                          aria-label="Edit user"
                          title={
                            isNexus
                              ? 'Nexus accounts cannot be edited here'
                              : 'Edit'
                          }
                          disabled={isNexus}
                          onClick={() => {
                            setModalError('')

                            setEditing({
                              user: u,
                              name: u.name,
                              username: u.username,
                              roleId: String(u.role_id),
                              permissions: normalizePermissions(
                                u.permissions
                              ),
                            })
                          }}
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          type="button"
                          className="icon-btn icon-btn-blue"
                          aria-label="Reset password"
                          title={
                            isNexus
                              ? 'Nexus accounts cannot be edited here'
                              : 'Reset password'
                          }
                          disabled={isNexus}
                          onClick={() => {
                            setModalError('')
                            setResetting({
                              user: u,
                              password: '',
                            })
                          }}
                        >
                          <KeyRound size={15} />
                        </button>

                        <button
                          type="button"
                          className={`icon-btn ${
                            u.is_active
                              ? 'icon-btn-red'
                              : 'icon-btn-green'
                          }`}
                          aria-label={
                            u.is_active
                              ? 'Deactivate user'
                              : 'Activate user'
                          }
                          title={
                            isMe
                              ? 'You cannot deactivate your own account'
                              : u.is_active
                                ? 'Deactivate'
                                : 'Activate'
                          }
                          disabled={
                            isNexus || (isMe && u.is_active)
                          }
                          onClick={() =>
                            setConfirm({
                              user: u,
                              activate: !u.is_active,
                            })
                          }
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

      {/* EDIT USER MODAL */}

      {editing && (
        <Modal
          title="Edit User"
          onClose={() => !busy && setEditing(null)}
          busy={busy}
        >
          <form
            onSubmit={handleEdit}
            className="stack"
            style={{ gap: 16 }}
            noValidate
          >
            {modalError && (
              <div className="form-error">
                {modalError}
              </div>
            )}

            <div className="field">
              <label htmlFor="eu-username">Username</label>

              <input
                id="eu-username"
                className="input"
                value={editing.username}
                onChange={(e) =>
                  setEditing((s) => ({
                    ...s,
                    username: e.target.value,
                  }))
                }
              />
            </div>

            <div className="field">
              <label htmlFor="eu-name">Name</label>

              <input
                id="eu-name"
                className="input"
                value={editing.name}
                onChange={(e) =>
                  setEditing((s) => ({
                    ...s,
                    name: e.target.value,
                  }))
                }
              />
            </div>

            <div className="field">
              <label htmlFor="eu-role">Role</label>

              <input
                id="eu-role"
                className="input"
                value={
                  roleName[editing.roleId] ?? editing.roleId
                }
                readOnly
                disabled
              />
            </div>

            <PermissionSelector
              permissions={editing.permissions}
              onChange={(permissions) =>
                setEditing((current) => ({
                  ...current,
                  permissions,
                }))
              }
            />

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setEditing(null)}
                disabled={busy}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={busy}
              >
                {busy && <span className="spinner" />}
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* RESET PASSWORD MODAL */}

      {resetting && (
        <Modal
          title={`Reset password: ${resetting.user.username}`}
          onClose={() => !busy && setResetting(null)}
          busy={busy}
        >
          <form
            onSubmit={handleReset}
            className="stack"
            style={{ gap: 16 }}
            noValidate
          >
            {modalError && (
              <div className="form-error">
                {modalError}
              </div>
            )}

            <div className="field">
              <label htmlFor="rp-pass">New Password</label>

              <PasswordInput
                id="rp-pass"
                value={resetting.password}
                onChange={(e) =>
                  setResetting((s) => ({
                    ...s,
                    password: e.target.value,
                  }))
                }
                placeholder="Enter new password"
                autoComplete="new-password"
              />
            </div>

            <p
              style={{
                color: 'var(--muted)',
                fontSize: 13,
              }}
            >
              The user will be asked to change it after signing in.
            </p>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setResetting(null)}
                disabled={busy}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={busy}
              >
                {busy && <span className="spinner" />}
                Reset Password
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ACTIVATE / DEACTIVATE CONFIRMATION */}

      {confirm && (
        <ConfirmDialog
          title={
            confirm.activate
              ? 'Activate user?'
              : 'Deactivate user?'
          }
          message={
            confirm.activate
              ? `“${confirm.user.username}” will be able to sign in again.`
              : `“${confirm.user.username}” will no longer be able to sign in.`
          }
          confirmLabel={
            confirm.activate ? 'Activate' : 'Deactivate'
          }
          danger={!confirm.activate}
          busy={busy}
          onConfirm={handleStatus}
          onCancel={() => !busy && setConfirm(null)}
        />
      )}
    </>
  )
}
