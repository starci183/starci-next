import { createHash } from "node:crypto"
import { parse } from "yaml"
import { isRecord } from "@modules/platform/primitives"
import {
    HARNESS_ID,
    documentOf,
    firstTitleOf,
    runBlocksOf,
    sectionsOf,
    type MarkdownSection,
} from "./harness-markdown.policy"
import {
    HARNESS_LOCALES,
    HARNESS_TOOLS,
    type HarnessBuildRecord,
    type HarnessConverted,
    type HarnessDocRecord,
    type HarnessDoctorPackRecord,
    type HarnessFile,
    type HarnessGuideRecord,
    type HarnessIssue,
    type HarnessKeyNeed,
    type HarnessLocale,
    type HarnessProbeRecord,
    type HarnessRawFile,
    type HarnessSectionRecord,
    type HarnessStageRecord,
    type HarnessStepRecord,
    type HarnessTool,
    type HarnessTrapRecord,
    type Localized,
} from "./harness.contracts"

/** The folder of the raw tree this converter reads. */
export const HARNESS_RAW_ROOT = "raw/harness/"

/** The folders a pack never ships. */
const SKIPPED: ReadonlySet<string> = new Set(["node_modules", ".git"])

/** A file of the raw tree with the path relative to `raw/harness/`. */
interface Entry {
    readonly path: string
    readonly text: string
}

const textOf = (value: unknown): string | null => (typeof value === "string" && value.trim() !== "" ? value : null)

/** A `{ vi, en }` pair, or one plain string read as both; null for anything else. */
export const localizedOf = (value: unknown): Localized | null => {
    const plain = textOf(value)
    if (plain !== null) return { vi: plain, en: plain }
    if (!isRecord(value)) return null
    const vi = textOf(value["vi"])
    const en = textOf(value["en"])
    return vi === null || en === null ? null : { vi, en }
}

const stringsOf = (value: unknown): ReadonlyArray<string> | null =>
    Array.isArray(value) && value.every((item) => typeof item === "string") ? (value as Array<string>) : null

const yamlOf = (text: string): unknown => {
    try {
        return parse(text)
    } catch {
        return null
    }
}

/** The hash over the path and text of files, sorted by path, so the same files always hash the same. */
export const filesHashOf = (files: ReadonlyArray<{ readonly path: string; readonly text: string }>): string => {
    const hash = createHash("sha256")
    for (const file of [...files].sort((a, b) => a.path.localeCompare(b.path))) {
        hash.update(file.path).update("\0").update(file.text).update("\0")
    }
    return hash.digest("hex")
}

const isSkipped = (path: string): boolean => path.split("/").some((part) => SKIPPED.has(part))

/** Groups entries by the first folder under `prefix`: `<prefix>/<name>/<rest>` becomes name -> rest. */
const groupedBy = (entries: ReadonlyArray<Entry>, prefix: string): Map<string, Array<Entry>> => {
    const groups = new Map<string, Array<Entry>>()
    for (const entry of entries) {
        if (!entry.path.startsWith(`${prefix}/`)) continue
        const rest = entry.path.slice(prefix.length + 1)
        const slash = rest.indexOf("/")
        if (slash < 1) continue
        const name = rest.slice(0, slash)
        const list = groups.get(name) ?? []
        list.push({ path: rest.slice(slash + 1), text: entry.text })
        groups.set(name, list)
    }
    return groups
}

const textFileOf = (entries: ReadonlyArray<Entry>, name: string): string | null =>
    entries.find((entry) => entry.path === name)?.text ?? null

/** Collects findings while a converter runs. */
class Findings {
    readonly list: Array<HarnessIssue> = []

    add(path: string, code: string, message: string): void {
        this.list.push({ path: `${HARNESS_RAW_ROOT}${path}`, code, message })
    }
}

const sectionOf = (
    id: string,
    order: number,
    title: Localized,
    body: Localized,
    run: ReadonlyArray<string>,
): HarnessSectionRecord => ({ id, order, title, body, run })

