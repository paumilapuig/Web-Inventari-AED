export default function ConfirmStep({
  message,
  onConfirm,
  onCancel,
  loading,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancel·lar',
  danger = false,
}) {
  return (
    <div className="confirm-step">
      <p className="confirm-message">{message}</p>
      <div className="modal-actions modal-actions--stack">
        <button
          type="button"
          className={`btn btn-full ${danger ? 'btn-danger-outline' : 'btn-accent'}`}
          disabled={loading}
          onClick={onConfirm}
        >
          {loading ? 'Processant…' : confirmLabel}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-full"
          disabled={loading}
          onClick={onCancel}
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  )
}
