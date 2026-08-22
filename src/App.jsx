import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './firebase/AuthContext'
import Login from './components/Login'
import ProductList from './components/ProductList'
import FacturesPage from './components/FacturesPage'
import aedLogo from './assets/images/aedlogoSENSELLETRES.webp'
import scrollIcon from './assets/images/scroll.svg'
import packageIcon from './assets/images/package.svg'
import './App.css'

function readPageFromLocation() {
  return window.location.hash === '#factures' ? 'factures' : 'inventari'
}

export default function App() {
  const { user, loading, logout } = useAuth()
  const [page, setPage] = useState(readPageFromLocation)

  const navigateTo = useCallback((nextPage) => {
    setPage(nextPage)
    const nextHash = nextPage === 'factures' ? '#factures' : '#inventari'
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash
    }
  }, [])

  useEffect(() => {
    const onHashChange = () => setPage(readPageFromLocation())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader" aria-hidden="true" />
        <p>Carregant inventari…</p>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  const initials = user.email?.slice(0, 2).toUpperCase() ?? '?'

  const brandContent = (
    <>
      <img src={aedLogo} alt="Associació d'Estudiants de Dades" className="brand-logo" />
      <div>
        <h1>{page === 'factures' ? 'Factures' : 'Inventari'}</h1>
        <p className="brand-sub">Associació d&apos;Estudiants de Dades</p>
      </div>
    </>
  )

  return (
    <div className="app">
      <header className="header">
        {page === 'factures' ? (
          <div className="brand">{brandContent}</div>
        ) : (
          <button
            type="button"
            className="brand brand--link"
            onClick={() => navigateTo('inventari')}
            aria-label="Anar a inventari"
          >
            {brandContent}
          </button>
        )}
        <div className="header-end">
          <button
            type="button"
            className={`btn btn-ghost btn-sm btn-header-icon ${page === 'factures' ? 'btn-header-icon--active' : ''}`}
            onClick={() => navigateTo(page === 'factures' ? 'inventari' : 'factures')}
            aria-label={page === 'factures' ? 'Anar a inventari' : 'Factures'}
            title={page === 'factures' ? 'Inventari' : 'Factures'}
          >
            <span className="header-nav-stack">
              <img
                src={page === 'factures' ? packageIcon : scrollIcon}
                alt=""
                className="header-nav-icon"
              />
              <span className="header-nav-label">
                {page === 'factures' ? 'Inventari' : 'Factures'}
              </span>
            </span>
          </button>
          <div className="user-chip" title={user.email}>
            <span className="user-avatar">{initials}</span>
            <span className="user-email">{user.email}</span>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
            Sortir
          </button>
        </div>
      </header>

      <main className="main">
        {page === 'inventari' ? <ProductList /> : <FacturesPage />}
      </main>
    </div>
  )
}
