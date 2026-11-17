"use client"

import { useFormatter, useTranslations } from "next-intl"
import {
    ANY_LANGUAGE,
    INTERVIEW_TIERS,
    languageNameOf,
    useInterviewHome,
    verdictToneOf,
    type InterviewIssue,
} from "@/hooks/interview"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import type { InterviewHistoryRead, InterviewOptionsRead } from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import { APP_ROUTES, interviewReportPath, interviewRoomPath } from "@/modules/routes"
import {
    INTERVIEW_HOME_PLACEHOLDER,
    InterviewHomeBase,
    type InterviewHomeLabels,
    type InterviewHomeView,
} from "./component"

type HistoryItem = InterviewHistoryRead["items"][number]
type Translate = ReturnType<typeof useTranslations>
type DateOf = (iso: string) => string

/** The tone of a history badge: the row list has no danger tone, so a verdict that did not pass is a caution. */
const rowToneOf = (verdict: string | null): "success" | "warning" | "muted" => {
    const tone = verdictToneOf(verdict)
    return tone === "danger" ? "warning" : tone
}

/** The name of a tier in the locale. */
const tierNameOf = (t: Translate, tier: string): string => t(`home.tier${tier.charAt(0).toUpperCase()}${tier.slice(1)}`)

/** The words of the refusal of the last start; empty for none. */
const issueWordsOf = (t: Translate, issue: InterviewIssue): string => {
    switch (issue) {
        case "none":
            return ""
        case "premiumRequired":
            return t("home.errors.premiumRequired")
        case "sessionActive":
            return t("home.errors.sessionActive")
        case "poolEmpty":
            return t("home.errors.poolEmpty")
        case "setupInvalid":
            return t("home.errors.setupInvalid")
        case "aiLimit":
        case "noAnswer":
        case "unconfigured":
        case "unavailable":
        case "invalid":
        case "conflict":
        case "other":
            return t("home.errors.other")
    }
}

/** The line about what the learner may do now: Premium, the free session left, or when the quota resets. */
const accessLineOf = (t: Translate, access: InterviewOptionsRead["access"], dateOf: DateOf): string => {
    if (access.isPremium) return t("home.premiumNote")
    if (access.freeSessionsLeftThisMonth <= 0) return t("home.freeNone", { date: dateOf(access.resetsAt) })
    return t("home.freeLeft", { count: access.freeSessionsLeftThisMonth })
}

/** The code languages the live banks have, without the agnostic body. */
const languagesOf = (options: InterviewOptionsRead): ReadonlyArray<string> => [
    ...new Set(options.banks.flatMap((bank) => bank.languages).filter((each) => each !== "agnostic")),
]

/** The home as it is drawn, from the options read. */
const viewOf = (t: Translate, options: InterviewOptionsRead, dateOf: DateOf): InterviewHomeView => {
    const { access, active } = options
    return {
        tracks: options.tracks.map((each) => ({ id: each.id, label: each.title })),
        tiers: INTERVIEW_TIERS.map((id) => ({ id, label: tierNameOf(t, id) })),
        languages: [
            { id: ANY_LANGUAGE, label: t("home.languageAny") },
            ...languagesOf(options).map((id) => ({ id, label: languageNameOf(id) })),
        ],
        facts: [t("home.length", { count: access.length })],
        accessLine: accessLineOf(t, access, dateOf),
        isLocked: !access.isPremium && access.freeSessionsLeftThisMonth <= 0,
        lengthLine: t("home.length", { count: access.length }),
        banksLine: t("home.banksNote", { count: options.banks.length }),
        hasBanks: options.banks.length > 0,
        active:
            active === null
                ? null
                : {
                      sessionId: active.sessionId,
                      title: t("home.resumeTitle"),
                      description: t("home.resumeDescription", { date: dateOf(active.startedAt) }),
                      href: interviewRoomPath(active.sessionId),
                  },
    }
}

/** The badge of a history row: the score, and the verdict when there is one. */
const badgeOf = (t: Translate, item: HistoryItem): string => {
    if (item.overallScore === null) return ""
    const score = t("home.historyScore", { score: item.overallScore })
    return item.verdict === null ? score : [score, t(`report.verdict.${item.verdict}`)].join(" · ")
}

/** One row of the history. */
const rowOf = (t: Translate, item: HistoryItem, trackName: (id: string) => string, dateOf: DateOf) => {
    const isActive = item.status === "active"
    return {
        id: item.sessionId,
        title: t("home.historyRow", { track: trackName(item.track), tier: tierNameOf(t, item.tier) }),
        description: [dateOf(item.startedAt), t(`home.status.${item.status}`)].join(" · "),
        badge: badgeOf(t, item),
        badgeTone: rowToneOf(item.verdict),
        href: isActive ? interviewRoomPath(item.sessionId) : interviewReportPath(item.sessionId),
        cta: item.status === "graded" ? t("home.historyOpen") : t("home.historyContinue"),
        isCurrent: isActive,
    }
}

/** The fixed words of the home. */
const labelsOf = (t: Translate): InterviewHomeLabels => ({
    eyebrow: t("home.eyebrow"),
    title: t("home.title"),
    description: t("home.description"),
    setupTitle: t("home.setupTitle"),
    track: t("home.track"),
    tier: t("home.tier"),
    language: t("home.language"),
    start: t("home.start"),
    starting: t("home.starting"),
    noBanks: t("home.noBanks"),
    lockedTitle: t("home.lockedTitle"),
    lockedDescription: t("home.lockedDescription"),
    plans: t("home.plans"),
    resume: t("home.resume"),
    abandon: t("home.abandon"),
    historyTitle: t("home.historyTitle"),
    historyEmpty: t("home.historyEmpty"),
    trendTitle: t("home.trendTitle"),
})

/** The connected interview home: reads the options of the track and the history, keeps the setup and words every label. */
export const InterviewHome = () => {
    const t = useTranslations("app.interview")
    const format = useFormatter()
    const home = useInterviewHome()
    useDocumentTitle(t("pageTitle"))
    const labels = useSlotLabels()
    const dateOf: DateOf = (iso) => format.dateTime(new Date(iso), { dateStyle: "medium" })
    const trackName = (id: string): string => home.options.data?.tracks.find((each) => each.id === id)?.title ?? id
    return (
        <InterviewHomeBase
            props={{
                slot: mapSlot(slotOfSwr(home.options), (options) => viewOf(t, options, dateOf)),
                placeholder: INTERVIEW_HOME_PLACEHOLDER,
                slotLabels: labels(t("home.noBanks")),
                labels: labelsOf(t),
                state: {
                    track: home.track,
                    tier: home.tier,
                    language: home.language,
                    issueWords: issueWordsOf(t, home.issue),
                },
                isStarting: home.isStarting,
                isAbandoning: home.isAbandoning,
                needsPremium: home.issue === "premiumRequired",
                history: {
                    slot: mapSlot(slotOfSwr(home.history), (history) => ({
                        rows: history.items.map((item) => rowOf(t, item, trackName, dateOf)),
                        trend: history.trend.map((entry) =>
                            t("home.trendLine", {
                                track: trackName(entry.track),
                                tier: tierNameOf(t, entry.tier),
                                scores: entry.scores.join(" → "),
                            }),
                        ),
                    })),
                    slotLabels: labels(t("home.historyEmpty")),
                },
                plansHref: APP_ROUTES.premium,
            }}
            on={{
                retry: () => void home.options.mutate(),
                track: home.chooseTrack,
                tier: home.chooseTier,
                language: home.chooseLanguage,
                start: home.start,
                abandon: home.abandon,
            }}
        />
    )
}
