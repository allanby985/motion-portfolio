export type VideoSource =
  | {
      kind: 'file'
      /** 站内 mp4 路径（public/media 下），或任意可直链的 https 地址 */
      src: string
      /** 16:9 封面图，视频加载失败时作为兜底 */
      poster: string
      duration?: string
      note?: string
    }
  | {
      kind: 'bilibili'
      /** B 站公开稿件的 BV 号；仅自己可见的稿件无法被他人播放 */
      bvid: string
      poster: string
      duration?: string
      note?: string
    }

export interface MediaImage {
  src: string
  alt: string
  caption?: string
}

export interface Project {
  slug: string
  /** 展示用序号，例如 01 */
  index: string
  title: string
  subtitle: string
  year: string
  category: string
  client: string
  role: string
  tools: string[]
  summary: string
  intro: string[]
  approach: string[]
  cover: MediaImage
  video: VideoSource
  keyframes: MediaImage[]
  process: (MediaImage & { stage: string })[]
  credits: { label: string; value: string }[]
  /** 示例素材标记：替换为正式作品后改为 false */
  sample: boolean
}
