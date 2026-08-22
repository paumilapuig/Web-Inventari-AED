import { useEffect, useState } from 'react'
import { useAuth } from '../firebase/AuthContext'
import {
  addProductComment,
  deleteProductComment,
  subscribeToProductComments,
} from '../firebase/comentaris'
import { isDeveloper } from '../utils/developers'
import TrashIcon from './TrashIcon'

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

export default function ProductComments({ product, onClose }) {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [canDelete, setCanDelete] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    isDeveloper(user?.email).then(setCanDelete)
  }, [user?.email])

  useEffect(() => {
    if (!product?.id) return undefined
    setLoading(true)
    return subscribeToProductComments(
      product.id,
      (items) => {
        setComments(items)
        setLoading(false)
        setError('')
      },
      (err) => {
        console.error('Error llegint comentaris:', err)
        setLoading(false)
        const code = err?.code ? ` (${err.code})` : ''
        setError(`No es poden carregar els comentaris${code}. Revisa les regles de Firestore.`)
      },
    )
  }, [product?.id])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim() || sending) return

    setSendError('')
    setSending(true)
    try {
      await addProductComment({
        productId: product.id,
        text,
        usuari: user.email,
      })
      setText('')
      const list = document.querySelector('.comments-list')
      if (list) list.scrollTop = 0
    } catch (err) {
      console.error('Error publicant comentari:', err)
      const code = err?.code ? ` (${err.code})` : ''
      setSendError(`No s'ha pogut publicar el comentari${code}.`)
    } finally {
      setSending(false)
    }
  }

  async function handleDelete(comment) {
    const preview = comment.text.length > 60 ? `${comment.text.slice(0, 60)}…` : comment.text
    if (!window.confirm(`Esborrar aquest comentari?\n\n«${preview}»`)) return

    setDeleteError('')
    setDeletingId(comment.id)
    try {
      await deleteProductComment(product.id, comment.id)
    } catch {
      setDeleteError('No s\'ha pogut esborrar. Només l\'admin pot eliminar comentaris.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--comments" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="modal-header">
          <div>
            <p className="modal-eyebrow">{product.nombre}</p>
            <h2>Comentaris</h2>
          </div>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Tancar">
            ×
          </button>
        </div>

        <p className="comments-hint">
          Notes sobre on és guardat, estat, etc. Visibles per a tots els membres.
        </p>

        {loading && <p className="log-empty">Carregant…</p>}
        {!loading && error && <p className="error-banner log-error">{error}</p>}
        {deleteError && <p className="error-banner log-error">{deleteError}</p>}

        {!loading && !error && comments.length === 0 && (
          <p className="log-empty">Encara no hi ha comentaris.</p>
        )}

        {!loading && !error && comments.length > 0 && (
          <ul className="comments-list">
            {comments.map((comment) => {
              const isDeleting = deletingId === comment.id
              return (
                <li key={comment.id} className="comment-item">
                  <div className="comment-item-top">
                    <span className="comment-user">{usuariCurt(comment.usuari)}</span>
                    <div className="comment-item-meta">
                      <time className="log-time">{formatData(comment.data)}</time>
                      {canDelete && (
                        <button
                          type="button"
                          className="log-delete-btn"
                          onClick={() => handleDelete(comment)}
                          disabled={isDeleting}
                          aria-label="Esborrar comentari"
                          title="Esborrar comentari (admin)"
                        >
                          {isDeleting ? '…' : <TrashIcon />}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="comment-text">{comment.text}</p>
                </li>
              )
            })}
          </ul>
        )}

        <form className="comments-compose" onSubmit={handleSubmit}>
          {sendError && <p className="error-banner">{sendError}</p>}
          <label className="field">
            <span className="field-label">Nou comentari</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ex: Ho he deixat dins d'una caixa sota la taula del despatx"
              rows={3}
              maxLength={2000}
              disabled={sending}
            />
          </label>
          <button
            type="submit"
            className="btn btn-accent btn-full"
            disabled={sending || !text.trim()}
          >
            {sending ? 'Publicant…' : 'Publicar'}
          </button>
        </form>
      </div>
    </div>
  )
}
