import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

function parseEmailList(raw) {
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

function envDeveloperEmails() {
  return parseEmailList(import.meta.env.VITE_DEV_EMAILS ?? '')
}

export async function isAdminInFirestore(email) {
  if (!email) return false

  try {
    const snap = await getDoc(doc(db, 'settings', 'developers'))
    if (!snap.exists()) return false
    const emails = (snap.data().emails ?? []).map((e) => e.toLowerCase())
    return emails.includes(email.toLowerCase())
  } catch {
    return false
  }
}

export async function isDeveloper(email) {
  if (!email) return false

  const normalized = email.toLowerCase()
  if (envDeveloperEmails().includes(normalized)) return true

  return isAdminInFirestore(email)
}

export const canDeleteMovements = isDeveloper
export const isAdmin = isDeveloper
