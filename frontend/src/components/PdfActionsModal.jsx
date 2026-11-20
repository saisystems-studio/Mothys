import { useEffect, useRef, useState } from 'react'
import { Download, Printer, Share2, X } from 'lucide-react'
import useToast from '../hooks/useToast'
import { canSharePdf, downloadPdfBlob, printPdfBlob, sharePdfBlob } from '../utils/pdfActions'

/*
 * One popup used on every page: Print / Download as PDF / Share as PDF.
 *  - build: async () => ({ blob, fileName })  (called once when the popup opens)
 *  - Print    -> opens the browser print dialog, nothing is saved
 *  - Download -> saves the PDF, nothing else
 *  - Share    -> opens the device share menu, nothing is saved
 * No action ever turns into another one.
 */
export default function PdfActionsModal({ title = 'Print', build, onClose }) {
  const toast = useToast()
  const [pdf, setPdf] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sharePossible] = useState(canSharePdf)
  const buildRef = useRef(build)

  // Build the PDF as soon as the popup opens, so Print and Share can run
  // straight from the click (browsers only allow sharing right after a click).
  useEffect(() => {
    let cancelled = false

    Promise.resolve()
      .then(() => buildRef.current())
      .then((result) => {
        if (!cancelled) setPdf(result)
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Could not create the PDF.')
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  const runPrint = async () => {
    if (!pdf) return
    setBusy(true)
    try {
      await printPdfBlob(pdf.blob)
      onClose()
    } catch (err) {
      toast.error(err?.message || 'Could not open the print dialog.')
    } finally {
      setBusy(false)
    }
  }

  const runDownload = () => {
    if (!pdf) return
    downloadPdfBlob(pdf.blob, pdf.fileName)
    onClose()
  }

  const runShare = async () => {
    if (!pdf) return
    setBusy(true)
    try {
      const shared = await sharePdfBlob(pdf.blob, pdf.fileName, title)
      if (shared) onClose()
    } catch (err) {
      toast.error(err?.message || 'Could not share the PDF.')
    } finally {
      setBusy(false)
    }
  }

  const ready = Boolean(pdf) && !busy

  return (
    <div
      className="pam-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose()
      }}
    >
      <style>{`
        .pam-backdrop {
          position: fixed;
          inset: 0;
          z-index: 3000;
          display: grid;
          place-items: center;
          padding: 16px;
          background: rgba(15, 23, 42, .45);
        }

        .pam-card {
          width: 100%;
          max-width: 380px;
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 20px 50px rgba(15, 23, 42, .25);
          overflow: hidden;
        }

        .pam-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 16px 20px;
          border-bottom: 1px solid #e5eaf1;
        }

        .pam-head h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 750;
          color: #1b2947;
        }

        .pam-close {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          border: 0;
          border-radius: 9px;
          background: #f1f5fa;
          color: #52627e;
          cursor: pointer;
        }

        .pam-close:hover {
          background: #e5edfa;
          color: #2458db;
        }

        .pam-body {
          display: grid;
          gap: 12px;
          padding: 20px;
        }

        .pam-btn {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          width: 100%;
          border: 1px solid #d7dfeb;
          border-radius: 10px;
          background: #fff;
          color: #1e3155;
          font-size: 14px;
          font-weight: 650;
          cursor: pointer;
        }

        .pam-btn:hover:not(:disabled) {
          border-color: #2458db;
          color: #2458db;
          background: #f8faff;
        }

        .pam-btn.primary {
          background: #2458db;
          border-color: #2458db;
          color: #fff;
        }

        .pam-btn.primary:hover:not(:disabled) {
          background: #1747c2;
          color: #fff;
        }

        .pam-btn.success {
          background: #15803d;
          border-color: #15803d;
          color: #fff;
        }

        .pam-btn.success:hover:not(:disabled) {
          background: #116a32;
          color: #fff;
        }

        .pam-btn:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .pam-error {
          padding: 10px 12px;
          border-radius: 9px;
          background: #fdecec;
          color: #b42318;
          font-size: 13px;
        }

        .pam-hint {
          margin: 0;
          color: #64748b;
          font-size: 12px;
          font-weight: 600;
        }
      `}</style>

      <div className="pam-card" role="dialog" aria-modal="true" aria-label={title}>
        <div className="pam-head">
          <h3>{title}</h3>
          <button type="button" className="pam-close" onClick={onClose} aria-label="Close" disabled={busy}>
            <X size={18} />
          </button>
        </div>

        <div className="pam-body">
          {error && <div className="pam-error">{error}</div>}

          <button type="button" className="pam-btn primary" onClick={runPrint} disabled={!ready}>
            <Printer size={17} />
            {!pdf && !error ? 'Preparing…' : 'Print'}
          </button>

          <button type="button" className="pam-btn" onClick={runDownload} disabled={!ready}>
            <Download size={17} />
            Download as PDF
          </button>

          <button
            type="button"
            className="pam-btn success"
            onClick={runShare}
            disabled={!ready || !sharePossible}
          >
            <Share2 size={17} />
            Share as PDF
          </button>

          {!sharePossible && (
            <p className="pam-hint">Sharing is not supported in this browser. Use Print or Download.</p>
          )}
        </div>
      </div>
    </div>
  )
}
