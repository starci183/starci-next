import { createHash } from "node:crypto"
import type { CaseResultEvent } from "@modules/platform/relay-protocol"
import {
    COURSE_HINT_LEVELS,
    type CourseCaseKind,
    type CourseCasesView,
    type CourseCaseSpecView,
    type CourseCaseStateView,
    type CourseCaseStatus,
    type CourseFailure,
    type CourseHintView,
    type CourseLastRunView,
    type CourseLessonView,
    type CourseLocale,
    type CourseRunStatus,
    type CourseText,
    type CourseArchitectureFileView,
    type CourseAuditView,
    type CourseArchitectureView,
    type CourseEndpointView,
    type CourseFocusView,
    type CourseBeforeAfterView,
} from "./course-lab.contracts"
import type { CourseLabRecord } from "./course-lab-record.policy"
import { recordReferenceViewOf, referenceViewOf } from "./course-reference.policy"

/** One case in the order the learner meets it: every happy case in order, then every unhappy case in order. */
export interface CaseRef {
    /** The case id. */
    readonly caseId: string
    /** Happy or unhappy. */
    readonly kind: CourseCaseKind
    /** Whether a reference step exists to reset to: an unhappy case with its rung, or a happy case the starter breaks (fixed by `c0-naive`). */
    readonly hasReference: boolean
    /** The hint texts of the case, one per level; empty for a happy case that declares none. */
    readonly hints: ReadonlyArray<{ readonly vi: string; readonly en?: string | undefined }>
}

/** What a learner has done with one case. */
export interface CaseMark {
    /** The case id. */
    readonly caseId: string
    /** Hint levels opened, 0 to 3. */
    readonly hintsOpened: number
    /** Whether the case was green at least once. */
    readonly everGreen: boolean
}

/** The newest stored run of one case. */
export interface CaseRun {
    /** The case id. */
    readonly caseId: string
    /** How it ended. */
    readonly status: CourseRunStatus
    /** When it ran, ISO 8601. */
    readonly ranAt: string
    /** How long it took, in milliseconds. */
    readonly durationMs: number
    /** The learner's commit it ran on, or null. */
    readonly learnerCommit: string | null
    /** Why it failed, or null. */
    readonly failed: CourseFailure | null
}

/** The cases of a record in the order the learner meets them. */
export const caseOrderOf = (record: CourseLabRecord): ReadonlyArray<CaseRef> => [
    ...record.happy.map((each) => ({
        caseId: each.id,
        kind: "happy" as const,
        hasReference: each.hasReference === true && each.ref !== undefined,
        hints: (each.hints ?? []).slice(0, COURSE_HINT_LEVELS),
    })),
    ...record.unhappy.map((each) => ({
        caseId: each.id,
        kind: "unhappy" as const,
        hasReference: each.hasReference,
        hints: each.hints.slice(0, COURSE_HINT_LEVELS),
    })),
]

/** The ids of the cases that are unlocked: the first case, and every case whose predecessor in the order was ever green. */
export const unlockedIdsOf = (order: ReadonlyArray<CaseRef>, marks: ReadonlyArray<CaseMark>): ReadonlySet<string> => {
    const green = new Set(marks.filter((mark) => mark.everGreen).map((mark) => mark.caseId))
    const unlocked = new Set<string>()
    order.forEach((each, index) => {
        const before = order[index - 1]
        if (before === undefined || green.has(before.caseId)) unlocked.add(each.caseId)
    })
    return unlocked
}

/** One case a `case.result` upload reports: the named case or one its run covered before it. */
export interface UploadedCaseRun {
    readonly caseId: string
    readonly kind: CourseCaseKind
    readonly status: CaseResultEvent["status"]
}

/**
 * The cases one `case.result` reports, in the lab's order: every case of its `upTo` (the run of X covers X and every case before it),
 * the named case with the upload's own status. Null when `upTo` names a case the lab does not have, names one twice, or names one
 * after the named case: such an upload did not come from `case run`.
 */
export const caseRunsOfUpload = (
    order: ReadonlyArray<CaseRef>,
    event: Pick<CaseResultEvent, "caseId" | "kind" | "status" | "upTo">,
): ReadonlyArray<UploadedCaseRun> | null => {
    const indexOf = new Map(order.map((each, index) => [each.caseId, index]))
    const last = indexOf.get(event.caseId)
    if (last === undefined) return null
    const ids = event.upTo.map((entry) => entry.caseId)
    if (new Set(ids).size !== ids.length) return null
    if (ids.some((id) => (indexOf.get(id) ?? Number.POSITIVE_INFINITY) > last)) return null
    const statusOf = new Map(event.upTo.map((entry) => [entry.caseId, entry.status]))
    statusOf.set(event.caseId, event.status)
    return order
        .filter((each) => statusOf.has(each.caseId))
        .map((each) => ({ caseId: each.caseId, kind: each.kind, status: statusOf.get(each.caseId) ?? event.status }))
}

