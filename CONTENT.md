# 内容替换清单

当前站内所有项目、文案、联系方式均为**示例**。正式投递前，按这份清单逐项替换。

---

## 1. 个人信息（必改）

文件：`src/config/site.ts`

| 字段 | 当前值 | 改成 |
|---|---|---|
| `name` | `YOUR NAME` | 你的姓名（页脚版权、项目 credits） |
| `nameZh` | `你的名字` | 中文姓名（暂未使用，可留） |
| `email` | `hello@yourname.com` | 常用邮箱 |
| `wechat` | `your_wechat` | 微信号 |
| `phone` | `+86 138 0000 0000` | 手机号 |
| `location` | `中国 · 上海` | 所在城市 |
| `availability` | `2026 年可入职` | 求职状态 |
| `socials` | 三个空链接 | 填 B 站/站酷/Behance 主页；留空则不显示 |
| `showSampleNotice` | `true` | 正式素材全部就位后改 `false` |

页头字标 `wordmark: 'MOTION'`、`wordmarkSuffix: '26'` 可以保留，也可以换成你的名字缩写。

---

## 2. 首页文案

文件：`src/pages/HomePage.tsx`

- 主标题「让产品，开口说话。」
- 副标题「从建模、材质、灯光到动画与合成…」
- 作品区标题「从产品出发，把功能变成画面。」
- About 大标题「比起炫技，我更在意每一帧有没有把产品讲清楚。」
- About 两段自我介绍
- 能力列表 `capabilities`
- 工作流 `process`
- 页脚 CTA「有一个产品，想让它动起来？」

如果要改中文，改完后运行 `npm run font` 重新生成字体子集，否则新字可能缺字。

---

## 3. 四个项目

文件：`src/data/projects.ts`

每个项目建议填：

| 字段 | 说明 |
|---|---|
| `title` / `subtitle` | 项目名 / 一句话类型 |
| `year` | 年份 |
| `category` | 分类，如「产品动画 / 材质灯光」 |
| `client` | 真实客户或「自主项目」 |
| `role` | 你的职责 |
| `tools` | 软件栈 |
| `summary` | 一句话卖点，显示在标题右侧 |
| `intro` / `approach` | 背景 + 你的工作，两段左右 |
| `cover` | 16:9 封面 |
| `video` | 视频源（见 README 第二节） |
| `keyframes` | 4 张关键帧，记得写 caption |
| `process` | 3 张过程图 + stage 标签 |
| `credits` | 制作名单，把 YOUR NAME 换掉 |
| `sample` | 正式项目改 `false` |

项目数量：目前 4 个。只保留 3 个时，删掉一个对象即可，首页网格和详情页「下一个项目」会自动适配。

### 每个项目的素材文件

```
public/media/projects/<slug>/
├── film.mp4            # 成片 16:9，H.264，≤15MB
├── cover.jpg           # 封面 1920×1080
├── key-01.jpg … key-04.jpg
└── process-01.jpg … process-03.jpg
```

用新素材覆盖同名文件最省事，页面不需要改。

---

## 4. Showreel

```
public/media/showreel.mp4          # 24s / 16:9 / H.264
public/media/showreel-poster.jpg   # 封面
```

替换后如果时长不是 24s，记得改两处：
- `src/config/site.ts` 里的 `duration`
- `src/pages/HomePage.tsx` 里的「2026 — 00:24」「24s」文案

---

## 5. 分享缩略图

`public/media/og.jpg`，1200×630。当前由示例素材生成，正式版建议用自己的最强画面 + 名字。

微信/简历里发链接时，标题、描述、缩略图分别来自 `index.html` 的 `og:title`、`og:description`、`og:image`。

---

## 6. 隐私与示例声明

- 页脚目前写着「本站视频与图片为示例素材，正式作品可在面试时提供。」替换完素材后，把 `showSampleNotice` 改为 `false`。
- 每个项目卡片的「示例素材」角标来自 `project.sample`，正式项目改 `false` 后消失。
- `index.html` 默认允许搜索引擎收录；如需隐私，可在 `<head>` 里加 `<meta name="robots" content="noindex, nofollow">`。
- B 站「仅自己可见」的稿件别人打不开，面试前必须改成公开，或现场登录播放。

---

## 7. 交付前检查

- [ ] 姓名、邮箱、微信、电话、城市全部替换
- [ ] 四个项目的 `sample` 全部改 `false`
- [ ] `showSampleNotice` 改 `false`
- [ ] 每个项目成片能在 Chrome / Safari / 微信内播放
- [ ] 手机 4G 下打开首页，首屏 3 秒内出现内容
- [ ] 关键帧灯箱、视频控制条、返回作品、下一个项目都点一遍
- [ ] 在 1366×768 和 1920×1080 投屏比例下检查排版
- [ ] 重新 `npm run build`，确认 dist 里没有旧素材
- [ ] 线上链接在微信里打开一次
