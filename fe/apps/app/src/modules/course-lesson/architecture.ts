import type { CourseArchitectureSegment, CourseArchitectureView } from "@starci-next/ui"
import { diagramOf, learnerServiceOf } from "./diagram"
import type { CourseLessonRecord } from "./lesson"
import { chaosWordsOf, localized } from "./views"
import type { CourseArchitectureWords } from "./words"
import { termsOf } from "./narration"

/** The architecture the record carries for the Kiến trúc page. */
type RecordArchitecture = NonNullable<CourseLessonRecord["architecture"]>

/** One learner file of the record's architecture. */
type RecordFile = RecordArchitecture["files"][number]

/** An HTTP request written in a sentence (`POST /checkout`): its method and path. */
const REQUEST_IN_TEXT = /\b(GET|POST|PUT|PATCH|DELETE)\s+(\/[\w\-/:{}]*)/u

/** The first call on a line of code (`ctx.payments.charge(` gives `ctx.payments.charge`): the function that sends the request. */
const CALL_ON_LINE = /([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)+)\s*\(/u

/** The language badge of a file by its extension; a file of any other extension shows the extension itself. */
const LANGUAGES: Readonly<Record<string, string>> = {
    ts: "ts",
    tsx: "tsx",
    js: "js",
    mjs: "js",
    sql: "sql",
    py: "python",
    go: "go",
    yml: "yaml",
}

/** The base name of a path: `services/orders/src/checkout.ts` gives `checkout.ts`. */
export const baseNameOf = (path: string): string => path.split("/").at(-1) ?? path

/** The language of a file from its extension (`.sql` highlights as SQL). */
export const languageOf = (path: string): string => {
    const extension = baseNameOf(path).split(".").at(-1)?.toLowerCase() ?? ""
    return LANGUAGES[extension] ?? extension
}

/** A sentence with names between backticks, cut into words and inline code. */
export const segmentsOf = (text: string): ReadonlyArray<CourseArchitectureSegment> =>
    text
        .split("`")
        .map((part, index) => ({ text: part, isCode: index % 2 === 1 }))
        .filter((part) => part.text !== "")

/**
 * The outside request the learner file serves, read from the business flow (`frontend gửi POST /checkout tới orders`): the first step
 * that names a method and a path. Undefined when no step does; the code section then takes its plain title.
 */
export const entryRequestOf = (architecture: RecordArchitecture): { method: string; path: string } | undefined => {
    for (const step of architecture.flow) {
        const found = REQUEST_IN_TEXT.exec(step.text.vi)
        if (found?.[1] !== undefined && found[2] !== undefined) return { method: found[1], path: found[2] }
    }
    return undefined
}

/** The service that holds a file: the one whose id is a folder of its path, else the service of the learner file. */
const serviceOfPath = (lesson: CourseLessonRecord, path: string): string | undefined => {
    const folders = new Set(path.split("/"))
    return lesson.stack.services.find((each) => folders.has(each.id))?.id ?? learnerServiceOf(lesson)?.id
}

/** The call on the line that sends request `n`, read from the excerpt that marks it; empty when no excerpt holds that line. */
const callOf = (files: ReadonlyArray<RecordFile>, n: number): string => {
    for (const file of files) {
        const mark = file.marks.find((each) => each.request === n)
        const excerpt = file.excerpt
        if (mark === undefined || excerpt === null || excerpt.code === null) continue
        const line = excerpt.code.split("\n")[mark.line - excerpt.from]
        const found = line === undefined ? null : CALL_ON_LINE.exec(line)
        if (found?.[1] !== undefined) return found[1]
    }
    return ""
}

/** The kind of a case's situation for its tile: the most telling chaos switch it turns on, `normal` for a normal case with none. */
const situationIconOf = (keys: ReadonlyArray<string>, isNormal: boolean): string => {
    const kinds: ReadonlyArray<readonly [RegExp, string]> = [
        [/CRASH/u, "crash"],
        [/LOST|TIMEOUT/u, "lost"],
        [/DUP/u, "duplicate"],
        [/FLAKY/u, "flaky"],
        [/SLOW/u, "slow"],
        [/STOCK/u, "stock"],
    ]
    const found = kinds.find(([pattern]) => keys.some((key) => pattern.test(key)))
    if (found !== undefined) return found[1]
    return isNormal ? "normal" : "failure"
}

/**
 * Every case of the lab as the situation it creates on the learner's system, normal cases first then the failures (the page groups them):
 * its title and its situation in business words. Never the fix, never the concept: the page is read before the failures.
 */
const situationsOf = (
    lesson: CourseLessonRecord,
    words: CourseArchitectureWords,
    locale: string,
): CourseArchitectureView["situations"] =>
    [
        ...lesson.happy.map((spec) => ({ spec, isNormal: true })),
        ...lesson.unhappy.map((spec) => ({ spec, isNormal: false })),
    ].map(({ spec, isNormal }) => {
        const chaos = spec.chaos.map((each) => chaosWordsOf(lesson, each.key, each.value, locale))
        // The case's own situation in business words (the record's `situation`, the sentence the case page shows); the chaos labels only
        // for a record that has none (owner 2026-11-28: never raw switches like "(after:payments.charge)" on a reading page).
        const told = spec.situation === null ? "" : localized(spec.situation, locale)
        return {
            id: spec.id,
            title: localized(spec.title, locale),
            isNormal,
            situation: told !== "" ? told : chaos.length === 0 ? words.noChaos : chaos.join(" · "),
            icon: situationIconOf(
                spec.chaos.map((each) => each.key),
                isNormal,
            ),
        }
    })

/** The page of a record cut before the Kiến trúc page existed: it says it has nothing to show. */
const EMPTY_VIEW: CourseArchitectureView = {
    hasArchitecture: false,
    flowTitle: "",
    flow: [],
    diagram: "",
    why: "",
    codeTitle: "",
    codeLead: [],
    fileLines: [],
    files: [],
    requests: [],
    situations: [],
    terms: [],
}

/**
 * The static Kiến trúc page (lessons.md §7) from the record alone: one order through the services in business words, the architecture
 * drawn with the real requests on its edges, the tables of each database and the learner file names on their services, why the plain
 * approach is not enough, the code that runs when the frontend sends its request (the learner files with their sending lines marked by
 * request number, and the table number → call → endpoint → business effect) and every case as the situation it creates. Nothing in it
 * depends on the learner's progress: it holds no button and no case state.
 */
export const architectureViewOf = (
    lesson: CourseLessonRecord,
    words: CourseArchitectureWords,
    locale: string,
): CourseArchitectureView => {
    const { architecture } = lesson
    if (architecture === null || architecture === undefined)
        return { ...EMPTY_VIEW, situations: situationsOf(lesson, words, locale), terms: termsOf(lesson, locale) }
    const files = architecture.files
    const filesByService: Record<string, string[]> = {}
    for (const file of files) {
        const service = serviceOfPath(lesson, file.path)
        if (service !== undefined) filesByService[service] = [...(filesByService[service] ?? []), baseNameOf(file.path)]
    }
    const tables = Object.fromEntries(architecture.tables.map((each) => [each.serviceId, each.tables]))
    const diagram = diagramOf(lesson, { entry: words.entry, frame: words.frame }, locale, {
        requests: architecture.requests,
        tables,
        files: filesByService,
    })
    const entry = entryRequestOf(architecture)
    const services = Object.keys(filesByService)
    const first = files[0]
    const lead =
        files.length <= 1
            ? words.codeLeadOne({
                  path: first?.path ?? lesson.learnerFile,
                  service: services[0] ?? "",
                  requests: architecture.requests.length,
              })
            : words.codeLeadMany({ count: files.length, services: services.map((id) => `\`${id}\``).join(", ") })
    return {
        hasArchitecture: true,
        flowTitle: words.flowTitle(lesson.stack.services.length),
        flow: architecture.flow.map((step, index) => ({
            id: `step-${String(index + 1)}`,
            text: localized(step.text, locale),
            icon: step.icon,
        })),
        diagram: diagram.source,
        why: localized(architecture.why, locale),
        codeTitle: entry === undefined ? words.codeTitlePlain : words.codeTitle(entry.method, entry.path),
        codeLead: segmentsOf(lead),
        fileLines:
            files.length <= 1
                ? []
                : files.map((file) => ({
                      id: file.path,
                      path: file.path,
                      role: file.role === null ? "" : localized(file.role, locale),
                  })),
        files: files.map((file) => ({
            id: file.path,
            path: file.path,
            role: file.role === null ? "" : localized(file.role, locale),
            code: file.excerpt?.code ?? "",
            language: languageOf(file.path),
            start: file.excerpt?.from ?? 1,
            marked: file.marks.map((each) => each.line),
            note: file.marks.map((each) => words.mark(each.line, each.request)).join(" · "),
        })),
        requests: architecture.requests.map((each) => ({
            id: `request-${String(each.n)}`,
            n: String(each.n),
            call: callOf(files, each.n),
            endpoint: `${each.to} ${each.method} ${each.path}`,
            does: localized(each.does, locale),
        })),
        situations: situationsOf(lesson, words, locale),
        terms: termsOf(lesson, locale),
    }
}

/** The blank page the skeleton of the first read draws: the same shape, no words. */
export const PLACEHOLDER_ARCHITECTURE: CourseArchitectureView = {
    ...EMPTY_VIEW,
    hasArchitecture: true,
    diagram: ["flowchart LR", "    a[ ]"].join("\n"),
    flow: [1, 2, 3].map((n) => ({ id: `step-${String(n)}`, text: "", icon: "" })),
    situations: [1, 2, 3].map((n) => ({ id: `case-${String(n)}`, title: "", situation: "", icon: "", isNormal: n === 1 })),
}
