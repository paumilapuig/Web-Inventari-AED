import { ref, getBlob } from 'firebase/storage'
import { storage } from '../firebase/config'

function sanitizeFilename(name) {
  return name.replace(/[<>:"/\\|?*]+/g, '-').trim() || 'factura'
}

function fileExtension(filename) {
  const match = filename?.match(/(\.[^.]+)$/)
  return match ? match[1] : ''
}

function storagePathFromUrl(fileUrl) {
  try {
    const url = new URL(fileUrl)
    const match = url.pathname.match(/\/o\/(.+)$/)
    if (!match) return null
    return decodeURIComponent(match[1])
  } catch {
    return null
  }
}

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

function openInNewTab(url) {
  const link = document.createElement('a')
  link.href = url
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)

  if (isMobileDevice()) {
    openInNewTab(url)
    setTimeout(() => URL.revokeObjectURL(url), 60000)
    return 'open'
  }

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'download'
}

function buildDownloadName(factura, { isAdmin = false } = {}) {
  const base = sanitizeFilename(factura.titol || factura.nom)
  const ext = fileExtension(factura.nom) || '.bin'
  const prefix = isAdmin && factura.usuari
    ? `${factura.usuari.split('@')[0]}_`
    : ''
  return `${prefix}${base}${ext}`
}

async function getFacturaBlob(factura) {
  const path = factura.storagePath || storagePathFromUrl(factura.fileUrl)
  if (!path) throw new Error('missing-file-reference')

  const blobPromise = getBlob(ref(storage, path))
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('timeout')), 12000)
  })

  return Promise.race([blobPromise, timeoutPromise])
}

export async function downloadFacturaFile(factura, options = {}) {
  const filename = buildDownloadName(factura, options)

  if (!factura.fileUrl && !factura.storagePath) {
    throw new Error('missing-file-reference')
  }

  // Al mòbil, obrir l'URL directa és més fiable que getBlob + download
  if (isMobileDevice() && factura.fileUrl) {
    openInNewTab(factura.fileUrl)
    return { mode: 'open' }
  }

  try {
    const blob = await getFacturaBlob(factura)
    const mode = triggerDownload(blob, filename)
    return { mode }
  } catch (err) {
    if (!factura.fileUrl) throw err
    openInNewTab(factura.fileUrl)
    return { mode: 'open-fallback' }
  }
}

export async function downloadAllFactures(factures, { isAdmin = false } = {}) {
  if (factures.length === 0) return { mode: 'empty' }

  if (isMobileDevice()) {
    for (const factura of factures) {
      await downloadFacturaFile(factura, { isAdmin })
      await new Promise((resolve) => setTimeout(resolve, 400))
    }
    return { mode: 'open-multiple' }
  }

  if (factures.length === 1) {
    return downloadFacturaFile(factures[0], { isAdmin })
  }

  try {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    const usedNames = new Set()

    for (const factura of factures) {
      const blob = await getFacturaBlob(factura)

      let filename = buildDownloadName(factura, { isAdmin })
      while (usedNames.has(filename)) {
        const ext = fileExtension(filename)
        const stem = filename.slice(0, -ext.length)
        filename = `${stem}_${usedNames.size}${ext}`
      }
      usedNames.add(filename)
      zip.file(filename, blob)
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' })
    triggerDownload(zipBlob, isAdmin ? 'factures-aed.zip' : 'les-meves-factures.zip')
    return { mode: 'zip' }
  } catch {
    for (const factura of factures) {
      await downloadFacturaFile(factura, { isAdmin })
      await new Promise((resolve) => setTimeout(resolve, 400))
    }
    return { mode: 'open-fallback-multiple' }
  }
}
