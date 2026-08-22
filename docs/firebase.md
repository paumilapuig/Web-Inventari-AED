# Configuració Firebase — Inventari AED

## 1. Projecte i app web

1. Crea o obre el projecte a [Firebase Console](https://console.firebase.google.com/).
2. Afegeix una app web i copia la configuració SDK.
3. Copia `.env.example` → `.env` i omple les variables `VITE_FIREBASE_*`.

## 2. Authentication

1. **Authentication** → mètode **Google**.
2. Restringeix el domini a `@aed.cat` (la app també ho comprova al client).
3. Afegeix els dominis autoritzats (localhost, `inventari-aed.web.app`, etc.).

## 3. Firestore

1. Crea la base de dades (ubicació Europa si és possible).
2. Desplega les regles:

```bash
npx firebase-tools deploy --only firestore:rules
```

Col·leccions principals (es creen soles amb l'ús):

- `productos`
- `moviments`
- `factures`
- `settings/developers` → `{ emails: ["algu@aed.cat"] }`

## 4. Storage

1. Activa Storage.
2. Desplega les regles:

```bash
npx firebase-tools deploy --only storage
```

Rutes típiques: fotos de productes i `factures/{userId}/...`.

## 5. Hosting

```bash
npm run build
npx firebase-tools deploy --only hosting
```

## 6. Admins / developers

- Document: `settings/developers` → camp `emails` (array en minúscules o tal com es guardin).
- Opcional a `.env`: `VITE_DEV_EMAILS=tu@aed.cat` (UI; no substitueix les regles).

Permisos típics d'admin/dev: veure totes les factures, esborrar factures, esborrar productes/moviments.

## Problemes freqüents

| Símptoma | Què revisar |
|----------|-------------|
| Error d'auth | Google activat + domini autoritzat |
| No carreguen productes | `.env` i regles Firestore |
| Error en pujar foto/factura | Storage actiu + regles |
| No surten opcions d'admin | `settings/developers` i/o `VITE_DEV_EMAILS` |
