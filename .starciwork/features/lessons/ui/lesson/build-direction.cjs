// Rebuild direction.html as static prerendered markup from installed Grammar, the existing SiteShell and the safe fixture.
// direction.tsx is bundled into a throwaway page, drawn once in an isolated headless Chrome (so the Grammar's own
// MermaidDiagram renders the article's Mermaid source to SVG), then serialized without any script, with only the
// compiled CSS rules that match the drawn markup. Run from the app root: node .starciwork/features/lessons/ui/lesson/build-direction.cjs
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { webpack, LimitChunkCountPlugin } = require('next/dist/compiled/webpack/webpack')
const postcss = require('postcss')
const tailwind = require('@tailwindcss/postcss')
const { launch, profileDir } = require('./direction-browser.cjs')
const dir = __dirname
const root = process.cwd()

// Runs in the drawn page: keep each compiled rule whose selector matches the markup (interaction and pseudo-element
// parts ignored), the grouping rules that still hold one, every at-rule that is not a block, and the keyframes used.
const PRUNE = `(() => {
  const sheet = document.getElementById('direction-css').sheet
  const dynamic = /::?(?:hover|focus-visible|focus-within|focus|active|visited|placeholder-shown|placeholder|before|after|marker|selection|backdrop|file-selector-button|first-letter|first-line|autofill|target|checked|indeterminate|user-invalid|user-valid|invalid|valid|popover-open|open|enabled|disabled|read-only|read-write|default|required|optional|in-range|out-of-range|empty|-webkit-[a-z-]+|-moz-[a-z-]+)(?![a-z-])(?:\\([^()]*\\))?/g
  const matches = selector => {
    for (const candidate of [selector, selector.replace(dynamic, '')]) {
      try { if (document.querySelector(candidate || '*')) return true } catch { return true }
    }
    return false
  }
  const keyframes = []
  const keep = rules => {
    let out = ''
    for (const rule of rules) {
      if (rule instanceof CSSStyleRule) { if (matches(rule.selectorText)) out += rule.cssText }
      else if (rule instanceof CSSKeyframesRule) keyframes.push(rule)
      else if (rule.cssRules) { const inner = keep(rule.cssRules); if (inner) out += rule.cssText.slice(0, rule.cssText.indexOf('{')) + '{' + inner + '}' }
      else out += rule.cssText
    }
    return out
  }
  let css = keep(sheet.cssRules)
  for (const rule of keyframes) if (css.includes(rule.name)) css += rule.cssText
  return css
})()`

