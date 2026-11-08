"use client"

import { useLocale, useTranslations } from "next-intl"
import { phaseOf, useLessonWorkbench } from "@/hooks/lesson"
import { useCatalogWords } from "@/hooks/catalog"
import { useLessonProgress } from "@/hooks/lessonProgress"
import { studyOf, useLessonStudyLabels } from "@/hooks/lessonStudy"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useGetLessonSwr } from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import { APP_ROUTES } from "@/modules/routes"
import { LessonStudyBase } from "./component"
import { STUDY_PLACEHOLDER, type AttemptAnswer, type LessonDifficulty, type LessonView } from "@/modules/types"

/** What the route hands the study block: the lesson and the `phase` query, both atoms. */
type LessonStudyProps = {
    readonly lessonId: string
    /** The raw `phase` query value; anything that names no phase opens the overview. */
    readonly phase: string | undefined
}

/** The connected study screen of one lesson: reads its public projection, keeps the learner's work and words every label. */
export const LessonStudy = (props: LessonStudyProps) => {
    const t = useTranslations("app.essentials")
    const read = useGetLessonSwr(props.lessonId, useLocale())
    const slotLabels = useSlotLabels()
    const labels = useLessonStudyLabels()
    const catalog = useCatalogWords()
    const workbench = useLessonWorkbench()
    const { progress, challenge } = useLessonProgress(props.lessonId)
    const locale = useLocale()
    const phase = phaseOf(props.phase)
    useDocumentTitle(read.data?.title)
    const difficulty = {
        foundation: t("difficulty.foundation"),
        intermediate: t("difficulty.intermediate"),
        advanced: t("difficulty.advanced"),
    } satisfies Record<LessonDifficulty, string>
    const factsOf = (lesson: LessonView): string =>
        lesson.implementation === "agnostic"
            ? t("study.factsAgnostic", { minutes: lesson.minutes })
            : t("study.facts", {
                  minutes: lesson.minutes,
                  language: catalog.languageNames[lesson.implementation.toLowerCase()] ?? lesson.implementation,
              })
    const submit = (activityId: string, answer: AttemptAnswer): void =>
        workbench.submit({ lessonId: props.lessonId, version: read.data?.version ?? "", locale, activityId, answer })
    return (
        <LessonStudyBase
            props={{
                slot: mapSlot(slotOfSwr(read), (lesson) =>
                    studyOf({
                        lesson,
                        phase,
                        workbench,
                        progress,
                        challenge,
                        words: {
                            category: catalog.groups[lesson.group] ?? lesson.category,
                            difficulty: difficulty[lesson.difficulty],
                            facts: factsOf(lesson),
                            score: (score, maxScore) => t("study.score", { score, maxScore }),
                        },
                    }),
                ),
                placeholder: STUDY_PLACEHOLDER,
                slotLabels: slotLabels(t("study.empty")),
                labels,
                plansHref: APP_ROUTES.premium,
                catalogHref: APP_ROUTES.essentials,
            }}
            on={{
                retry: () => void read.mutate(),
                pick: workbench.pick,
                write: workbench.write,
                submitChoice: (activityId, optionId) => submit(activityId, { optionId }),
                submitWritten: (activityId, text) => submit(activityId, { text }),
                submitDebrief: (activityId, debrief) =>
                    submit(activityId, {
                        debrief,
                        reachedStateId: workbench.trails[activityId]?.at(-1) ?? "",
                        actionIds: workbench.actions[activityId] ?? [],
                    }),
                move: workbench.visit,
                restart: workbench.restart,
                openTab: workbench.openTab,
            }}
        />
    )
}
