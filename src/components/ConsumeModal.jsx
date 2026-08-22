import { useState } from 'react'
import { useAuth } from '../firebase/AuthContext'
import { consumeProduct } from '../firebase/products'
import { formatUnitats } from '../utils/unitats'
import ConfirmStep from './ConfirmStep'

export default function ConsumeModal({ product, onClose, onDone }) {
  const { user } = useAuth()
  const [step, setStep] = useState('form')
  const [pendingUnits, setPendingUnits] = useState(1)
  const [cantidadInput, setCantidadInput] = useState('1')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function getCantidad() {
    const n = parseInt(cantidadInput, 10)
    return Number.isNaN(n) ? 1 : n
  }

  function normalizeCantidad() {
    const n = getCantidad()
    const clamped = Math.min(product.cantidad, Math.max(1, n))
    setCantidadInput(String(clamped))
    return clamped
  }

  function goToConfirm(units) {
    const toConsume = units ?? normalizeCantidad()
    if (toConsume < 1 || toConsume > product.cantidad) {
      setError(`Indica un valor entre 1 i ${product.cantidad} u.`)
      return
    }
    setError('')
    setPendingUnits(toConsume)
    setStep('confirm')
  }

  async function handleConfirm() {
    setLoading(true)
    setError('')
    try {
      await consumeProduct({
        productId: product.id,
        cantidadGastada: pendingUnits,
        cantidadActual: product.cantidad,
        productoNombre: product.nombre,
        userEmail: user.email,
      })
      onDone?.()
      onClose()
    } catch (err) {
      console.error(err)
      setError('No s\'ha pogut registrar el consum.')
      setStep('form')
    } finally {
      setLoading(false)
    }
  }

  function adjustQuantity(delta) {
    const next = Math.min(product.cantidad, Math.max(1, getCantidad() + delta))
    setCantidadInput(String(next))
  }

  function handleInputChange(e) {
    const val = e.target.value
    if (val === '' || /^\d+$/.test(val)) {
      setCantidadInput(val)
    }
  }

  const isGastarTot = pendingUnits === product.cantidad
  const stockDespres = product.cantidad - pendingUnits

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--consume" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="modal-header">
          <div>
            <p className="modal-eyebrow">Sortida d&apos;inventari</p>
            <h2>{step === 'confirm' ? 'Confirmar consum' : 'Gasta producte'}</h2>
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
            <p className="hint">Disponibles: <strong>{formatUnitats(product.cantidad)}</strong></p>
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
                aria-label="Unitats a consumir"
              />
              <button type="button" className="stepper-btn" onClick={() => adjustQuantity(1)} aria-label="Més">
                +
              </button>
            </div>
            <p className="stepper-label">unitats a consumir</p>

            {error && <p className="error-banner modal-error">{error}</p>}

            <div className="modal-actions modal-actions--stack">
              <button type="button" className="btn btn-accent btn-full" onClick={() => goToConfirm()}>
                Continuar
              </button>
              <button
                type="button"
                className="btn btn-danger-outline btn-full"
                onClick={() => goToConfirm(product.cantidad)}
              >
                Gasta-ho tot ({formatUnitats(product.cantidad)})
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
              message={
                isGastarTot
                  ? `Vols gastar-ho tot? «${product.nombre}» passarà a Esgotats amb 0 unitats.`
                  : `Vols gastar ${formatUnitats(pendingUnits)} de «${product.nombre}»? Quedaran ${formatUnitats(stockDespres)}.`
              }
              onConfirm={handleConfirm}
              onCancel={() => setStep('form')}
              loading={loading}
              danger={isGastarTot}
              confirmLabel={isGastarTot ? 'Confirmar i esgotar' : 'Confirmar'}
            />
          </div>
        )}
      </div>
    </div>
  )
}
