import { useEffect, useRef, type ReactNode } from 'react'

// A native <dialog>, opened as soon as it mounts. Escape, the close button and
// a click on the backdrop all close it; the parent unmounts it in onClose. A
// drag that starts inside (a swipe, a text selection) and ends on the
// backdrop doesn't count as a click there.
export function Modal({ label, onClose, className = '', children }: {
  label: string
  onClose: () => void
  className?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const downOnBackdrop = useRef(false)

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
      onPointerDown={(e) => { downOnBackdrop.current = e.target === ref.current }}
      onClick={(e) => e.target === ref.current && downOnBackdrop.current && ref.current.close()}
    >
      <div className="modal-inner">
        <button type="button" className="modal-x" aria-label="Close" onClick={() => ref.current?.close()}>×</button>
        {children}
      </div>
    </dialog>
  )
}
