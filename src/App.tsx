import { useEffect } from 'react'
import { RouterProvider, useRouter } from './lib/router'
import { SiteHeader } from './components/SiteHeader'
import { SiteFooter } from './components/SiteFooter'
import { HomePage } from './pages/HomePage'
import { ProjectPage } from './pages/ProjectPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { getProject } from './data/projects'

function AppRoutes() {
  const { path } = useRouter()

  useEffect(() => {
    window.history.scrollRestoration = 'manual'
  }, [])

  const projectMatch = path.match(/^\/work\/([^/]+)\/?$/)
  const project = projectMatch ? getProject(decodeURIComponent(projectMatch[1])) : undefined
  const isHome = path === '/'
  const showFooter = isHome || Boolean(project)

  let content
  if (isHome) {
    content = <HomePage />
  } else if (project) {
    content = <ProjectPage key={project.slug} project={project} />
  } else {
    content = <NotFoundPage />
  }

  return (
    <div className="site">
      <a className="skip-link" href="#main">
        跳到主要内容
      </a>
      <SiteHeader />
      <main id="main" className="site__main" key={path}>
        {content}
      </main>
      {showFooter && <SiteFooter />}
    </div>
  )
}

export default function App() {
  return (
    <RouterProvider>
      <AppRoutes />
    </RouterProvider>
  )
}
