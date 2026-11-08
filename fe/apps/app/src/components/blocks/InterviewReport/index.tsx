"use client"

import { useTranslations } from "next-intl"
import type { ReportItem, ReportQuestion } from "@starci-next/ui"
import {
    interviewGapsOf,
    scoreToneOf,
    levelToneOf,
    useInterviewReport,
    verdictToneOf,
    type InterviewIssue,
    interviewNoticeKindOf,
} from "@/hooks/interview"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import type { InterviewSessionRead } from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import { APP_ROUTES, interviewRoomPath } from "@/modules/routes"
import {
    INTERVIEW_REPORT_PLACEHOLDER,
    InterviewReportBase,
    type InterviewReportLabels,
    type InterviewReportView,
    type ReportPillarView,
} from "./component"

/** What the route hands the report block: the session in the address. */
type InterviewReportProps = { readonly sessionId: string }

type Translate = ReturnType<typeof useTranslations>
type Scorecard = NonNullable<InterviewSessionRead["scorecard"]>
type ScoredQuestion = Scorecard["questions"][number]

/** The words of a refusal of the regrade; empty for none. */
const issueWordsOf = (t: Translate, issue: InterviewIssue): string => {
    switch (issue) {
        case "none":
            return ""
        case "aiLimit":
            return t("report.errors.aiLimit")
        case "unconfigured":
            return t("report.errors.unconfigured")
        case "noAnswer":
        case "premiumRequired":
        case "sessionActive":
        case "poolEmpty":
        case "setupInvalid":
        case "unavailable":
        case "invalid":
        case "conflict":
        case "other":
            return t("report.errors.other")
    }
}

/** One pillar of the score; a pillar with no graded question says so. */
const pillarOf = (t: Translate, label: string, score: number | null, verdict: string | null): ReportPillarView =>
    score === null || verdict === null
        ? { label, score: "–", verdict: t("report.pillarNone"), tone: "muted" }
        : { label, score: String(score), verdict: t(`report.verdict.${verdict}`), tone: verdictToneOf(verdict) }

/** The checklist items and the STAR dimensions of a question, each with the learner's own words as evidence. */
const itemsOf = (t: Translate, question: ScoredQuestion): ReadonlyArray<ReportItem> => [
    ...question.checklist.map((item, index) => ({
        id: `c${index}`,
        title: item.text,
        badge: item.hit ? t("report.hit") : t("report.miss"),
        tone: item.hit ? ("success" as const) : ("muted" as const),
        critical: item.critical ? t("report.critical") : "",
        quoteLabel: t("report.evidence"),
        quote: item.evidenceQuote,
    })),
    ...question.dimensions.map((item) => ({
        id: `d${item.key}`,
        title: [t(`report.attr.${item.key}`), item.text].join(": "),
        badge: t(`report.levels.${item.level}`),
        tone: levelToneOf(item.level),
        critical: "",
        quoteLabel: t("report.evidence"),
        quote: item.evidenceQuote,
    })),
]

/** The lines under a question about hints and what was missed. */
const linesOf = (t: Translate, question: ScoredQuestion): ReadonlyArray<string> => [
    ...(question.hintsUsed > 0
        ? [t("report.hintsUsed", { count: question.hintsUsed, penalty: question.hintPenalty })]
        : []),
    ...(question.criticalMissed.length > 0 ? [t("report.criticalMissed")] : []),
    ...(question.ownershipWeak ? [t("report.ownershipWeak")] : []),
]

const questionOf = (t: Translate, session: InterviewSessionRead, question: ScoredQuestion): ReportQuestion => ({
    id: `q${question.position}`,
    title: t("report.questionTitle", { n: question.position + 1 }),
    prompt: session.questions.find((each) => each.position === question.position)?.prompt ?? "",
    scoreLine: t("report.score", { score: question.score }),
    tone: scoreToneOf(question),
    skipped: question.skipped ? t("report.skipped") : "",
    items: itemsOf(t, question),
    lines: linesOf(t, question),
    note: question.note,
    ideal: question.idealAnswer,
})

const deltaOf = (t: Translate, previous: number | null, score: number): string =>
    previous === null ? "" : t("report.delta", { delta: `${score >= previous ? "+" : ""}${score - previous}` })

