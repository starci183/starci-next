"use client"

import { useEffect, useState } from "react"
import { useLocale } from "next-intl"
import type {
    ApplyPartView,
    ArticleSectionView,
    CompareRowView,
    EssentialPartsLabels,
    OpenerView,
    ScenariosPartView,
    SourcePartView,
} from "@starci-next/ui"
import { navigation } from "@starci-next/i18n/navigation"
import { useLessonAttempts } from "@/hooks/lesson"
import { useLessonProgress } from "@/hooks/lessonProgress"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useGetLessonSwr, useQueryLessonOpenerScoresSwr, useQueryLessonScenarioRunsSwr } from "@/hooks/swr"
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
import {
    applyOf,
    articleOf,
    compareOf,
    openerOf,
    partOf,
    partPath,
    partSectionOf,
    scenariosOf,
    sourceOf,
    type EssentialDesk,
} from "./essentialLesson.shared"
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
    readonly difficulty: string
    readonly facts: string
    readonly part: EssentialPart
    readonly tabs: ReadonlyArray<{ readonly id: EssentialPart; readonly label: string; readonly href: string }>
    /** True when the lesson carries none of the four parts yet. */
    readonly isEmpty: boolean
    /** True when the part on screen needs Premium the learner lacks: only its words and the Subscribe link are shown. */
    readonly isLocked: boolean
    /** The prose a part opens with (its own section), when the lesson has one. */
    readonly intro: ArticleSectionView | undefined
    readonly opener: OpenerView
    readonly article: ReadonlyArray<ArticleSectionView>
    readonly compare: ReadonlyArray<CompareRowView>
    readonly source: SourcePartView
    readonly scenarios: ScenariosPartView
    readonly apply: ApplyPartView
}

/** What the learner does on the page. */
export type EssentialLessonActions = {
    readonly retry: () => void
    readonly pick: (activityId: string, optionId: string) => void
    readonly submit: (activityId: string, optionId: string) => void
    readonly moveOpener: (index: number) => void
    readonly retake: () => void
    readonly selectScenario: (scenarioId: string) => void
    readonly selectChallenge: (challengeId: string) => void
    readonly openPart: (part: EssentialPart) => void
}

/** The connected lesson page. */
export type EssentialLessonScreen = {
    readonly props: {
        readonly slot: DataSlot<EssentialLessonView>
        readonly placeholder: EssentialLessonView
        readonly slotLabels: SlotLabels
        readonly page: EssentialPageLabels
        readonly labels: EssentialPartsLabels
        readonly plansHref: string
        readonly catalogHref: string
    }
    readonly on: EssentialLessonActions
}

/** The same-shape lesson the skeleton draws while the first read runs. */
export const ESSENTIAL_PLACEHOLDER: EssentialLessonView = {
    id: "placeholder",
    title: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    topic: { title: "xxxxxxxxxxxx", href: "/" },
    difficulty: "xxxxxx",
    facts: "xxxxxxxxxxxxxx",
    part: "essence",
    tabs: ESSENTIAL_PARTS.map((id) => ({ id, label: "xxxxxx", href: "/" })),
    isEmpty: false,
    isLocked: false,
    intro: undefined,
    opener: {
        questions: [
            {
                id: "q",
                prompt: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
                choices: [1, 2, 3, 4].map((n) => ({ id: `c${n}`, label: "xxxxxxxxxxxxxxxxxxxxxxxx" })),
                pickedId: "",
                status: "idle",
                isSendFailed: false,
                isCorrect: false,
                explanation: "",
                links: [],
            },
        ],
        index: 0,
        position: "xxxxxxx",
        score: "",
        isRetake: false,
    },
    article: [1, 2, 3].map((n) => ({
        id: `s${n}`,
        title: "xxxxxxxxxxxxxxxxxxxxx",
        markdown: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        isLocked: false,
        isFlagged: false,
    })),
    compare: [],
    source: { pullCommand: "xxxxxxxxxxxxxxxx", diagram: "", components: [], codeWalk: [] },
    scenarios: { scenarios: [], selectedId: "", summary: "" },
    apply: { rungs: [], selectedId: "", challenge: undefined },
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
    const essential = read.data?.essential
    const part = partOf(route.part)
    const runs = useQueryLessonScenarioRunsSwr(
        route.lessonId,
        essential !== undefined && !essential.lockedParts.includes(part) && (part === "scenarios" || part === "apply"),
    )
    const { page, parts, words } = useEssentialLessonLabels()
    const slotLabels = useSlotLabels()
    const [desk, setDesk] = useState<EssentialDesk>({
        picks: {},
        retakeFrom: {},
        openerIndex: undefined,
        scenarioId: route.scenario ?? "",
        challengeId: "",
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
                    opener: [],
                    source: undefined,
                    invariants: [],
                    architecture: undefined,
                    codeWalk: [],
                    scenarios: [],
                    challenges: [],
                }
                const opener = openerOf(lesson, view, attempts.attempts, desk, words)
                return {
                    id: lesson.id,
                    title: lesson.title,
                    topic: { title: lesson.topic.title, href: topicPath(lesson.topic.id) },
                    difficulty: difficulty[lesson.difficulty],
                    facts: page.facts(lesson.minutes),
                    part,
                    tabs: ESSENTIAL_PARTS.map((id) => ({ id, label: page.parts[id], href: partPath(lesson, id) })),
                    isEmpty: lesson.essential === undefined,
                    isLocked: lesson.essential !== undefined && view.lockedParts.includes(part),
                    intro: partSectionOf(lesson, part),
                    opener,
                    article: articleOf(lesson, opener, score),
                    compare: compareOf(view, score),
                    source: sourceOf(lesson, view),
                    scenarios: scenariosOf(lesson, view, runs.data ?? [], desk, words),
                    apply: applyOf(lesson, view, runs.data ?? [], attempts.attempts, desk, words),
                }
            }),
            placeholder: ESSENTIAL_PLACEHOLDER,
            slotLabels: slotLabels(page.empty),
            page,
            labels: parts,
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
            moveOpener: (index) => setDesk((all) => ({ ...all, openerIndex: index })),
            retake: () => {
                const opener = read.data?.essential?.opener ?? []
                setDesk((all) => ({
                    ...all,
                    openerIndex: 0,
                    picks: Object.fromEntries(
                        Object.entries(all.picks).filter(([id]) => !opener.some((each) => each.activityId === id)),
                    ),
                    retakeFrom: Object.fromEntries(
                        opener.map((each) => [each.activityId, attempts.attempts[each.activityId]?.revision ?? 0]),
                    ),
                }))
                if (typeof window !== "undefined") window.location.hash = "opener"
            },
            selectScenario: (scenarioId) => setDesk((all) => ({ ...all, scenarioId })),
            selectChallenge: (challengeId) => setDesk((all) => ({ ...all, challengeId })),
            openPart: (target) => {
                if (read.data !== undefined) router.push(partPath(read.data, target))
            },
        },
    }
}
