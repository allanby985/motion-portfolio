import { site } from '../config/site'
import { projects } from '../data/projects'
import { ProjectCard } from '../components/ProjectCard'
import { Reveal } from '../components/Reveal'
import { VideoPlayer } from '../components/VideoPlayer'
import { IconArrowDown, IconArrowUpRight, IconPlay } from '../components/icons'
import { usePageMeta } from '../lib/meta'
import { asset } from '../lib/media'

const capabilities = [
  {
    label: '三维',
    items: ['Cinema 4D', 'Blender', 'Redshift', 'Octane'],
  },
  {
    label: '动态',
    items: ['After Effects', 'Houdini（基础）', '分镜与节奏'],
  },
  {
    label: '后期',
    items: ['DaVinci Resolve', 'Nuke', 'Premiere Pro'],
  },
  {
    label: '协作',
    items: ['Figma', '脚本沟通', '版本与交付'],
  },
]

const process = [
  {
    step: '01',
    title: '脚本与分镜',
    text: '先想清楚要讲什么，再决定怎么拍。',
  },
  {
    step: '02',
    title: '建模与场景',
    text: '用准确的形体与比例建立可信度。',
  },
  {
    step: '03',
    title: '材质与灯光',
    text: '让光替产品说话，而不是装饰画面。',
  },
  {
    step: '04',
    title: '动画与镜头',
    text: '用运动控制注意力，让信息按顺序出现。',
  },
  {
    step: '05',
    title: '渲染与合成',
    text: '统一色彩、控制噪点，交付可用的成片。',
  },
]

export function HomePage() {
  usePageMeta(site.title, site.description)

  return (
    <div className="home">
      <section className="hero">
        <div className="container hero__meta">
          <span className="eyebrow">产品动画 / 三维动态设计</span>
          <span className="eyebrow eyebrow--muted">PORTFOLIO — 2026</span>
        </div>

        <a className="hero__reel" href="#reel">
          <span className="hero__reel-media">
            <img
              src={asset(site.showreel.video.poster)}
              alt=""
              width={1920}
              height={1080}
            />
            <span className="hero__reel-play" aria-hidden="true">
              <IconPlay width={16} height={16} />
            </span>
          </span>
          <span className="hero__reel-caption">
            <span>SHOWREEL 2026</span>
            <span>00:24</span>
          </span>
        </a>

        <div className="container hero__body">
          <h1 className="hero__title">
            <span>让产品，</span>
            <span>开口说话。</span>
          </h1>

          <div className="hero__foot">
            <p className="hero__intro">
              从建模、材质、灯光到动画与合成，
              <br />
              把每一台产品，讲成一个值得相信的故事。
            </p>
            <div className="hero__actions">
              <a className="text-link" href="#work">
                查看作品
                <IconArrowDown />
              </a>
              <span className="hero__status">
                <span className="status-dot" aria-hidden="true" />
                {site.availability}
              </span>
            </div>
          </div>
        </div>

        <div className="container hero__bottom">
          <span className="eyebrow eyebrow--muted">SCROLL TO EXPLORE</span>
          <span className="hero__count">
            SELECTED WORK <strong>04</strong>
          </span>
        </div>
      </section>

      <section className="section reel" id="reel">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">SHOWREEL / 作品集锦</span>
            <span className="eyebrow eyebrow--muted">2026 — 00:24</span>
          </div>

          <Reveal>
            <VideoPlayer source={site.showreel.video} title={site.showreel.title} />
          </Reveal>

          <div className="reel__foot">
            <p>
              {site.showreel.label} · 24s · 16:9 · 声音设计待补充
              {site.showSampleNotice && ' — 当前为示例素材'}
            </p>
            <span className="eyebrow eyebrow--muted">DIRECTOR'S CUT</span>
          </div>
        </div>
      </section>

      <section className="section works" id="work">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">SELECTED WORK / 精选项目</span>
            <span className="eyebrow eyebrow--muted">04 PROJECTS — 2025/2026</span>
          </div>

          <div className="works__intro">
            <h2 className="section-title">
              从产品出发，
              <br />
              把功能变成画面。
            </h2>
            <p>
              以下项目聚焦消费电子与美妆产品，覆盖概念片、材质表现与结构演示。
              {site.showSampleNotice && ' 当前素材为示例，正式作品将持续替换。'}
            </p>
          </div>

          <div className="work-grid">
            {projects.map((project, index) => (
              <Reveal
                key={project.slug}
                className={`work-cell work-cell--${index + 1}`}
                delay={(index % 2) * 70}
              >
                <ProjectCard project={project} eager={index === 0} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section about" id="about">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">ABOUT / 关于</span>
            <span className="eyebrow eyebrow--muted">PRODUCT MOTION DESIGNER</span>
          </div>

          <Reveal>
            <p className="about__statement">
              比起炫技，
              <br />
              我更在意每一帧
              <br />
              有没有把产品<em>讲清楚</em>。
            </p>
          </Reveal>

          <div className="about__grid">
            <Reveal className="about__copy">
              <p>
                我是一名产品动画设计师，专注于消费电子与美妆产品的三维视觉。工作覆盖从脚本、分镜、建模、
                材质灯光，到动画、渲染与合成的完整流程。
              </p>
              <p>
                技术是手段，画面最终要回答一个问题：这个东西为什么值得被看见。习惯把技术问题拆成镜头问题，
                再用画面解决它。
              </p>
              <a className="text-link about__link" href="#contact">
                聊聊合作
                <IconArrowUpRight />
              </a>
            </Reveal>

            <Reveal className="about__capabilities" delay={80}>
              {capabilities.map((group) => (
                <div className="capability" key={group.label}>
                  <span className="capability__label">{group.label}</span>
                  <ul>
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </Reveal>
          </div>

          <div className="process">
            <div className="process__head">
              <span className="eyebrow">WORKFLOW / 工作流</span>
              <span className="eyebrow eyebrow--muted">05 STEPS</span>
            </div>
            <ol className="process__list">
              {process.map((item, index) => (
                <li key={item.step} className="process__item">
                  <Reveal delay={index * 50}>
                    <span className="process__step">{item.step}</span>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </div>
  )
}
