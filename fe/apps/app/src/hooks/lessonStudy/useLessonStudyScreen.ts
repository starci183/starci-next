"use client"

import { useEffect } from "react"
import { useLocale, useTranslations } from "next-intl"
import { navigation } from "@starci-next/i18n/navigation"
import { phaseOf, useLessonWorkbench, type LessonWorkbench } from "@/hooks/lesson"
import { evidenceKeyOf, evidenceTextOf } from "@/hooks/lessonEvidence"
import { useCatalogWords } from "@/hooks/catalog"
import { useLessonProgress } from "@/hooks/lessonProgress"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useGetLessonSwr, useMutateSaveLessonSimulationSwr } from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import { APP_ROUTES, lessonPath } from "@/modules/routes"
import {
    STUDY_PLACEHOLDER,
    type AttemptAnswer,
    type LessonDifficulty,
    type LessonStudyActions,
    type LessonStudyScreen,
    type LessonView,
    type StudyWords,
} from "@/modules/types"
import { languageCountOf, studyOf } from "./lessonStudy.shared"
import { useLessonStudyLabels } from "./useLessonStudyLabels"

/** The phases a learner works through: the six between the overview and the review. */
const PHASE_COUNT = 6

/** What the route hands the study screen: the lesson and the `phase` query, both atoms. */
type LessonStudyRoute = {
    readonly lessonId: string
    /** The raw `phase` query value; anything that names no phase opens the overview. */
    readonly phase: string | undefined
}

/** The words of a lesson's facts, its level and its group, and the score line. */
const useStudyWords = (): ((lesson: LessonView) => StudyWords) => {
    const t = useTranslations("app.essentials")
    const catalog = useCatalogWords()
    const difficulty = {
        foundation: t("difficulty.foundation"),
        intermediate: t("difficulty.intermediate"),
        advanced: t("difficulty.advanced"),
    } satisfies Record<LessonDifficulty, string>
    const factsOf = (lesson: LessonView): string => {
        const languages = languageCountOf(lesson)
        if (languages > 1) return t("study.factsLanguages", { minutes: lesson.minutes, count: PHASE_COUNT, languages })
        if (lesson.implementation === "agnostic") {
            return t("study.factsAgnosticWithPhases", { minutes: lesson.minutes, count: PHASE_COUNT })
        }
        return t("study.factsWithPhases", {
            minutes: lesson.minutes,
            count: PHASE_COUNT,
            language: catalog.languageNames[lesson.implementation.toLowerCase()] ?? lesson.implementation,
        })
    }
    return (lesson) => ({
        category: catalog.groups[lesson.group] ?? lesson.category,
        difficulty: difficulty[lesson.difficulty],
        facts: factsOf(lesson),
        score: (score, maxScore) => t("study.score", { score, maxScore }),
    })
}

/** What the learner does on the screen, over the workbench and the submit of an attempt. */
const actionsOf = (
    workbench: LessonWorkbench,
    submit: (activityId: string, answer: AttemptAnswer) => void,
    others: Pick<LessonStudyActions, "retry" | "openPhase" | "walk">,
): LessonStudyActions => ({
    ...others,
    pick: workbench.pick,
    write: workbench.write,
    openTab: workbench.openTab,
    pickLanguage: workbench.pickLanguage,
    submitChoice: (activityId, optionId) => submit(activityId, { optionId }),
    submitWritten: (activityId, text) => submit(activityId, { text }),
    submitDebrief: (activityId, debrief) => {
        const steps = workbench.walks[activityId]
        const saved = workbench.simulations[activityId]
        submit(activityId, {
            debrief,
            reachedStateId: steps?.at(-1)?.toStateId ?? saved?.currentStateId ?? "",
            actionIds: steps?.map((step) => step.actionId) ?? saved?.actionIds ?? [],
        })
    },
    writeEvidence: (activityId, field, text) => workbench.write(evidenceKeyOf(activityId, field), text),
    submitEvidence: (activityId, output, explanation) => submit(activityId, { text: evidenceTextOf(output, explanation) }),
})

/**
 * The connected study screen of one lesson: reads its public projection, keeps the learner's work, reads the progress again whenever an attempt
 * is sent or settled (so the cards and the aside update without a reload) and words every label.
 */
export const useLessonStudyScreen = (route: LessonStudyRoute): LessonStudyScreen => {
    const t = useTranslations("app.essentials")
    const locale = useLocale()
    const read = useGetLessonSwr(route.lessonId, locale)
    const slotLabels = useSlotLabels()
    const labels = useLessonStudyLabels()
    const wordsOf = useStudyWords()
    const router = navigation.useRouter()
    const { progress, refresh } = useLessonProgress(route.lessonId, locale)
    const workbench = useLessonWorkbench(progress)
    const saveWalk = useMutateSaveLessonSimulationSwr()
    const settledKey = Object.values(workbench.attempts)
        .map((attempt) => `${attempt.view?.attemptId ?? attempt.status}:${attempt.status}`)
        .join(",")
    useEffect(() => {
        refresh()
    }, [settledKey, refresh])
    useDocumentTitle(read.data?.title)
    const phase = phaseOf(route.phase)
    const submit = (activityId: string, answer: AttemptAnswer): void =>
        workbench.submit({ lessonId: route.lessonId, version: read.data?.version ?? "", locale, activityId, answer })
    return {
        props: {
            slot: mapSlot(slotOfSwr(read), (lesson) => studyOf({ lesson, phase, workbench, progress, words: wordsOf(lesson) })),
            placeholder: STUDY_PLACEHOLDER,
            slotLabels: slotLabels(t("study.empty")),
            labels,
            plansHref: APP_ROUTES.premium,
            catalogHref: APP_ROUTES.essentials,
            reviewHref: APP_ROUTES.review,
            projectsHref: APP_ROUTES.projects,
        },
        on: actionsOf(workbench, submit, {
            retry: () => void read.mutate(),
            walk: (activityId, walk) => {
                workbench.walk(activityId, walk.steps)
                saveWalk
                    .trigger({
                        lessonId: route.lessonId,
                        version: read.data?.version ?? "",
                        locale,
                        activityId,
                        currentStateId: walk.currentStateId,
                        actionIds: walk.steps.map((step) => step.actionId),
                    })
                    .then(refresh)
                    .catch(refresh)
            },
            openPhase: (target) => router.push(lessonPath(read.data?.topic.id ?? "", route.lessonId, target)),
        }),
    }
}
