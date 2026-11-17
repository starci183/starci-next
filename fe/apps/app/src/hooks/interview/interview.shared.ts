import type { MarkdownBlock, ReportTone } from "@starci-next/ui"
import type { InterviewSessionRead } from "@/hooks/swr"
import { ApiFailure } from "@/modules/failure"
import { parseMarkdown } from "@/modules/markdown"
import { lessonPath } from "@/modules/routes"

/** Why an interview step did not go through, as the screen words it. Each comes from a stable error code, never from a status. */
export type InterviewIssue =
    | "none"
    | "premiumRequired"
    | "sessionActive"
    | "poolEmpty"
    | "setupInvalid"
    | "aiLimit"
    | "noAnswer"
    | "unconfigured"
    | "unavailable"
    | "invalid"
    | "conflict"
    | "other"

/** The stable codes the interview doors answer, by the issue each one is. */
const ISSUE_OF_CODE: Readonly<Record<string, InterviewIssue>> = {
    INTERVIEW_PREMIUM_REQUIRED: "premiumRequired",
    INTERVIEW_SESSION_ACTIVE: "sessionActive",
    INTERVIEW_POOL_EMPTY: "poolEmpty",
    INTERVIEW_SETUP_INVALID: "setupInvalid",
    INTERVIEW_AI_LIMIT_REACHED: "aiLimit",
    INTERVIEW_NO_ANSWER: "noAnswer",
    INTERVIEW_COACH_UNCONFIGURED: "unconfigured",
    INTERVIEW_COACH_UNAVAILABLE: "unavailable",
    INTERVIEW_COACH_INVALID: "invalid",
    INTERVIEW_REVISION_CONFLICT: "conflict",
}

/** The issue a stable error code names; `other` for a code the screen has no words for, `none` for no code at all. */
export const interviewIssueOfCode = (code: string | null | undefined): InterviewIssue =>
    code === null || code === undefined ? "none" : (ISSUE_OF_CODE[code] ?? "other")

/** The issue a rejected call names, by the stable code it carries. */
export const interviewIssueOf = (error: unknown): InterviewIssue =>
    error instanceof ApiFailure ? interviewIssueOfCode(error.code) : "other"

/** The tone of a verdict badge: pass is a success, borderline a caution, anything else a danger. */
export const verdictToneOf = (verdict: string | null | undefined): "success" | "warning" | "danger" | "muted" => {
    if (verdict === "pass") return "success"
    if (verdict === "borderline") return "warning"
    return verdict === "fail" ? "danger" : "muted"
}

/** The tone of a STAR level from 0 to 4. */
export const levelToneOf = (level: number): "success" | "warning" | "muted" => {
    if (level >= 3) return "success"
    return level >= 1 ? "warning" : "muted"
}

/** The tiers the setup offers, in order. */
export const INTERVIEW_TIERS = ["junior", "middle", "senior"] as const

/** A tier the setup offers. */
export type InterviewTierId = (typeof INTERVIEW_TIERS)[number]

/** The tier an id names, or undefined for anything else. */
export const tierOf = (id: string): InterviewTierId | undefined => INTERVIEW_TIERS.find((each) => each === id)

/** The code language that means "as each question has it". */
export const ANY_LANGUAGE = "any"

/** The issues after which the answer is saved and only the interviewer's step is missing. */
const SAVED_ISSUES: ReadonlySet<InterviewIssue> = new Set<InterviewIssue>([
    "aiLimit",
    "unconfigured",
    "unavailable",
    "invalid",
])

/** Whether an issue means the transcript is saved but the interviewer step is missing. */
export const isSavedIssue = (issue: InterviewIssue): boolean => SAVED_ISSUES.has(issue)

/** One thing to study again, with the lessons it links to. */
export type InterviewGap = {
    readonly id: string
    readonly text: string
    readonly links: ReadonlyArray<{ readonly id: string; readonly label: string; readonly href: string }>
}

