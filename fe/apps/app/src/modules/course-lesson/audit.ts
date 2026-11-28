import type {
    CourseAuditCaseView,
    CourseAuditFindingView,
    CourseAuditImpact,
    CourseAuditPathView,
    CourseAuditRailView,
    CourseAuditVerdict,
    CourseAuditView,
} from "@starci-next/ui"
import type { CourseLessonRecord } from "./lesson"
import { chaosWordsOf } from "./views"
import type { CourseAuditWords } from "./words"

/**
 * The dev-only Audit tab's views (owner 2026-11-28), mapped from the record's stored audit as written. The audit documents the lesson AS IT
 * IS NOW: the verdict of every page, every case read in full (its text, the changes the reference solution expects, what they do to the
 * learner's thinking) and the findings. Nothing is computed beyond mapping the record's codes onto words and counting for the rail.
 */

/** The audit as the record carries it. */
type CourseAuditRecord = NonNullable<CourseLessonRecord["audit"]>

/** One finding as the record carries it. */
type CourseAuditFindingRecord = CourseAuditRecord["findings"][number]

/** One case as the record carries it. */
type CourseAuditCaseRecord = CourseAuditRecord["cases"][number]

/** The verdict of the record's code (`de`, `vap`, `mat-dau`) and its words; a code the app does not know reads as stumbled. */
const verdictOf = (
    code: string,
    words: CourseAuditWords,
): { readonly verdict: CourseAuditVerdict; readonly label: string } => {
    if (code === "de") return { verdict: "easy", label: words.verdict.de }
    if (code === "mat-dau") return { verdict: "lost", label: words.verdict.matDau }
    return { verdict: "stumble", label: words.verdict.vap }
}

/** The impact of the record's code; a code the app does not know reads as low. */
const impactOf = (code: string): CourseAuditImpact => (code === "high" || code === "medium" ? code : "low")

/** The status of the record's code; a code the app does not know reads as open. */
const statusOf = (code: string): CourseAuditFindingView["status"] =>
    code === "fixed" || code === "deferred" ? code : "open"

/** The Shiki language of each file extension the labs use. */
const LANGUAGES: Readonly<Record<string, string>> = {
    ts: "ts",
    tsx: "tsx",
    js: "js",
    mjs: "js",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    go: "go",
    py: "python",
    sql: "sql",
    md: "md",
}

