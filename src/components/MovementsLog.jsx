import { useEffect, useMemo, useState } from 'react'
import { deleteMovement, subscribeToMovements } from '../firebase/moviments'
import { useAuth } from '../firebase/AuthContext'
import { formatUnitats } from '../utils/unitats'
import { canDeleteMovements } from '../utils/developers'
import LogFilterMenu, { filterMovementsByDate, hasActiveFilter } from './LogFilterMenu'
import TrashIcon from './TrashIcon'

const EMPTY_FILTER = { dateFrom: '', dateTo: '', timeFrom: '', timeTo: '' }

const TIPUS_CONFIG = {
  alta: { label: 'Alta', signe: '+' },
  entrada: { label: 'Entrada', signe: '+' },
  sortida: { label: 'Sortida', signe: '−' },
}

function formatData(timestamp) {
  if (!timestamp?.toDate) return '—'
  return timestamp.toDate().toLocaleString('ca-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function usuariCurt(email) {
  if (!email) return '—'
  return email.split('@')[0]
}

export default function MovementsLog({ onClose, product = null }) {
  const { user } = useAuth()
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [draftFilter, setDraftFilter] = useState(EMPTY_FILTER)
  const [appliedFilter, setAppliedFilter] = useState(EMPTY_FILTER)
  const [canDelete, setCanDelete] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function preventBackgroundScroll(e) {
      if (e.target.closest('.log-list, .log-filter-panel, .log-filter-body')) return
      e.preventDefault()
    }

    document.addEventListener('touchmove', preventBackgroundScroll, { passive: false })

    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('touchmove', preventBackgroundScroll)
    }
  }, [])

  useEffect(() => {
    canDeleteMovements(user?.email).then(setCanDelete)
  }, [user?.email])

  useEffect(() => {
    return subscribeToMovements(
      (items) => {
        setMovements(items)
        setLoading(false)
        setError('')
      },
      () => {
        setLoading(false)
        setError('No es pot llegir l\'historial. Revisa les regles de Firestore per a «moviments».')
      },
    )
  }, [])

  const productMovements = useMemo(() => {
    if (!product) return movements
    return movements.filter((mov) => mov.producteId === product.id)
  }, [movements, product])

  const filtered = useMemo(
    () => filterMovementsByDate(productMovements, appliedFilter),
    [productMovements, appliedFilter],
  )

  const filterActive = hasActiveFilter(appliedFilter)

  async function handleDelete(mov) {
    const msg = `Esborrar «${mov.producteNom}» (${TIPUS_CONFIG[mov.tipus]?.label ?? mov.tipus})?\n\nNomés s'elimina l'entrada de l'historial; l'inventari no canvia.`
    if (!window.confirm(msg)) return

    setDeleteError('')
    setDeletingId(mov.id)
    try {
      await deleteMovement(mov.id)
    } catch {
      setDeleteError('No s\'ha pogut esborrar. Revisa permisos de desenvolupador i regles Firestore.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--log" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="modal-header modal-header--log">
          <div>
            <p className="modal-eyebrow">{product ? product.nombre : 'Activitat'}</p>
            <h2>{product ? 'Historial del producte' : 'Historial de moviments'}</h2>
          </div>
          <div className="log-header-actions">
            <LogFilterMenu
              filter={draftFilter}
              onChange={setDraftFilter}
              onApply={setAppliedFilter}
              resultCount={filterActive ? filtered.length : null}
              totalCount={productMovements.length}
            />
            <button type="button" className="btn-close" onClick={onClose} aria-label="Tancar">
              ×
            </button>
          </div>
        </div>

        {loading && <p className="log-empty">Carregant…</p>}

        {!loading && error && <p className="error-banner log-error">{error}</p>}

        {!loading && !error && productMovements.length === 0 && (
          <p className="log-empty">
            {product
              ? 'Encara no hi ha moviments d\'aquest producte.'
              : 'Encara no hi ha moviments. Afegeix, suma o gasta un producte i apareixerà aquí.'}
          </p>
        )}

        {!loading && !error && productMovements.length > 0 && filtered.length === 0 && (
          <p className="log-empty">Cap moviment en aquest interval de dates.</p>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            {deleteError && <p className="error-banner log-error">{deleteError}</p>}
            <ul className="log-list">
            {filtered.map((mov) => {
              const cfg = TIPUS_CONFIG[mov.tipus] ?? { label: mov.tipus, signe: '' }
              const isDeleting = deletingId === mov.id
              return (
                <li key={mov.id} className={`log-item log-item--${mov.tipus}`}>
                  <div className="log-item-top">
                    <span className={`log-badge log-badge--${mov.tipus}`}>{cfg.label}</span>
                    <div className="log-item-meta">
                      <time className="log-time">{formatData(mov.data)}</time>
                      {canDelete && (
                        <button
                          type="button"
                          className="log-delete-btn"
                          onClick={() => handleDelete(mov)}
                          disabled={isDeleting}
                          aria-label={`Esborrar moviment de ${mov.producteNom}`}
                          title="Esborrar entrada (dev)"
                        >
                          {isDeleting ? '…' : <TrashIcon />}
                        </button>
                      )}
                    </div>
                  </div>
                  {!product && <p className="log-product">{mov.producteNom}</p>}
                  <p className="log-detail">
                    <span className="log-qty">
                      {cfg.signe}{formatUnitats(mov.quantitat)}
                    </span>
                    {mov.stockDespres != null && (
                      <span className="log-stock">
                        · queden {formatUnitats(mov.stockDespres)}
                      </span>
                    )}
                  </p>
                  <p className="log-user">{usuariCurt(mov.usuari)}</p>
                </li>
              )
            })}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
