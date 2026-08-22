import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'

const MOVIMENTS = 'moviments'

export function subscribeToMovements(callback, onError) {
  const q = query(
    collection(db, MOVIMENTS),
    orderBy('data', 'desc'),
    limit(200),
  )
  return onSnapshot(
    q,
    (snapshot) => {
      const movements = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }))
      callback(movements)
    },
    (error) => {
      console.error('Error llegint moviments:', error)
      onError?.(error)
    },
  )
}

export async function logMovement({
  tipus,
  producteId,
  producteNom,
  quantitat,
  usuari,
  stockDespres = null,
}) {
  await addDoc(collection(db, MOVIMENTS), {
    tipus,
    producteId,
    producteNom,
    quantitat: Number(quantitat),
    usuari,
    stockDespres,
    data: serverTimestamp(),
  })
}

export async function deleteMovement(id) {
  await deleteDoc(doc(db, MOVIMENTS, id))
}
