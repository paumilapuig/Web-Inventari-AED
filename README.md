# Inventari AED

App web d'inventari compartit per a l'[Associació d'Estudiants de Dades](https://aed.cat) (AED).

- **URL:** https://inventari-aed.web.app  
- **Stack:** React 19 + Vite 6 + Firebase (Auth, Firestore, Storage, Hosting)  
- **Accés:** comptes Google `@aed.cat`

## Funcions

- Inventari amb foto i unitats (disponibles / esgotats)
- Entrades i sortides amb historial i filtre per data
- Factures pujades pels membres (admin veu totes)
- Sincronització en temps real entre membres

## Arrencar en local

```bash
npm install
cp .env.example .env   # omple les claus Firebase
npm run dev
```

Obre la URL que mostra Vite (normalment `http://localhost:5173`).

## Scripts

| Comanda | Descripció |
|---------|------------|
| `npm run dev` | Desenvolupament |
| `npm run build` | Build a `dist/` |
| `npm run preview` | Previsualitza el build |

## Desplegar

```bash
npm run build
npx firebase-tools deploy
```

Només regles:

```bash
npx firebase-tools deploy --only firestore:rules,storage
```

## Estructura

```
├── docs/                 # Documentació
├── firebase/             # Regles Firestore i Storage
├── src/
│   ├── components/       # UI
│   ├── firebase/         # Config + API Firestore/Storage/Auth
│   ├── utils/            # Helpers
│   └── assets/images/    # Logos i icones
├── .env.example
├── firebase.json
└── package.json
```

## Configuració Firebase

Guia pas a pas: [docs/firebase.md](docs/firebase.md)

## Pujar a GitHub

Guia detallada (repo privat): [docs/github.md](docs/github.md)

Admins/developers: document Firestore `settings/developers` amb camp `emails` (array).  
`VITE_DEV_EMAILS` només afecta la UI local; els permisos reals venen de Firestore.