/**
 * The event id a covered case's run is stored under: a UUID derived from the upload's event id and the case, so a resend of the upload
 * maps to the same ids and changes nothing twice.
 */
export const caseRunEventIdOf = (eventId: string, caseId: string): string => {
    const hex = createHash("sha256").update(`${eventId}/${caseId}`).digest("hex")
    // Version 5 shape (name-based, SHA) with the RFC 4122 variant, so a uuid column and any uuid check take it.
    const variant = ((Number.parseInt(hex.slice(16, 17), 16) & 0x3) | 0x8).toString(16)
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`
}

/** What one case shows: locked, open before its first run, otherwise the outcome of its newest run. */
export const caseStatusOf = (unlocked: boolean, run: CaseRun | undefined): CourseCaseStatus => {
    if (!unlocked) return "locked"
    return run === undefined ? "open" : run.status
}

const lastRunViewOf = (run: CaseRun | undefined): CourseLastRunView | null =>
    run === undefined
        ? null
        : { ranAt: run.ranAt, durationMs: run.durationMs, learnerCommit: run.learnerCommit, failed: run.failed }

/**
 * Where the learner stands on every case: its status, whether it was ever green, the hints opened, the diff (only once green, and only
 * for a case with a reference rung), the reset (any case with a reference rung, happy ones the starter breaks included) and the newest run. The current case is the first unlocked case never green.
 */
export const casesViewOf = (
    order: ReadonlyArray<CaseRef>,
    marks: ReadonlyArray<CaseMark>,
    runs: ReadonlyArray<CaseRun>,
): CourseCasesView => {
    const unlocked = unlockedIdsOf(order, marks)
    const markOf = new Map(marks.map((mark) => [mark.caseId, mark]))
    const runOf = new Map(runs.map((run) => [run.caseId, run]))
    const cases: Array<CourseCaseStateView> = order.map((each) => {
        const mark = markOf.get(each.caseId)
        const everGreen = mark?.everGreen === true
        const open = unlocked.has(each.caseId)
        return {
            caseId: each.caseId,
            kind: each.kind,
            status: caseStatusOf(open, runOf.get(each.caseId)),
            everGreen,
            hintsOpened: mark?.hintsOpened ?? 0,
            diffAvailable: everGreen && each.hasReference,
            resetAvailable: each.hasReference,
            lastRun: lastRunViewOf(runOf.get(each.caseId)),
        }
    })
    const current = cases.find((each) => each.status !== "locked" && !each.everGreen)
    return { currentCaseId: current?.caseId ?? null, cases }
}

/** What opening hint level `level` of a case does, given the levels opened and the levels the case has. */
export type HintDecision = "open" | "already-open" | "out-of-order" | "missing"

/** A level opens only when the level below is open; an open level answers again unchanged; a level the case lacks is missing. */
export const hintDecisionOf = (opened: number, level: number, count: number): HintDecision => {
    if (!Number.isInteger(level) || level < 1 || level > Math.min(count, COURSE_HINT_LEVELS)) return "missing"
    if (level <= opened) return "already-open"
    return level === opened + 1 ? "open" : "out-of-order"
}

/** The text of a hint in the asked locale: the English text when the record has it, Vietnamese otherwise. */
export const hintTextOf = (
    hint: { readonly vi: string; readonly en?: string | undefined },
    locale: CourseLocale,
): string => (locale === "en" ? (hint.en ?? hint.vi) : hint.vi)

const textOf = (value: { readonly vi: string; readonly en?: string | undefined }): CourseText => ({
    vi: value.vi,
    en: value.en ?? null,
})

/** A text the record may leave out: null when it does. */
const optionalTextOf = (
    value: { readonly vi: string; readonly en?: string | undefined } | undefined,
): CourseText | null => (value === undefined ? null : textOf(value))

const chaosOf = (chaos: Readonly<Record<string, string | number | boolean>>): CourseCaseSpecView["chaos"] =>
    Object.entries(chaos).map(([key, value]) => ({ key, value: String(value) }))

/** The hint levels of a case: the text only for a level the learner opened, so a closed hint never leaves the server (conventions rule 4). */
const hintViewsOf = (hints: CaseRef["hints"], opened: number, locale: CourseLocale): ReadonlyArray<CourseHintView> =>
    hints.map((hint, index) => {
        const level = index + 1
        const unlocked = level <= opened
        return { level, text: unlocked ? hintTextOf(hint, locale) : null, unlocked }
    })

/** The focus of a case as the web reads it, or null when the record names none. */
const focusViewOf = (
    focus: { readonly file: string; readonly lines: ReadonlyArray<number> } | undefined,
): CourseFocusView | null => (focus === undefined ? null : { file: focus.file, lines: [...focus.lines] })

/** The before-and-after block a case of the record carries, its type. */
type RecordBeforeAfter = NonNullable<CourseLabRecord["happy"][number]["beforeAfter"]>

/**
 * True once a case may show how it is fixed: it was green once, or the learner opened every hint level it has (the last level is the
 * solution, "gợi ý → lời giải"). A case with no hints opens only by going green.
 */
export const caseRevealedOf = (everGreen: boolean, hintsOpened: number, hintCount: number): boolean =>
    everGreen || (hintCount > 0 && hintsOpened >= hintCount)

/**
 * The before-and-after block of a case as the web may read it, or null when the record has none. The "after" half, the fix and the idea
 * name the fix, so they stay on the server until the case is revealed (`caseRevealedOf`, the hint rule, conventions rule 4).
 */
export const beforeAfterViewOf = (value: RecordBeforeAfter | undefined, revealed: boolean): CourseBeforeAfterView | null =>
    value === undefined
        ? null
        : {
              before: { steps: [...value.before.steps], result: value.before.result, damage: value.before.damage },
              after: revealed ? { steps: [...value.after.steps], result: value.after.result, gain: value.after.gain } : null,
              fix: revealed ? (value.fix ?? null) : null,
              idea: revealed ? value.idea : null,
          }

/** The record's architecture, its type. */
type RecordArchitecture = NonNullable<CourseLabRecord["architecture"]>

/** An endpoint the record names, or null. */
const endpointViewOf = (
    value: { readonly method: string; readonly path: string } | null | undefined,
): CourseEndpointView | null =>
    value === null || value === undefined ? null : { method: value.method, path: value.path }

/**
 * The lines `from`..`to` (1-based, both included) of a file's text, or null when the text is unknown or the span falls outside it. The
 * text is the base rung, the file the learner downloads on day 1: no rung past it ever leaves the server through this door.
 */
const excerptTextOf = (text: string | undefined, from: number, to: number): string | null => {
    if (text === undefined || to < from) return null
    const lines = text.split(/\r?\n/u)
    if (from > lines.length) return null
    return lines.slice(from - 1, to).join("\n")
}

/** One learner file entry of the record, before it becomes a view. */
type LearnerEntry = {
    readonly path: string
    readonly role?: { readonly vi: string; readonly en?: string | undefined } | undefined
    readonly excerpt?: { readonly from: number; readonly to: number } | undefined
    readonly marks?: ReadonlyArray<{ readonly line: number; readonly request: number }> | undefined
}

/**
 * The learner files the Kiến trúc page shows, one card each: the record's `learner.files` when it lists them, else the one learner file
 * with the top-level excerpt and marks. The learner file falls back to the top-level excerpt and marks when its entry names none. The code
 * is cut from the base rung, which holds the record's `learnerFile` only, so another file of a multi-file lab has a null code.
 */
const learnerFilesViewOf = (
    record: CourseLabRecord,
    learner: RecordArchitecture["learner"],
): Array<CourseArchitectureFileView> => {
    const base = record.rungs?.[0]?.content
    const entries: ReadonlyArray<LearnerEntry> = learner.files ?? [{ path: record.learnerFile }]
    return entries.map((entry) => {
        const isMain = entry.path === record.learnerFile
        const span = entry.excerpt ?? (isMain ? learner.excerpt : undefined)
        const marks = entry.marks ?? (isMain ? learner.marks : [])
        return {
            path: entry.path,
            role: optionalTextOf(entry.role),
            excerpt:
                span === undefined
                    ? null
                    : { from: span.from, to: span.to, code: isMain ? excerptTextOf(base, span.from, span.to) : null },
            marks: marks.map((each) => ({ line: each.line, request: each.request })),
        }
    })
}

/**
 * The static Kiến trúc page as the web may read it (lessons.md §7): the business flow, the requests with their real endpoints (the
 * revert endpoint rides along, never drawn), the tables of each service's database in the stack's order, why the plain approach is not
 * enough and the learner files with their excerpts. Null for a record cut before the page existed.
 */
export const architectureViewOf = (record: CourseLabRecord): CourseArchitectureView | null => {
    const { architecture } = record
    if (architecture === undefined) return null
    const order = record.stack.services.map((each) => each.id)
    const tables = Object.entries(architecture.tables).sort(
        ([left], [right]) => order.indexOf(left) - order.indexOf(right),
    )
    return {
        flow: architecture.flow.map((step) => ({ text: textOf(step), icon: step.icon })),
        requests: [...architecture.requests]
            .sort((left, right) => left.n - right.n)
            .map((each) => ({
                n: each.n,
                from: each.from,
                to: each.to,
                method: each.method,
                path: each.path,
                does: textOf(each.does),
                undo: endpointViewOf(each.undo),
            })),
        tables: tables.map(([serviceId, names]) => ({ serviceId, tables: names })),
        why: textOf(architecture.why),
        files: learnerFilesViewOf(record, architecture.learner),
    }
}

/**
 * The audit as the web sees it (owner 2026-11-28): a stored fact passed as written, every absent part filled (no rank is null, no status is
 * `open`, a missing text is empty), on every page and for every learner; the app alone decides where it shows it (dev only).
 */
export const auditViewOf = (audit: NonNullable<CourseLabRecord["audit"]>): CourseAuditView => ({
    checked: audit.checked,
    reader: audit.reader,
    prerequisites: audit.prerequisites ?? [],
    pages: audit.pages.map((each) => ({ page: each.page, verdict: each.verdict, note: each.note })),
    findings: audit.findings.map((each) => ({
        id: each.id,
        page: each.page,
        kind: each.kind,
        quote: each.quote,
        why: each.why,
        fix: each.fix,
        rank: each.rank ?? null,
        status: each.status ?? "open",
    })),
    cases: (audit.cases ?? []).map((each) => ({
        id: each.id,
        kind: each.kind,
        title: each.title,
        now: {
            situation: each.now.situation ?? "",
            question: each.now.question ?? "",
            conditions: each.now.conditions ?? [],
            hints: each.now.hints ?? [],
        },
        expected: (each.expected ?? []).map((change) => ({ file: change.file, diff: change.diff, what: change.what })),
        thinking: {
            learns: each.thinking.learns,
            shift: each.thinking.shift,
            interview: each.thinking.interview,
            impact: each.thinking.impact,
            mechanical: each.thinking.mechanical,
            mechanicalWhy: each.thinking.mechanicalWhy ?? "",
        },
        guess: each.guess ?? "",
        verdict: each.verdict,
        note: each.note,
    })),
})

/**
 * The lab record as the web may see it. Hint texts are released only for the levels a learner opened, the chaos and invariants are
 * lists, and the grader shows only the dimensions of its matrix: nothing hidden or graded leaves early.
 */
export const lessonViewOf = (
    record: CourseLabRecord,
    version: string,
    marks: ReadonlyArray<CaseMark>,
    locale: CourseLocale,
): CourseLessonView => {
    const openedOf = new Map(marks.map((mark) => [mark.caseId, mark.hintsOpened]))
    const greenOnce = new Set(marks.filter((mark) => mark.everGreen).map((mark) => mark.caseId))
    // What retells or names a fix leaves the server only once the case is green (the hint rule, conventions rule 4): pages 5 and 6 read it after the work.
    const isNamed = record.unhappy.length > 0 && record.unhappy.every((each) => greenOnce.has(each.id))
    const happy: Array<CourseCaseSpecView> = record.happy.map((each) => ({
        id: each.id,
        title: { vi: each.title.vi, en: each.title.en },
        chaos: chaosOf(each.chaos),
        invariants: each.invariants,
        teaches: null,
        hints: hintViewsOf((each.hints ?? []).slice(0, COURSE_HINT_LEVELS), openedOf.get(each.id) ?? 0, locale),
        hasReference: each.hasReference === true && each.ref !== undefined,
        question: null,
        recap: null,
        focus: focusViewOf(each.focus),
        situation: optionalTextOf(each.situation),
        beforeAfter: beforeAfterViewOf(
            each.beforeAfter,
            caseRevealedOf(greenOnce.has(each.id), openedOf.get(each.id) ?? 0, Math.min((each.hints ?? []).length, COURSE_HINT_LEVELS)),
        ),
    }))
    const unhappy: Array<CourseCaseSpecView> = record.unhappy.map((each) => ({
        id: each.id,
        title: { vi: each.title.vi, en: each.title.en },
        chaos: chaosOf(each.chaos),
        invariants: each.invariants,
        teaches: each.teaches,
        hints: hintViewsOf(each.hints.slice(0, COURSE_HINT_LEVELS), openedOf.get(each.id) ?? 0, locale),
        hasReference: each.hasReference,
        question: optionalTextOf(each.question),
        recap:
            greenOnce.has(each.id) && each.recap !== undefined
                ? { did: textOf(each.recap.did), gain: textOf(each.recap.gain), en: each.recap.en }
                : null,
        focus: focusViewOf(each.focus),
        situation: optionalTextOf(each.situation),
        beforeAfter: beforeAfterViewOf(
            each.beforeAfter,
            caseRevealedOf(greenOnce.has(each.id), openedOf.get(each.id) ?? 0, Math.min(each.hints.length, COURSE_HINT_LEVELS)),
        ),
    }))
    return {
        lessonId: record.lessonId,
        version,
        lab: record.lab,
        concept: record.concept,
        requires: record.requires,
        allowedTerms: record.allowedTerms.map((term) => ({ id: term.id, term: term.term })),
        // A keyword that names the lesson's own concept (`named`) stays off the pages before the naming page (REF rule, essentials rule 9).
        terms: Object.entries(record.terms ?? {})
            .filter(([, note]) => isNamed || note.named !== true)
            .map(([term, note]) => ({ term, note: textOf(note) })),
        stack: {
            language: record.stack.language,
            runtime: record.stack.runtime,
            test: record.stack.test,
            host: record.stack.host ?? null,
            services: record.stack.services.map((each) => ({
                id: each.id,
                port: each.port,
                db: each.db ?? null,
                uses: each.uses,
                role: textOf(each.role),
                icon: each.icon ?? null,
            })),
            deps: record.stack.deps.map((each) => ({
                id: each.id,
                image: each.image,
                role: textOf(each.role),
                icon: each.icon ?? null,
            })),
        },
        learnerFile: record.learnerFile,
        invariants: Object.entries(record.invariants).map(([id, text]) => ({ id, vi: text.vi, en: text.en })),
        happy,
        unhappy,
        chaos: (record.chaos ?? []).map((each) => ({ id: each.id, label: { vi: each.label.vi, en: each.label.en } })),
        grader: { steps: record.grader.matrix.steps, faults: record.grader.matrix.faults },
        nestjs: (record.framework?.nestjs.map ?? []).map((entry) => ({ from: entry.from, to: entry.to })),
        hook:
            record.hook === undefined
                ? null
                : {
                      title: optionalTextOf(record.hook.title),
                      when: optionalTextOf(record.hook.when),
                      asker: optionalTextOf(record.hook.asker),
                      scene: textOf(record.hook.scene),
                      question: textOf(record.hook.question),
                      stuck: textOf(record.hook.stuck),
                      pushback: optionalTextOf(record.hook.pushback),
                      promise: textOf(record.hook.promise),
                  },
        outcomes: (record.outcomes ?? []).map((each) => ({ can: textOf(each.can), caseId: each.case ?? null })),
        recall:
            record.recall === undefined || !isNamed
                ? null
                : { title: textOf(record.recall.title), paragraphs: record.recall.paragraphs.map(textOf) },
        closing:
            record.closing === undefined || !isNamed
                ? null
                : { beyond: textOf(record.closing.beyond), answer: textOf(record.closing.answer) },
        production: (isNamed ? (record.production ?? []) : []).map((repo) => ({
            repo: repo.repo,
            lang: repo.lang,
            checked: repo.checked ?? null,
            files: repo.files.map((file) => ({ path: file.path, url: file.url })),
            shows: Object.entries(repo.shows).map(([caseId, value]) => ({ caseId, value })),
            note: textOf(repo.note),
        })),
        architecture: architectureViewOf(record),
        // The record's own reference wins (owner 2026-11-28); a record cut before it falls back to the pinned list in code.
        reference:
            record.reference === undefined
                ? referenceViewOf(
                      record.lessonId,
                      record.unhappy.map((each) => each.id),
                      isNamed,
                  )
                : recordReferenceViewOf(
                      record.reference,
                      record.lessonId,
                      record.unhappy.map((each) => each.id),
                      isNamed,
                  ),
        // The audit is a stored fact, passed as written on every page (the app shows it on dev only); absent means not audited yet.
        audit: record.audit === undefined ? null : auditViewOf(record.audit),
    }
}
