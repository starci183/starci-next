// Run with: node measure-direction.mjs <existing harness playwright/index.mjs>
// Uses the installed harness browser; never installs a browser or contacts a service.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const folder = new URL('./', import.meta.url);
const html = new URL('direction.html', folder);
const { chromium } = await import(pathToFileURL(process.argv[2]).href);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const pageErrors = [], externalRequests = [], matrix = [], pendingParity = [], stress = [], alertTones = [];
page.on('pageerror', error => pageErrors.push(error.message));
page.on('request', request => {
  if (/^https?:/.test(request.url())) externalRequests.push(request.url());
});
const states = ['idle', 'redirecting', 'failed', 'signed-in'];
const themes = ['light', 'dark'];
const widths = [360, 390, 639, 640, 767, 768, 1023, 1024, 1184, 1279, 1280, 1440];
async function open(state, theme, width, height = 900) {
  await page.setViewportSize({ width, height });
  await page.goto(`${html.href}?state=${state}&theme=${theme}`);
  await page.evaluate(() => document.fonts.ready);
}
async function measure() {
  return page.evaluate(() => {
    const button = document.querySelector('#drawing [data-component="Button"]');
    const card = document.querySelector('#drawing [data-component="SurfaceCard"]');
    const rect = button.getBoundingClientRect();
    const root = document.querySelector('#drawing [data-component="GrammarRoot"]');
    const result = {
      button: { height: rect.height, width: rect.width, size: button.dataset.size,
        widthMode: button.dataset.width, pending: button.dataset.actionPending,
        label: button.textContent.trim(), disabled: button.disabled,
        radius: getComputedStyle(button).borderRadius },
      card: { width: card.getBoundingClientRect().width, top: card.getBoundingClientRect().top },
      formWidth: document.querySelector('#drawing form').getBoundingClientRect().width,
      h1Count: document.querySelectorAll('#drawing h1').length,
      pageCount: document.querySelectorAll('#drawing [data-component="Page"]').length,
      headerCount: document.querySelectorAll('#drawing [data-component="PageHeader"]').length,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      pageBodyGap: getComputedStyle(document.querySelector('#drawing [data-grammar-page-body]')).paddingTop,
      fontLoaded: document.fonts.check('400 16px "Be Vietnam Pro"'),
    };
    const alert = document.querySelector('#drawing [data-component="Alert"]');
    if (alert) {
      const tone = alert.dataset.grammarTone;
      const token = { negative: '--danger-soft', affirmative: '--success-soft', informative: '--accent-soft',
        cautionary: '--warning-soft' }[tone] || '--default-soft';
      const expected = document.createElement('div');
      expected.style.background = `color-mix(in oklab, var(${token}) 50%, transparent)`;
      root.append(expected);
      const style = getComputedStyle(alert);
      const expectedBackground = getComputedStyle(expected).backgroundColor;
      result.alert = { tone, appearance: alert.dataset.grammarAppearance, role: alert.getAttribute('role'),
        background: style.backgroundColor, shadow: style.boxShadow, expectedSoftBackground: expectedBackground,
        softTintApplied: style.backgroundColor === expectedBackground, noShadow: style.boxShadow === 'none',
        softToken: style.getPropertyValue('--starci-core-alert-soft').trim() };
      expected.remove();
    }
    return result;
  });
}
for (const width of widths) for (const theme of themes) {
  const entries = [];
  for (const state of states) {
    await open(state, theme, width);
    const entry = { viewport: { width, height: 900 }, theme, state, ...await measure() };
    matrix.push(entry); entries.push(entry);
    if (width === 1184 && theme === 'light' && state === 'failed')
      await page.screenshot({ path: fileURLToPath(new URL('preview-desktop.png', folder)), fullPage: true });
    if (width === 390 && theme === 'light' && state === 'idle')
      await page.screenshot({ path: fileURLToPath(new URL('preview-mobile.png', folder)), fullPage: true });
    if (width === 1184 && theme === 'dark' && state === 'signed-in')
      await page.screenshot({ path: fileURLToPath(new URL('preview-dark.png', folder)), fullPage: true });
  }
  const [idle, pending] = entries;
  pendingParity.push({ viewport: width, theme, heightEqual: idle.button.height === pending.button.height,
    widthEqual: idle.button.width === pending.button.width, labelEqual: idle.button.label === pending.button.label,
    repeatPrevented: pending.button.pending === 'true' && pending.button.disabled });
}
for (const theme of themes) for (const state of states) {
  await open(state, theme, 390, 320);
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  const result = await page.evaluate(() => {
    const button = document.querySelector('#drawing button');
    const scroller = document.querySelector('#drawing [data-grammar-scroll-region="vertical"]');
    button.scrollIntoView({ block: 'end' });
    const b = button.getBoundingClientRect(), s = scroller.getBoundingClientRect();
    return { horizontalOverflow: document.documentElement.scrollWidth > innerWidth, scrollOwner: scroller.className,
      scrollHeight: scroller.scrollHeight, clientHeight: scroller.clientHeight,
      buttonReachable: b.top >= s.top - 1 && b.bottom <= s.bottom + 1, buttonHeight: b.height };
  });
  stress.push({ viewport: { width: 390, height: 320 }, rootTextScale: '200%', theme, state, ...result });
}
// Exercise every published tone through the unchanged Alert anatomy and both appearances.
for (const theme of themes) for (const tone of ['neutral', 'informative', 'affirmative', 'cautionary', 'negative', 'pending', 'unavailable']) {
  await open('failed', theme, 390);
  await page.evaluate(tone => {
    const alert = document.querySelector('#drawing [data-component="Alert"]');
    const status = { informative: 'accent', affirmative: 'success', cautionary: 'warning', negative: 'danger' }[tone] || 'default';
    alert.className = `alert alert--${status} starci-core-alert`;
    alert.dataset.grammarTone = tone;
  }, tone);
  const soft = (await measure()).alert;
  const surface = await page.evaluate(() => {
    const alert = document.querySelector('#drawing [data-component="Alert"]');
    alert.dataset.grammarAppearance = 'surface';
    const probe = document.createElement('div'); probe.style.background = 'var(--surface)'; alert.parentNode.append(probe);
    const expected = getComputedStyle(probe).backgroundColor; probe.remove();
    const style = getComputedStyle(alert);
    return { background: style.backgroundColor, expectedBackground: expected, shadow: style.boxShadow,
      surfacePreserved: style.backgroundColor === expected && style.boxShadow !== 'none' };
  });
  alertTones.push({ theme, tone, soft, surface });
}
await browser.close();
const summary = { renders: matrix.length, buttonHeights: [...new Set(matrix.map(x => x.button.height))],
  buttonFailures: matrix.filter(x => x.button.height !== 40 || x.button.width !== x.formWidth).length,
  pendingParityPass: pendingParity.every(x => x.heightEqual && x.widthEqual && x.labelEqual && x.repeatPrevented),
  stressRenders: stress.length, stressPass: stress.every(x => !x.horizontalOverflow && x.buttonReachable),
  softAlertRenders: matrix.filter(x => x.alert).length,
  softAlertFailures: matrix.filter(x => x.alert && (!x.alert.softTintApplied || !x.alert.noShadow)).length,
  allToneRenders: alertTones.length,
  allTonesPass: alertTones.every(x => x.soft.softTintApplied && x.soft.noShadow && x.surface.surfacePreserved),
  anatomyPass: matrix.every(x => x.h1Count === 1 && x.pageCount === 1 && x.headerCount === 0 && !x.horizontalOverflow && x.fontLoaded),
  pageErrors, externalRequests };
