import { useEffect, useRef, type ReactNode } from 'react'

// A native <dialog>, opened as soon as it mounts. Escape, the close button and
// a click on the backdrop all close it; the parent unmounts it in onClose.
export function Modal({ label, onClose, className = '', children }: {
  label: string
  onClose: () => void
  className?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      aria-label={label}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current.close()}
    >
      <div className="modal-inner">
        <button type="button" className="modal-x" aria-label="Close" onClick={() => ref.current?.close()}>×</button>
        {children}
      </div>
    </dialog>
  )
}
