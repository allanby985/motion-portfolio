import type { Project } from '../data/types'
import { asset } from '../lib/media'
import { Link } from '../lib/router'
import { IconArrowUpRight } from './icons'

interface ProjectCardProps {
  project: Project
  eager?: boolean
}

export function ProjectCard({ project, eager = false }: ProjectCardProps) {
  return (
    <Link to={`/work/${project.slug}`} className="project-card">
      <div className="project-card__media">
        <img
          src={asset(project.cover.src)}
          alt={project.cover.alt}
          width={1920}
          height={1080}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
        />
        <div className="project-card__hover" aria-hidden="true">
          <span>VIEW PROJECT</span>
          <IconArrowUpRight />
        </div>
        {project.sample && <span className="chip project-card__chip">示例素材</span>}
      </div>
      <div className="project-card__meta">
        <span className="project-card__index">{project.index}</span>
        <div className="project-card__titles">
          <h3>{project.title}</h3>
          <p>{project.subtitle}</p>
        </div>
        <span className="project-card__year">{project.year}</span>
      </div>
    </Link>
  )
}
