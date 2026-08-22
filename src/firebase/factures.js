import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from './config'

const FACTURES = 'factures'

function sortByDateDesc(items) {
  return [...items].sort((a, b) => {
    const ta = a.data?.toDate?.()?.getTime() ?? 0
    const tb = b.data?.toDate?.()?.getTime() ?? 0
    return tb - ta
  })
}

export function subscribeToFactures({ userEmail, isAdmin }, callback, onError) {
  const email = userEmail.toLowerCase()
  const base = collection(db, FACTURES)
  const q = isAdmin
    ? query(base)
    : query(base, where('usuari', '==', email))

  return onSnapshot(
    q,
    (snapshot) => {
      const factures = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      callback(sortByDateDesc(factures))
    },
    (error) => {
      console.error('Error llegint factures:', error)
      onError?.(error)
    },
  )
}

export async function uploadFactura({ file, titol, userEmail, userId }) {
  const path = `factures/${userId}/${Date.now()}_${file.name}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  const fileUrl = await getDownloadURL(storageRef)

  await addDoc(collection(db, FACTURES), {
    usuari: userEmail.toLowerCase(),
    usuariId: userId,
    titol: titol.trim(),
    nom: file.name,
    fileUrl,
    storagePath: path,
    mida: file.size,
    data: serverTimestamp(),
  })
}

export async function deleteFactura({ id, storagePath }) {
  await deleteDoc(doc(db, FACTURES, id))
  if (storagePath) {
    try {
      await deleteObject(ref(storage, storagePath))
    } catch {
      // El fitxer pot haver estat esborrat ja; el doc ja s'ha eliminat
    }
  }
}
