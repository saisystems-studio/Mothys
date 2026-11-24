import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useSearchParams } from 'react-router-dom'

import { Pencil, Trash2, Download, Search, EyeOff } from 'lucide-react'

import Modal from '../components/Modal'

import TableState from '../components/TableState'

import useAsyncData from '../hooks/useAsyncData'

import useToast from '../hooks/useToast'

import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../services/productsService'

import { getUnits } from '../services/unitsService'

import {
  getStock,
  createStockEntry,
} from '../services/stockService'

import { getErrorMessage } from '../services/api'

import { formatQtyWithUnit } from '../utils/format'


const loadAll = () => Promise.all([
  getProducts(),
  getUnits(),
  getStock(),
])


const NUM_RE = /^\d+(\.\d{1,3})?$/


// Normalise whatever the backend returns into an array of unit ids.
const getUnitIds = (p) => {
  if (Array.isArray(p.unit_ids)) return p.unit_ids.map(Number)

  if (Array.isArray(p.units)) {
    return p.units.map((u) => Number(u?.id ?? u))
  }

  return p.unit_id != null ? [Number(p.unit_id)] : []
}


// Checkbox chips for choosing one or more units.
function UnitPicker({ id, units, value, onChange, invalid, locked = [] }) {
  const toggle = (uid) => {
    if (locked.includes(uid)) return

    onChange(
      value.includes(uid)
        ? value.filter((x) => x !== uid)
        : [...value, uid],
    )
  }

  if (units.length === 0) {
    return (
      <span className="field-error">
        No units available. Add a unit first.
      </span>
    )
  }

  return (
    <div
      id={id}
      role="group"
      className={invalid ? 'invalid' : ''}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        padding: 6,
        border: invalid ? '1px solid #dc2626' : '1px solid transparent',
        borderRadius: 8,
      }}
    >
      {units.map((u) => {
        const checked = value.includes(u.id)
        const isLocked = locked.includes(u.id)

        return (
          <label
            key={u.id}
            title={
              isLocked
                ? 'This unit already has stock, so it cannot be removed.'
                : undefined
            }
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 999,
              cursor: isLocked ? 'not-allowed' : 'pointer',
              opacity: isLocked ? 0.75 : 1,
              userSelect: 'none',
              fontSize: 14,
              border: `1px solid ${checked ? '#2563eb' : '#cbd5e1'}`,
              background: checked ? '#eff6ff' : 'transparent',
              color: checked ? '#1d4ed8' : 'inherit',
            }}
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={isLocked}
              onChange={() => toggle(u.id)}
              style={{ accentColor: '#2563eb' }}
            />

            {u.unit_name}
          </label>
        )
      })}
    </div>
  )
}