const gapFieldsOf = (t: Translate, session: InterviewSessionRead, card: Scorecard) => {
    const gaps = interviewGapsOf(session, card)
    const loose = gaps.filter((gap) => gap.links.length === 0)
    return {
        gaps: gaps.filter((gap) => gap.links.length > 0),
        looseGaps: loose.length === 0 ? "" : t("report.looseGaps", { items: loose.map((gap) => gap.text).join("; ") }),
        reviewLine: gaps.length === 0 ? "" : t("report.reviewGaps", { count: gaps.length }),
    }
}

/** The graded report: the score, the pillars apart, the bars, the questions, what went well and what to study again. */
const readyViewOf = (t: Translate, session: InterviewSessionRead, card: Scorecard): InterviewReportView => ({
    kind: "ready",
    overall: String(card.overallScore),
    verdict: t(`report.verdict.${card.verdict}`),
    tone: verdictToneOf(card.verdict),
    pillars: [
        pillarOf(t, t("report.technical"), card.technicalScore, card.technicalVerdict),
        pillarOf(t, t("report.behavioral"), card.behavioralScore, card.behavioralVerdict),
    ],
    fallback: session.gradedBy?.usedFallback === true ? t("report.fallback") : "",
    attributes: card.attributes.map((each) => ({
        id: each.key,
        label: t(`report.attr.${each.key}`),
        score: each.score,
    })),
    questions: card.questions.map((question) => questionOf(t, session, question)),
    strengths: card.strengths,
    ...gapFieldsOf(t, session, card),
    delta: deltaOf(t, session.previousScore, card.overallScore),
})

/** The report as it is drawn: graded, or the notice its status calls for. */
const viewOf = (t: Translate, session: InterviewSessionRead): InterviewReportView => {
    const card = session.scorecard
    if (session.status === "graded" && card !== null) return readyViewOf(t, session, card)
    return { kind: interviewNoticeKindOf(session.status) }
}

/** The fixed words of the report. */
const labelsOf = (t: Translate): InterviewReportLabels => ({
    title: t("reportTitle"),
    overall: t("report.overall"),
    outOf: t("report.outOf"),
    attributesTitle: t("report.attributesTitle"),
    strengthsTitle: t("report.strengthsTitle"),
    gapsTitle: t("report.gapsTitle"),
    gapsEmpty: t("report.gapsEmpty"),
    studyAgain: t("report.studyAgain"),
    breadcrumb: t("report.breadcrumb"),
    stronger: t("report.stronger"),
    note: t("report.note"),
    yourAnswer: t("report.yourAnswer"),
    retake: t("report.retake"),
    home: t("report.home"),
    gradingTitle: t("report.gradingTitle"),
    gradingDescription: t("report.gradingDescription"),
    failedTitle: t("report.failedTitle"),
    failedDescription: t("report.failedDescription"),
    regrade: t("report.regrade"),
    regrading: t("report.regrading"),
    notReadyTitle: t("report.notReadyTitle"),
    notReadyDescription: t("report.notReadyDescription"),
    abandonedTitle: t("report.abandonedTitle"),
    abandonedDescription: t("report.abandonedDescription"),
    continue: t("report.continue"),
})

/** The connected report: reads the session (again while it is being graded), words the scorecard and links each gap to its lessons. */
export const InterviewReport = (props: InterviewReportProps) => {
    const t = useTranslations("app.interview")
    const report = useInterviewReport(props.sessionId)
    useDocumentTitle(t("reportTitle"))
    const slotLabels = useSlotLabels()(t("report.notReadyDescription"))
    return (
        <InterviewReportBase
            props={{
                slot: mapSlot(slotOfSwr(report.session), (session) => viewOf(t, session)),
                placeholder: INTERVIEW_REPORT_PLACEHOLDER,
                slotLabels,
                labels: labelsOf(t),
                issueWords: issueWordsOf(t, report.issue),
                isRegrading: report.isRegrading,
                retakeHref: APP_ROUTES.interview,
                homeHref: APP_ROUTES.interview,
                roomHref: interviewRoomPath(props.sessionId),
                reviewHref: APP_ROUTES.review,
            }}
            on={{ retryRead: () => void report.session.mutate(), regrade: report.regrade }}
        />
    )
}
