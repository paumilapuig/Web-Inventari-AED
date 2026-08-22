import { useEffect, useMemo, useState } from 'react'
import { formatUnitats } from '../utils/unitats'
import { deleteProduct, subscribeToProducts } from '../firebase/products'
import { useAuth } from '../firebase/AuthContext'
import { isDeveloper } from '../utils/developers'
import AddProductForm from './AddProductForm'
import AddUnitsModal from './AddUnitsModal'
import ConsumeModal from './ConsumeModal'
import MovementsLog from './MovementsLog'
import ProductComments from './ProductComments'
import TrashIcon from './TrashIcon'

export default function ProductList() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [consumeTarget, setConsumeTarget] = useState(null)
  const [addUnitsTarget, setAddUnitsTarget] = useState(null)
  const [showGlobalLog, setShowGlobalLog] = useState(false)
  const [productLogTarget, setProductLogTarget] = useState(null)
  const [productCommentsTarget, setProductCommentsTarget] = useState(null)
  const [search, setSearch] = useState('')
  const [stockView, setStockView] = useState('disponibles')
  const [canDeleteProducts, setCanDeleteProducts] = useState(false)
  const [deletingProductId, setDeletingProductId] = useState(null)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    return subscribeToProducts(setProducts)
  }, [])

  useEffect(() => {
    isDeveloper(user?.email).then(setCanDeleteProducts)
  }, [user?.email])

  const disponibles = useMemo(
    () => products.filter((p) => Number(p.cantidad) > 0),
    [products],
  )

  const esgotats = useMemo(
    () => products.filter((p) => Number(p.cantidad) <= 0),
    [products],
  )

  const stockProducts = stockView === 'disponibles' ? disponibles : esgotats

  const filtered = stockProducts.filter((p) =>
    p.nombre.toLowerCase().includes(search.toLowerCase()),
  )

  const countLabel = stockView === 'disponibles' ? 'disponibles' : 'esgotats'

  async function handleDeleteProduct(product) {
    const msg = `Esborrar «${product.nombre}» de l'inventari?\n\nS'eliminarà el producte del tot. L'historial de moviments es mantindrà.`
    if (!window.confirm(msg)) return

    setDeleteError('')
    setDeletingProductId(product.id)
    try {
      await deleteProduct(product.id)
    } catch {
      setDeleteError('No s\'ha pogut esborrar el producte. Revisa permisos de desenvolupador.')
    } finally {
      setDeletingProductId(null)
    }
  }

  return (
    <>
      {deleteError && <p className="error-banner product-delete-error">{deleteError}</p>}

      <section className="stats-bar">
        <div className="stock-tabs" role="tablist" aria-label="Estat de l'inventari">
          <button
            type="button"
            role="tab"
            aria-selected={stockView === 'disponibles'}
            className={`stock-tab ${stockView === 'disponibles' ? 'stock-tab--active' : ''}`}
            onClick={() => setStockView('disponibles')}
          >
            Disponibles
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={stockView === 'esgotats'}
            className={`stock-tab ${stockView === 'esgotats' ? 'stock-tab--active' : ''}`}
            onClick={() => setStockView('esgotats')}
          >
            Esgotats
          </button>
        </div>

        <div className="stat">
          <span className="stat-value">{stockProducts.length}</span>
          <span className="stat-label">{countLabel}</span>
        </div>
      </section>



      <div className="toolbar">

        <div className="search-wrap">

          <SearchIcon />

          <input

            type="search"

            placeholder="Cercar producte…"

            value={search}

            onChange={(e) => setSearch(e.target.value)}

            className="search-input"

          />

        </div>

        <button type="button" className="btn btn-historial" onClick={() => setShowGlobalLog(true)}>

          <HistoryIcon />

          <span>Historial</span>

        </button>

        <button type="button" className="btn btn-accent" onClick={() => setShowAdd(true)}>

          <PlusIcon />

          Afegir

        </button>

      </div>



      {filtered.length === 0 ? (

        <div className="empty-state">

          <div className="empty-icon" aria-hidden="true">—</div>

          <h2>

            {search

              ? 'Cap coincidència'

              : stockView === 'esgotats'

                ? 'Cap producte esgotat'

                : products.length === 0

                  ? 'Inventari buit'

                  : 'Cap producte disponible'}

          </h2>

          <p>

            {search

              ? 'Prova amb un altre terme de cerca.'

              : stockView === 'esgotats'

                ? 'Quan un producte arribi a 0 unitats apareixerà aquí.'

                : products.length === 0

                  ? 'Registra el primer producte a l\'inventari.'

                  : 'Tots els productes estan esgotats. Afegeix unitats des de la pestanya Esgotats.'}

          </p>

          {!search && stockView === 'disponibles' && products.length === 0 && (

            <button type="button" className="btn btn-accent" onClick={() => setShowAdd(true)}>

              Afegir producte

            </button>

          )}

        </div>

      ) : (

        <ul className="product-grid">

          {filtered.map((product) => {
            const esgotat = Number(product.cantidad) <= 0
            const isDeleting = deletingProductId === product.id
            return (
              <li key={product.id} className={`product-card ${esgotat ? 'product-card--esgotat' : ''}`}>
                <div className="product-visual">
                  {product.fotoUrl ? (
                    <img src={product.fotoUrl} alt={product.nombre} />
                  ) : (
                    <div className="product-placeholder">
                      <span>{product.nombre.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  {canDeleteProducts && (
                    <button
                      type="button"
                      className="btn-product-delete"
                      onClick={() => handleDeleteProduct(product)}
                      disabled={isDeleting}
                      aria-label={`Esborrar ${product.nombre}`}
                      title="Esborrar producte (dev)"
                    >
                      {isDeleting ? '…' : <TrashIcon />}
                    </button>
                  )}
                  <div className="product-body">
                    <div className="product-body-top">
                      <div className="product-title-row">
                        <h3>{product.nombre}</h3>
                        <span className="qty-tag">{formatUnitats(product.cantidad)}</span>
                      </div>
                      <div className="product-card-tools">
                        <button
                          type="button"
                          className="btn-product-history"
                          onClick={() => setProductCommentsTarget(product)}
                          aria-label={`Comentaris de ${product.nombre}`}
                          title="Comentaris"
                        >
                          <CommentIcon />
                        </button>
                        <button
                          type="button"
                          className="btn-product-history"
                          onClick={() => setProductLogTarget(product)}
                          aria-label={`Historial de ${product.nombre}`}
                          title="Historial del producte"
                        >
                          <HistoryIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="product-actions">
                  <button
                    type="button"
                    className="btn btn-card-action btn-card-add"
                    onClick={() => setAddUnitsTarget(product)}
                  >
                    Afegeix
                  </button>
                  {!esgotat && (
                    <button
                      type="button"
                      className="btn btn-card-action"
                      onClick={() => setConsumeTarget(product)}
                    >
                      Gasta
                    </button>
                  )}
                </div>
              </li>
            )
          })}

        </ul>

      )}



      {showAdd && <AddProductForm onClose={() => setShowAdd(false)} />}



      {addUnitsTarget && (

        <AddUnitsModal

          product={addUnitsTarget}

          onClose={() => setAddUnitsTarget(null)}

        />

      )}



      {showGlobalLog && <MovementsLog onClose={() => setShowGlobalLog(false)} />}



      {productLogTarget && (
        <MovementsLog
          product={productLogTarget}
          onClose={() => setProductLogTarget(null)}
        />
      )}

      {productCommentsTarget && (
        <ProductComments
          product={productCommentsTarget}
          onClose={() => setProductCommentsTarget(null)}
        />
      )}

      {consumeTarget && (

        <ConsumeModal

          product={consumeTarget}

          onClose={() => setConsumeTarget(null)}

        />

      )}

    </>

  )

}



function SearchIcon() {

  return (

    <svg className="search-icon" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">

      <circle cx="6.5" cy="6.5" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />

      <path d="M10 10l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />

    </svg>

  )

}



function PlusIcon() {

  return (

    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">

      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

    </svg>

  )

}



function HistoryIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function CommentIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3 3.5h10v7H8.5L5.5 13v-2.5H3v-7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}
