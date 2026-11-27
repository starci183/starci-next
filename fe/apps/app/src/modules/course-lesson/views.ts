import type { CourseCaseDetailView, CourseCaseLoopView, CourseCommandView, CourseHintLevelView } from "@starci-next/ui"
import {
    isEverGreen,
    isGreenNow,
    loopOf,
    type CourseCase,
    type CourseLessonRecord,
    type CourseLoopKind,
} from "./lesson"
import type { CourseLoopWords } from "./words"

/** A text the record keeps in both languages; the Vietnamese one stands in when the English one is missing. */
/** A text the record keeps in both languages. */
export type LocalizedText = { readonly vi: string; readonly en?: string | null }

/** The text in the learner's language. */
export const localized = (text: LocalizedText, locale: string): string =>
    locale === "en" && text.en !== undefined && text.en !== null && text.en !== "" ? text.en : text.vi

/** The quote marks a record may wrap a spoken line in: the typographic pair and the plain double quote. */
const QUOTE_PAIRS: ReadonlyArray<readonly [string, string]> = [
    ["“", "”"],
    ['"', '"'],
]

/**
 * A spoken line (the interviewer's question, the learner's answer) without the one pair of quote marks the record may wrap it in. The
 * composite that draws a spoken line owns its quote marks and always adds one pair, so the record's own pair is dropped here, once, and a line
 * stored either way reads with exactly one pair. Quotes inside the line (a quoted word) stay.
 */
export const unquoted = (text: string): string => {
    const trimmed = text.trim()
    const pair = QUOTE_PAIRS.find(([open, close]) => trimmed.length >= 2 && trimmed.startsWith(open) && trimmed.endsWith(close))
    return pair === undefined ? text : trimmed.slice(pair[0].length, trimmed.length - pair[1].length).trim()
}

/** The words of one invariant of the record; empty when the record names no such invariant. */
export const invariantWordsOf = (lesson: CourseLessonRecord, id: string | null | undefined, locale: string): string => {
    const found = lesson.invariants.find((each) => each.id === id)
    return found === undefined ? "" : localized(found, locale)
}

/** True for a value that only says the switch is on: the label then stands alone. */
const plainOn = (value: string): boolean => value === "true" || value === "on" || value === "1" || value === "all"

/**
 * One chaos switch of a case in words. The words come from the lesson record (its `chaos` labels, in the learner's language), never from the app: a
 * switch the lab labels reads as its label, followed by its value when the value says more than "on"; a switch with no label yet reads as the plain
 * `KEY=value`.
 */
export const chaosWordsOf = (lesson: CourseLessonRecord, key: string, value: string, locale: string): string => {
    const found = lesson.chaos.find((each) => each.id === key)
    if (found === undefined) return `${key}=${value}`
    const label = localized(found.label, locale)
    return plainOn(value) ? label : `${label} (${value})`
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
    /** True for the first case of its loop: a locked first unhappy case waits on the normal cases, not on a question before it. */
    readonly isFirst?: boolean
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

/**
 * When a locked case opens, in the loop's own words: a normal case after the case before it, the first question after the normal cases,
 * any later question after the question before it.
 */
const lockedNoteOf = (words: CourseLoopWords, kind: CourseLoopKind, isFirst: boolean): string => {
    if (kind === "happy") return words.lockedNote.happy
    return isFirst ? words.lockedNote.firstQuestion : words.lockedNote.question
}

/** Where the last run left one check of a case: not run when the case never ran, broken when the run names it as the one that failed, else held. */
const checkStateOf = (item: CourseCase, invariant: string): "done" | "error" | "notRun" => {
    const run = item.mark?.lastRun
    if (run === null || run === undefined) return "notRun"
    // A run reports its first broken check; every other check of a red run is counted as held.
    return run.failed?.invariant === invariant ? "error" : "done"
}

/** The case-state word each check state borrows: held reads like a passed case, broken like a red one, not run like an open one. */
const CHECK_WORD = { done: "green", error: "red", notRun: "open" } as const

/** The case on screen: a locked case says when it opens, any other shows what it asks and what the learner can do next. */
export const detailOf = (params: DetailParams): CourseCaseDetailView => {
    const { item, words, lesson, locale } = params
    const base = { id: item.id, status: item.state }
    if (item.state === "locked") {
        return {
            ...base,
            lockedNote: lockedNoteOf(words, item.kind, params.isFirst === true),
            question: "",
            invariants: [],
            chaos: [],
            run: undefined,
            hints: undefined,
            diff: undefined,
            reset: undefined,
        }
    }
    // Every case may carry hints: the code starts wrong in the normal cases too (owner 2026-11-27).
    const levels = hintLevelsOf(params)
    return {
        ...base,
        lockedNote: "",
        question: item.spec.question === null ? "" : unquoted(localized(item.spec.question, locale)),
        invariants: item.spec.invariants
            .map((id) => ({ id, text: invariantWordsOf(lesson, id, locale) }))
            .filter((each) => each.text !== "")
            .map((each) => {
                const state = checkStateOf(item, each.id)
                return { text: each.text, state, stateLabel: words.status[CHECK_WORD[state]] }
            }),
        chaos: item.spec.chaos.map((each) => chaosWordsOf(lesson, each.key, each.value, locale)),
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
        progress: words.progress(params.kind, loop.filter((each) => each.state === "green").length, loop.length),
        cases: loop.map((each, index) => ({
            id: each.id,
            // The unhappy cases are a numbered run of interview questions; the happy ones are a pair, unnumbered.
            title:
                params.kind === "unhappy"
                    ? `${index + 1}. ${localized(each.spec.title, locale)}`
                    : localized(each.spec.title, locale),
            status: each.state,
            statusLabel: words.status[each.state],
            isSelected: each.id === params.selectedId,
        })),
        selected: selected === undefined ? undefined : detailOf({ ...params, item: selected, isFirst: loop[0]?.id === selected.id }),
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

/** How many cases of the record were never green: what still keeps the next page closed. */
export const missingCountOf = (cases: ReadonlyArray<CourseCase>, kind?: CourseLoopKind): number =>
    cases.filter((each) => (kind === undefined || each.kind === kind) && !isEverGreen(each)).length

/** How many cases are not green on their newest run: what the server's submit gate refuses on, even for a case green once. */
export const notGreenNowCountOf = (cases: ReadonlyArray<CourseCase>): number =>
    cases.filter((each) => !isGreenNow(each)).length
