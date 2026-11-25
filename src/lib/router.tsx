import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react'

const BASE =
  import.meta.env.BASE_URL === '/' ? '' : import.meta.env.BASE_URL.replace(/\/$/, '')

interface RouterValue {
  path: string
  navigate: (to: string, options?: { replace?: boolean }) => void
}

const RouterContext = createContext<RouterValue | null>(null)

export function toHref(path: string) {
  if (!path.startsWith('/')) return path
  return `${BASE}${path}`
}

function readPath() {
  const pathname = window.location.pathname
  if (BASE && pathname.startsWith(BASE)) {
    const rest = pathname.slice(BASE.length)
    return rest.startsWith('/') ? rest : `/${rest}`
  }
  return pathname || '/'
}

function scrollToHash(hash: string, behavior: ScrollBehavior = 'smooth') {
  if (!hash) return false
  const target = document.getElementById(hash)
  if (!target) return false
  target.scrollIntoView({ behavior, block: 'start' })
  return true
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(readPath)

  useEffect(() => {
    const initialHash = window.location.hash.replace(/^#/, '')
    if (initialHash) {
      window.setTimeout(() => scrollToHash(initialHash, 'auto'), 60)
    }

    const onPopState = () => {
      setPath(readPath())
      window.setTimeout(() => {
        const hash = window.location.hash.replace(/^#/, '')
        if (!scrollToHash(hash, 'auto')) window.scrollTo({ top: 0 })
      }, 30)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    const hashIndex = to.indexOf('#')
    const rawPath = hashIndex >= 0 ? to.slice(0, hashIndex) || '/' : to
    const hash = hashIndex >= 0 ? to.slice(hashIndex + 1) : ''
    const nextPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`
    const url = `${toHref(nextPath)}${hash ? `#${hash}` : ''}`

    if (options?.replace) {
      window.history.replaceState(null, '', url)
    } else {
      window.history.pushState(null, '', url)
    }
    setPath(nextPath)

    if (hash) {
      window.setTimeout(() => {
        if (!scrollToHash(hash)) window.scrollTo({ top: 0 })
      }, 60)
    } else {
      window.scrollTo({ top: 0 })
    }
  }, [])

  const value = useMemo(() => ({ path, navigate }), [path, navigate])

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
}

export function useRouter() {
  const router = useContext(RouterContext)
  if (!router) throw new Error('useRouter 必须在 RouterProvider 内使用')
  return router
}

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string
  children: ReactNode
}

export function Link({ to, children, onClick, ...rest }: LinkProps) {
  const { navigate } = useRouter()

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (event.defaultPrevented) return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if (rest.target && rest.target !== '_self') return
    event.preventDefault()
    navigate(to)
  }

  return (
    <a href={toHref(to)} onClick={handleClick} {...rest}>
      {children}
    </a>
  )
}
