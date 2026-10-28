// Focused offline check of the static drawing: the file bounds the secret scan relies on, then its anatomy and proof
// screenshots in an isolated headless Chrome. Run from the app root: node .starciwork/features/lessons/ui/lesson/check-direction.cjs
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { launch, profileDir } = require('./direction-browser.cjs')
const reference = require('../../../../_resources/fixtures/lessons/academy-rest-semantics-v1/draw-reference/reference.json')
const dir = __dirname
// Well under the scan's 1 MiB scan.maxFileBytes (policy/loosening.yaml), which is never raised for this file.
const MAX_BYTES = 600_000

const fail = message => { throw new Error(message) }

async function main() {
  const file = path.join(dir, 'direction.html')
  const html = await fs.readFile(file, 'utf8')
  const bytes = Buffer.byteLength(html)
  const file_ = {
    bytes,
    scripts: (html.match(/<script\b/gi) || []).length,
    dataUris: (html.match(/data:/gi) || []).length,
    base64: (html.match(/base64/gi) || []).length,
    externalReferences: [...html.matchAll(/\b(?:src|href)="((?:https?:)?\/\/[^"]*|[^"#][^"]*\.(?:js|css|png|jpe?g|svg|woff2?))"/g)].map(m => m[1]).filter(ref => !/^https:\/\/(github\.com|docs\.nestjs\.com)\//.test(ref)),
  }
  if (bytes > MAX_BYTES) fail(`direction.html is ${bytes} bytes, over ${MAX_BYTES}`)
  if (file_.scripts || file_.dataUris || file_.base64) fail('direction.html must carry no script, data: URI or base64 payload: ' + JSON.stringify(file_))
  if (file_.externalReferences.length) fail('direction.html must stand alone: ' + file_.externalReferences.join(', '))

  const browser = await launch(profileDir(dir))
  try {
    const { command, evaluate } = browser
    const viewport = (width, height) => command('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
    const proof = path.join(dir, 'proof')
    await fs.mkdir(proof, { recursive: true })
    const capture = async name => { const shot = await command('Page.captureScreenshot', { format: 'png' }); await fs.writeFile(path.join(proof, name + '.png'), Buffer.from(shot.data, 'base64')) }
    const show = async selector => { await evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'start'})`); await new Promise(resolve => setTimeout(resolve, 150)) }

    await viewport(1440, 1000)
    await command('Page.navigate', { url: pathToFileURL(file).href })
    await browser.waitFor(`document.readyState === 'complete'`)
    const expected = {
      outline: reference.outline.map(s => s.text.replace(/`/g, '')),
      steps: ['Read the original article', 'Explain the core concept', 'Trace the working code', 'Practice interview questions', 'Solve a challenge'],
      interviews: reference.interviewPrompts.map(q => q.prompt.replace(/^-\s+/, '').replace(/[*`]/g, '').trim()),
      challenges: reference.challengeDefinitions.map(c => c.title.trim()),
      languages: ['TS', 'Java', 'C#', 'Go'],
      diagramLabels: ['Client', 'NestJS app — resource /users', 'UserController — verb → handler + @HttpCode', 'UserService — CRUD', 'PostgreSQL — bảng users', 'POST/GET/PUT/PATCH/DELETE', 'TypeORM repository', 'status code + body'],
    }
    const page = await evaluate(`(() => {
      const text = node => (node?.textContent || '').replace(/\\s+/g, ' ').trim()
      const article = document.querySelector('#article-original')
      const diagram = article.querySelector('[data-component="MermaidDiagram"]')
      const svg = diagram?.querySelector('svg')
      const nodeOf = label => [...(svg?.querySelectorAll('g.node') || [])].find(g => text(g).includes(label))
      return {
        title: document.title,
        h1: document.querySelectorAll('h1').length,
        // ids the drawing owns; React Aria's generated ids are the vendor's (its Select value repeats the option label's id)
        duplicateIds: [...document.querySelectorAll('[id]')].map(x => x.id).filter(id => !id.startsWith('react-aria')).filter((id, i, all) => all.indexOf(id) !== i),
        vendorDuplicateIds: [...document.querySelectorAll('[id^="react-aria"]')].map(x => x.id).filter((id, i, all) => all.indexOf(id) !== i).length,
        articleHeadings: [...article.querySelectorAll('h2,h3,h4,h5')].map(text),
        diagramState: diagram?.getAttribute('data-grammar-mermaid-state'),
        diagramName: diagram?.getAttribute('aria-label'),
        diagramText: text(svg),
        subgraph: Boolean(svg?.querySelector('g.cluster')),
        circleNode: Boolean(nodeOf('Client')?.querySelector('circle')),
        cylinderNode: Boolean(nodeOf('PostgreSQL')?.querySelector('path')),
        accordionPanels: article.querySelectorAll('[data-component="Accordion"] h5').length,
        stepLabels: [...document.querySelectorAll('main [data-component="Stepper"] [data-grammar-step-state]')].map(text),
        bodyText: text(document.body),
        previews: [...document.querySelectorAll('[id^="state-"]')].map(x => x.id.slice(6)),
        lockedSections: document.querySelectorAll('#state-locked [id^="locked-section-"]').length,
        lockedCoaching: Boolean(document.querySelector('#state-locked [id$="practice"]')),
        interviewGate: { continueDisabled: [...document.querySelectorAll('#state-interview-feedback button')].find(x => text(x) === 'Continue')?.disabled, questions: document.querySelectorAll('#state-interview-feedback [data-component="RadioGroup"] input[type="radio"]').length },
        overflow: document.documentElement.scrollWidth > innerWidth,
      }
    })()`)
    const missing = (kind, list, haystack) => list.filter(item => !haystack.includes(item)).map(item => `${kind}: ${item}`)
    const problems = [
      page.h1 !== 1 && `h1 count ${page.h1}`,
      page.duplicateIds.length && `duplicate ids ${page.duplicateIds.slice(0, 5).join(', ')}`,
      page.diagramState !== 'ready' && `diagram ${page.diagramState}`,
      !page.subgraph && 'NestJS subgraph not drawn',
      !page.circleNode && 'Client circle node not drawn',
      !page.cylinderNode && 'PostgreSQL cylinder node not drawn',
      page.accordionPanels !== 4 && `accordion panels ${page.accordionPanels}`,
      page.lockedSections !== 1 && `locked preview sections ${page.lockedSections}`,
      page.lockedCoaching && 'locked preview mounts coaching',
      !(page.interviewGate.continueDisabled && page.interviewGate.questions === 3) && 'interview gate ' + JSON.stringify(page.interviewGate),
      page.overflow && 'horizontal overflow at 1440',
      ...missing('outline heading', expected.outline, page.articleHeadings.join('\n')),
      // Mermaid wraps a long label into lines, so labels compare without whitespace.
      ...missing('diagram label', expected.diagramLabels.map(label => label.replace(/\s+/g, '')), page.diagramText.replace(/\s+/g, '')),
      ...missing('step', expected.steps, page.stepLabels.join('\n')),
      ...missing('interview prompt', expected.interviews, page.bodyText),
      ...missing('challenge', expected.challenges, page.bodyText),
      ...missing('language', expected.languages, page.bodyText),
    ].filter(Boolean)
    if (problems.length) fail('Anatomy failed:\n' + problems.join('\n'))

    await capture('desktop')
    await show('#article-original [data-component="MermaidDiagram"]'); await capture('diagram')
    await show('#state-saved'); await capture('saved-desktop')
    await show('#state-streaming-dark'); await capture('streaming-dark')
    await viewport(390, 844)
    await evaluate('scrollTo(0, 0)'); await new Promise(resolve => setTimeout(resolve, 150)); await capture('mobile')
    const mobile = await evaluate(`({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, articleWidth: document.querySelector('article').getBoundingClientRect().width })`)
    if (mobile.scrollWidth > mobile.width) fail('horizontal overflow at 390: ' + JSON.stringify(mobile))
    await show('#practice [data-component="SurfaceCard"]'); await capture('form-1-mobile')
    for (let step = 2; step <= 5; step++) { await show(`#state-form-${step}`); await capture(`form-${step}-mobile`) }

    const observations = { file: file_, maxBytes: MAX_BYTES, page: { ...page, bodyText: undefined }, mobile, errors: browser.errors }
    await fs.writeFile(path.join(proof, 'observations.json'), JSON.stringify(observations, null, 2))
    console.log(JSON.stringify({ bytes, previews: page.previews.length, diagram: page.diagramState, mobile, errors: browser.errors.length }, null, 2))
  } finally {
    await browser.close()
    await fs.rm(path.join(dir, '.direction-build'), { recursive: true, force: true })
  }
}
main().catch(error => { console.error(error.message || error); process.exit(1) })