/** Reads both locale files of a guide or a doc into sections; null when a file is missing or the two disagree. */
const bothSectionsOf = (
    folder: string,
    entries: ReadonlyArray<Entry>,
    findings: Findings,
): {
    readonly title: Localized
    readonly summary: Localized
    readonly order: number | null
    readonly probes: ReadonlyArray<string>
    readonly sections: ReadonlyArray<HarnessSectionRecord>
} | null => {
    const docs = HARNESS_LOCALES.map((locale) => {
        const text = textFileOf(entries, `${locale}.md`)
        if (text === null) findings.add(`${folder}/${locale}.md`, "HARNESS_FILE_MISSING", `${locale}.md is missing`)
        return text === null ? null : documentOf(text)
    })
    const [vi, en] = docs
    if (vi === null || vi === undefined || en === null || en === undefined) return null
    const parsed: Record<HarnessLocale, ReadonlyArray<MarkdownSection>> = {
        vi: sectionsOf(vi.body, 2),
        en: sectionsOf(en.body, 2),
    }
    const ids = parsed.vi.map((section) => section.id)
    if (ids.join("|") !== parsed.en.map((section) => section.id).join("|") || new Set(ids).size !== ids.length) {
        findings.add(
            folder,
            "HARNESS_LOCALE_MISMATCH",
            "vi.md and en.md must declare the same unique section ids in the same order",
        )
        return null
    }
    const titleOf = (doc: typeof vi): string =>
        textOf(doc.meta["title"]) ?? firstTitleOf(doc.body) ?? folder.split("/").pop() ?? folder
    const summaryOf = (doc: typeof vi): string => textOf(doc.meta["summary"]) ?? ""
    const order = vi.meta["order"]
    return {
        title: { vi: titleOf(vi), en: titleOf(en) },
        summary: { vi: summaryOf(vi), en: summaryOf(en) },
        order: typeof order === "number" && Number.isFinite(order) ? order : null,
        probes: stringsOf(vi.meta["probes"]) ?? [],
        sections: parsed.vi.map((section, index) =>
            sectionOf(
                section.id,
                index + 1,
                { vi: section.title, en: parsed.en[index]?.title ?? section.title },
                { vi: section.body, en: parsed.en[index]?.body ?? section.body },
                runBlocksOf(section.body),
            ),
        ),
    }
}

const guideOf = (
    tool: HarnessTool,
    slug: string,
    entries: ReadonlyArray<Entry>,
    index: number,
    findings: Findings,
): HarnessGuideRecord | null => {
    const read = bothSectionsOf(`guides/${tool}/${slug}`, entries, findings)
    if (read === null) return null
    return {
        tool,
        slug,
        order: read.order ?? index + 1,
        title: read.title,
        summary: read.summary,
        probes: read.probes,
        sections: read.sections,
        contentHash: filesHashOf(entries),
    }
}

const docOf = (
    slug: string,
    entries: ReadonlyArray<Entry>,
    index: number,
    findings: Findings,
): HarnessDocRecord | null => {
    const read = bothSectionsOf(`docs/${slug}`, entries, findings)
    if (read === null) return null
    return {
        slug,
        order: read.order ?? index + 1,
        title: read.title,
        summary: read.summary,
        sections: read.sections,
        contentHash: filesHashOf(entries),
    }
}

const keyNeedsOf = (value: unknown, path: string, findings: Findings): ReadonlyArray<HarnessKeyNeed> => {
    if (value === undefined) return []
    if (!Array.isArray(value)) {
        findings.add(path, "HARNESS_BUILD_INVALID", "keys must be a list")
        return []
    }
    return value.flatMap((item): Array<HarnessKeyNeed> => {
        const id = isRecord(item) ? textOf(item["id"]) : null
        const anyOf = isRecord(item) ? stringsOf(item["anyOf"]) : null
        if (id === null || !HARNESS_ID.test(id) || anyOf === null || anyOf.length === 0) {
            findings.add(path, "HARNESS_BUILD_INVALID", "a key need needs an id and a non-empty anyOf list of names")
            return []
        }
        return [{ id, anyOf, note: isRecord(item) ? localizedOf(item["note"]) : null }]
    })
}

/** The stage chapters and steps of one locale's build guide, by stage id. */
const chaptersOf = (
    text: string,
): ReadonlyArray<{ readonly id: string; readonly title: string; readonly steps: ReadonlyArray<MarkdownSection> }> =>
    sectionsOf(documentOf(text).body, 2).map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
        steps: sectionsOf(chapter.body, 3),
    }))

