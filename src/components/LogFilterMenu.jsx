import { useEffect, useRef, useState } from 'react'

export function filterMovementsByDate(movements, filter) {
  const { dateFrom, dateTo, timeFrom, timeTo } = filter
  if (!dateFrom) return movements

  const toDayStr = dateTo || dateFrom
  const rangeStart = new Date(`${dateFrom}T${timeFrom || '00:00'}:00`)
  const rangeEnd = new Date(`${toDayStr}T${timeTo || '23:59'}:59`)

  return movements.filter((mov) => {
    const ts = mov.data?.toDate?.()
    if (!ts) return false
    return ts >= rangeStart && ts <= rangeEnd
  })
}

export function hasActiveFilter(filter) {
  return Boolean(filter.dateFrom)
}

export default function LogFilterMenu({ filter, onChange, onApply, resultCount, totalCount }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
    }
  }, [open])

  function update(field, value) {
    onChange({ ...filter, [field]: value })
  }

  function handleClear() {
    onChange({ dateFrom: '', dateTo: '', timeFrom: '', timeTo: '' })
    onApply({ dateFrom: '', dateTo: '', timeFrom: '', timeTo: '' })
    setOpen(false)
  }

  function handleApply() {
    onApply(filter)
    setOpen(false)
  }

  const active = hasActiveFilter(filter)

  return (
    <div className="log-filter-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`log-filter-btn ${active ? 'log-filter-btn--active' : ''}`}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="Filtrar per data"
        title="Filtrar per data"
      >
        <FilterIcon />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="log-filter-backdrop"
            aria-label="Tancar filtre"
            onClick={() => setOpen(false)}
          />
          <div className="log-filter-panel">
            <div className="log-filter-body">
              <p className="log-filter-title">Filtrar per data i hora</p>

              <div className="log-filter-fields">
                <label className="log-filter-field">
                  <span className="field-label">Des del dia</span>
                  <input
                    type="date"
                    value={filter.dateFrom}
                    onChange={(e) => update('dateFrom', e.target.value)}
                  />
                </label>
                <label className="log-filter-field">
                  <span className="field-label">Fins al dia</span>
                  <input
                    type="date"
                    value={filter.dateTo}
                    min={filter.dateFrom || undefined}
                    onChange={(e) => update('dateTo', e.target.value)}
                  />
                </label>
                <label className="log-filter-field">
                  <span className="field-label">Hora inici</span>
                  <input
                    type="time"
                    value={filter.timeFrom}
                    onChange={(e) => update('timeFrom', e.target.value)}
                  />
                </label>
                <label className="log-filter-field">
                  <span className="field-label">Hora final</span>
                  <input
                    type="time"
                    value={filter.timeTo}
                    onChange={(e) => update('timeTo', e.target.value)}
                  />
                </label>
              </div>

              <p className="log-filter-hint">
                Deixa «Fins al dia» buit per un sol dia. Les hores s&apos;apliquen al dia d&apos;inici i al de final (opcional).
              </p>

              {active && resultCount != null && (
                <p className="log-filter-results">
                  {resultCount} de {totalCount} moviments
                </p>
              )}

              <div className="log-filter-actions">
                <button type="button" className="log-filter-action log-filter-action--ghost" onClick={handleClear}>
                  Netejar
                </button>
                <button
                  type="button"
                  className="log-filter-action log-filter-action--primary"
                  onClick={handleApply}
                  disabled={!filter.dateFrom}
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M2 3h12M4.5 8h7M7 13h2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
