import { useEffect, useRef } from 'react'
import type { MediaImage } from '../data/types'
import { asset } from '../lib/media'
import { IconChevronLeft, IconChevronRight, IconClose } from './icons'

interface LightboxProps {
  items: MediaImage[]
  index: number | null
  onClose: () => void
  onChange: (index: number) => void
}

export function Lightbox({ items, index, onClose, onChange }: LightboxProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const open = index !== null

  useEffect(() => {
    if (!open) return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft' && index !== null) {
        onChange((index - 1 + items.length) % items.length)
      }
      if (event.key === 'ArrowRight' && index !== null) {
        onChange((index + 1) % items.length)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, index, items.length, onClose, onChange])

  if (index === null) return null
  const item = items[index]
  const hasMultiple = items.length > 1

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="图片查看"
      onClick={onClose}
    >
      <button
        ref={closeRef}
        type="button"
        className="lightbox__close"
        onClick={onClose}
        aria-label="关闭"
      >
        <IconClose />
      </button>

      {hasMultiple && (
        <button
          type="button"
          className="lightbox__nav lightbox__nav--prev"
          onClick={(event) => {
            event.stopPropagation()
            onChange((index - 1 + items.length) % items.length)
          }}
          aria-label="上一张"
        >
          <IconChevronLeft />
        </button>
      )}

      <figure className="lightbox__figure" onClick={(event) => event.stopPropagation()}>
        <img className="lightbox__image" src={asset(item.src)} alt={item.alt} />
        <figcaption className="lightbox__caption">
          <span className="mono">
            {String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
          </span>
          {item.caption && <span>{item.caption}</span>}
        </figcaption>
      </figure>

      {hasMultiple && (
        <button
          type="button"
          className="lightbox__nav lightbox__nav--next"
          onClick={(event) => {
            event.stopPropagation()
            onChange((index + 1) % items.length)
          }}
          aria-label="下一张"
        >
          <IconChevronRight />
        </button>
      )}
    </div>
  )
}
