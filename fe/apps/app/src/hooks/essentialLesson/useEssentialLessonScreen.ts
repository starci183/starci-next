"use client"

import { useEffect, useState } from "react"
import { fireConfetti } from "@starci/visual-effects"
import { useLocale } from "next-intl"
import type {
    ApplyPartView,
    ArticleSectionView,
    EssenceLabels,
    EssenceStage,
    EssenceView,
    EssentialPartsLabels,
    ScenariosPartView,
    SourcePartView,
} from "@starci-next/ui"
import { navigation } from "@starci-next/i18n/navigation"
import { useLessonAttempts } from "@/hooks/lesson"
import { useLessonProgress } from "@/hooks/lessonProgress"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import {
    useGetLessonSwr,
    useGetLessonTopicsSwr,
    useQueryLessonOpenerScoresSwr,
    useQueryLessonPartsProgressSwr,
} from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import { APP_ROUTES, topicPath } from "@/modules/routes"
import {
    ESSENTIAL_PARTS,
    type DataSlot,
    type EssentialPart,
    type LessonDifficulty,
    type SlotLabels,
} from "@/modules/types"
import { useTranslations } from "next-intl"
import { partOf, partPath, partSectionOf, type EssentialDesk } from "./essentialLesson.shared"
import { essenceOf, useEssenceLabels, type EssenceShellLabels } from "@/hooks/essence"
import { EMPTY_RUN_PARTS } from "@/modules/essential-runs"
import { useEssentialRuns, type EssentialRuns } from "./useEssentialRuns"
import { useEssentialLessonLabels, type EssentialPageLabels } from "./useEssentialLessonLabels"

/** What the route hands the lesson page: the lesson and the `part` and `scenario` queries. */
type EssentialRoute = {
    readonly lessonId: string
    readonly part: string | undefined
    readonly scenario: string | undefined
}

/** The lesson page as drawn: the band and the part on screen, every word resolved. */
export type EssentialLessonView = {
    readonly id: string
    readonly title: string
    readonly topic: { readonly title: string; readonly href: string }
    /** The crumbs after the catalog (the topic, then the lesson); empty until the lesson is read, so no placeholder word reaches the trail. */
    readonly trail: ReadonlyArray<{ readonly id: string; readonly label: string; readonly href?: string }>
    readonly difficulty: string
    /** The one line under the subtitle: "Bài 3/6 trong Hệ thống phân tán · 20 phút đọc · 5 kịch bản · 4 mức tự áp dụng". */
    readonly facts: string
    /** The lesson's one-line problem, under the title. */
    readonly subtitle: string
    readonly part: EssentialPart
    readonly tabs: ReadonlyArray<EssentialTabView>
    /** True when the reader has no Premium (some part is locked). */
    readonly isFree: boolean
    readonly lockedParts: ReadonlyArray<EssentialPart>
    /** The four parts of the lesson with the learner's standing in each, from the batch read; empty until it answers. */
    readonly parts: ReadonlyArray<EssentialPartStanding>
    /** The part the page opens the lesson on again ("Học tiếp"): the first part not done. */
    readonly nextPartHref: string
    /** True when the lesson carries none of the four parts yet. */
    readonly hasNoPart: boolean
    /** True when the part on screen needs Premium the learner lacks: only its words and the Subscribe link are shown. */
    readonly isLocked: boolean
    /** The prose a part opens with (its own section), when the lesson has one. */
    readonly intro: ArticleSectionView | undefined
    readonly essence: EssenceView
    readonly source: SourcePartView
    readonly scenarios: ScenariosPartView
    readonly apply: ApplyPartView
}

/** One tab of the lesson band: the part, its address and the standing the tab marks. */
export type EssentialTabView = {
    readonly id: EssentialPart
    readonly label: string
    readonly href: string
    /** The items done of the part, shown as the count chip while the part is under way; undefined hides it. */
    readonly count: number | undefined
    readonly state: "none" | "doing" | "done" | "locked"
}

