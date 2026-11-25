import type { VideoSource } from '../data/types'

/**
 * 个人信息集中在 config/site.ts，替换下面这些值即可。
 * 名字、邮箱、微信、电话、城市默认是占位内容，交付前请改成自己的。
 */
export const site = {
  /** 页头字标 */
  wordmark: 'MOTION',
  wordmarkSuffix: '26',
  title: 'MOTION — 产品动画作品集',
  description:
    '产品动画设计师作品集：三维产品演示、材质灯光、动态视觉与合成。',
  name: 'YOUR NAME',
  nameZh: '你的名字',
  role: '产品动画设计师',
  roleEn: 'Product Motion Designer',
  location: '中国 · 上海',
  email: 'hello@yourname.com',
  wechat: 'your_wechat',
  phone: '+86 138 0000 0000',
  availability: '2026 年可入职',
  /** 首页作品集锦，替换 src / poster 即可 */
  showreel: {
    title: '2026 作品集锦',
    label: 'SHOWREEL 2026',
    video: {
      kind: 'file',
      src: '/media/showreel.mp4',
      poster: '/media/showreel-poster.jpg',
      duration: '00:24',
    } satisfies VideoSource,
  },
  /** 填上自己的主页后才会显示；留空则不显示 */
  socials: [
    { label: 'Bilibili', href: '' },
    { label: '站酷', href: '' },
    { label: 'Behance', href: '' },
  ],
  /** 示例素材提示；正式素材就位后改为 false */
  showSampleNotice: true,
} as const
