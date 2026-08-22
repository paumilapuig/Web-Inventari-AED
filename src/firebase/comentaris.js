import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'

function commentsRef(productId) {
  return collection(db, 'productos', productId, 'comentaris')
}

/** Comentaris d’un producte, més nous primer. */
export function subscribeToProductComments(productId, callback, onError) {
  const q = query(commentsRef(productId), orderBy('data', 'desc'))
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    },
    (error) => {
      console.error('Error llegint comentaris:', error)
      onError?.(error)
    },
  )
}

export async function addProductComment({ productId, text, usuari }) {
  const trimmed = text.trim()
  if (!trimmed) throw new Error('empty-comment')

  await addDoc(commentsRef(productId), {
    text: trimmed,
    usuari,
    data: serverTimestamp(),
  })
}

export async function deleteProductComment(productId, commentId) {
  await deleteDoc(doc(db, 'productos', productId, 'comentaris', commentId))
}
