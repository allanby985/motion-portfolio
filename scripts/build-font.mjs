/**
 * 生成中文字体子集（Noto Sans SC），只保留站内实际用到的字。
 *
 * 用法：npm run font
 * 依赖：Windows 自带 C:\Windows\Fonts\NotoSansSC-VF.ttf，或设置 FONT_SOURCE 指向其他 Noto Sans SC 变量字体。
 *
 * 改动文案后重新运行一次，生成的 public/fonts/noto-sans-sc-subset.woff2 就是新的子集。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import subsetFont from 'subset-font'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const fontSource =
  process.env.FONT_SOURCE || 'C:\\Windows\\Fonts\\NotoSansSC-VF.ttf'
const output = path.join(root, 'public', 'fonts', 'noto-sans-sc-subset.woff2')

if (!fs.existsSync(fontSource)) {
  console.error(`找不到字体源文件：${fontSource}`)
  process.exit(1)
}

const textFiles = []
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full)
    } else if (/\.(tsx?|html|md|json|css)$/.test(entry.name)) {
      textFiles.push(full)
    }
  }
}

walk(path.join(root, 'src'))
textFiles.push(path.join(root, 'index.html'))

const chars = new Set(
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:;!?/\\|-_()[]{}<>@#%&*+=~`\'"“”‘’·—…、。，；：？！（）【】《》〈〉「」『』→←↑↓©®™ ',
)
for (const file of textFiles) {
  const content = fs.readFileSync(file, 'utf8')
  for (const char of content) {
    const code = char.codePointAt(0)
    if (
      code !== undefined &&
      code > 31 &&
      code !== 127 &&
      !(code >= 0xe000 && code <= 0xf8ff)
    ) {
      chars.add(char)
    }
  }
}

const text = Array.from(chars).sort().join('')
console.log(`收集字符：${chars.size}，源文件：${textFiles.length}`)

const fontBuffer = fs.readFileSync(fontSource)
const subset = await subsetFont(fontBuffer, text, { targetFormat: 'woff2' })
fs.mkdirSync(path.dirname(output), { recursive: true })
fs.writeFileSync(output, subset)
console.log(`已生成：${path.relative(root, output)}（${(subset.length / 1024).toFixed(1)} KB）`)