// Every sibling the drawing loads stays under the secret scan's 1048576-byte read limit.
const files = [];
for (const name of ['direction.html', 'direction.css', 'fonts/be-vietnam-pro-400.ttf', 'fonts/be-vietnam-pro-500.ttf',
  'fonts/be-vietnam-pro-600.ttf']) {
  const bytes = await readFile(new URL(name, folder));
  files.push({ path: name, bytes: bytes.length, underScanLimit: bytes.length < 1048576,
    sha256: createHash('sha256').update(bytes).digest('hex') });
}
summary.filesUnderScanLimit = files.every(x => x.underScanLimit);
const packageRoot = new URL('../../../../../node_modules/@starci/grammar/', folder);
const proof = { schema: 'sign-in-direction-proof@1', measuredAt: new Date().toISOString(),
  package: { name: '@starci/grammar', version: '0.15.4',
    buildStamp: JSON.parse(await readFile(new URL('dist/.build-stamp.json', packageRoot), 'utf8')),
    branch: 'pkg/starci-next-app-alert-soft-paint', head: '36a0c6845bd3eaceead217138851fc79d646188c',
    handoff: 'Debug queue, recorded 2026-10-28T11:29:18.755Z; grammar; non-urgent' },
  artifact: { path: '.starciwork/features/identity/ui/sign-in/direction.html',
    sha256: createHash('sha256').update(await readFile(html)).digest('hex'), files },
  method: 'Existing harness Playwright and Chromium over a file URL; direction.html links the sibling direction.css (generated published Grammar CSS with the exact two-declaration package delta) and fonts/be-vietnam-pro-{400,500,600}.ttf by relative path, nothing base64-embedded; no network or app component override.',
  rules: ['DNA-COMMON-CONTROL-MD', 'DNA-COMMON-CONTROL-FILL', 'DNA-COMMON-PENDING-KEEPS-BOX',
    'DNA-COMMON-PAGE-BODY-GAP', 'DNA-CORE-BUTTON-PILL', 'toast-alert.choose.appearance'],
  summary, matrix, pendingParity, stress, alertTones };
await writeFile(new URL('direction-proof.json', folder), JSON.stringify(proof, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
if (summary.buttonFailures || !summary.pendingParityPass || !summary.stressPass || summary.softAlertFailures ||
  !summary.allTonesPass || !summary.anatomyPass || !summary.filesUnderScanLimit || pageErrors.length || externalRequests.length) process.exitCode = 1;