const buildOf = (
    id: string,
    entries: ReadonlyArray<Entry>,
    index: number,
    findings: Findings,
): HarnessBuildRecord | null => {
    const base = `build/${id}`
    const stagesText = textFileOf(entries, "stages.yaml")
    if (stagesText === null) {
        findings.add(`${base}/stages.yaml`, "HARNESS_FILE_MISSING", "stages.yaml is missing")
        return null
    }
    const raw = yamlOf(stagesText)
    if (!isRecord(raw) || raw["id"] !== id) {
        findings.add(
            `${base}/stages.yaml`,
            "HARNESS_BUILD_INVALID",
            "stages.yaml must be a map whose id equals the folder name",
        )
        return null
    }
    const title = localizedOf(raw["title"])
    const summary = localizedOf(raw["summary"])
    const runtimeRaw = raw["runtime"]
    const stagesRaw = raw["stages"]
    if (
        title === null ||
        summary === null ||
        !isRecord(runtimeRaw) ||
        !Array.isArray(stagesRaw) ||
        stagesRaw.length === 0
    ) {
        findings.add(
            `${base}/stages.yaml`,
            "HARNESS_BUILD_INVALID",
            "title, summary, runtime and a non-empty stages list are required",
        )
        return null
    }
    const runtime = {
        dir: textOf(runtimeRaw["dir"]) ?? "source",
        install: textOf(runtimeRaw["install"]) ?? "npm ci",
        e2e: textOf(runtimeRaw["e2e"]) ?? "npm run e2e",
        report: textOf(runtimeRaw["report"]) ?? "e2e/reports/junit.xml",
    }
    const chapters = HARNESS_LOCALES.map((locale) => {
        const text = textFileOf(entries, `${locale}.md`)
        if (text === null) findings.add(`${base}/${locale}.md`, "HARNESS_FILE_MISSING", `${locale}.md is missing`)
        return text === null ? null : chaptersOf(text)
    })
    const [vi, en] = chapters
    if (vi === null || vi === undefined || en === null || en === undefined) return null
    const shape = (list: typeof vi): string =>
        list.map((chapter) => `${chapter.id}:${chapter.steps.map((step) => step.id).join(",")}`).join("|")
    if (shape(vi) !== shape(en)) {
        findings.add(
            base,
            "HARNESS_LOCALE_MISMATCH",
            "vi.md and en.md must declare the same stage and step ids in the same order",
        )
        return null
    }
    const seenE2e = new Set<string>()
    const stages: Array<HarnessStageRecord> = []
    for (const [position, stage] of stagesRaw.entries()) {
        const stageId = isRecord(stage) ? textOf(stage["id"]) : null
        const e2e = isRecord(stage) ? stringsOf(stage["e2e"]) : null
        const stageTitle = isRecord(stage) ? localizedOf(stage["title"]) : null
        const stageSummary = isRecord(stage) ? localizedOf(stage["summary"]) : null
        const chapterVi = vi.find((chapter) => chapter.id === stageId)
        const chapterEn = en.find((chapter) => chapter.id === stageId)
        if (
            stageId === null ||
            !HARNESS_ID.test(stageId) ||
            e2e === null ||
            e2e.length === 0 ||
            stageTitle === null ||
            stageSummary === null
        ) {
            findings.add(
                `${base}/stages.yaml`,
                "HARNESS_BUILD_INVALID",
                `stage ${String(position + 1)} needs an id, a title, a summary and e2e ids`,
            )
            continue
        }
        if (chapterVi === undefined || chapterEn === undefined) {
            findings.add(`${base}/vi.md`, "HARNESS_STAGE_UNGUIDED", `stage ${stageId} has no chapter in the guide`)
            continue
        }
        const badE2e = e2e.filter((each) => !HARNESS_ID.test(each) || seenE2e.has(each))
        if (badE2e.length > 0)
            findings.add(
                `${base}/stages.yaml`,
                "HARNESS_BUILD_INVALID",
                `e2e ids must be unique slugs: ${badE2e.join(", ")}`,
            )
        e2e.forEach((each) => seenE2e.add(each))
        const steps: Array<HarnessStepRecord> = chapterVi.steps.map((step, stepIndex) => {
            const other = chapterEn.steps[stepIndex]
            return {
                id: step.id,
                order: stepIndex + 1,
                title: { vi: step.title, en: other?.title ?? step.title },
                body: { vi: step.body, en: other?.body ?? step.body },
                run: runBlocksOf(step.body),
            }
        })
        stages.push({ id: stageId, order: position + 1, title: stageTitle, summary: stageSummary, e2e, steps })
    }
    if (new Set(stages.map((stage) => stage.id)).size !== stages.length) {
        findings.add(`${base}/stages.yaml`, "HARNESS_BUILD_INVALID", "stage ids must be unique")
        return null
    }
    const live = entries.filter((entry) => !isSkipped(entry.path))
    const order = raw["order"]
    return {
        id,
        order: typeof order === "number" && Number.isFinite(order) ? order : index + 1,
        title,
        summary,
        keys: keyNeedsOf(raw["keys"], `${base}/stages.yaml`, findings),
        runtime,
        stages,
        packFiles: live
            .filter((entry) => entry.path.startsWith("source/") || entry.path.startsWith("e2e/"))
            .map((entry) => ({ path: entry.path, text: entry.text }))
            .sort((a, b) => a.path.localeCompare(b.path)),
        hiddenPaths: live
            .filter((entry) => entry.path.startsWith("hidden/"))
            .map((entry) => entry.path)
            .sort(),
        contentHash: filesHashOf(live),
    }
}