/** The standing of one part, as the batch read states it. */
export type EssentialPartStanding = {
    readonly part: EssentialPart
    readonly state: "none" | "doing" | "done" | "locked"
    readonly done: number
    readonly total: number
}

/** What the learner does on the page. */
export type EssentialLessonActions = {
    readonly retry: () => void
    readonly pick: (activityId: string, optionId: string) => void
    readonly submit: (activityId: string, optionId: string) => void
    /** Picks an option of an opener question and sends it to be graded at once. */
    readonly answer: (activityId: string, optionId: string) => void
    readonly moveOpener: (index: number) => void
    /** Shows one of the three screens of Bản chất. */
    readonly showStage: (stage: EssenceStage) => void
    readonly retake: () => void
    readonly selectScenario: (scenarioId: string) => void
    readonly selectChallenge: (challengeId: string) => void
    readonly toggleGuard: (flag: string, isOff: boolean) => void
    readonly revealHint: (scenarioId: string) => void
    readonly openPart: (part: EssentialPart) => void
}

/** The connected lesson page. */
export type EssentialLessonScreen = {
    readonly props: {
        readonly slot: DataSlot<EssentialLessonView>
        readonly placeholder: EssentialLessonView
        readonly slotLabels: SlotLabels
        readonly errorText: string
        readonly page: EssentialPageLabels
        readonly labels: EssentialPartsLabels
        readonly essence: EssenceLabels
        readonly shell: EssenceShellLabels
        /** The three parts that run on the learner machine: their words, the primary command of the part on screen. */
        readonly runs: EssentialRuns
        readonly plansHref: string
        readonly catalogHref: string
    }
    readonly on: EssentialLessonActions
}

/** The same-shape lesson the skeleton draws while the first read runs. */
export const ESSENTIAL_PLACEHOLDER: EssentialLessonView = {
    id: "placeholder",
    title: "",
    topic: { title: "", href: "/" },
    trail: [],
    difficulty: "",
    facts: "",
    subtitle: "",
    part: "essence",
    tabs: ESSENTIAL_PARTS.map((id) => ({ id, label: "", href: "/", count: undefined, state: "none" as const })),
    isFree: false,
    lockedParts: [],
    parts: [],
    nextPartHref: "/",
    hasNoPart: false,
    isLocked: false,
    intro: undefined,
    essence: {
        stage: "questions",
        questions: [
            {
                id: "q",
                prompt: "",
                choices: [1, 2, 3, 4].map((n) => ({ id: `c${n}`, label: "" })),
                pickedId: "",
                correctId: "",
                status: "idle",
                isSendFailed: false,
                isCorrect: false,
                explanation: "",
                links: [],
                misses: [],
                isSolved: false,
                insight: undefined,
            },
        ],
        story: undefined,
        timeline: [],
        isPassed: false,
        index: 0,
        bar: [1, 2, 3, 4, 5].map((n) => ({ id: `q${n}`, label: "", state: "upcoming" as const, isCurrent: false })),
        resultTitle: "",
        resultText: "",
        retakeLine: "",
        toc: [1, 2, 3].map((n) => ({
            id: `s${n}`,
            title: "",
            href: "#",
            isFlagged: false,
            isRead: false,
        })),
        articleEyebrow: "",
        sections: [],
        journey: [],
        isFree: false,
    },
    ...EMPTY_RUN_PARTS,
}

/**
 * The connected four-part lesson page: reads the lesson, the learner's attempts (the opener and the essence checks are choice
 * attempts graded on the spot), the opener's before and after, and the scenario runs the relay brought back from the learner's
 * machine (read again every few seconds while one is in flight), and words every part.
 */
