import { site } from '../config/site'
import { Link } from '../lib/router'
import { usePageMeta } from '../lib/meta'

export function NotFoundPage() {
  usePageMeta(`页面不存在 — ${site.name}`, '这个页面没有找到，回到首页继续浏览作品。')

  return (
    <section className="not-found container">
      <span className="eyebrow">404 / NOT FOUND</span>
      <h1>
        这个画面
        <br />
        不在这里。
      </h1>
      <p>链接可能已经失效，或者项目还没有上线。</p>
      <Link className="text-link" to="/">
        回到首页 →
      </Link>
    </section>
  )
}