/** The things to study again, each with the Essentials lessons of its bank. */
export const interviewGapsOf = (
    session: InterviewSessionRead,
    card: NonNullable<InterviewSessionRead["scorecard"]>,
): ReadonlyArray<InterviewGap> =>
    card.gaps.map((gap, index) => {
        const lessons = gap.moduleRefs.flatMap(
            (moduleRef) => session.lessons.find((each) => each.moduleRef === moduleRef)?.lessons ?? [],
        )
        const unique = lessons.filter(
            (lesson, at) => lessons.findIndex((each) => each.lessonId === lesson.lessonId) === at,
        )
        return {
            id: `g${index}`,
            text: gap.text,
            links: unique.map((lesson) => ({
                id: lesson.lessonId,
                label: lesson.title,
                href: lessonPath(lesson.topic, lesson.lessonId),
            })),
        }
    })

/** What a session says about the open question. */
export type InterviewFacts = {
    readonly turns: InterviewSessionRead["turns"]
    readonly position: number
    readonly material: ReadonlyArray<MarkdownBlock>
    readonly answersHere: number
    readonly needsReply: boolean
    readonly isFinished: boolean
    readonly isActive: boolean
    readonly hintsLeft: number
    readonly answeredCount: number
}

/** What a session says about the open question, read from its turns so a reload shows the same screen. */
export const interviewFactsOf = (data: InterviewSessionRead | undefined): InterviewFacts => {
    const turns = data?.turns ?? []
    const position = data?.position ?? 0
    const last = turns.at(-1)
    const open = data?.questions.find((question) => question.position === position)
    const material = [open?.givenCode, open?.diagram].filter((part): part is string => typeof part === "string")
    const hintsUsed = turns.filter((turn) => turn.kind === "hint" && turn.position === position).length
    return {
        turns,
        position,
        material: material.length === 0 ? [] : parseMarkdown(material.join("\n\n")),
        answersHere: turns.filter((turn) => turn.role === "candidate" && turn.position === position).length,
        needsReply: data?.status === "active" && last?.role === "candidate" && last.kind === "answer",
        isFinished: last?.kind === "done",
        isActive: data?.status === "active",
        hintsLeft: Math.max(0, (open?.hintCount ?? 0) - hintsUsed),
        answeredCount: turns.filter((turn) => turn.kind === "answer").length,
    }
}

/** The names of the code languages the banks carry; any other id is shown with a capital letter. */
const LANGUAGE_NAMES: Readonly<Record<string, string>> = {
    typescript: "TypeScript",
    javascript: "JavaScript",
    csharp: "C#",
    go: "Go",
    java: "Java",
    python: "Python",
    bash: "Bash",
    yaml: "YAML",
    hcl: "HCL",
}

/** The name of a code language as a learner reads it. */
export const languageNameOf = (id: string): string =>
    LANGUAGE_NAMES[id] ?? `${id.charAt(0).toUpperCase()}${id.slice(1)}`

/** The tone of a question score: a missed critical point is a danger whatever the score. */
export const scoreToneOf = (question: ScoredQuestion): ReportTone => {
    if (question.skipped) return "muted"
    if (question.criticalMissed.length > 0) return "danger"
    if (question.score >= 70) return "success"
    return question.score >= 50 ? "warning" : "danger"
}

type ScoredQuestion = NonNullable<InterviewSessionRead["scorecard"]>["questions"][number]

/** Where a question stands for the learner: answered, skipped, the open one, or still to come. */
export const interviewQuestionStateOf = (
    session: InterviewSessionRead,
    question: InterviewSessionRead["questions"][number],
): "complete" | "current" | "paused" | "upcoming" => {
    const mine = session.turns.filter((turn) => turn.role === "candidate" && turn.position === question.position)
    if (mine.some((turn) => turn.kind === "answer")) return "complete"
    if (session.status === "active" && question.position === session.position) return "current"
    return mine.length > 0 ? "paused" : "upcoming"
}

/** The notice a session that has no scorecard shows in the report: one state for each status. */
export type InterviewNoticeKind = "grading" | "failed" | "notReady" | "abandoned"

/** The report state of a session by its status: grading (or submitted), failed (or graded without a scorecard), abandoned, not submitted. */
export const interviewNoticeKindOf = (status: string): InterviewNoticeKind => {
    switch (status) {
        case "grading":
        case "submitted":
            return "grading"
        case "failed":
        case "graded":
            return "failed"
        case "abandoned":
            return "abandoned"
        default:
            return "notReady"
    }
}
