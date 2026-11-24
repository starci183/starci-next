import type { CourseCaseDetailView, CourseCaseLoopView, CourseCommandView, CourseHintLevelView } from "@starci-next/ui"
import { isEverGreen, loopOf, type CourseCase, type CourseLessonRecord, type CourseLoopKind } from "./lesson"
import type { CourseLoopWords } from "./words"

/** A text the record keeps in both languages; the Vietnamese one stands in when the English one is missing. */
/** A text the record keeps in both languages. */
export type LocalizedText = { readonly vi: string; readonly en?: string | null }

/** The text in the learner's language. */
export const localized = (text: LocalizedText, locale: string): string =>
    locale === "en" && text.en !== undefined && text.en !== null && text.en !== "" ? text.en : text.vi

/** The words of one invariant of the record; empty when the record names no such invariant. */
export const invariantWordsOf = (lesson: CourseLessonRecord, id: string | null | undefined, locale: string): string => {
    const found = lesson.invariants.find((each) => each.id === id)
    return found === undefined ? "" : localized(found, locale)
}

/** A command the learner types, with what it does. */
const commandOf = (id: string, title: string, note: string, command: string): CourseCommandView => ({
    id,
    title,
    note,
    command,
})

/** The hint a learner opened just now or earlier, by case and level. */
export type OpenedHints = Readonly<Record<string, string>>

/** Which hint is being opened right now. */
export type OpeningHint = { readonly caseId: string; readonly level: number } | undefined

/** The key an opened hint's text is kept under. */
export const hintKeyOf = (caseId: string, level: number): string => `${caseId}:${level}`

/** What the detail of one case is built from. */
export type DetailParams = {
    readonly lesson: CourseLessonRecord
    readonly item: CourseCase
    readonly locale: string
    readonly words: CourseLoopWords
    readonly opened: OpenedHints
    readonly opening: OpeningHint
}

/** The hint ladder of a case: each level with its text when opened, and the one level that may be opened now. */
const hintLevelsOf = (params: DetailParams): ReadonlyArray<CourseHintLevelView> => {
    const { item, words } = params
    const specs = [...item.spec.hints].sort((a, b) => a.level - b.level)
    const unlocked = specs.filter((each) => each.unlocked).length
    const openCount = Math.max(item.mark?.hintsOpened ?? 0, unlocked)
    return specs.map((spec) => {
        const isOpen = spec.level <= openCount
        const text = params.opened[hintKeyOf(item.id, spec.level)] ?? spec.text ?? ""
        return {
            level: spec.level,
            title: words.hintTitle(spec.level),
            text: isOpen ? text : "",
            isOpen,
            isNext: spec.level === openCount + 1,
            isOpening: params.opening?.caseId === item.id && params.opening.level === spec.level,
        }
    })
}

/** The invariant a case broke in its last run, in words, with the two values; undefined unless the last run failed. */
const violationOf = (params: DetailParams): CourseCaseDetailView["violation"] => {
    const failed = params.item.mark?.lastRun?.failed
    if (failed === undefined || failed === null) return undefined
    if (params.item.state !== "red" && params.item.state !== "error") return undefined
    return {
        invariant: invariantWordsOf(params.lesson, failed.invariant, params.locale),
        message: failed.message,
        expected: failed.expected ?? "",
        actual: failed.actual ?? "",
    }
}

/** The case on screen: a locked case says when it opens, any other shows what it asks and what the learner can do next. */
export const detailOf = (params: DetailParams): CourseCaseDetailView => {
    const { item, words, lesson, locale } = params
    const base = { id: item.id, status: item.state }
    if (item.state === "locked") {
        return {
            ...base,
            lockedNote: words.lockedNote,
            invariants: [],
            chaos: [],
            violation: undefined,
            run: undefined,
            hints: undefined,
            diff: undefined,
            reset: undefined,
        }
    }
    const levels = item.kind === "unhappy" ? hintLevelsOf(params) : []
    return {
        ...base,
        lockedNote: "",
        invariants: item.spec.invariants
            .map((id) => invariantWordsOf(lesson, id, locale))
            .filter((each) => each !== ""),
        chaos: item.spec.chaos.map((each) => words.chaos(each.key, each.value)),
        violation: violationOf(params),
        run: commandOf("run", words.runTitle, words.runNote, `starci-relay case run ${item.id}`),
        hints: levels.length === 0 ? undefined : levels,
        diff:
            item.mark?.diffAvailable === true
                ? commandOf("diff", words.diffTitle, words.diffNote, `starci-relay case diff ${item.id}`)
                : undefined,
        reset:
            item.mark?.resetAvailable === true
                ? {
                      command: commandOf(
                          "reset",
                          words.resetTitle,
                          words.resetNote,
                          `starci-relay case reset-to ${item.id}`,
                      ),
                      warning: words.resetWarning(item.id),
                  }
                : undefined,
    }
}

/** What a loop page is built from. */
export type LoopParams = Omit<DetailParams, "item"> & {
    readonly cases: ReadonlyArray<CourseCase>
    readonly kind: CourseLoopKind
    readonly selectedId: string | undefined
}

/** A loop page: its cases in order with their states, the selected case in detail and, on the unhappy loop, the line about the lab's AI tools. */
export const loopViewOf = (params: LoopParams): CourseCaseLoopView => {
    const loop = loopOf(params.cases, params.kind)
    const { words, locale } = params
    const selected = loop.find((each) => each.id === params.selectedId)
    return {
        intro: params.kind === "happy" ? words.happyIntro : words.unhappyIntro,
        cases: loop.map((each) => ({
            id: each.id,
            title: localized(each.spec.title, locale),
            status: each.state,
            statusLabel: words.status[each.state],
            isSelected: each.id === params.selectedId,
        })),
        selected: selected === undefined ? undefined : detailOf({ ...params, item: selected }),
        mcp:
            params.kind === "unhappy" ? commandOf("mcp", words.mcpTitle, words.mcpNote, "starci-relay mcp") : undefined,
    }
}

/** The status of a case as the lab panel words it: a green case passed, a red one failed, any other has not run. */
export type LabCaseStatus = "notRun" | "running" | "passed" | "failed"

/** The current case as the lab panel is handed it: its title, where it stands and, when red, the invariant that failed. */
export type LabCaseResult = {
    readonly title: string
    readonly status: LabCaseStatus
    readonly invariant: string
    readonly expected: string
    readonly actual: string
}

/** How the lab panel words a case state: a green case passed, a red or errored one failed, any other has not run. */
const labStatusOf = (state: CourseCase["state"]): LabCaseStatus => {
    if (state === "green") return "passed"
    return state === "red" || state === "error" ? "failed" : "notRun"
}

/** The result of the selected case for the lab panel beside the loop. */
export const caseResultOf = (
    lesson: CourseLessonRecord,
    item: CourseCase | undefined,
    locale: string,
): LabCaseResult | undefined => {
    if (item === undefined) return undefined
    const failed = item.mark?.lastRun?.failed
    const isRed = item.state === "red" || item.state === "error"
    const status = labStatusOf(item.state)
    return {
        title: localized(item.spec.title, locale),
        status,
        invariant: isRed && failed ? invariantWordsOf(lesson, failed.invariant, locale) || failed.message : "",
        expected: isRed ? (failed?.expected ?? "") : "",
        actual: isRed ? (failed?.actual ?? "") : "",
    }
}

/** How many cases of the record are not green yet. */
export const missingCountOf = (cases: ReadonlyArray<CourseCase>, kind?: CourseLoopKind): number =>
    cases.filter((each) => (kind === undefined || each.kind === kind) && !isEverGreen(each)).length
