// lesson-type-probe.mjs - DEV ONLY: measures the typography of every page (tab) of one lesson on the dev web and checks the three type laws of
// .starcistacks/brand/lessons.md "Cỡ chữ" (DNA-COMMON-TYPE-NESTED-NOT-LARGER, DNA-COMMON-TYPE-SIBLINGS-SAME, DNA-COMMON-TYPE-LEAD-PAGE-ONLY in
// the harness's contexts/grammars/contract.yaml). Every lesson audit runs it (lessons-audit.md "Cỡ chữ").
// usage (repo root): node scripts/integration/lesson-type-probe.mjs [lesson path] [out.md]
//   lesson path: default /essentials/saga/saga-compensation; out.md: default .cache/lesson-type-probe.md (a .json lands beside it).
// Env: STARCI_CLI (the harness cli dist, default D:/starci-lanes/_cli-current/cli/dist), LOOK_ROOT (the checkout whose gallery/look.json and dev
// seed custody sign the probe in, default D:/starci-lanes/_next/devstack), PAGES (comma list, default every lesson tab).
// Signs in the way `starci app look` does: the password is opened from custody and never printed. Exit 1 when a law has a violation.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { dirname, join } from "node:path"
import { pathToFileURL } from "node:url"

const CLI = process.env.STARCI_CLI ?? "D:/starci-lanes/_cli-current/cli/dist"
const ROOT = process.env.LOOK_ROOT ?? "D:/starci-lanes/_next/devstack"
const LESSON = process.argv[2] ?? "/essentials/saga/saga-compensation"
const OUT_MD = process.argv[3] ?? ".cache/lesson-type-probe.md"
const OUT_JSON = OUT_MD.replace(/\.md$/u, ".json")
const PAGES = (process.env.PAGES ?? "intro,setup,architecture,happy,unhappy,pattern,submit,audit").split(",")

const { appStore } = await import(pathToFileURL(join(CLI, "core/app/alerts.js")).href)
const { sessionCookies } = await import(pathToFileURL(join(CLI, "core/gallery/look.js")).href)
const pw = await import(pathToFileURL(join(homedir(), ".starci-gallery-tools/node_modules/playwright-core/index.js")).href)
const chromium = pw.chromium ?? pw.default.chromium

