import { useEffect, useState } from 'react'
import { useAuth } from '../firebase/AuthContext'
import { deleteFactura, subscribeToFactures, uploadFactura } from '../firebase/factures'
import { isDeveloper, isAdminInFirestore } from '../utils/developers'
import { downloadAllFactures, downloadFacturaFile } from '../utils/facturesDownload'
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

function formatMida(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function usuariCurt(email) {
  if (!email) return '—'
  return email.split('@')[0]
}

function defaultTitleFromFile(file) {
  return file.name.replace(/\.[^.]+$/, '')
}

export default function FacturesPage() {
  const { user } = useAuth()
  const [factures, setFactures] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [downloadNotice, setDownloadNotice] = useState('')
  const [uploading, setUploading] = useState(false)
  const [downloadingAll, setDownloadingAll] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [canViewAll, setCanViewAll] = useState(false)
  const [adminChecked, setAdminChecked] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [title, setTitle] = useState('')
  const [pendingFile, setPendingFile] = useState(null)

  useEffect(() => {
    setAdminChecked(false)
    Promise.all([
      isDeveloper(user?.email),
      isAdminInFirestore(user?.email),
    ]).then(([adminUi, adminQuery]) => {
      setIsAdmin(adminUi)
      setCanViewAll(adminQuery)
      setAdminChecked(true)
    })
  }, [user?.email])

  useEffect(() => {
    if (!user?.email || !adminChecked) return undefined

    return subscribeToFactures(
      { userEmail: user.email, isAdmin: canViewAll },
      (items) => {
        setFactures(items)
        setLoading(false)
        setError('')
      },
      () => {
        setLoading(false)
        setError('No es pot llegir les factures. Desplega les regles: npx firebase-tools deploy --only firestore:rules,storage')
      },
    )
  }, [user?.email, canViewAll, adminChecked])

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPendingFile(file)
    if (!title.trim()) setTitle(defaultTitleFromFile(file))
    setUploadError('')
  }

  async function handleSubmitUpload(e) {
    e.preventDefault()
    if (!pendingFile || !user) return

    const titol = title.trim()
    if (!titol) {
      setUploadError('Posa un títol a la factura.')
      return
    }

    setUploadError('')
    setUploading(true)
    try {
      await uploadFactura({
        file: pendingFile,
        titol,
        userEmail: user.email,
        userId: user.uid,
      })
      setPendingFile(null)
      setTitle('')
    } catch {
      setUploadError('No s\'ha pogut pujar la factura. Torna-ho a provar.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(factura) {
    const label = factura.titol || factura.nom
    if (!window.confirm(`Esborrar «${label}»?`)) return

    setDeletingId(factura.id)
    try {
      await deleteFactura({ id: factura.id, storagePath: factura.storagePath })
    } catch {
      setUploadError('No s\'ha pogut esborrar. Només l\'admin pot eliminar factures.')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleDownloadOne(factura) {
    setDownloadingId(factura.id)
    setUploadError('')
    setDownloadNotice('')
    try {
      const result = await downloadFacturaFile(factura, { isAdmin: canViewAll })
      if (result?.mode === 'open' || result?.mode === 'open-fallback') {
        setDownloadNotice('S\'ha obert el fitxer. Desa\'l des del navegador (compartir o descarregar).')
      }
    } catch (err) {
      console.error('Error descarregant factura:', err)
      setUploadError('No s\'ha pogut descarregar la factura. Prova «Obrir» i desa\'l manualment.')
    } finally {
      setDownloadingId(null)
    }
  }

  async function handleDownloadAll() {
    setDownloadingAll(true)
    setUploadError('')
    setDownloadNotice('')
    try {
      const result = await downloadAllFactures(factures, { isAdmin: canViewAll })
      if (result?.mode === 'open-multiple' || result?.mode === 'open-fallback-multiple') {
        setDownloadNotice('S\'han obert les factures. Desa-les des del navegador una per una.')
      }
    } catch {
      setUploadError('No s\'han pogut descarregar les factures.')
    } finally {
      setDownloadingAll(false)
    }
  }

  return (
    <div className="factures-page">
      <div className="factures-intro">
        <h2>Factures</h2>
        <p className="factures-hint">
          {isAdmin
            ? 'Pots veure totes les factures pujades pels membres.'
            : 'Puja i consulta les teves factures.'}
        </p>
      </div>

      <form className="factures-upload-form" onSubmit={handleSubmitUpload}>
        <label className="field">
          <span className="field-label">Títol</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Menjar Data Talks"
            maxLength={120}
            disabled={uploading}
          />
        </label>

        <label className={`factures-upload ${uploading ? 'factures-upload--busy' : ''}`}>
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="factures-upload-input"
          />
          <span className="factures-upload-icon" aria-hidden="true">
            <UploadIcon />
          </span>
          <span className="factures-upload-text">
            {pendingFile ? pendingFile.name : uploading ? 'Pujant…' : 'Tria fitxer (PDF o imatge)'}
          </span>
          {!pendingFile && !uploading && (
            <span className="factures-upload-sub">Després prem «Pujar factura»</span>
          )}
        </label>

        <button
          type="submit"
          className="btn btn-accent btn-full"
          disabled={uploading || !pendingFile || !title.trim()}
        >
          {uploading ? 'Pujant…' : 'Pujar factura'}
        </button>
      </form>

      {uploadError && <p className="error-banner">{uploadError}</p>}
      {downloadNotice && <p className="factures-notice">{downloadNotice}</p>}

      {loading && <p className="factures-empty">Carregant…</p>}

      {!loading && error && <p className="error-banner">{error}</p>}

      {!loading && !error && factures.length === 0 && (
        <p className="factures-empty">Encara no hi ha factures{isAdmin ? '' : ' teves'}.</p>
      )}

      {!loading && !error && factures.length > 0 && (
        <>
          <button
            type="button"
            className="btn btn-ghost btn-full factures-download-all"
            onClick={handleDownloadAll}
            disabled={downloadingAll}
          >
            {downloadingAll
              ? 'Preparant descàrrega…'
              : canViewAll
                ? `Descarregar totes (${factures.length})`
                : `Descarregar les meves (${factures.length})`}
          </button>

          <ul className="factures-list">
            {factures.map((factura) => {
              const isDeleting = deletingId === factura.id
              const isDownloading = downloadingId === factura.id
              const displayTitle = factura.titol || factura.nom
              return (
                <li key={factura.id} className="factures-item">
                  <div className="factures-item-main">
                    <p className="factures-item-name">{displayTitle}</p>
                    <p className="factures-item-meta">
                      <time>{formatData(factura.data)}</time>
                      {factura.titol && factura.nom ? <span> · {factura.nom}</span> : null}
                      {factura.mida ? <span> · {formatMida(factura.mida)}</span> : null}
                      {isAdmin && factura.usuari ? (
                        <span> · {usuariCurt(factura.usuari)}</span>
                      ) : null}
                    </p>
                  </div>
                  <div className="factures-item-actions">
                    <a
                      href={factura.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-ghost factures-open-btn"
                    >
                      Obrir
                    </a>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost factures-open-btn"
                      onClick={() => handleDownloadOne(factura)}
                      disabled={isDownloading}
                    >
                      {isDownloading ? '…' : 'Baixa'}
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        className="factures-delete-btn"
                        onClick={() => handleDelete(factura)}
                        disabled={isDeleting}
                        aria-label={`Esborrar ${displayTitle}`}
                        title="Esborrar factura (admin)"
                      >
                        {isDeleting ? '…' : <TrashIcon />}
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}

function UploadIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M8 2v8M5 5l3-3 3 3M3 12.5h10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
