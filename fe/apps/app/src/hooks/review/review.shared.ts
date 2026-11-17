import { parseMarkdown } from "@/modules/markdown"
import { ApiFailure, isForbidden } from "@/modules/failure"
import type {
    ReviewAnswerPart,
    ReviewGrade,
    ReviewIntervalsView,
    ReviewSessionLabels,
    ReviewTodayLabels,
} from "@/modules/types"
import type { ReviewTranslator, ReviewWords } from "./useReviewWords"

/** The smallest and largest daily goal the door accepts. */
export const REVIEW_GOAL_BOUNDS = { min: 5, max: 50 } as const

/** The four grades in the order of the buttons, with their keyboard shortcut. */
export const REVIEW_GRADE_ORDER: ReadonlyArray<{ readonly grade: ReviewGrade; readonly key: string }> = [
    { grade: "AGAIN", key: "1" },
    { grade: "HARD", key: "2" },
    { grade: "GOOD", key: "3" },
    { grade: "EASY", key: "4" },
]

/** The stable codes of the premium refusals of the review doors and of the lesson doors it reuses. */
const PREMIUM_CODES: ReadonlySet<string> = new Set(["REVIEW_PREMIUM_REQUIRED", "LESSON_PREMIUM_REQUIRED"])

/** The stable codes that say the written answer cannot be handled yet: the coach or the attempt door is not available. */
const SOON_CODES: ReadonlySet<string> = new Set([
    "ATTEMPT_COACH_UNCONFIGURED",
    "ATTEMPT_COACH_UNAVAILABLE",
    "ATTEMPT_ACTIVITY_UNSUPPORTED",
    "ATTEMPT_COACH_LIMIT_REACHED",
])

/** The stable code of a refusal, or undefined for any other error. */
const codeOf = (error: unknown): string | undefined => (error instanceof ApiFailure ? error.code : undefined)

/** True when the item is behind Premium for this reader. It branches on the stable code and the kind, never on the status. */
export const isReviewLocked = (error: unknown): boolean => PREMIUM_CODES.has(codeOf(error) ?? "") || isForbidden(error)

/** True when answering a written question is not available yet. */
export const isReviewAnswerSoon = (error: unknown): boolean => SOON_CODES.has(codeOf(error) ?? "")

/** True when the written answer was empty or too long. */
export const isReviewAnswerInvalid = (error: unknown): boolean => codeOf(error) === "REVIEW_ANSWER_INVALID"

/** True when the item was graded with another revision meanwhile: read it again. */
export const isReviewRevisionConflict = (error: unknown): boolean => codeOf(error) === "REVIEW_REVISION_CONFLICT"

/** The mark of a section header in an answer: a `:::muted` line, the title, then a `:::` line. */
const SECTION_MARK = ":::muted"

/** True when the line at `index` opens a headed section (the mark, a title line and the closing `:::`). */
const isHeaderAt = (lines: ReadonlyArray<string>, index: number): boolean =>
    (lines[index] ?? "").trim() === SECTION_MARK && (lines[index + 2] ?? "").trim() === ":::"

/**
 * Splits an answer into its muted-header sections (the direct answer, the mechanism, the common pitfall, the deeper question) and a
 * possible lead, then reads each body as markdown.
 */
export const answerPartsOf = (markdown: string): ReadonlyArray<ReviewAnswerPart> => {
    const lines = markdown.replaceAll("\r\n", "\n").split("\n")
    const sections: Array<{ title: string | undefined; lines: Array<string> }> = [{ title: undefined, lines: [] }]
    for (let index = 0; index < lines.length; index += 1) {
        if (isHeaderAt(lines, index)) {
            sections.push({ title: (lines[index + 1] ?? "").trim(), lines: [] })
            index += 2
        } else {
            sections.at(-1)?.lines.push(lines[index] ?? "")
        }
    }
    return sections
        .map((section) => ({ title: section.title, body: section.lines.join("\n").trim() }))
        .filter((section) => section.body !== "" || section.title !== undefined)
        .map((section, index) => ({ id: `${index}`, title: section.title, blocks: parseMarkdown(section.body) }))
}

/** The days until the next review of a grade. */
export const intervalOf = (intervals: ReviewIntervalsView, grade: ReviewGrade): number => {
    switch (grade) {
        case "AGAIN":
            return intervals.again
        case "HARD":
            return intervals.hard
        case "GOOD":
            return intervals.good
        case "EASY":
            return intervals.easy
    }
}

/** True when the focus is in a field the shortcuts must leave alone. */
export const isTypingTarget = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) return false
    return target.tagName === "TEXTAREA" || target.tagName === "INPUT" || target.isContentEditable
}

/** The label of a course folder (`0-fullstack-mastery`) as words. */
export const courseLabelOf = (course: string): string => course.replace(/^\d+-/, "").replaceAll("-", " ")

/** The fixed words of today's screen. */
export const todayLabelsOf = (t: ReviewTranslator): ReviewTodayLabels => ({
    pageTitle: t("today.pageTitle"),
    intro: t("today.intro"),
    goalLabel: t("today.goalLabel"),
    dueTitle: t("today.dueTitle"),
    start: t("today.start"),
    startNew: t("today.startNew"),
    decks: t("today.decks"),
    emptyTitle: t("today.emptyTitle"),
    emptyBody: t("today.emptyBody"),
    emptyEssentials: t("today.emptyEssentials"),
    doneTitle: t("today.doneTitle"),
    lockedTitle: t("today.lockedTitle"),
    upsell: t("today.upsell"),
    upsellNote: t("today.upsellNote"),
    queueTitle: t("today.queueTitle"),
    sourcesTitle: t("today.sourcesTitle"),
    streakNote: t("today.streakNote"),
    hubLink: t("today.hubLink"),
})

/** The fixed words of the session. */
export const sessionLabelsOf = (words: ReviewWords, progressText: string): ReviewSessionLabels => {
    const t = words.t
    return {
        pageTitle: t("session.pageTitle"),
        progressLabel: t("session.progressLabel"),
        progressText,
        noteLabel: t("session.noteLabel"),
        notePlaceholder: t("session.notePlaceholder"),
        retrievalLabel: t("session.retrievalLabel"),
        retrievalPlaceholder: t("session.retrievalPlaceholder"),
        flip: t("session.flip"),
        revealRetrieval: t("session.revealRetrieval"),
        retrievalSoon: t("session.retrievalSoon"),
        retrievalSoonNote: t("session.retrievalSoonNote"),
        skip: t("session.skip"),
        clozeTitle: t("session.clozeTitle"),
        clozeCorrect: t("session.clozeCorrect"),
        clozeWrong: t("session.clozeWrong"),
        rateQuestion: t("session.rateQuestion"),
        rateGroup: t("session.rateGroup"),
        shortcuts: t("session.shortcuts"),
        saveFailedTitle: t("session.saveFailedTitle"),
        saveFailedBody: t("session.saveFailedBody"),
        retry: t("session.retry"),
        lockedTitle: t("session.lockedTitle"),
        lockedBody: t("session.lockedBody"),
        upsell: t("session.upsell"),
        answerError: t("session.answerError"),
        diagram: t("session.diagram"),
        diagramError: t("session.diagramError"),
        summaryTitle: t("session.summaryTitle"),
        summaryReviewed: t("session.summaryReviewed"),
        summaryRecall: t("session.summaryRecall"),
        summaryGoal: t("session.summaryGoal"),
        summaryAllDone: t("session.summaryAllDone"),
        summaryBack: t("session.summaryBack"),
        summaryHub: t("session.summaryHub"),
        emptyBack: t("session.emptyBack"),
    }
}