const reasonsOf = (value: unknown): Readonly<Record<string, Localized>> => {
    if (!isRecord(value)) return {}
    const pairs = Object.entries(value).flatMap(([code, hint]): Array<[string, Localized]> => {
        const text = localizedOf(hint)
        return text === null ? [] : [[code, text]]
    })
    return Object.fromEntries(pairs)
}

const probesOf = (tool: HarnessTool, entries: ReadonlyArray<Entry>, findings: Findings): Array<HarnessProbeRecord> => {
    const files = entries
        .filter((entry) => !entry.path.includes("/") && entry.path.endsWith(".yaml"))
        .sort((a, b) => a.path.localeCompare(b.path))
    const probes: Array<HarnessProbeRecord> = []
    for (const [index, file] of files.entries()) {
        const path = `doctor/${tool}/${file.path}`
        const raw = yamlOf(file.text)
        const fallback = file.path.replace(/\.yaml$/u, "")
        const id = isRecord(raw) ? (textOf(raw["id"]) ?? fallback) : null
        if (!isRecord(raw) || id === null || !HARNESS_ID.test(id)) {
            findings.add(path, "HARNESS_PROBE_INVALID", "a probe is a yaml map with a kebab-case id")
            continue
        }
        if (probes.some((probe) => probe.id === id)) {
            findings.add(path, "HARNESS_PROBE_INVALID", `probe id ${id} is used twice for ${tool}`)
            continue
        }
        const label = localizedOf(raw["label"]) ?? { vi: id, en: id }
        const order = raw["order"]
        probes.push({
            id,
            tool,
            order: typeof order === "number" && Number.isFinite(order) ? order : index + 1,
            label,
            needs: stringsOf(raw["needs"]) ?? [],
            reasons: reasonsOf(raw["reasons"]),
            yaml: file.text,
        })
    }
    return probes
}

/** True when a path matches a glob of `**`, `*` and literal characters. */
export const globMatches = (glob: string, path: string): boolean => {
    const source = glob
        .split("**")
        .map((part) =>
            part
                .split("*")
                .map((literal) => literal.replace(/[.+?^${}()|[\]\\]/gu, "\\$&"))
                .join("[^/]*"),
        )
        .join(".*")
    return new RegExp(`^${source}$`, "u").test(path)
}

const trapOf = (
    id: string,
    entries: ReadonlyArray<Entry>,
    index: number,
    findings: Findings,
): HarnessTrapRecord | null => {
    const base = `trials/${id}`
    const text = textFileOf(entries, "trap.yaml")
    if (text === null) {
        findings.add(`${base}/trap.yaml`, "HARNESS_FILE_MISSING", "trap.yaml is missing")
        return null
    }
    const raw = yamlOf(text)
    const label = isRecord(raw) ? localizedOf(raw["label"]) : null
    const task = isRecord(raw) ? textOf(raw["task"]) : null
    if (!isRecord(raw) || raw["id"] !== id || label === null || task === null || !isRecord(raw["test"])) {
        findings.add(
            `${base}/trap.yaml`,
            "HARNESS_TRAP_INVALID",
            "a trap needs id (the folder name), label, task and test",
        )
        return null
    }
    const tools = (stringsOf(raw["tools"]) ?? [...HARNESS_TOOLS]).filter((tool): tool is HarnessTool =>
        HARNESS_TOOLS.some((known) => known === tool),
    )
    const estimate = raw["estimate"]
    const turns = isRecord(estimate) ? estimate["turns"] : null
    const per = isRecord(estimate) ? estimate["outputTokensPerTurn"] : null
    const files: Array<HarnessFile> = entries
        .filter((entry) => !isSkipped(entry.path))
        .map((entry) => ({ path: entry.path, text: entry.text }))
        .sort((a, b) => a.path.localeCompare(b.path))
    const order = raw["order"]
    return {
        id,
        order: typeof order === "number" && Number.isFinite(order) ? order : index + 1,
        label,
        task,
        tools: tools.length === 0 ? [...HARNESS_TOOLS] : tools,
        estimate: typeof turns === "number" && typeof per === "number" ? { turns, outputTokensPerTurn: per } : null,
        files,
        contentHash: filesHashOf(files),
    }
}