export default function Products() {
  const toast = useToast()

  const [params, setParams] = useSearchParams()

  const { data, loading, error, reload } = useAsyncData(loadAll)

  const [products, units, stock] = data ?? [[], [], []]

  const nameRef = useRef(null)

  const [search, setSearch] = useState('')

  const [form, setForm] = useState({
    name: '',
    unitId: '',
    opening: '',
  })

  const [formErrors, setFormErrors] = useState({})

  const [saving, setSaving] = useState(false)

  const [showHidden, setShowHidden] = useState(false)

  // { product, name, unitIds, openings: { [unitId]: 'text' } }
  const [editing, setEditing] = useState(null)

  const [editError, setEditError] = useState('')

  const [removing, setRemoving] = useState(null) // product chosen for delete / hide

  const [removeError, setRemoveError] = useState('')

  const [busy, setBusy] = useState(false)


  // Product-name suggestions.
  const [suggestOpen, setSuggestOpen] = useState(false)

  const [suggestIndex, setSuggestIndex] = useState(-1)


  const focusForm = useCallback(() => {
    nameRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })

    nameRef.current?.focus()
  }, [])


  useEffect(() => {
    if (params.get('add')) {
      setParams({}, { replace: true })
      focusForm()
    }
  }, [params, setParams, focusForm])


  const unitName = useMemo(
    () => Object.fromEntries(
      units.map((u) => [u.id, u.unit_name]),
    ),
    [units],
  )


  // Stock grouped by product.
  const stockByProduct = useMemo(() => {
    const map = {}

    stock.forEach((s) => {
      ;(map[s.product_id] ??= []).push(s)
    })

    return map
  }, [stock])


  const activeUnits = units.filter((u) => u.is_active)


  // Active products, newest first.
  const visible = useMemo(() => {
    const query = search.trim().toLowerCase()

    return products
      .filter(
        (p) =>
          p.is_active &&
          p.product_name.toLowerCase().includes(query),
      )
      .sort(
        (a, b) =>
          new Date(b.created_at) - new Date(a.created_at),
      )
  }, [products, search])


  // Hidden products.
  const hiddenProducts = useMemo(
    () => products.filter((p) => !p.is_active),
    [products],
  )


  // Product-name suggestions.
  const suggestions = useMemo(() => {
    const q = form.name.trim().toLowerCase()

    return products
      .filter(
        (p) =>
          p.is_active &&
          (q === '' || p.product_name.toLowerCase().includes(q)),
      )
      .sort((a, b) =>
        a.product_name.localeCompare(b.product_name),
      )
      .slice(0, 50)
  }, [products, form.name])


  const pickSuggestion = (p) => {
    setForm((f) => ({
      ...f,
      name: p.product_name,
    }))

    setFormErrors((errs) => ({
      ...errs,
      name: undefined,
    }))

    setSuggestOpen(false)
    setSuggestIndex(-1)
  }


  const onNameKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()

      setSuggestOpen(true)

      setSuggestIndex((i) =>
        Math.min(i + 1, suggestions.length - 1),
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()

      setSuggestIndex((i) => Math.max(i - 1, 0))
    } else if (
      e.key === 'Enter' &&
      suggestOpen &&
      suggestIndex >= 0 &&
      suggestions[suggestIndex]
    ) {
      e.preventDefault()

      pickSuggestion(suggestions[suggestIndex])
    } else if (e.key === 'Escape') {
      setSuggestOpen(false)
    }
  }


  // Existing product matching the typed name.
  const typedMatch = useMemo(() => {
    const name = form.name.trim().toLowerCase()

    return name
      ? products.find(
          (p) => p.product_name.toLowerCase() === name,
        )
      : null
  }, [products, form.name])


  // Create product or add another unit.
  const handleCreate = async (e) => {
    e.preventDefault()

    const errs = {}

    const name = form.name.trim()

    const match = typedMatch

    const openingText = form.opening.trim()


    if (!name) {
      errs.name = 'Enter a product name.'
    }

    if (!form.unitId) {
      errs.unitId = 'Select a unit.'
    }


    // Same visible product: only a new unit is allowed.
    // (A hidden product is simply brought back, so it is not blocked.)
    if (match && match.is_active && form.unitId) {
      if (getUnitIds(match).includes(Number(form.unitId))) {
        errs.unitId =
          'This product already has this unit. Pick a different unit to add.'
      }
    }


    // Opening balance validation.
    if (
      openingText !== '' &&
      !NUM_RE.test(openingText)
    ) {
      errs.opening =
        'Enter a number (0 or more, up to 3 decimals).'
    }


    setFormErrors(errs)

    if (Object.keys(errs).length) return


    setSaving(true)

    try {
      if (match) {
        // Existing product: add the new unit, and bring it back if it was hidden.
        const existing = getUnitIds(match)

        const hasUnit = existing.includes(Number(form.unitId))

        const changes = {}

        if (!match.is_active) changes.is_active = true

        if (!hasUnit) {
          changes.unit_ids = [
            match.unit_id,
            ...existing.filter((id) => id !== match.unit_id),
            Number(form.unitId),
          ]
        }

        if (Object.keys(changes).length) {
          await updateProduct(match.id, changes)
        }


        // Opening balance for the new unit.
        if (
          openingText !== '' &&
          Number(openingText) > 0
        ) {
          try {
            await createStockEntry(
              match.id,
              Number(openingText),
              Number(form.unitId),
            )
          } catch (err) {
            toast.error(
              `Unit added, but opening balance failed: ${getErrorMessage(err)}`,
            )
          }
        }

        toast.success(
          match.is_active
            ? `Unit added to "${match.product_name}".`
            : `"${match.product_name}" is back in the list.`,
        )
      } else {
        const payload = {
          product_name: name,
          unit_ids: [Number(form.unitId)],
        }

        if (openingText !== '') {
          payload.opening_stock = Number(openingText)
        }

        await createProduct(payload)

        toast.success(`Product "${name}" saved.`)
      }


      setForm({
        name: '',
        unitId: '',
        opening: '',
      })

      setFormErrors({})

      setSuggestOpen(false)

      reload()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }


  // Units that already hold stock cannot be removed.
  const lockedUnitIds = editing
    ? (stockByProduct[editing.product.id] ?? [])
        .filter((s) => Number(s.remaining_stock) !== 0)
        .map((s) => Number(s.unit_id))
    : []


  // Selected units that hold no stock yet: an opening balance can be set
  // for them (or simply left empty to skip it).
  const openingUnitIds = editing
    ? editing.unitIds.filter((id) => !lockedUnitIds.includes(Number(id)))
    : []


  // Save name / unit changes (and optional opening balances).
  // Updates show on every page.
  const handleEdit = async (e) => {
    e.preventDefault()

    const name = editing.name.trim()

    if (!name) return setEditError('Enter a product name.')

    if (editing.unitIds.length === 0) {
      return setEditError('Select at least one unit.')
    }

    const clash = products.find(
      (p) =>
        p.id !== editing.product.id &&
        p.product_name.toLowerCase() === name.toLowerCase(),
    )

    if (clash) return setEditError('Another product already has this name.')


    // Validate the opening balances typed for the selected units.
    for (const uid of openingUnitIds) {
      const text = (editing.openings[uid] ?? '').trim()

      if (text !== '' && !NUM_RE.test(text)) {
        return setEditError(
          `Opening balance for ${unitName[uid] ?? 'unit'}: enter a number (0 or more, up to 3 decimals).`,
        )
      }
    }

    setEditError('')
    setBusy(true)

    try {
      // Keep the default unit first if it is still selected.
      const primary = editing.product.unit_id
      const ids = editing.unitIds.map(Number)
      const ordered = ids.includes(primary)
        ? [primary, ...ids.filter((id) => id !== primary)]
        : ids

      await updateProduct(editing.product.id, {
        product_name: name,
        unit_ids: ordered,
      })


      // Opening balances (only the ones that were filled in).
      let openingFailed = null

      for (const uid of openingUnitIds) {
        const text = (editing.openings[uid] ?? '').trim()

        if (text === '' || Number(text) <= 0) continue

        try {
          await createStockEntry(
            editing.product.id,
            Number(text),
            Number(uid),
          )
        } catch (err) {
          openingFailed = getErrorMessage(err)
        }
      }

      if (openingFailed) {
        toast.error(
          `Product updated, but opening balance failed: ${openingFailed}`,
        )
      } else {
        toast.success('Product updated.')
      }

      setEditing(null)
      reload()
    } catch (err) {
      setEditError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }


  // Units offered while editing: active ones plus any the product already has.
  const editUnits = editing
    ? units.filter((u) => u.is_active || editing.unitIds.includes(u.id))
    : []


  // Permanently delete. Products with stock or bills are refused by the backend.
  const handleDelete = async () => {
    const product = removing

    setRemoveError('')
    setBusy(true)

    try {
      await deleteProduct(product.id)

      toast.success(`Product "${product.product_name}" deleted.`)
      setRemoving(null)
      reload()
    } catch (err) {
      if (err.response?.status === 409) {
        setRemoveError(
          'This product already has stock or bills, so it cannot be deleted. Use Hide product instead. Your old records stay safe.',
        )
      } else {
        setRemoveError(getErrorMessage(err))
      }
    } finally {
      setBusy(false)
    }
  }


  // Stock row of one unit of a product.
  const stockRowFor = (p, unitId) =>
    (stockByProduct[p.id] ?? []).find(
      (s) => Number(s.unit_id) === Number(unitId),
    )


  // Stock of one unit of a product, formatted with its unit name.
  const stockFor = (p, unitId) => {
    const row = stockRowFor(p, unitId)

    return formatQtyWithUnit(
      row ? row.remaining_stock : 0,
      unitName[unitId],
    )
  }


  // One row per product. Units and stocks are joined with " / ".
  const rows = useMemo(
    () =>
      visible.map((p) => ({
        product: p,
        unitIds: getUnitIds(p),
      })),
    [visible],
  )


  // Download the rows shown in the grid as a CSV file (opens in Excel).
  const exportCsv = () => {
    if (rows.length === 0) {
      toast.error('Nothing to export.')
      return
    }

    const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`

    const lines = [['S.No', 'Product Name', 'Unit', 'Current Stock']]

    rows.forEach(({ product: p, unitIds }, i) => {
      const unitsText = unitIds.length
        ? unitIds.map((id) => unitName[id] ?? '').join(' / ')
        : ''

      const stockText = unitIds.length
        ? unitIds
            .map((id) => {
              const row = stockRowFor(p, id)

              return `${row ? Number(row.remaining_stock) : 0} ${unitName[id] ?? ''}`.trim()
            })
            .join(' / ')
        : ''

      lines.push([i + 1, p.product_name, unitsText, stockText])
    })

    const csv = '\uFEFF' + lines.map((l) => l.map(cell).join(',')).join('\r\n')

    const url = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
    )

    const a = document.createElement('a')
    a.href = url
    a.download = `products-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }


  // Hide or bring back products.
  const setActive = async (product, active) => {
    setBusy(true)

    try {
      await updateProduct(product.id, {
        is_active: active,
      })

      if (!active) {
        setEditing(null)
        setRemoving(null)
      }

      toast.success(
        active
          ? `"${product.product_name}" is back in the list.`
          : `"${product.product_name}" moved to Hidden products.`,
      )

      reload()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }


  // Display helpers.
  const unitNamesOf = (p) => {
    const names = getUnitIds(p)
      .map((id) => unitName[id])
      .filter(Boolean)

    return names.length ? names.join(', ') : '—'
  }


  return (
    <>
      <style>{`
        .name-search {
          position: relative;
          width: 100%;
        }

        .name-search > svg {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #8a97ad;
          pointer-events: none;
        }

        .name-search .input {
          padding-left: 42px;
        }

        .suggest-list {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          z-index: 30;
          max-height: 240px;
          margin: 0;
          padding: 4px;
          overflow-y: auto;
          list-style: none;
          background: #fff;
          border: 1px solid #d9e1ed;
          border-radius: 10px;
          box-shadow: 0 10px 28px rgba(15, 30, 66, .14);
        }

        .suggest-head {
          padding: 6px 10px 4px;
          color: #8a97ad;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .04em;
          text-transform: uppercase;
        }

        .suggest-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          width: 100%;
          padding: 9px 10px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #253653;
          font-size: 14px;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
        }

        .suggest-item:hover,
        .suggest-item.active {
          background: #eef3ff;
          color: #1d4ed8;
        }

        .suggest-item small {
          color: #8a97ad;
          font-size: 12px;
          font-weight: 600;
        }

        .field-hint {
          color: #64748b;
          font-size: 12px;
          font-weight: 600;
        }

        .unit-sep {
          color: #8a97ad;
          font-weight: 400;
          padding: 0 4px;
        }

        .opening-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
        }

        .opening-grid .opening-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .opening-grid .opening-item span {
          color: #64748b;
          font-size: 12px;
          font-weight: 700;
        }
      `}</style>


      <div className="page-head">
        <h1>Products</h1>

        <div className="page-head-tools">
          <label className="search-box">
            <Search size={18} />

            <input
              placeholder="Search Product"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>

          {hiddenProducts.length > 0 && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setShowHidden(true)}
            >
              <EyeOff size={16} />
              Hidden products ({hiddenProducts.length})
            </button>
          )}

          <button
            type="button"
            className="btn btn-primary"
            onClick={focusForm}
          >
            + Add Product
          </button>

          <button
            type="button"
            className="btn btn-outline"
            onClick={exportCsv}
            title="Download the product list as CSV"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>


      {/* Add Product Form */}
      <form
        className="card product-add"
        onSubmit={handleCreate}
        noValidate
      >
        <h2 className="card-title">Add Product</h2>

        <div className="inline-form">

          <div className="field">
            <label htmlFor="p-name">
              Product Name <span className="req">*</span>
            </label>

            <div className="name-search">
              <Search size={18} />

              <input
                id="p-name"
                ref={nameRef}
                className={`input ${formErrors.name ? 'invalid' : ''}`}
                placeholder="Enter or search product name"
                value={form.name}
                autoComplete="off"
                role="combobox"
                aria-expanded={suggestOpen}
                aria-controls="p-name-list"
                onChange={(e) => {
                  setForm((f) => ({
                    ...f,
                    name: e.target.value,
                  }))

                  setSuggestOpen(true)
                  setSuggestIndex(-1)
                }}
                onFocus={() => setSuggestOpen(true)}
                onBlur={() => setSuggestOpen(false)}
                onKeyDown={onNameKeyDown}
              />

              {suggestOpen && suggestions.length > 0 && (
                <ul
                  className="suggest-list"
                  id="p-name-list"
                  role="listbox"
                >
                  <li
                    className="suggest-head"
                    aria-hidden="true"
                  >
                    Already added
                  </li>

                  {suggestions.map((p, i) => (
                    <li
                      key={p.id}
                      role="option"
                      aria-selected={i === suggestIndex}
                    >
                      <button
                        type="button"
                        className={`suggest-item ${i === suggestIndex ? 'active' : ''}`}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          pickSuggestion(p)
                        }}
                      >
                        <span>{p.product_name}</span>

                        <small>{unitNamesOf(p)}</small>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {formErrors.name && (
              <span className="field-error">
                {formErrors.name}
              </span>
            )}
          </div>


          <div className="field">
            <label htmlFor="p-unit">
              Unit <span className="req">*</span>
            </label>

            <select
              id="p-unit"
              className={`select ${formErrors.unitId ? 'invalid' : ''}`}
              value={form.unitId}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  unitId: e.target.value,
                }))
              }
            >
              <option value="">
                Select unit (e.g. KGS, PCS, BUNDLE)
              </option>

              {activeUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unit_name}
                </option>
              ))}
            </select>

            {formErrors.unitId && (
              <span className="field-error">
                {formErrors.unitId}
              </span>
            )}
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
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  opening: e.target.value,
                }))
              }
            />

            {formErrors.opening && (
              <span className="field-error">
                {formErrors.opening}
              </span>
            )}
          </div>


          <button
            type="submit"
            className="btn btn-success"
            disabled={saving}
          >
            {saving && <span className="spinner" />}
            Save Product
          </button>

        </div>
      </form>


      {/* Products Table */}
      <div className="table-card">
        <div className="table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Product Name</th>
                <th>Unit</th>
                <th
                  className="num"
                  style={{ textAlign: 'right' }}
                >
                  Current Stock
                </th>
                <th className="center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.map(({ product: p, unitIds }, i) => (
                <tr key={p.id}>
                  <td>{i + 1}</td>

                  <td>{p.product_name}</td>

                  {/* Units: KGS / PCS */}
                  <td>
                    {unitIds.length === 0
                      ? '—'
                      : unitIds.map((id, k) => (
                          <span key={id}>
                            {k > 0 && <span className="unit-sep">/</span>}
                            {unitName[id] ?? '—'}
                          </span>
                        ))}
                  </td>

                  {/* Stocks: 96.5 KGS / 2,400 PCS */}
                  <td className="num">
                    {unitIds.length === 0
                      ? '—'
                      : unitIds.map((id, k) => (
                          <span key={id}>
                            {k > 0 && <span className="unit-sep">/</span>}
                            {stockFor(p, id)}
                          </span>
                        ))}
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
                          setEditing({
                            product: p,
                            name: p.product_name,
                            unitIds: getUnitIds(p),
                            openings: {},
                          })
                        }}
                      >
                        <Pencil size={15} />
                      </button>

                      {/* <button
                        type="button"
                        className="icon-btn icon-btn-red"
                        aria-label="Delete product"
                        title="Delete / Hide"
                        onClick={() => {
                          setRemoveError('')
                          setRemoving(p)
                        }}
                      >
                        <Trash2 size={15} />
                      </button> */}
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
          empty={!loading && !error && rows.length === 0}
          emptyText={
            search
              ? 'No products match your search.'
              : 'No products yet. Add your first product above.'
          }
          onRetry={reload}
        />
      </div>


      {/* Edit Product */}
      {editing && (
        <Modal
          title="Edit Product"
          onClose={() => !busy && setEditing(null)}
          busy={busy}
        >
          <form
            onSubmit={handleEdit}
            className="stack"
            style={{ gap: 16 }}
            noValidate
          >
            {editError && <div className="form-error">{editError}</div>}

            <div className="field">
              <label htmlFor="e-name">
                Product Name <span className="req">*</span>
              </label>

              <input
                id="e-name"
                className="input"
                value={editing.name}
                onChange={(e) =>
                  setEditing((s) => ({ ...s, name: e.target.value }))
                }
                autoFocus
              />
            </div>

            <div className="field">
              <label htmlFor="e-unit">
                Units <span className="req">*</span>
              </label>

              <UnitPicker
                id="e-unit"
                units={editUnits}
                value={editing.unitIds}
                locked={lockedUnitIds}
                onChange={(unitIds) =>
                  setEditing((s) => ({ ...s, unitIds }))
                }
              />

              <span className="field-hint">
                Changes apply everywhere (Entry, Billing, Stock, Reports).
              </span>
            </div>

            {/* Opening balance: only for selected units that have no stock yet.
                Leave empty to skip it. */}
            {openingUnitIds.length > 0 && (
              <div className="field">
                <label>
                  Opening Balance <span className="opt">(optional)</span>
                </label>

                <div className="opening-grid">
                  {openingUnitIds.map((uid) => (
                    <label key={uid} className="opening-item">
                      <span>{unitName[uid] ?? 'Unit'}</span>

                      <input
                        inputMode="decimal"
                        className="input"
                        placeholder="Leave empty to skip"
                        value={editing.openings[uid] ?? ''}
                        onChange={(e) =>
                          setEditing((s) => ({
                            ...s,
                            openings: {
                              ...s.openings,
                              [uid]: e.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                  ))}
                </div>

                <span className="field-hint">
                  Units that already have stock are not listed here.
                </span>
              </div>
            )}

            <div
              className="modal-actions"
              style={{ justifyContent: 'space-between' }}
            >
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setActive(editing.product, false)}
                disabled={busy}
                title="Hide this product from the list (records are kept)"
              >
                <EyeOff size={16} /> Hide product
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
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
            </div>
          </form>
        </Modal>
      )}


      {/* Delete / Hide */}
      {removing && (
        <Modal
          title="Delete product?"
          onClose={() => !busy && setRemoving(null)}
          busy={busy}
        >
          <div className="stack" style={{ gap: 16 }}>
            {removeError && <div className="form-error">{removeError}</div>}

            <p style={{ margin: 0 }}>
              “{removing.product_name}” (all its units) will be deleted. If you
              only want it out of the list, hide it instead. Hidden products
              keep all their records and can be brought back.
            </p>

            <div
              className="modal-actions"
              style={{ justifyContent: 'space-between' }}
            >
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setActive(removing, false)}
                disabled={busy}
              >
                <EyeOff size={16} /> Hide product
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setRemoving(null)}
                  disabled={busy}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ background: '#dc2626', borderColor: '#dc2626' }}
                  onClick={handleDelete}
                  disabled={busy}
                >
                  {busy && <span className="spinner" />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}


      {/* Hidden Products */}
      {showHidden && (
        <Modal
          title="Hidden products"
          onClose={() => !busy && setShowHidden(false)}
          busy={busy}
        >
          <div className="stack" style={{ gap: 12 }}>
            {hiddenProducts.length === 0 && (
              <p>No hidden products.</p>
            )}

            {hiddenProducts.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                }}
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
