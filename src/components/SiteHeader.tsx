import { useEffect, useState } from 'react'
import { site } from '../config/site'
import { Link, useRouter } from '../lib/router'

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [onDark, setOnDark] = useState(false)
  const { navigate } = useRouter()

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24)
      const footer = document.getElementById('contact')
      setOnDark(Boolean(footer && footer.getBoundingClientRect().top <= 76))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const goToSection = (id: string) => {
    const scroll = () => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    if (document.getElementById(id)) {
      scroll()
      return
    }
    navigate('/')
    window.setTimeout(scroll, 140)
  }

  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''} ${onDark ? 'is-on-dark' : ''}`.trim()}>
      <div className="site-header__inner">
        <Link to="/" className="wordmark">
          {site.wordmark}
          <span className="wordmark__suffix">{site.wordmarkSuffix}</span>
        </Link>

        <nav className="site-nav" aria-label="主导航">
          <button type="button" className="site-nav__link" onClick={() => goToSection('work')}>
            作品<span>Work</span>
          </button>
          <button type="button" className="site-nav__link" onClick={() => goToSection('about')}>
            关于<span>About</span>
          </button>
          <button type="button" className="site-nav__link" onClick={() => goToSection('contact')}>
            联系<span>Contact</span>
          </button>
        </nav>

        <div className="site-header__status">
          <span className="status-dot" aria-hidden="true" />
          {site.availability}
        </div>
      </div>
    </header>
  )
}