/**
 * Converts the `raw/harness/**` files of the content tree to the records the app stores (CONTRACT.md): builds (stages.yaml, the two
 * guides, `source/`, `e2e/`, `hidden/`), guides, docs, doctor probes with their packs, and trial traps. It is pure: files in, records
 * and findings out; the importer and the seed adapter both call it, and any finding refuses the import.
 */
export const convertRawHarness = (files: ReadonlyArray<HarnessRawFile>): HarnessConverted => {
    const findings = new Findings()
    const entries: Array<Entry> = files
        .filter((file) => file.path.startsWith(HARNESS_RAW_ROOT))
        .map((file) => ({ path: file.path.slice(HARNESS_RAW_ROOT.length), text: file.text }))
    const builds = [...groupedBy(entries, "build")]
        .sort(([a], [b]) => a.localeCompare(b))
        .flatMap(([id, group], index) => {
            const build = buildOf(id, group, index, findings)
            return build === null ? [] : [build]
        })
    const guides: Array<HarnessGuideRecord> = []
    const doctorPacks: Array<HarnessDoctorPackRecord> = []
    const probes: Array<HarnessProbeRecord> = []
    for (const tool of HARNESS_TOOLS) {
        const prefix = `guides/${tool}`
        ;[...groupedBy(entries, prefix)]
            .sort(([a], [b]) => a.localeCompare(b))
            .forEach(([slug, group], index) => {
                const guide = HARNESS_ID.test(slug) ? guideOf(tool, slug, group, index, findings) : null
                if (guide !== null) guides.push(guide)
            })
        const doctor = entries
            .filter((entry) => entry.path.startsWith(`doctor/${tool}/`) && !isSkipped(entry.path))
            .map((entry) => ({ path: entry.path.slice(`doctor/${tool}/`.length), text: entry.text }))
        probes.push(...probesOf(tool, doctor, findings))
        if (doctor.length > 0)
            doctorPacks.push({
                tool,
                files: [...doctor].sort((a, b) => a.path.localeCompare(b.path)),
                contentHash: filesHashOf(doctor),
            })
    }
    for (const [name] of groupedBy(entries, "guides")) {
        if (!HARNESS_TOOLS.some((tool) => tool === name))
            findings.add(`guides/${name}`, "HARNESS_TOOL_UNKNOWN", `${name} is not a tool (claude or codex)`)
    }
    for (const guide of guides) {
        const known = new Set(probes.filter((probe) => probe.tool === guide.tool).map((probe) => probe.id))
        const missing = guide.probes.filter((probe) => !known.has(probe))
        if (missing.length > 0)
            findings.add(
                `guides/${guide.tool}/${guide.slug}`,
                "HARNESS_PROBE_UNKNOWN",
                `unknown probe ids: ${missing.join(", ")}`,
            )
    }
    const docs = [...groupedBy(entries, "docs")]
        .sort(([a], [b]) => a.localeCompare(b))
        .flatMap(([slug, group], index) => {
            const doc = HARNESS_ID.test(slug) ? docOf(slug, group, index, findings) : null
            return doc === null ? [] : [doc]
        })
    const traps = [...groupedBy(entries, "trials")]
        .sort(([a], [b]) => a.localeCompare(b))
        .flatMap(([id, group], index) => {
            const trap = trapOf(id, group, index, findings)
            return trap === null ? [] : [trap]
        })
    return { builds, guides, docs, probes, doctorPacks, traps, issues: findings.list }
}

/** Whether any file of the list belongs to the harness raw tree. */
export const hasRawHarness = (files: ReadonlyArray<HarnessRawFile>): boolean =>
    files.some((file) => file.path.startsWith(HARNESS_RAW_ROOT))