export const useEssentialLessonScreen = (route: EssentialRoute): EssentialLessonScreen => {
    const locale = useLocale()
    const tStudy = useTranslations("app.essentials")
    const router = navigation.useRouter()
    const read = useGetLessonSwr(route.lessonId, locale)
    const { progress, refresh } = useLessonProgress(route.lessonId, locale)
    const restored = Object.fromEntries((progress?.activities ?? []).map((each) => [each.activityId, each.latest]))
    const attempts = useLessonAttempts(restored)
    const scores = useQueryLessonOpenerScoresSwr([route.lessonId])
    const part = partOf(route.part)
    const { page, parts } = useEssentialLessonLabels()
    const { labels: essenceLabels, words: essenceWords, shell } = useEssenceLabels()
    const standing = useQueryLessonPartsProgressSwr([route.lessonId]).data?.[route.lessonId]
    const topicId = read.data?.topic.id
    const topic = useGetLessonTopicsSwr(topicId === undefined ? [] : [topicId], locale).data?.[topicId ?? ""]
    const slotLabels = useSlotLabels()
    const [desk, setDesk] = useState<EssentialDesk>({
        picks: {},
        retakeFrom: {},
        openerIndex: undefined,
        stage: undefined,
    })
    const runsPart = useEssentialRuns({
        lesson: read.data,
        part,
        scenario: route.scenario,
        refreshLesson: () => void read.mutate(),
        attempts: attempts.attempts,
        picks: desk.picks,
    })
    const settled = Object.values(attempts.attempts)
        .map((attempt) => `${attempt.view?.attemptId ?? ""}:${attempt.status}`)
        .join(",")
    const rescore = scores.mutate
    useEffect(() => {
        refresh()
        void rescore()
    }, [settled, refresh, rescore])
    useEffect(() => {
        if (route.scenario !== undefined) setDesk((all) => ({ ...all, scenarioId: route.scenario ?? "" }))
    }, [route.scenario])
    useDocumentTitle(read.data?.title)
    const difficulty = {
        foundation: tStudy("difficulty.foundation"),
        intermediate: tStudy("difficulty.intermediate"),
        advanced: tStudy("difficulty.advanced"),
    } satisfies Record<LessonDifficulty, string>
    const score = scores.data?.[route.lessonId]
    return {
        props: {
            slot: mapSlot(slotOfSwr(read), (lesson): EssentialLessonView => {
                const view = lesson.essential ?? {
                    isLocked: !lesson.isPremium,
                    lockedParts: [],
                    story: undefined,
                    opener: [],
                    source: undefined,
                    invariants: [],
                    architecture: undefined,
                    codeWalk: [],
                    scenarios: [],
                    challenges: [],
                }
                const essence = essenceOf({
                    lesson,
                    essential: view,
                    attempts: attempts.attempts,
                    desk,
                    score,
                    parts: standing,
                    part,
                    titles: page.parts,
                    readIds: progress?.readSectionIds ?? [],
                    words: essenceWords,
                })
                const place = topic?.path.findIndex((each) => each.lessonId === lesson.id) ?? -1
                const partStandings = ESSENTIAL_PARTS.flatMap((id): ReadonlyArray<EssentialPartStanding> => {
                    const own = standing?.parts.find((each) => each.part === id)
                    return own === undefined ? [] : [{ part: id, state: own.state, done: own.done, total: own.total }]
                })
                const stateOf = (id: EssentialPart): EssentialTabView["state"] =>
                    view.lockedParts.includes(id)
                        ? "locked"
                        : (partStandings.find((each) => each.part === id)?.state ?? "none")
                const nextPart =
                    ESSENTIAL_PARTS.find((id) => stateOf(id) !== "done" && stateOf(id) !== "locked") ?? "essence"
                return {
                    id: lesson.id,
                    title: lesson.title,
                    topic: { title: lesson.topic.title, href: topicPath(lesson.topic.id) },
                    trail: [
                        { id: "topic", label: lesson.topic.title, href: topicPath(lesson.topic.id) },
                        { id: "lesson", label: lesson.title },
                    ],
                    difficulty: difficulty[lesson.difficulty],
                    facts: [
                        place === -1 || topic === undefined
                            ? ""
                            : shell.position(place + 1, topic.path.length, lesson.topic.title),
                        view.scenarios.length === 0 || view.challenges.length === 0
                            ? shell.factsPlain(lesson.minutes)
                            : shell.facts(lesson.minutes, view.scenarios.length, view.challenges.length),
                    ]
                        .filter((each) => each !== "")
                        .join(" · "),
                    subtitle: lesson.description,
                    isFree: view.lockedParts.length > 0,
                    lockedParts: view.lockedParts,
                    parts: partStandings,
                    nextPartHref: partPath(lesson, nextPart),
                    part,
                    tabs: ESSENTIAL_PARTS.map((id) => {
                        const own = partStandings.find((each) => each.part === id)
                        return {
                            id,
                            label: page.parts[id],
                            href: partPath(lesson, id),
                            count: own !== undefined && own.state === "doing" ? own.done : undefined,
                            state: stateOf(id),
                        }
                    }),
                    hasNoPart: lesson.essential === undefined,
                    isLocked: lesson.essential !== undefined && view.lockedParts.includes(part),
                    intro: partSectionOf(lesson, part),
                    essence,
                    source: runsPart.source,
                    scenarios: runsPart.scenarios,
                    apply: runsPart.apply,
                }
            }),
            placeholder: ESSENTIAL_PLACEHOLDER,
            slotLabels: { ...slotLabels(page.empty), error: page.errorTitle },
            errorText: page.errorText,
            page,
            labels: parts,
            essence: essenceLabels,
            shell,
            runs: runsPart,
            plansHref: APP_ROUTES.premium,
            catalogHref: APP_ROUTES.essentials,
        },
        on: {
            retry: () => void read.mutate(),
            pick: (activityId, optionId) =>
                setDesk((all) => ({ ...all, picks: { ...all.picks, [activityId]: optionId } })),
            submit: (activityId, optionId) => {
                if (optionId === "" || read.data === undefined) return
                attempts.submit({
                    lessonId: route.lessonId,
                    version: read.data.version,
                    locale,
                    activityId,
                    answer: { optionId },
                })
            },
            answer: (activityId, optionId) => {
                const place = (read.data?.essential?.opener ?? []).findIndex((each) => each.activityId === activityId)
                setDesk((all) => ({
                    ...all,
                    picks: { ...all.picks, [activityId]: optionId },
                    openerIndex: place === -1 ? all.openerIndex : place,
                }))
                if (optionId === "" || read.data === undefined) return
                attempts.submit(
                    {
                        lessonId: route.lessonId,
                        version: read.data.version,
                        locale,
                        activityId,
                        answer: { optionId },
                    },
                    (view) => {
                        // The right pick of an opener question is celebrated the moment its grade lands.
                        if (place !== -1 && view.result?.correct === true) fireConfetti()
                    },
                )
            },
            moveOpener: (index) => setDesk((all) => ({ ...all, openerIndex: index, stage: "questions" })),
            showStage: (stage) => setDesk((all) => ({ ...all, stage })),
            retake: () => {
                const opener = read.data?.essential?.opener ?? []
                setDesk((all) => ({
                    ...all,
                    openerIndex: 0,
                    stage: "questions",
                    picks: Object.fromEntries(
                        Object.entries(all.picks).filter(([id]) => !opener.some((each) => each.activityId === id)),
                    ),
                    retakeFrom: Object.fromEntries(
                        opener.map((each) => [each.activityId, attempts.attempts[each.activityId]?.revision ?? 0]),
                    ),
                }))
                if (typeof window !== "undefined") window.location.hash = "opener"
            },
            ...runsPart.on,
            openPart: (target) => {
                if (read.data !== undefined) router.push(partPath(read.data, target))
            },
        },
    }
}
