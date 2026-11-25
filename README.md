# MOTION — 产品动画作品集

面向中国大陆面试场景的单页作品集：明亮极简视觉、3–4 个精选项目、16:9 视频与关键帧、视频源可切换、线上链接可分享。

当前提交里包含一套**可替换的示例素材**（4 个虚构项目），用于先确认版式、交互与内容结构；正式作品按下面的流程替换即可。

## 在线预览

**https://allanby985.github.io/motion-portfolio/**

> 这是使用示例素材部署的预览版（GitHub Pages，public 仓库）。正式投递前请先替换个人信息与项目素材；如果在中国大陆访问较慢，建议按「部署」一节的说明换到 Cloudflare Pages + 自有域名。

---

## 快速开始

```bash
npm install
npm run dev        # http://127.0.0.1:5173
npm run build      # 产物在 dist/
npm run preview    # 预览生产构建
```

环境：Node.js ≥ 20（当前开发机 v26）、npm。构建产物是纯静态文件，不需要后端。

---

## 一、先改这三处

### 1. 个人信息 `src/config/site.ts`

| 字段 | 说明 |
|---|---|
| `name` / `nameZh` | 姓名 |
| `email` / `wechat` / `phone` | 联系方式，当前是占位值 |
| `location` | 城市 |
| `availability` | 求职状态，如「2026 年可入职」 |
| `socials` | B 站 / 站酷 / Behance，`href` 留空则不显示 |
| `showSampleNotice` | 正式素材就位后改为 `false` |

### 2. 项目内容 `src/data/projects.ts`

每个项目包含：标题、副标题、年份、客户、角色、软件、简介、两段正文、封面、视频、4 张关键帧、3 张过程图、credits。

- 改文案直接改这个文件，不用动页面组件。
- 项目增删：复制一个对象即可，首页网格会自动适配 3–4 个项目。
- 正式素材替换完成后，把该项目 `sample` 改为 `false`。

### 3. 素材文件 `public/media/`

```
public/media/
├── showreel.mp4              # 首页作品集锦，16:9，24s
├── showreel-poster.jpg       # 集锦封面
├── og.jpg                    # 微信/社交分享缩略图 1200×630
└── projects/
    ├── aura/
    │   ├── film.mp4          # 成片 16:9
    │   ├── cover.jpg         # 封面（建议 1920×1080）
    │   ├── key-01..04.jpg    # 关键帧
    │   └── process-01..03.jpg# 过程图（白模/材质/成片）
    ├── serum/ ...
    ├── arc/ ...
    └── type-26/ ...
```

所有图片按 16:9 裁切（`object-fit: cover`），建议 1920×1080、JPEG 质量 82–88。

---

## 二、视频通道怎么切换

在 `src/data/projects.ts` 的 `video` 字段里改，页面和播放器会自动适配：

### 本地 MP4（默认）

```ts
video: {
  kind: 'file',
  src: '/media/projects/aura/film.mp4',
  poster: '/media/projects/aura/cover.jpg',
  duration: '00:08',
}
```

### B 站公开稿件

```ts
video: {
  kind: 'bilibili',
  bvid: 'BV1xxxxxxxxx',
  poster: '/media/projects/aura/cover.jpg',
}
```

> ⚠️ B 站「仅自己可见」的稿件别人打不开，iframe 也不行；「未公开」并非真正的仅链接可见。
> 面试场景的现实做法：面试前把稿件设为**公开**，面完再改回私密；或现场登录 B 站播放。
> 站点里点击封面才会加载 iframe，不会默认请求 B 站。

### 对象存储签名链接

```ts
video: {
  kind: 'file',
  src: 'https://your-bucket.oss-cn-hangzhou.aliyuncs.com/aura.mp4?Expires=...&Signature=...',
  poster: '/media/projects/aura/cover.jpg',
}
```

签名链接有时效，面试当天需要重新生成；长期使用建议自己域名 + 私有 bucket + 短时效签名，或在面试时改用本地文件。

### 视频压缩建议

H.264（兼容性最好）+ AAC、1080p、≤30s、≤15MB、`faststart`：

