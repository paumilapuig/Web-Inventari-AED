import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from './config'
import { logMovement } from './moviments'

const PRODUCTS = 'productos'

export function subscribeToProducts(callback) {
  const q = query(collection(db, PRODUCTS), orderBy('nombre'))
  return onSnapshot(q, (snapshot) => {
    const products = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }))
    callback(products)
  })
}

export async function addProduct({ nombre, cantidad, fotoFile, userEmail }) {
  let fotoUrl = null

  if (fotoFile) {
    const path = `productos/${Date.now()}_${fotoFile.name}`
    const storageRef = ref(storage, path)
    await uploadBytes(storageRef, fotoFile)
    fotoUrl = await getDownloadURL(storageRef)
  }

  const nom = nombre.trim()
  const qty = Number(cantidad)

  const docRef = await addDoc(collection(db, PRODUCTS), {
    nombre: nom,
    cantidad: qty,
    fotoUrl,
    creadoPor: userEmail,
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
  })

  await logMovement({
    tipus: 'alta',
    producteId: docRef.id,
    producteNom: nom,
    quantitat: qty,
    usuari: userEmail,
    stockDespres: qty,
  })
}

export async function consumeProduct({
  productId,
  cantidadGastada,
  cantidadActual,
  productoNombre,
  userEmail,
}) {
  const gastada = Number(cantidadGastada)
  const nuevaCantidad = Math.max(0, cantidadActual - gastada)

  await updateDoc(doc(db, PRODUCTS, productId), {
    cantidad: nuevaCantidad,
    actualizadoEn: serverTimestamp(),
  })

  await logMovement({
    tipus: 'sortida',
    producteId: productId,
    producteNom: productoNombre,
    quantitat: gastada,
    usuari: userEmail,
    stockDespres: nuevaCantidad,
  })
}

export async function addUnits({
  productId,
  unidades,
  cantidadActual,
  productoNombre,
  userEmail,
}) {
  const afegides = Number(unidades)
  const stockDespres = cantidadActual + afegides

  await updateDoc(doc(db, PRODUCTS, productId), {
    cantidad: stockDespres,
    actualizadoEn: serverTimestamp(),
  })

  await logMovement({
    tipus: 'entrada',
    producteId: productId,
    producteNom: productoNombre,
    quantitat: afegides,
    usuari: userEmail,
    stockDespres,
  })
}

export async function deleteProduct(productId) {
  await deleteDoc(doc(db, PRODUCTS, productId))
}