const look = JSON.parse(readFileSync(join(ROOT, "gallery/look.json"), "utf8")).envs.dev
const secrets = (await appStore(ROOT)).open(join(ROOT, ".starcistacks/dev/secrets/seed.enc.yaml"))
const response = await fetch(`${look.api}${look.signIn.path}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: look.origin },
    body: JSON.stringify({ email: look.signIn.email, password: String(secrets[look.signIn.password.key]).trim() }),
})
if (!response.ok) throw new Error(`sign-in answered ${response.status}`)
const cookies = sessionCookies(response.headers.getSetCookie(), look.web, new Date(), look.api)

/**
 * Runs in the page. A block is a Grammar part that owns a heading: the Page (its h1), a Section, a SurfaceCard, an Accordion item and a
 * Disclosure. Every visible element that owns a direct text node becomes a line with its type, its Grammar owner and the chain of blocks it
 * sits in; every block heading becomes a block with its own type, its tag and its parent block.
 */
const measure = () => {
    const main = document.querySelector("main") ?? document.body
    const BLOCK = "[data-component='Page'],[data-component='Section'],[data-component='SurfaceCard'],.starci-core-generic-accordion-item,[data-component='Disclosure']"
    const ids = new Map()
    const blockId = (el) => {
        if (el === null) return null
        if (!ids.has(el)) ids.set(el, ids.size)
        return ids.get(el)
    }
    const typeOf = (el) => {
        const s = getComputedStyle(el)
        return { size: parseFloat(s.fontSize), line: s.lineHeight, weight: Number(s.fontWeight), mono: /mono/u.test(s.fontFamily) }
    }
    const visible = (el) => {
        const r = el.getBoundingClientRect()
        const s = getComputedStyle(el)
        return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.opacity !== "0" && el.closest("[aria-hidden='true'], .sr-only, svg, [hidden]") === null
    }
    const kindOf = (block) => block.getAttribute("data-component") ?? "AccordionItem"
    // The type a heading is drawn in: its largest visible line (an Accordion item's title is a Text inside the h3's trigger).
    const headType = (h) => {
        const own = [h, ...h.querySelectorAll("*")].filter((el) => visible(el) && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0))
        const types = own.map(typeOf).sort((a, b) => b.size - a.size || b.weight - a.weight)
        return types[0] ?? typeOf(h)
    }
    // The heading a block owns: the first h1-h4 whose nearest block is this one (the Page's is its PageHeader title).
    const headingOf = (block) => [...block.querySelectorAll("h1,h2,h3,h4")].find((h) => h.parentElement.closest(BLOCK) === block && visible(h)) ?? null
    const blocks = []
    const headingEls = new Set()
    for (const block of document.querySelectorAll(BLOCK)) {
        if (!visible(block)) continue
        const heading = headingOf(block)
        if (heading === null) continue
        const parent = block.parentElement?.closest(BLOCK) ?? null
        headingEls.add(heading)
        blocks.push({ id: blockId(block), parent: blockId(parent), kind: kindOf(block), tag: heading.tagName.toLowerCase(), text: heading.textContent.replace(/\s+/gu, " ").trim().slice(0, 40), ...headType(heading) })
    }
    // A heading drawn outside any block part (a bare Heading in a Stack): a block of its own, so the sibling law still sees it.
    for (const h of main.querySelectorAll("h2,h3,h4")) {
        if (!visible(h)) continue
        const owner = h.parentElement.closest(BLOCK)
        if (owner !== null && headingOf(owner) === h) continue
        headingEls.add(h)
        blocks.push({ id: blockId(h.parentElement), parent: blockId(owner), kind: "bare", tag: h.tagName.toLowerCase(), text: h.textContent.replace(/\s+/gu, " ").trim().slice(0, 40), ...headType(h) })
    }
    const lines = []
    const owns = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0)
    for (const el of main.querySelectorAll("*")) {
        if (!owns(el) || !visible(el)) continue
        const chain = []
        for (let at = el.parentElement?.closest(BLOCK) ?? null; at !== null; at = at.parentElement?.closest(BLOCK) ?? null) chain.push(blockId(at))
        const headingEl = el.closest("h1,h2,h3,h4,h5,h6")
        const component = el.closest("[data-component]")?.getAttribute("data-component") ?? ""
        let aboveList = false
        for (let at = el, depth = 0; at && at !== main && depth < 4; at = at.parentElement, depth += 1) {
            const next = at.nextElementSibling
            if (next && (next.matches("ul,ol,[role=list]") || next.querySelector(":scope > ul, :scope > ol, :scope > [role=list]"))) { aboveList = true; break }
            if (next) break
        }
        // The Grammar part that draws the line (its first starci-core-* class, or its nearest ancestor's): a ListRow's title and its
        // description are two parts of one component.
        let part = ""
        for (let at = el; at && at !== main && part === ""; at = at.parentElement)
            part = [...at.classList].find((c) => c.startsWith("starci-core-")) ?? ""
        lines.push({
            tag: el.tagName.toLowerCase(),
            component,
            part,
            strong: el.closest("[data-strong='true']") !== null,
            role: el.closest("[data-role]")?.getAttribute("data-role") ?? "",
            heading: headingEl ? headingEl.tagName.toLowerCase() : "",
            // The line is its block's own heading (not content of it).
            ownHeading: headingEl !== null && headingEls.has(headingEl),
            control: el.closest("[role=tab]") ? "tab" : el.closest("button,[role=button],a") ? "button" : el.closest("code,pre,kbd") ? "code" : "",
            aboveList,
            chain,
            color: getComputedStyle(el).color,
            text: (el.innerText || el.textContent || "").replace(/\s+/gu, " ").trim().slice(0, 40),
            ...typeOf(el),
        })
    }
    return { blocks, lines }
}

/** The semantic role of a line: what a reader takes it for, whatever Grammar part draws it. */
const semantic = (line) => {
    if (line.control === "tab") return "page tab"
    if (line.control === "button") return "button"
    if (line.control === "code" || line.role === "code" || line.mono) return "code"
    if (line.heading === "h1" || line.role === "title.page" || line.role === "reading.title") return "page title"
    if (line.heading === "h2") return "section heading h2"
    if (/^h[3-6]$/u.test(line.heading)) return "sub heading h3/h4"
    if (line.role === "label.group" || line.role === "label.field" || line.aboveList) return "label above a list"
    if (line.role === "caption") return "caption/muted meta"
    if (line.role === "reading.body" || line.role === "lead") return "reading body/lead"
    if (line.role === "label.item" || line.role === "title.section") return "item title"
    if (line.component === "Badge" || line.component === "Breadcrumbs") return "badge/meta chip"
    return "body"
}

const browser = await chromium.launch({ channel: "chrome", headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await context.addCookies(cookies)
const page = await context.newPage()
const pages = {}
for (const name of PAGES) {
    await page.goto(`${look.web}${LESSON}?page=${name}`, { waitUntil: "networkidle" })
    await page.waitForTimeout(2500)
    // A loop page: open the first case, so its parts are measured too.
    const trigger = page.locator("main [data-component='Accordion'] [aria-expanded='false']").first()
    if ((await trigger.count()) > 0) {
        await trigger.click().catch(() => undefined)
        await page.waitForTimeout(1500)
    }
    const { blocks, lines } = await page.evaluate(measure)
    pages[name] = { blocks, lines: lines.map((line) => ({ ...line, semantic: semantic(line) })) }
    console.log(`${name}: ${lines.length} lines, ${blocks.length} blocks`)
}
await browser.close()

// The three laws.
const violations = []
const type = (t) => `${t.size}px/${t.weight}`
const READING = new Set(["reading.body", "reading.title", "lead"])
// Parts that draw their own type at their own scale (a badge, a diagram's labels, a breadcrumb): exempt from the nesting and sibling laws.
const EXEMPT = new Set(["Badge", "MermaidDiagram", "Breadcrumbs", "Tabs"])
// Blocks of one level are of one family: a Section, a SurfaceCard and a bare heading are sections; an Accordion item is an item; a
// Disclosure is a toggle (its heading is a control).
const FAMILY = { Section: "section", SurfaceCard: "section", bare: "section", AccordionItem: "item", Disclosure: "toggle", Page: "page" }
for (const [name, { blocks, lines }] of Object.entries(pages)) {
    const byId = new Map(blocks.map((b) => [b.id, b]))
    // 1. Nested not larger: no line inside a block is larger than the block's heading, or as large and heavier, at any depth.
    // A control (button, tab, link), a badge and inline code are drawn by their own part and are exempt.
    for (const line of lines) {
        if (line.ownHeading || line.control !== "" || EXEMPT.has(line.component) || line.semantic === "code") continue
        for (const id of line.chain) {
            const head = byId.get(id)
            if (head === undefined) continue
            if (line.size > head.size || (line.size === head.size && line.weight > head.weight))
                violations.push({ law: "NESTED-NOT-LARGER", page: name, detail: `"${line.text}" ${type(line)} (${line.component} ${line.role}) inside ${head.kind} "${head.text}" ${type(head)}` })
        }
    }
    // 3. Reading/lead only at page level: a reading role whose nearest block is not the Page.
    for (const line of lines) {
        if (!READING.has(line.role) || line.chain.length === 0) continue
        const nearest = byId.get(line.chain[0])
        if (nearest !== undefined && nearest.kind !== "Page")
            violations.push({ law: "LEAD-PAGE-ONLY", page: name, detail: `"${line.text}" ${line.role} inside ${nearest.kind} "${nearest.text}"` })
    }
    // 2. Siblings share the type: blocks of one level (same parent block, same heading tag) draw their heading, and each role of their own
    // lines, in one size and weight.
    const groups = new Map()
    for (const b of blocks) {
        const key = `${b.parent}|${b.tag}|${FAMILY[b.kind] ?? b.kind}`
        groups.set(key, [...(groups.get(key) ?? []), b])
    }
    for (const siblings of groups.values()) {
        if (siblings.length < 2) continue
        const heads = new Set(siblings.map(type))
        if (heads.size > 1) violations.push({ law: "SIBLINGS-SAME", page: name, detail: `${siblings[0].tag} headings of one level: ${siblings.map((b) => `${b.kind} "${b.text}" ${type(b)}`).join("; ")}` })
        const roles = new Map()
        for (const b of siblings)
            for (const line of lines)
                if (line.chain[0] === b.id && !line.ownHeading && line.control === "" && !EXEMPT.has(line.component)) {
                    const key = `${line.semantic} (${line.component}${line.role ? ` ${line.role}` : ""} ${line.part}${line.strong ? " strong" : ""} ${line.tag})`
                    const seen = roles.get(key) ?? new Map()
                    if (!seen.has(type(line))) seen.set(type(line), `"${line.text}" in "${b.text}"`)
                    roles.set(key, seen)
                }
        for (const [key, seen] of roles)
            if (seen.size > 1) violations.push({ law: "SIBLINGS-SAME", page: name, detail: `${key} across sibling ${siblings[0].tag} blocks: ${[...seen].map(([t, where]) => `${t} ${where}`).join("; ")}` })
    }
}

// One scale: every semantic role in more than one size/weight across all pages.
const scale = new Map()
for (const [name, { lines }] of Object.entries(pages))
    for (const line of lines) {
        const variants = scale.get(line.semantic) ?? new Map()
        const v = variants.get(type(line)) ?? { count: 0, examples: [] }
        v.count += 1
        if (v.examples.length < 3) v.examples.push(`${name}: "${line.text}" (${line.component || line.tag}${line.role ? ` ${line.role}` : ""}${line.heading ? ` ${line.heading}` : ""})`)
        variants.set(type(line), v)
        scale.set(line.semantic, variants)
    }

const esc = (s) => String(s).replace(/\|/gu, "\\|")
const md = [`# Lesson type probe: ${LESSON}`, "", `Measured ${new Date().toISOString()} on ${look.web} at 1440 wide.`, ""]
md.push(`## Law violations: ${violations.length}`, "")
for (const law of ["NESTED-NOT-LARGER", "SIBLINGS-SAME", "LEAD-PAGE-ONLY"]) {
    const of = violations.filter((v) => v.law === law)
    md.push(`### DNA-COMMON-TYPE-${law}: ${of.length}`, "", ...of.map((v) => `- ${v.page}: ${esc(v.detail)}`), "")
}
md.push("## Semantic roles in more than one size/weight", "")
for (const [role, variants] of scale) {
    md.push(`### ${role}${variants.size > 1 ? " (mixed)" : ""}`, "")
    for (const [t, v] of [...variants].sort((a, b) => b[1].count - a[1].count)) md.push(`- ${t} x${v.count}: ${v.examples.map(esc).join("; ")}`)
    md.push("")
}
for (const [name, { lines }] of Object.entries(pages)) {
    md.push(`## page=${name}`, "", "| semantic | tag | component | data-role | heading | size / line / weight | color | text |", "|---|---|---|---|---|---|---|---|")
    for (const l of lines) md.push(`| ${l.semantic} | ${l.tag} | ${l.component} | ${l.role} | ${l.heading} | ${l.size}px / ${l.line} / ${l.weight} | ${l.color} | ${esc(l.text)} |`)
    md.push("")
}
mkdirSync(dirname(OUT_MD), { recursive: true })
writeFileSync(OUT_MD, md.join("\n"))
writeFileSync(OUT_JSON, JSON.stringify({ violations, pages }, null, 2))
console.log(`${violations.length} violation(s); wrote ${OUT_MD}`)
process.exit(violations.length > 0 ? 1 : 0)