// Drop the custom properties (and their @property registrations) that no kept declaration, inline style or diagram
// style reads, following var() chains to a fixed point.
function unusedPropertiesRemoved(css, html) {
  const tree = postcss.parse(css)
  const refs = text => [...text.matchAll(/var\(\s*(--[\w-]+)/g)].map(match => match[1])
  const read = new Set(refs(html.replace('__CSS__', '')))
  tree.walkDecls(decl => { if (!decl.prop.startsWith('--')) refs(decl.value).forEach(name => read.add(name)) })
  for (let size = -1; size !== read.size;) {
    size = read.size
    tree.walkDecls(decl => { if (decl.prop.startsWith('--') && read.has(decl.prop)) refs(decl.value).forEach(name => read.add(name)) })
  }
  tree.walkDecls(decl => { if (decl.prop.startsWith('--') && !read.has(decl.prop)) decl.remove() })
  tree.walkAtRules('property', rule => { if (!read.has(rule.params.trim())) rule.remove() })
  tree.walkRules(rule => { if (!rule.nodes.length) rule.remove() })
  tree.walkAtRules(rule => { if (rule.nodes && !rule.nodes.length) rule.remove() })
  return tree.toString()
}

async function main() {
  const out = path.join(dir, '.direction-build')
  await fs.rm(out, { recursive: true, force: true })
  await fs.mkdir(out, { recursive: true })
  const loader = path.join(out, 'tsx-loader.cjs')
  await fs.writeFile(loader, `const ts=require(${JSON.stringify(require.resolve('typescript'))});module.exports=function(source){return ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText}`)
  const entry = path.join(out, 'entry.tsx')
  await fs.writeFile(entry, `import { createRoot } from 'react-dom/client'\nimport { Direction } from '../direction'\ncreateRoot(document.getElementById('root')!).render(<Direction/>)\n`)
  await new Promise((resolve, reject) => webpack({ mode: 'production', entry, output: { path: out, filename: 'direction.js', publicPath: '' }, devtool: false, optimization: { minimize: false, splitChunks: false }, plugins: [new LimitChunkCountPlugin({ maxChunks: 1 })], module: { rules: [{ test: /\.tsx?$/, exclude: /node_modules/, use: loader }] }, resolve: { extensions: ['.tsx', '.ts', '.js'], alias: { react: path.join(root, 'node_modules/react'), 'react-dom': path.join(root, 'node_modules/react-dom') } }, performance: { hints: false } }, (error, stats) => error ? reject(error) : stats.hasErrors() ? reject(new Error(stats.toString({ all: false, errors: true }))) : resolve()))
  const slash = file => file.replaceAll('\\', '/')
  const input = `@import "tailwindcss" source(none);\n@import "@heroui/styles/css";\n@import "@starci/grammar/common.css";\n@import "@starci/grammar/core.css";\n@source "${slash(path.join(root, 'node_modules/@starci/grammar/dist'))}";\n@source "${slash(path.join(root, 'fe/packages/starci-next-ui/src'))}";\n@source "${slash(path.join(dir, 'direction.tsx'))}";\n@source "${slash(path.join(dir, 'direction.classes.ts'))}";`
  const compiled = await postcss([tailwind({ base: root, optimize: true })]).process(input, { from: path.join(root, 'direction-input.css') })
  const page = path.join(out, 'render.html')
  await fs.writeFile(page, `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><title>Lesson direction · academy-rest-semantics</title><style id="direction-css">${compiled.css}</style></head><body><div id="root"></div><script src="direction.js"></script></body></html>`)
  const browser = await launch(profileDir(dir))
  try {
    await browser.command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
    await browser.command('Page.navigate', { url: pathToFileURL(page).href })
    // The page's article diagram must be drawn by MermaidDiagram itself; the loading preview keeps its skeleton box.
    await browser.waitFor(`document.querySelector('#article-original [data-grammar-mermaid-state="ready"] svg') !== null`)
    await browser.waitFor(`![...document.querySelectorAll('[data-grammar-mermaid-state]')].some(x => x.getAttribute('data-grammar-mermaid-state') === 'loading' && !x.closest('#state-loading'))`)
    if (browser.errors.length) throw new Error('Runtime errors: ' + JSON.stringify(browser.errors))
    const css = await browser.evaluate(PRUNE)
    // A data attribute no kept rule reads changes nothing drawn; the component name, the diagram state and the step
    // state stay so a reviewer and the check can still find each Grammar part.
    // Likewise a class token no kept rule names (outside the diagram's own SVG styles).
    const read = [...new Set([...css.matchAll(/(?:\[|attr\()\s*(data-[\w-]+)/g)].map(match => match[1]))]
    const html = await browser.evaluate(`(() => {
      const css = ${JSON.stringify(css)}
      const keep = new Set(${JSON.stringify([...read, 'data-component', 'data-grammar-mermaid-state', 'data-grammar-step-state', 'data-theme'])})
      for (const node of document.body.querySelectorAll('*')) {
        if (node.closest('svg')) continue
        for (const name of node.getAttributeNames()) if (name.startsWith('data-') && !keep.has(name)) node.removeAttribute(name)
        if (node.classList.length) {
          for (const token of [...node.classList]) if (!css.includes('.' + CSS.escape(token))) node.classList.remove(token)
          if (!node.classList.length) node.removeAttribute('class')
        }
      }
      document.querySelectorAll('script').forEach(node => node.remove())
      document.getElementById('direction-css').textContent = ${JSON.stringify('__CSS__')}
      return '<!doctype html>' + document.documentElement.outerHTML
    })()`)
    const used = unusedPropertiesRemoved(css, html)
    const result = html.replace('__CSS__', () => used)
    await fs.writeFile(path.join(dir, 'direction.html'), result)
    console.log(`Built static direction.html: ${Buffer.byteLength(result)} bytes (css ${used.length} of ${compiled.css.length} chars).`)
  } finally {
    await browser.close()
    await fs.rm(out, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
  }
}
main().then(() => process.exit(0)).catch(error => { console.error(error); process.exit(1) })
