import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Pencil, Trash2, Search, EyeOff } from 'lucide-react'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import TableState from '../components/TableState'
import useAsyncData from '../hooks/useAsyncData'
import useToast from '../hooks/useToast'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/productsService'
import { getUnits } from '../services/unitsService'
import { getStock } from '../services/stockService'
import { getErrorMessage } from '../services/api'
import { formatQtyWithUnit } from '../utils/format'

const loadAll = () => Promise.all([getProducts(), getUnits(), getStock()])

export default function Products() {
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const { data, loading, error, reload } = useAsyncData(loadAll)
  const [products, units, stock] = data ?? [[], [], []]

  const nameRef = useRef(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ name: '', unitId: '', opening: '' })
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(null) // { product, name, unitId }
  const [editError, setEditError] = useState('')
  const [removing, setRemoving] = useState(null) // product pending delete
  const [hideAsk, setHideAsk] = useState(null) // product that can't be deleted (has history)
  const [showHidden, setShowHidden] = useState(false)
  const [busy, setBusy] = useState(false)

  const focusForm = useCallback(() => {
    nameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    nameRef.current?.focus()
  }, [])

  useEffect(() => {
    if (params.get('add')) {
      setParams({}, { replace: true })
      focusForm()
    }
  }, [params, setParams, focusForm])

  const unitName = useMemo(() => Object.fromEntries(units.map((u) => [u.id, u.unit_name])), [units])
  const stockById = useMemo(() => Object.fromEntries(stock.map((s) => [s.product_id, s.remaining_stock])), [stock])
  const activeUnits = units.filter((u) => u.is_active)

  // Grid shows only active products, newest first.
  const visible = useMemo(() => {
    const query = search.trim().toLowerCase()
    return products
      .filter((p) => p.is_active && p.product_name.toLowerCase().includes(query))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }, [products, search])

  // Products removed from the list (kept only because they have history).
  const hiddenProducts = useMemo(() => products.filter((p) => !p.is_active), [products])

  const handleCreate = async (e) => {
    e.preventDefault()
    const errs = {}
    const name = form.name.trim()
    if (!name) errs.name = 'Enter a product name.'
    else {
      const match = products.find((p) => p.product_name.toLowerCase() === name.toLowerCase())
      if (match) {
        errs.name = match.is_active
          ? 'This product already exists.'
          : 'This product is in Hidden products. Bring it back from there.'
      }
    }
    if (!form.unitId) errs.unitId = 'Select a unit.'
    // Opening balance is optional; when given it must be a number >= 0 with up to 3 decimals.
    if (form.opening.trim() !== '' && !/^\d+(\.\d{1,3})?$/.test(form.opening.trim()))
      errs.opening = 'Enter a number (0 or more, up to 3 decimals).'
    setFormErrors(errs)
    if (Object.keys(errs).length) return

    setSaving(true)
    try {
      const payload = { product_name: name, unit_id: Number(form.unitId) }
      if (form.opening.trim() !== '') payload.opening_stock = Number(form.opening)
      await createProduct(payload)
      toast.success(`Product "${name}" saved.`)
      setForm({ name: '', unitId: '', opening: '' })
      reload()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    const name = editing.name.trim()
    if (!name) return setEditError('Enter a product name.')
    if (!editing.unitId) return setEditError('Select a unit.')
    setEditError('')
    setBusy(true)
    try {
      await updateProduct(editing.product.id, { product_name: name, unit_id: Number(editing.unitId) })
      toast.success('Product updated.')
      setEditing(null)
      reload()
    } catch (err) {
      setEditError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  // Remove from list (active = false) or bring back (active = true).
  const setActive = async (product, active) => {
    setBusy(true)
    try {
      await updateProduct(product.id, { is_active: active })
      toast.success(
        active
          ? `"${product.product_name}" is back in the list.`
          : `"${product.product_name}" removed from the list.`
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
    const product = removing
    setBusy(true)
    try {
      await deleteProduct(product.id)
      toast.success(`Product "${product.product_name}" deleted.`)
      setRemoving(null)
      reload()
    } catch (err) {
      setRemoving(null)
      if (err.response?.status === 409) {
        // Product has stock/billing history, so it can't be deleted. Offer to remove it from the list.
        setHideAsk(product)
      } else {
        toast.error(getErrorMessage(err))
      }
    } finally {
      setBusy(false)
    }
  }

  // Units offered while editing: active ones, plus the product's current unit.
  const editUnits = editing
    ? units.filter((u) => u.is_active || u.id === editing.product.unit_id)
    : []

  return (
    <>
      <div className="page-head">
        <h1>Products</h1>
        <div className="page-head-tools">
          <label className="search-box">
            <Search size={18} />
            <input placeholder="Search Product" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          {hiddenProducts.length > 0 && (
            <button type="button" className="btn btn-outline" onClick={() => setShowHidden(true)}>
              <EyeOff size={16} /> Hidden products ({hiddenProducts.length})
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={focusForm}>
            + Add Product
          </button>
        </div>
      </div>

      <form className="card product-add" onSubmit={handleCreate} noValidate>
        <h2 className="card-title">Add Product</h2>
        <div className="inline-form">
          <div className="field">
            <label htmlFor="p-name">
              Product Name <span className="req">*</span>
            </label>
            <input
              id="p-name"
              ref={nameRef}
              className={`input ${formErrors.name ? 'invalid' : ''}`}
              placeholder="Enter product name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            {formErrors.name && <span className="field-error">{formErrors.name}</span>}
          </div>
          <div className="field">
            <label htmlFor="p-unit">
              Unit <span className="req">*</span>
            </label>
            <select
              id="p-unit"
              className={`select ${formErrors.unitId ? 'invalid' : ''}`}
              value={form.unitId}
              onChange={(e) => setForm((f) => ({ ...f, unitId: e.target.value }))}
            >
              <option value="">Select unit (e.g. Nos, Kg, Bag)</option>
              {activeUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unit_name}
                </option>
              ))}
            </select>
            {formErrors.unitId && <span className="field-error">{formErrors.unitId}</span>}
          </div>
          <div className="field">
            <label htmlFor="p-open">
              Opening Balance <span className="opt">(optional)</span>
            </label>
            <input
              id="p-open"
              inputMode="decimal"
              className={`input ${formErrors.opening ? 'invalid' : ''}`}
              placeholder="Enter opening balance (optional)"
              value={form.opening}
              onChange={(e) => setForm((f) => ({ ...f, opening: e.target.value }))}
            />
            {formErrors.opening && <span className="field-error">{formErrors.opening}</span>}
          </div>
          <button type="submit" className="btn btn-success" disabled={saving}>
            {saving && <span className="spinner" />}
            Save Product
          </button>
        </div>
      </form>

      <div className="table-card">
        <div className="table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Product Name</th>
                <th>Unit</th>
                <th className="num" style={{ textAlign: 'right' }}>
                  Current Stock
                </th>
                <th className="center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p, i) => (
                <tr key={p.id}>
                  <td>{i + 1}</td>
                  <td>{p.product_name}</td>
                  <td>{unitName[p.unit_id] ?? '—'}</td>
                  <td className="num">
                    {stockById[p.id] !== undefined
                      ? formatQtyWithUnit(stockById[p.id], unitName[p.unit_id])
                      : '—'}
                  </td>
                  <td className="center">
                    <div className="actions">
                      <button
                        type="button"
                        className="icon-btn icon-btn-blue"
                        aria-label="Edit product"
                        title="Edit"
                        onClick={() => {
                          setEditError('')
                          setEditing({ product: p, name: p.product_name, unitId: String(p.unit_id) })
                        }}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn icon-btn-red"
                        aria-label="Delete product"
                        title="Delete"
                        onClick={() => setRemoving(p)}
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
          empty={!loading && !error && visible.length === 0}
          emptyText={search ? 'No products match your search.' : 'No products yet. Add your first product above.'}
          onRetry={reload}
        />
      </div>

      {editing && (
        <Modal title="Edit Product" onClose={() => !busy && setEditing(null)} busy={busy}>
          <form onSubmit={handleEdit} className="stack" style={{ gap: 16 }} noValidate>
            {editError && <div className="form-error">{editError}</div>}
            <div className="field">
              <label htmlFor="e-name">
                Product Name <span className="req">*</span>
              </label>
              <input
                id="e-name"
                className="input"
                value={editing.name}
                onChange={(e) => setEditing((s) => ({ ...s, name: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="field">
              <label htmlFor="e-unit">
                Unit <span className="req">*</span>
              </label>
              <select
                id="e-unit"
                className="select"
                value={editing.unitId}
                onChange={(e) => setEditing((s) => ({ ...s, unitId: e.target.value }))}
              >
                {editUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.unit_name}
                  </option>
                ))}
              </select>
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

      {removing && (
        <ConfirmDialog
          title="Delete product?"
          message={`“${removing.product_name}” will be deleted.`}
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
          message={`“${hideAsk.product_name}” already has stock or bills, so it cannot be deleted. Remove it from the list instead? Your old records stay safe.`}
          confirmLabel="Remove from list"
          busy={busy}
          onConfirm={() => setActive(hideAsk, false)}
          onCancel={() => !busy && setHideAsk(null)}
        />
      )}

      {showHidden && (
        <Modal title="Hidden products" onClose={() => !busy && setShowHidden(false)} busy={busy}>
          <div className="stack" style={{ gap: 12 }}>
            {hiddenProducts.length === 0 && <p>No hidden products.</p>}
            {hiddenProducts.map((p) => (
              <div
                key={p.id}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
              >
                <span>{p.product_name}</span>
                <button
                  type="button"
                  className="btn btn-success"
                  disabled={busy}
                  onClick={() => setActive(p, true)}
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
