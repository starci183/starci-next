"use client"

import { useFormatter, useLocale, useTranslations } from "next-intl"
import { mapSlot, slotOfSwr } from "@/hooks/slot"
import { useQueryLearnerProgressSwr, type LearnerProgress } from "@/hooks/swr"
import type { DataSlot, ProgressLabels, ProgressPageView } from "@/modules/types"
import { essentialsOf } from "@/hooks/progressEssentials"
import { harnessOf } from "@/hooks/progressHarness"
import { projectsOf } from "@/hooks/progressProjects"
import { activityOf, reviewOf } from "@/hooks/progressReview"
import type { ProgressFormatter, ProgressTranslate } from "@/hooks/progressWords"

/** The ribbon: the four figures that stand on proof or on real work. */
const ribbonOf = (t: ProgressTranslate, data: LearnerProgress["ribbon"]): ProgressPageView["ribbon"] => [
    { id: "proved", term: t("ribbon.proved"), value: data.provedConcepts },
    { id: "streak", term: t("ribbon.streak"), value: data.streak, unit: t("ribbon.days") },
    { id: "lessons", term: t("ribbon.lessons"), value: data.lessonsDone },
    { id: "builds", term: t("ribbon.builds"), value: data.buildsDone },
]

/** The whole page in words. */
const viewOf = (t: ProgressTranslate, format: ProgressFormatter, data: LearnerProgress): ProgressPageView => ({
    ribbon: ribbonOf(t, data.ribbon),
    essentials: essentialsOf(t, data.essentials),
    harness: harnessOf(t, format, data.harness),
    projects: projectsOf(t, data),
    review: reviewOf(t, data.review),
    activity: activityOf(t, format, data.activity),
})

/** The fixed words of the page. */
const labelsOf = (t: ProgressTranslate): ProgressLabels => ({
    title: t("title"),
    description: t("description"),
    ribbonLabel: t("ribbon.label"),
    essentialsTitle: t("essentials.title"),
    harnessTitle: t("harness.title"),
    projectsTitle: t("projects.title"),
    reviewTitle: t("review.title"),
    activityTitle: t("activity.title"),
    activityLabel: t("activity.label"),
    activityEmpty: t("activity.empty"),
    unavailable: t("unavailable"),
})

/** What the progress page holds: its words, its slot and the way to read again. */
export type ProgressPageState = {
    readonly labels: ProgressLabels
    readonly slot: DataSlot<ProgressPageView>
    readonly pageTitle: string
    readonly retry: () => void
}

/** Reads the progress of the learner in the language of the page and words it. */
export const useProgressView = (): ProgressPageState => {
    const t = useTranslations("app.progress")
    const format = useFormatter()
    const read = useQueryLearnerProgressSwr(useLocale())
    return {
        labels: labelsOf(t),
        slot: mapSlot(slotOfSwr(read), (data) => viewOf(t, format, data)),
        pageTitle: t("pageTitle"),
        retry: () => void read.mutate(),
    }
}
