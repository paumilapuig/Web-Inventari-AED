import { useState } from 'react'
import { addProduct } from '../firebase/products'
import { useAuth } from '../firebase/AuthContext'
import { formatUnitats } from '../utils/unitats'
import ConfirmStep from './ConfirmStep'

export default function AddProductForm({ onClose, onAdded }) {
  const { user } = useAuth()
  const [step, setStep] = useState('form')
  const [nombre, setNombre] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [fotoFile, setFotoFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleFotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoFile(file)
    setPreview(URL.createObjectURL(file))
  }

  function handleContinue(e) {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('El nom és obligatori.')
      return
    }
    if (cantidad < 1) {
      setError('La quantitat ha de ser com a mínim 1.')
      return
    }
    setError('')
    setStep('confirm')
  }

  async function handleConfirm() {
    setLoading(true)
    setError('')
    try {
      await addProduct({
        nombre,
        cantidad,
        fotoFile,
        userEmail: user.email,
      })
      onAdded?.()
      onClose()
    } catch (err) {
      console.error(err)
      setError('No s\'ha pogut desar. Revisa la connexió.')
      setStep('form')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="add-title">
        <div className="modal-header">
          <div>
            <p className="modal-eyebrow">Nova entrada</p>
            <h2 id="add-title">{step === 'confirm' ? 'Confirmar alta' : 'Afegir producte'}</h2>
          </div>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Tancar">
            ×
          </button>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleContinue} className="modal-form">
            <label className="foto-label">
              <span className="field-label">Foto</span>
              {preview ? (
                <img src={preview} alt="Vista prèvia" className="foto-preview" />
              ) : (
                <span className="foto-placeholder">
                  <CameraIcon />
                  <span>Fer foto o triar imatge</span>
                </span>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFotoChange}
                className="foto-input"
              />
            </label>

            <label className="field">
              <span className="field-label">Nom</span>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ex: Bolígrafs blaus"
                required
              />
            </label>

            <label className="field">
              <span className="field-label">Unitats</span>
              <input
                type="number"
                min={1}
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
                required
              />
            </label>

            {error && <p className="error-banner">{error}</p>}

            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Cancel·lar
              </button>
              <button type="submit" className="btn btn-accent">
                Continuar
              </button>
            </div>
          </form>
        ) : (
          <div className="modal-form">
            {error && <p className="error-banner">{error}</p>}
            <ConfirmStep
              message={`Vols afegir «${nombre.trim()}» amb ${formatUnitats(cantidad)}?`}
              onConfirm={handleConfirm}
              onCancel={() => setStep('form')}
              loading={loading}
              confirmLabel="Confirmar"
            />
          </div>
        )}
      </div>
    </div>
  )
}

function CameraIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h3l2-2h6l2 2h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}
