import { useState } from 'react'
import { useAuth } from '../firebase/AuthContext'
import { addUnits } from '../firebase/products'
import { formatUnitats } from '../utils/unitats'
import ConfirmStep from './ConfirmStep'

export default function AddUnitsModal({ product, onClose, onDone }) {
  const { user } = useAuth()
  const [step, setStep] = useState('form')
  const [cantidadInput, setCantidadInput] = useState('1')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function getCantidad() {
    const n = parseInt(cantidadInput, 10)
    return Number.isNaN(n) ? 1 : n
  }

  function normalizeCantidad() {
    const n = Math.max(1, getCantidad())
    setCantidadInput(String(n))
    return n
  }

  function handleContinue() {
    const toAdd = normalizeCantidad()
    if (toAdd < 1) {
      setError('Indica com a mínim 1 u.')
      return
    }
    setError('')
    setStep('confirm')
  }

  async function handleConfirm() {
    const toAdd = normalizeCantidad()
    setLoading(true)
    setError('')
    try {
      await addUnits({
        productId: product.id,
        unidades: toAdd,
        cantidadActual: product.cantidad,
        productoNombre: product.nombre,
        userEmail: user.email,
      })
      onDone?.()
      onClose()
    } catch (err) {
      console.error(err)
      setError('No s\'ha pogut afegir les unitats.')
      setStep('form')
    } finally {
      setLoading(false)
    }
  }

  function adjustQuantity(delta) {
    const next = Math.max(1, getCantidad() + delta)
    setCantidadInput(String(next))
  }

  function handleInputChange(e) {
    const val = e.target.value
    if (val === '' || /^\d+$/.test(val)) {
      setCantidadInput(val)
    }
  }

  const totalDespres = product.cantidad + getCantidad()

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--consume" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="modal-header">
          <div>
            <p className="modal-eyebrow">Entrada d&apos;inventari</p>
            <h2>{step === 'confirm' ? 'Confirmar entrada' : 'Afegeix unitats'}</h2>
          </div>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Tancar">
            ×
          </button>
        </div>

        <div className="consume-product">
          {product.fotoUrl && (
            <img src={product.fotoUrl} alt="" className="consume-thumb" />
          )}
          <div>
            <p className="product-name-modal">{product.nombre}</p>
            <p className="hint">Actual: <strong>{formatUnitats(product.cantidad)}</strong></p>
          </div>
        </div>

        {step === 'form' ? (
          <>
            <div className="stepper">
              <button type="button" className="stepper-btn" onClick={() => adjustQuantity(-1)} aria-label="Menys">
                −
              </button>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="stepper-value"
                value={cantidadInput}
                onChange={handleInputChange}
                onBlur={normalizeCantidad}
                aria-label="Unitats a afegir"
              />
              <button type="button" className="stepper-btn" onClick={() => adjustQuantity(1)} aria-label="Més">
                +
              </button>
            </div>
            <p className="stepper-label">
              unitats a afegir · total: {formatUnitats(totalDespres)}
            </p>

            {error && <p className="error-banner modal-error">{error}</p>}

            <div className="modal-actions modal-actions--stack">
              <button type="button" className="btn btn-accent btn-full" onClick={handleContinue}>
                Continuar
              </button>
              <button type="button" className="btn btn-ghost btn-full" onClick={onClose}>
                Cancel·lar
              </button>
            </div>
          </>
        ) : (
          <div className="modal-form">
            {error && <p className="error-banner">{error}</p>}
            <ConfirmStep
              message={`Vols afegir ${formatUnitats(getCantidad())} a «${product.nombre}»? Total: ${formatUnitats(totalDespres)}.`}
              onConfirm={handleConfirm}
              onCancel={() => setStep('form')}
              loading={loading}
            />
          </div>
        )}
      </div>
    </div>
  )
}
