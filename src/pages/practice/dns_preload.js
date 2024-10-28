// const path = import('path');
const fs = import('node:fs')
const urlRegex = import('url-regex')
const { parse } = import('node-html-parser')
const { glob } = import('glob')

const urlPattern = /(https?:\/\/[^/]*)/i
const urls = new Set()

async function searchDomain() {
  const files = await glob('dist/**/*.{html, js, css}')

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf-8')
    const matches = source.match(urlRegex({ strict: true }))
    if (matches) {
      matches.forEach((url) => {
        const item = url.match(urlPattern)
        if (item && item[1]) {
          urls.add(item[1])
        }
      })
    }
  }
}

async function insertLinks() {
  const files = await glob('dist/**/*.html')
  const links = [...urls].map(url => `<link rel="dns-prefetch" href="${url}" />`).join('\n')

  for (const file of files) {
    const html = fs.readFileSync(file, 'utf-8')
    const root = parse(html)
    const head = root.querySelector('head')

    head.insertAdjacentHTML('afterbegin', links)
    fs.writeFileSync(file, root.toString())
  }
}

async function main() {
  // 提取需要做 dns 解析的域名集合
  await searchDomain()
  // 给项目的入口文件插入需要解析的 dns link标签
  await insertLinks()
}

main()
