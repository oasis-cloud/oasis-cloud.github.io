let overlay: HTMLDivElement | null = null
let bound = false

function ensureOverlay() {
  if (overlay) return overlay

  overlay = document.createElement('div')
  overlay.className = 'image-zoom-overlay'
  overlay.innerHTML = `
    <div class="image-zoom-container">
      <button class="image-zoom-close" aria-label="关闭">&times;</button>
      <img class="image-zoom-img" src="" alt="">
    </div>
  `
  document.body.appendChild(overlay)

  const imgEl = overlay.querySelector('.image-zoom-img') as HTMLImageElement
  const closeBtn = overlay.querySelector('.image-zoom-close') as HTMLButtonElement

  const hide = () => {
    overlay?.classList.remove('active')
    document.body.style.overflow = ''
  }

  closeBtn.addEventListener('click', hide)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) hide()
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hide()
  })

  ;(overlay as any)._show = (img: HTMLImageElement) => {
    imgEl.src = img.src
    imgEl.alt = img.alt || ''
    overlay?.classList.add('active')
    document.body.style.overflow = 'hidden'
  }

  return overlay
}

export function initImageZoom() {
  ensureOverlay()
  const images = document.querySelectorAll('article.main img')
  images.forEach((img) => {
    const el = img as HTMLImageElement
    if ((el as any)._zoomBound) return
    ;(el as any)._zoomBound = true
    el.style.cursor = 'pointer'
    el.addEventListener('click', (e) => {
      e.preventDefault()
      ;(overlay as any)._show(el)
    })
  })
  bound = true
}

export function isImageZoomBound() {
  return bound
}