```bash
ffmpeg -i source.mov -vf "scale=1920:-2,fps=30" \
  -c:v libx264 -preset slow -crf 21 -profile:v high -pix_fmt yuv420p \
  -c:a aac -b:a 128k -movflags +faststart film.mp4
```

不要用 H.265/AV1 作为唯一版本：Windows Chrome 和部分微信内核兼容性不稳。长视频才考虑 HLS，本站不需要。

---

## 三、字体

中文正文用自托管 Noto Sans SC 子集（`public/fonts/noto-sans-sc-subset.woff2`，约 190KB），拉丁小标签用 JetBrains Mono。

改过中文文案后重新生成子集：

```bash
npm run font
```

脚本默认读 `C:\Windows\Fonts\NotoSansSC-VF.ttf`；其他机器可用 `FONT_SOURCE=路径 npm run font`。字体是否包含某字取决于是否出现在源码里，如果动态数据里出现生僻字没被收集，补进 `scripts/build-font.mjs` 的字符集即可。

---

## 四、部署

### 首选：Cloudflare Pages（大陆可访问性相对最好，但无大陆节点）

1. 把仓库推到 GitHub（建议私有）。
2. Cloudflare Dashboard → Workers & Pages → Pages → Connect to Git → 选仓库。
3. Build command：`npm run build`；Build output：`dist`。
4. 绑定自己的域名（不需要备案，海外边缘节点）。`*.pages.dev` 直链在大陆经常不稳，**建议绑定域名**再发给 HR。
5. 项目已带 `public/_redirects`，直接访问 `/work/aura` 不会 404。

### 备选：GitHub Pages（当前预览版使用的方式）

免费账户只能用 **public 仓库**开 Pages（站点本身也是公开的）。仓库名不是 `用户名.github.io` 时，构建要指定子路径：

```bash
VITE_BASE=/仓库名/ npm run build
```

当前仓库已配置 `.github/workflows/deploy.yml`：推送到 `main` 后自动构建并发布到 Pages。项目自带 `public/404.html` 处理刷新 404。

> GitHub Pages 在大陆能访问但不稳定，微信内也可能被拦；只作为镜像/兜底，不建议作为唯一链接。

### 其他

- Netlify / Vercel：可以直接识别 `_redirects` / 自动 SPA 回退，但大陆访问不稳定。
- 阿里云 OSS / 腾讯云 COS：默认域名会强制下载 HTML，必须绑定已备案的自定义域名，准备周期较长。
- 如果暂时没有域名：先把 `dist/` 打包发给面试官，或面试时用本地 `npm run preview` 演示，链接作为补充。

---

## 五、面试现场清单

- [ ] 线上链接提前在**手机 4G/5G** 和**微信内**各打开一次，确认视频能播放。
- [ ] 准备离线兜底：`dist/` + 本地 MP4 + PDF 作品集，断网也能讲。
- [ ] 视频源如果是 B 站，确认稿件是**公开**状态，或现场登录。
- [ ] 笔记本分辨率 1920×1080 以上，浏览器缩放 100%；投屏前检查 16:9 是否被拉伸。
- [ ] 微信内如果打不开：右上角 → 在浏览器打开；或直接发短链/二维码。
- [ ] 面试前把 `sample`、`showSampleNotice` 全部关掉，示例标签不应出现在正式版本。

---

## 六、内容待补清单

见 [CONTENT.md](./CONTENT.md)。当前所有项目、客户、文案均为示例，正式投递前必须替换，避免把示例项目当成真实经历。

---

## 技术说明

- Vite 8 + React 19 + TypeScript，无 UI 框架、无路由库，产物约 80KB gzip JS + 9KB gzip CSS。
- 自写 60 行 History API 路由，兼容静态托管的 SPA 回退。
- 视频为点击后播放，`preload="metadata"`，封面图先行，避免首屏拉大文件。
- 关键帧支持灯箱查看（键盘 ← → / Esc）。
- 动效遵守 `prefers-reduced-motion`。
- 占位素材由 `scripts/generate_assets.py`（Pillow + FFmpeg）生成，可重复生成，也可整体替换。
