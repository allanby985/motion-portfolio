import { useState } from 'react'
import { createPortal } from 'react-dom'
import { site } from '../config/site'
import { projects, getNextProject } from '../data/projects'
import type { Project } from '../data/types'
import { asset } from '../lib/media'
import { Link } from '../lib/router'
import { VideoPlayer } from '../components/VideoPlayer'
import { Lightbox } from '../components/Lightbox'
import { Reveal } from '../components/Reveal'
import { IconArrowUpRight } from '../components/icons'
import { usePageMeta } from '../lib/meta'

interface ProjectPageProps {
  project: Project
}

export function ProjectPage({ project }: ProjectPageProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const nextProject = getNextProject(project.slug)
  usePageMeta(
    `${project.title} — ${project.subtitle} | ${site.name}`,
    `${project.summary} ${project.category}，${project.year}。`,
  )

  return (
    <article className="project-page">
      <div className="container project-page__top">
        <Link to="/#work" className="back-link">
          ← 返回作品
        </Link>
        <span className="eyebrow">
          PROJECT {project.index} / {String(projects.length).padStart(2, '0')}
        </span>
      </div>

      <header className="container project-page__header">
        <div className="project-page__kicker">
          <span className="eyebrow">{project.category}</span>
          <span className="eyebrow eyebrow--muted">{project.year}</span>
        </div>
        <h1 className="project-page__title">{project.title}</h1>
        <div className="project-page__lede">
          <p className="project-page__subtitle">{project.subtitle}</p>
          <p className="project-page__summary">{project.summary}</p>
        </div>
        {project.sample && <span className="chip project-page__chip">示例素材 · 待替换</span>}
      </header>

      <div className="container project-page__player">
        <VideoPlayer source={project.video} title={project.title} />
      </div>

      <section className="container project-page__meta" aria-label="项目信息">
        <dl>
          <div>
            <dt>客户 / CLIENT</dt>
            <dd>{project.client}</dd>
          </div>
          <div>
            <dt>角色 / ROLE</dt>
            <dd>{project.role}</dd>
          </div>
          <div>
            <dt>软件 / TOOLS</dt>
            <dd>{project.tools.join(' · ')}</dd>
          </div>
          <div>
            <dt>年份 / YEAR</dt>
            <dd>{project.year}</dd>
          </div>
        </dl>
      </section>

      <section className="container project-page__story">
        <div className="project-page__story-label">
          <span className="eyebrow">01 / 背景</span>
        </div>
        <div className="project-page__story-copy">
          {project.intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <h2>我的工作</h2>
          {project.approach.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="container project-page__gallery" aria-labelledby="keyframes-title">
        <div className="section-head">
          <h2 id="keyframes-title" className="section-head__title">
            关键帧
          </h2>
          <span className="eyebrow eyebrow--muted">02 / KEYFRAMES</span>
        </div>
        <div className="keyframe-grid">
          {project.keyframes.map((frame, index) => (
            <Reveal key={frame.src} delay={(index % 2) * 70}>
              <button
                type="button"
                className="keyframe"
                onClick={() => setLightboxIndex(index)}
                aria-label={`查看大图：${frame.caption ?? frame.alt}`}
              >
                <img
                  src={asset(frame.src)}
                  alt={frame.alt}
                  width={1920}
                  height={1080}
                  loading="lazy"
                  decoding="async"
                />
                <span className="keyframe__caption">
                  <span className="eyebrow eyebrow--muted">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {frame.caption}
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container project-page__process" aria-labelledby="process-title">
        <div className="section-head">
          <h2 id="process-title" className="section-head__title">
            制作过程
          </h2>
          <span className="eyebrow eyebrow--muted">03 / PROCESS</span>
        </div>
        <div className="process-grid">
          {project.process.map((step, index) => (
            <Reveal key={step.src} delay={index * 60}>
              <figure className="process-step">
                <img
                  src={asset(step.src)}
                  alt={step.alt}
                  width={1920}
                  height={1080}
                  loading="lazy"
                  decoding="async"
                />
                <figcaption>
                  <span className="process-step__stage">{step.stage}</span>
                  <span className="process-step__caption">{step.caption}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container project-page__credits" aria-label="制作名单">
        <div className="project-page__credits-head">
          <span className="eyebrow">04 / CREDITS</span>
        </div>
        <dl>
          {project.credits.map((credit) => (
            <div key={credit.label}>
              <dt>{credit.label}</dt>
              <dd>{credit.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="container project-page__next">
        <span className="eyebrow eyebrow--muted">NEXT PROJECT</span>
        <Link to={`/work/${nextProject.slug}`} className="next-project">
          <span className="next-project__index">{nextProject.index}</span>
          <span className="next-project__title">{nextProject.title}</span>
          <span className="next-project__subtitle">{nextProject.subtitle}</span>
          <span className="next-project__arrow">
            <IconArrowUpRight width={28} height={28} />
          </span>
          <img
            className="next-project__image"
            src={asset(nextProject.cover.src)}
            alt=""
            width={1920}
            height={1080}
            loading="lazy"
          />
        </Link>
      </div>

      {createPortal(
        <Lightbox
          items={project.keyframes}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChange={setLightboxIndex}
        />,
        document.body,
      )}
    </article>
  )
}
