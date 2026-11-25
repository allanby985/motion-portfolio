import { site } from '../config/site'
import { Reveal } from './Reveal'
import { IconArrowUpRight } from './icons'

export function SiteFooter() {
  const socials = site.socials.filter((social) => social.href)

  return (
    <footer className="site-footer" id="contact">
      <div className="container">
        <div className="site-footer__head">
          <span className="eyebrow">CONTACT / 联系</span>
          <span className="eyebrow eyebrow--muted">OPEN FOR WORK — 2026</span>
        </div>

        <Reveal>
          <h2 className="contact__title">
            有一个产品，
            <br />
            想让它<em>动起来</em>？
          </h2>
        </Reveal>

        <div className="contact__grid">
          <Reveal className="contact__primary">
            <span className="contact__label">邮箱 / EMAIL</span>
            <a className="contact__mail" href={`mailto:${site.email}`}>
              {site.email}
              <IconArrowUpRight width={22} height={22} />
            </a>
            <p className="contact__hint">面试、项目合作或作品集咨询，都欢迎直接邮件联系。</p>
          </Reveal>

          <Reveal className="contact__details" delay={80}>
            <div className="contact__item">
              <span className="contact__label">微信 / WECHAT</span>
              <p>{site.wechat}</p>
            </div>
            <div className="contact__item">
              <span className="contact__label">电话 / PHONE</span>
              <a href={`tel:${site.phone.replace(/\s/g, '')}`}>{site.phone}</a>
            </div>
            <div className="contact__item">
              <span className="contact__label">城市 / BASE</span>
              <p>{site.location}</p>
            </div>
            <div className="contact__item">
              <span className="contact__label">状态 / STATUS</span>
              <p className="contact__status">
                <span className="status-dot" aria-hidden="true" />
                {site.availability}
              </p>
            </div>
          </Reveal>
        </div>

        <div className="site-footer__bar">
          <span>
            © 2026 {site.name} · {site.role}
          </span>
          {site.showSampleNotice && (
            <span className="site-footer__note">
              本站视频与图片为示例素材，正式作品可在面试时提供。
            </span>
          )}
          <div className="site-footer__links">
            {socials.map((social) => (
              <a key={social.label} href={social.href} target="_blank" rel="noreferrer">
                {social.label}
              </a>
            ))}
            <button
              type="button"
              className="site-footer__top"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              回到顶部 ↑
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
