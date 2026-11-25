import type { Project } from './types'

/**
 * 项目数据：改这个文件就能替换作品，不需要动页面组件。
 *
 * 视频源三种写法：
 * 1. 本地文件（推荐先用这个，正式视频压缩后放进 public/media/）
 *    video: { kind: 'file', src: '/media/projects/xxx/film.mp4', poster: '/media/projects/xxx/cover.jpg', duration: '00:08' }
 * 2. B 站公开稿件（私密/仅自己可见的稿件别人打不开，不能用于面试）
 *    video: { kind: 'bilibili', bvid: 'BV1xxxxxxxxx', poster: '/media/projects/xxx/cover.jpg' }
 * 3. 对象存储签名直链：同样用 kind: 'file'，把 src 换成完整 https 地址即可
 *
 * 替换正式素材后，把该项目 sample 改为 false。
 */
export const projects: Project[] = [
  {
    slug: 'aura',
    index: '01',
    title: 'AURA',
    subtitle: '桌面空气净化器 · 产品概念片',
    year: '2026',
    category: '产品动画 / 材质灯光',
    client: '概念项目 / SELF-INITIATED',
    role: '三维动画 / 材质灯光 / 合成',
    tools: ['Cinema 4D', 'Octane', 'After Effects', 'DaVinci Resolve'],
    summary: '把看不见的风，做成可以看见的呼吸。',
    intro: [
      'AURA 是一台面向桌面场景的空气净化器。片子的任务不是罗列参数，而是把「干净的风」变成可以看见的东西。',
      '织物的起伏、空气的流动、指示灯的呼吸，构成全片的三个视觉母题。8 秒循环版本适合官网首屏与电商详情页。',
    ],
    approach: [
      '先从白模与镜头开始，确定产品在画面中的比例和运动轨迹；再用柔光与微距建立材质可信度；最后在合成阶段压低饱和度，让画面保持安静。',
    ],
    cover: {
      src: '/media/projects/aura/cover.jpg',
      alt: 'AURA 空气净化器产品概念片封面',
    },
    video: {
      kind: 'file',
      src: '/media/projects/aura/film.mp4',
      poster: '/media/projects/aura/cover.jpg',
      duration: '00:08',
    },
    keyframes: [
      {
        src: '/media/projects/aura/key-01.jpg',
        alt: 'AURA 开场画面',
        caption: '开场 / 产品从暗处进入光里',
      },
      {
        src: '/media/projects/aura/key-02.jpg',
        alt: 'AURA 织物材质微距画面',
        caption: '微距 / 织物表面的空气流动',
      },
      {
        src: '/media/projects/aura/key-03.jpg',
        alt: 'AURA 指示灯细节画面',
        caption: '细节 / 指示灯的呼吸节奏',
      },
      {
        src: '/media/projects/aura/key-04.jpg',
        alt: 'AURA 收尾画面',
        caption: '收尾 / 产品与环境的留白',
      },
    ],
    process: [
      {
        stage: 'PREVIZ',
        src: '/media/projects/aura/process-01.jpg',
        alt: 'AURA 白模阶段',
        caption: '白模与构图：先确定镜头，再谈细节。',
      },
      {
        stage: 'LOOKDEV',
        src: '/media/projects/aura/process-02.jpg',
        alt: 'AURA 材质与灯光阶段',
        caption: '材质与灯光：用柔光箱还原织物的哑光。',
      },
      {
        stage: 'FINAL',
        src: '/media/projects/aura/process-03.jpg',
        alt: 'AURA 最终画面',
        caption: '最终画面：统一色彩，输出 16:9 成片。',
      },
    ],
    credits: [
      { label: '创意 / 三维 / 动画 / 合成', value: 'YOUR NAME' },
      { label: '客户', value: '概念项目' },
      { label: '音乐', value: '待补充' },
      { label: '年份', value: '2026' },
    ],
    sample: true,
  },
  {
    slug: 'serum',
    index: '02',
    title: 'SERUM 01',
    subtitle: '精华液 · 美妆产品片',
    year: '2026',
    category: '产品动画 / 微观质感',
    client: '概念项目 / SELF-INITIATED',
    role: '材质 / 灯光 / 动画 / 合成',
    tools: ['Blender', 'Cycles', 'After Effects', 'DaVinci Resolve'],
    summary: '在八秒里，让一滴精华拥有自己的光。',
    intro: [
      'SERUM 01 是一支精华液产品概念片。核心是把「质地」拍出来：流动性、折射，以及光穿过玻璃时的边缘。',
      '全片以微距视角为主，用缓慢的推镜与浅景深制造呼吸感，让画面更像一次近距离的观察，而不是广告。',
    ],
    approach: [
      '在 Cycles 中搭建玻璃与液体的双层材质，用背光勾勒瓶身边缘；动画只保留缓慢旋转与液面微动，让注意力落在材质本身。',
    ],
    cover: {
      src: '/media/projects/serum/cover.jpg',
      alt: 'SERUM 01 精华液产品片封面',
    },
    video: {
      kind: 'file',
      src: '/media/projects/serum/film.mp4',
      poster: '/media/projects/serum/cover.jpg',
      duration: '00:08',
    },
    keyframes: [
      {
        src: '/media/projects/serum/key-01.jpg',
        alt: 'SERUM 01 瓶身折射画面',
        caption: '局部 / 瓶身的折射边缘',
      },
      {
        src: '/media/projects/serum/key-02.jpg',
        alt: 'SERUM 01 精华液滴落画面',
        caption: '液体 / 一滴精华落下',
      },
      {
        src: '/media/projects/serum/key-03.jpg',
        alt: 'SERUM 01 背光画面',
        caption: '光影 / 背光穿过玻璃',
      },
      {
        src: '/media/projects/serum/key-04.jpg',
        alt: 'SERUM 01 收尾定格画面',
        caption: '定格 / 品牌收尾',
      },
    ],
    process: [
      {
        stage: 'LAYOUT',
        src: '/media/projects/serum/process-01.jpg',
        alt: 'SERUM 01 构图与景深测试',
        caption: '构图与景深：先决定观众离产品有多近。',
      },
      {
        stage: 'SHADING',
        src: '/media/projects/serum/process-02.jpg',
        alt: 'SERUM 01 玻璃与液体材质',
        caption: '玻璃与液体：用背光建立通透感。',
      },
      {
        stage: 'FINAL',
        src: '/media/projects/serum/process-03.jpg',
        alt: 'SERUM 01 最终画面',
        caption: '合成与调色：把高光收在画面中心。',
      },
    ],
    credits: [
      { label: '材质 / 灯光 / 动画 / 合成', value: 'YOUR NAME' },
      { label: '客户', value: '概念项目' },
      { label: '音乐', value: '待补充' },
      { label: '年份', value: '2026' },
    ],
    sample: true,
  },
  {
    slug: 'arc',
    index: '03',
    title: 'ARC',
    subtitle: '无线耳机充电盒 · 结构动画',
    year: '2025',
    category: '产品动画 / 结构演示',
    client: '概念项目 / SELF-INITIATED',
    role: '建模 / 动画 / 渲染 / 合成',
    tools: ['Cinema 4D', 'Redshift', 'After Effects'],
    summary: '开合、吸附、点亮，把结构讲清楚。',
    intro: [
      'ARC 是一款无线耳机的充电盒。结构动画需要把开合、磁吸、指示灯三个动作讲清楚，同时保持产品的高级感。',
      '我们用剖面与半透明材质展示内部结构，再用节奏点配合音效完成说明，让技术信息不显得枯燥。',
    ],
    approach: [
      '以铰链为轴做物理正确的开合动画，磁吸瞬间加入轻微回弹；材质上用阳极氧化铝与哑光塑料的对比，强化结构层次。',
    ],
    cover: {
      src: '/media/projects/arc/cover.jpg',
      alt: 'ARC 无线耳机充电盒结构动画封面',
    },
    video: {
      kind: 'file',
      src: '/media/projects/arc/film.mp4',
      poster: '/media/projects/arc/cover.jpg',
      duration: '00:08',
    },
    keyframes: [
      {
        src: '/media/projects/arc/key-01.jpg',
        alt: 'ARC 闭合状态画面',
        caption: '闭合 / 产品静置',
      },
      {
        src: '/media/projects/arc/key-02.jpg',
        alt: 'ARC 开合结构画面',
        caption: '开合 / 铰链结构',
      },
      {
        src: '/media/projects/arc/key-03.jpg',
        alt: 'ARC 磁吸归位画面',
        caption: '磁吸 / 耳机归位',
      },
      {
        src: '/media/projects/arc/key-04.jpg',
        alt: 'ARC 指示灯亮起画面',
        caption: '点亮 / 指示灯亮起',
      },
    ],
    process: [
      {
        stage: 'BLOCKOUT',
        src: '/media/projects/arc/process-01.jpg',
        alt: 'ARC 结构白模',
        caption: '结构白模：先把开合关系做对。',
      },
      {
        stage: 'RIGGING',
        src: '/media/projects/arc/process-02.jpg',
        alt: 'ARC 铰链与磁吸动画',
        caption: '铰链与磁吸：用回弹制造手感。',
      },
      {
        stage: 'FINAL',
        src: '/media/projects/arc/process-03.jpg',
        alt: 'ARC 最终渲染画面',
        caption: '渲染与合成：让金属和塑料区分开。',
      },
    ],
    credits: [
      { label: '建模 / 动画 / 渲染 / 合成', value: 'YOUR NAME' },
      { label: '客户', value: '概念项目' },
      { label: '音乐', value: '待补充' },
      { label: '年份', value: '2025' },
    ],
    sample: true,
  },
  {
    slug: 'type-26',
    index: '04',
    title: 'TYPE / 26',
    subtitle: '动态字体实验 · 品牌片头',
    year: '2025',
    category: '动态视觉 / 字体实验',
    client: '自主实验 / SELF-INITIATED',
    role: '概念 / 动态设计 / 声音',
    tools: ['After Effects', 'Cinema 4D'],
    summary: '当字开始呼吸，版式就有了节奏。',
    intro: [
      'TYPE / 26 是一组动态字体实验，用字重、字距与遮罩做节奏练习。它不服务于具体产品，而是训练版式在时间里的呼吸感。',
      '整组实验以黑白为主，把「字」当作画面里的产品，观察它在运动中的重心与留白。',
    ],
    approach: [
      '以 120 BPM 为时间基准，把每个字当作一个节拍；用遮罩和位移制造断句，让文字在黑白之间形成呼吸。',
    ],
    cover: {
      src: '/media/projects/type-26/cover.jpg',
      alt: 'TYPE / 26 动态字体实验封面',
    },
    video: {
      kind: 'file',
      src: '/media/projects/type-26/film.mp4',
      poster: '/media/projects/type-26/cover.jpg',
      duration: '00:08',
    },
    keyframes: [
      {
        src: '/media/projects/type-26/key-01.jpg',
        alt: 'TYPE / 26 字重变化画面',
        caption: '节奏 / 字重变化',
      },
      {
        src: '/media/projects/type-26/key-02.jpg',
        alt: 'TYPE / 26 遮罩位移画面',
        caption: '断句 / 遮罩位移',
      },
      {
        src: '/media/projects/type-26/key-03.jpg',
        alt: 'TYPE / 26 负空间画面',
        caption: '留白 / 负空间',
      },
      {
        src: '/media/projects/type-26/key-04.jpg',
        alt: 'TYPE / 26 版式定格画面',
        caption: '收尾 / 版式定格',
      },
    ],
    process: [
      {
        stage: 'TYPE',
        src: '/media/projects/type-26/process-01.jpg',
        alt: 'TYPE / 26 字体与版式',
        caption: '字体与版式：先定骨架，再做运动。',
      },
      {
        stage: 'RHYTHM',
        src: '/media/projects/type-26/process-02.jpg',
        alt: 'TYPE / 26 节拍与遮罩',
        caption: '节拍与遮罩：让断句发生在重音上。',
      },
      {
        stage: 'FINAL',
        src: '/media/projects/type-26/process-03.jpg',
        alt: 'TYPE / 26 最终输出',
        caption: '输出与压缩：保证小尺寸下的锐度。',
      },
    ],
    credits: [
      { label: '概念 / 动态设计', value: 'YOUR NAME' },
      { label: '类型', value: '自主实验' },
      { label: '音乐', value: '待补充' },
      { label: '年份', value: '2025' },
    ],
    sample: true,
  },
]

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug)
}

export function getNextProject(slug: string) {
  const index = projects.findIndex((project) => project.slug === slug)
  return projects[(index + 1) % projects.length]
}