/** The Shiki language of a file by its extension (`checkout.ts` gives `ts`); empty for a file Shiki is not asked to colour. */
export const languageOf = (file: string): string => {
    const path = file.split(/[#?]/u)[0] ?? ""
    const name = path.split("/").pop() ?? ""
    const extension = name.includes(".") ? (name.split(".").pop() ?? "").toLowerCase() : ""
    return LANGUAGES[extension] ?? ""
}

/** One finding as the tab draws it, its page named by the tabs' own label. */
const findingViewOf = (
    finding: CourseAuditFindingRecord,
    words: CourseAuditWords,
    pageLabels: Readonly<Record<string, string>>,
): CourseAuditFindingView => {
    const status = statusOf(finding.status)
    const isLint = finding.kind === "lint"
    return {
        id: finding.id,
        quote: finding.quote,
        why: finding.why,
        fix: finding.fix,
        kind: isLint ? "lint" : "edit",
        kindLabel: isLint ? words.kind.lint : words.kind.edit,
        status,
        statusLabel: words.status[status],
        pageLabel: pageLabels[finding.page] ?? finding.page,
    }
}

/** The cautions of a case the owner must see: a rote fix (with why) and an assumption the audit did not check. */
const warningsOf = (item: CourseAuditCaseRecord, words: CourseAuditWords): CourseAuditCaseView["warnings"] => [
    ...(item.thinking.mechanical
        ? [
              {
                  id: "mechanical",
                  title: words.mechanicalTitle,
                  text: item.thinking.mechanicalWhy === "" ? words.mechanicalText : item.thinking.mechanicalWhy,
              },
          ]
        : []),
    ...(item.guess === "" ? [] : [{ id: "guess", title: words.guessTitle, text: item.guess }]),
]

/** One case as the tab draws it: its text now, the expected changes, its thinking, the impact and the cautions. */
const caseViewOf = (item: CourseAuditCaseRecord, words: CourseAuditWords): CourseAuditCaseView => {
    const title = `${item.id} · ${item.title}`
    const verdict = verdictOf(item.verdict, words)
    const impact = impactOf(item.thinking.impact)
    return {
        id: item.id,
        title,
        kindLabel: item.kind === "happy" ? words.caseKind.happy : words.caseKind.unhappy,
        verdict: { id: item.id, title, verdict: verdict.verdict, verdictLabel: verdict.label, note: item.note },
        situation: item.now.situation,
        question: item.now.question,
        conditions: item.now.conditions,
        hints: item.now.hints,
        expected: item.expected.map((change, index) => ({
            id: `${item.id}-${String(index)}`,
            file: change.file,
            language: languageOf(change.file),
            diff: change.diff,
            what: change.what,
        })),
        learns: item.thinking.learns,
        shift: item.thinking.shift,
        interview: item.thinking.interview,
        impact,
        impactLabel: words.impact[impact],
        warnings: warningsOf(item, words),
    }
}

/** The first sentence of a text (up to its first `.`, `!` or `?` followed by a space), or the whole text when it has one sentence. */
const firstSentenceOf = (text: string): string => {
    const found = /^.*?[.!?](?=\s)/su.exec(text.trim())
    return found === null ? text.trim() : found[0]
}

/**
 * The fault a case runs under, for the paths table: the lesson's chaos switches of the case in words (the lab's own labels, joined by
 * ` · `), else the first sentence of the situation the audit read; a happy case usually has no switch, so it reads as its situation.
 */
const faultOf = (lesson: CourseLessonRecord, item: CourseAuditCaseRecord, locale: string): string => {
    const spec = [...lesson.happy, ...lesson.unhappy].find((each) => each.id === item.id)
    const chaos = (spec?.chaos ?? []).map((each) => chaosWordsOf(lesson, each.key, each.value, locale))
    return chaos.length > 0 ? chaos.join(" · ") : firstSentenceOf(item.now.situation)
}

/**
 * The rows of the paths table: happy cases first, then unhappy ones, each in the order the audit lists them (the lesson's order). What a
 * case proves is the audit's `learns`: the before-and-after `idea` is read by its own query and only for a revealed case, so the dev-only
 * tab, which must read every case, takes the audit's words.
 */
const pathsOf = (
    lesson: CourseLessonRecord,
    cases: ReadonlyArray<CourseAuditCaseRecord>,
    words: CourseAuditWords,
    locale: string,
): ReadonlyArray<CourseAuditPathView> =>
    [...cases.filter((each) => each.kind === "happy"), ...cases.filter((each) => each.kind !== "happy")].map(
        (item, index) => {
            const kind = item.kind === "happy" ? "happy" : "unhappy"
            const impact = impactOf(item.thinking.impact)
            return {
                id: item.id,
                number: index + 1,
                title: `${item.id} · ${item.title}`,
                kind,
                kindLabel: words.pathKind[kind],
                fault: faultOf(lesson, item, locale),
                proves: item.thinking.learns,
                shift: item.thinking.shift,
                impact,
                impactLabel: words.pathImpact[impact],
                isMechanical: item.thinking.mechanical,
            }
        },
    )

/** The view of a lesson with no audit: the tab draws it as "Bài này chưa được audit". */
export const EMPTY_AUDIT: CourseAuditView = { isAudited: false, paths: [], pages: [], cases: [], top: [], groups: [] }

/**
 * The main column of the Audit tab: one verdict line per page, every case, the ranked findings (rank 1 first) and every finding grouped
 * by page in the order of the tabs (a page the app does not know comes last). A record with no audit gives {@link EMPTY_AUDIT}.
 */
export const auditViewOf = (
    lesson: CourseLessonRecord,
    words: CourseAuditWords,
    pageLabels: Readonly<Record<string, string>>,
    pageOrder: ReadonlyArray<string>,
    locale: string,
): CourseAuditView => {
    const audit = lesson.audit ?? null
    if (audit === null) return EMPTY_AUDIT
    const findingOf = (finding: CourseAuditFindingRecord): CourseAuditFindingView =>
        findingViewOf(finding, words, pageLabels)
    const ranked = audit.findings
        .filter((each) => each.rank !== null)
        .sort((left, right) => (left.rank ?? 0) - (right.rank ?? 0))
    const pages = [...new Set([...pageOrder, ...audit.findings.map((each) => each.page)])]
    return {
        isAudited: true,
        paths: pathsOf(lesson, audit.cases, words, locale),
        pages: audit.pages.map((each) => {
            const verdict = verdictOf(each.verdict, words)
            return {
                id: each.page,
                title: pageLabels[each.page] ?? each.page,
                verdict: verdict.verdict,
                verdictLabel: verdict.label,
                note: each.note,
            }
        }),
        cases: audit.cases.map((each) => caseViewOf(each, words)),
        top: ranked.map(findingOf),
        groups: pages
            .map((page) => ({
                id: page,
                title: pageLabels[page] ?? page,
                findings: audit.findings.filter((each) => each.page === page).map(findingOf),
            }))
            .filter((group) => group.findings.length > 0),
    }
}

/**
 * The rail of the Audit tab: the counts read off the stored audit (findings open and fixed, lint and biên tập, cases by impact, rote
 * cases), the day it ran, the reader it played and what that reader must know first. Undefined when the record has no audit.
 */
export const auditRailOf = (lesson: CourseLessonRecord, words: CourseAuditWords): CourseAuditRailView | undefined => {
    const audit = lesson.audit ?? null
    if (audit === null) return undefined
    const { rail } = words
    const findings = (keep: (each: CourseAuditFindingRecord) => boolean): string =>
        String(audit.findings.filter(keep).length)
    const cases = (keep: (each: CourseAuditCaseRecord) => boolean): string => String(audit.cases.filter(keep).length)
    return {
        title: rail.title,
        facts: [
            { id: "open", label: rail.findingsOpen, value: findings((each) => statusOf(each.status) === "open") },
            { id: "fixed", label: rail.findingsFixed, value: findings((each) => each.status === "fixed") },
            { id: "lint", label: rail.lint, value: findings((each) => each.kind === "lint") },
            { id: "edit", label: rail.edit, value: findings((each) => each.kind !== "lint") },
            { id: "high", label: rail.casesHigh, value: cases((each) => impactOf(each.thinking.impact) === "high") },
            {
                id: "medium",
                label: rail.casesMedium,
                value: cases((each) => impactOf(each.thinking.impact) === "medium"),
            },
            { id: "low", label: rail.casesLow, value: cases((each) => impactOf(each.thinking.impact) === "low") },
            { id: "mechanical", label: rail.mechanical, value: cases((each) => each.thinking.mechanical) },
            { id: "checked", label: rail.checked, value: audit.checked },
        ],
        readerTitle: rail.readerTitle,
        reader: audit.reader,
        prerequisitesTitle: rail.prerequisitesTitle,
        prerequisites: audit.prerequisites,
    }
}
