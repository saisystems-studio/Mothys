import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Pencil, Trash2, EyeOff, Search } from 'lucide-react'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import TableState from '../components/TableState'
import useAsyncData from '../hooks/useAsyncData'
import useToast from '../hooks/useToast'
import { createUnit, getUnits, updateUnit, deleteUnit } from '../services/unitsService'
import { getErrorMessage } from '../services/api'

export default function Units() {
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const { data: units, loading, error, reload } = useAsyncData(getUnits)

  // modal: null | { mode: 'add' } | { mode: 'edit', unit }
  const [modal, setModal] = useState(() => (params.get('add') ? { mode: 'add' } : null))
  const [removing, setRemoving] = useState(null) // unit pending delete
  const [hideAsk, setHideAsk] = useState(null) // unit that can't be deleted (in use)
  const [showHidden, setShowHidden] = useState(false)
  const [search, setSearch] = useState('')
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (params.get('add')) setParams({}, { replace: true })
  }, [params, setParams])

  const openAdd = () => {
    setName('')
    setNameError('')
    setModal({ mode: 'add' })
  }
  const openEdit = (unit) => {
    setName(unit.unit_name)
    setNameError('')
    setModal({ mode: 'edit', unit })
  }
  const closeModal = () => !busy && setModal(null)

  // Grid shows only active units that match the search, newest first.
  const visibleUnits = useMemo(() => {
    const query = search.trim().toLowerCase()
    return (units ?? [])
      .filter((u) => u.is_active && u.unit_name.toLowerCase().includes(query))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }, [units, search])

  // Units removed from the list (kept only because products/bills use them).
  const hiddenUnits = useMemo(() => (units ?? []).filter((u) => !u.is_active), [units])

  const handleSave = async (e) => {
    e.preventDefault()
    const value = name.trim()
    const ignoreId = modal.mode === 'edit' ? modal.unit.id : undefined
    if (!value) return setNameError('Enter a unit name.')

    const match = (units ?? []).find(
      (u) => u.id !== ignoreId && u.unit_name.toLowerCase() === value.toLowerCase()
    )
    if (match) {
      return setNameError(
        match.is_active
          ? 'This unit already exists.'
          : 'This unit is in Hidden units. Bring it back from there.'
      )
    }

    setNameError('')
    setBusy(true)
    try {
      if (modal.mode === 'add') {
        await createUnit(value)
        toast.success(`Unit "${value}" added.`)
      } else {
        await updateUnit(modal.unit.id, { unit_name: value })
        toast.success('Unit updated.')
      }
      setModal(null)
      reload()
    } catch (err) {
      setNameError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  // Remove from list (active = false) or bring back (active = true).
  const setActive = async (unit, active) => {
    setBusy(true)
    try {
      await updateUnit(unit.id, { is_active: active })
      toast.success(
        active
          ? `"${unit.unit_name}" is back in the list.`
          : `"${unit.unit_name}" removed from the list.`
      )
      setHideAsk(null)
      reload()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    const unit = removing
    setBusy(true)
    try {
      await deleteUnit(unit.id)
      toast.success(`Unit "${unit.unit_name}" deleted.`)
      setRemoving(null)
      reload()
    } catch (err) {
      setRemoving(null)
      if (err.response?.status === 409) {
        // Unit is used by products or bills, so it can't be deleted. Offer to remove it from the list.
        setHideAsk(unit)
      } else {
        toast.error(getErrorMessage(err))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Units</h1>
        <div className="page-head-tools">
          <label className="search-box">
            <Search size={18} />
            <input placeholder="Search Unit" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          {hiddenUnits.length > 0 && (
            <button type="button" className="btn btn-outline" onClick={() => setShowHidden(true)}>
              <EyeOff size={16} /> Hidden units ({hiddenUnits.length})
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={openAdd}>
            + Add Unit
          </button>
        </div>
      </div>

      <div className="table-card">
        <div className="table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th style={{ width: 160 }}>S.No</th>
                <th>Unit Name</th>
                <th className="center" style={{ width: 220 }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleUnits.map((unit, i) => (
                <tr key={unit.id}>
                  <td>{i + 1}</td>
                  <td>{unit.unit_name}</td>
                  <td className="center">
                    <div className="actions">
                      <button
                        type="button"
                        className="icon-btn icon-btn-blue"
                        onClick={() => openEdit(unit)}
                        aria-label="Edit unit"
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn icon-btn-red"
                        onClick={() => setRemoving(unit)}
                        aria-label="Delete unit"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TableState
          loading={loading}
          error={error}
          empty={!loading && !error && visibleUnits.length === 0}
          emptyText={search ? 'No units match your search.' : 'No units yet. Click “+ Add Unit” to create one.'}
          onRetry={reload}
        />
      </div>

      {modal && (
        <Modal title={modal.mode === 'add' ? 'Add Unit' : 'Edit Unit'} onClose={closeModal} busy={busy}>
          <form onSubmit={handleSave} className="stack" style={{ gap: 16 }} noValidate>
            <div className="field">
              <label htmlFor="unit-name">
                Unit Name <span className="req">*</span>
              </label>
              <input
                id="unit-name"
                className={`input ${nameError ? 'invalid' : ''}`}
                placeholder="e.g. Nos, Kg, Bag"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              {nameError && <span className="field-error">{nameError}</span>}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={closeModal} disabled={busy}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy && <span className="spinner" />}
                {modal.mode === 'add' ? 'Add Unit' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {removing && (
        <ConfirmDialog
          title="Delete unit?"
          message={`“${removing.unit_name}” will be deleted.`}
          confirmLabel="Delete"
          danger
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => !busy && setRemoving(null)}
        />
      )}

      {hideAsk && (
        <ConfirmDialog
          title="Cannot delete"
          message={`“${hideAsk.unit_name}” is already used by products or bills, so it cannot be deleted. Remove it from the list instead? Existing products keep their unit and your old records stay safe.`}
          confirmLabel="Remove from list"
          busy={busy}
          onConfirm={() => setActive(hideAsk, false)}
          onCancel={() => !busy && setHideAsk(null)}
        />
      )}

      {showHidden && (
        <Modal title="Hidden units" onClose={() => !busy && setShowHidden(false)} busy={busy}>
          <div className="stack" style={{ gap: 12 }}>
            {hiddenUnits.length === 0 && <p>No hidden units.</p>}
            {hiddenUnits.map((u) => (
              <div
                key={u.id}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
              >
                <span>{u.unit_name}</span>
                <button
                  type="button"
                  className="btn btn-success"
                  disabled={busy}
                  onClick={() => setActive(u, true)}
                >
                  Bring back
                </button>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </>
  )
}
