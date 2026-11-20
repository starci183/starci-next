"use client"

import { useFormatter, useLocale, useTranslations } from "next-intl"
import { mapSlot, slotOfSwr } from "@/hooks/slot"
import { useQueryLearnerProgressSwr, type LearnerProgress } from "@/hooks/swr"
import type { DataSlot, ProgressLabels, ProgressPageView } from "@/modules/types"
import { essentialsOf } from "@/hooks/progressEssentials"
import { harnessOf } from "@/hooks/progressHarness"
import { projectsOf } from "@/hooks/progressProjects"
import { practiceOf } from "@/hooks/progressPractice"
import { activityOf, reviewOf } from "@/hooks/progressReview"
import { APP_ROUTES } from "@/modules/routes"
import type { ProgressFormatter, ProgressTranslate } from "@/hooks/progressWords"

/** The ribbon: the figures that stand on proof or on real work; a figure whose source could not be read is left out. */
const ribbonOf = (t: ProgressTranslate, data: LearnerProgress): ProgressPageView["ribbon"] => [
    { id: "proved", term: t("ribbon.proved"), value: data.ribbon.provedConcepts },
    { id: "streak", term: t("ribbon.streak"), value: data.ribbon.streak, unit: t("ribbon.days") },
    ...(data.essentials === null ? [] : [{ id: "lessons", term: t("ribbon.lessons"), value: data.ribbon.lessonsDone }]),
    ...(data.harness === null ? [] : [{ id: "builds", term: t("ribbon.builds"), value: data.ribbon.buildsDone }]),
    ...(data.practice === null
        ? []
        : [{ id: "accepted", term: t("ribbon.accepted"), value: data.practice.acceptedCount }]),
]

/** Whether nothing has been measured yet: no lesson, proof, build, solved problem, review or activity. */
const isFirstVisitOf = (data: LearnerProgress): boolean =>
    data.ribbon.provedConcepts === 0 &&
    data.ribbon.streak === 0 &&
    data.ribbon.lessonsDone === 0 &&
    data.ribbon.buildsDone === 0 &&
    (data.practice?.acceptedCount ?? 0) === 0 &&
    (data.review?.doneToday ?? 0) === 0 &&
    data.activity.length === 0

/** The three ways in a learner with nothing measured is shown. */
const invitationsOf = (t: ProgressTranslate): NonNullable<ProgressPageView["firstVisit"]> => [
    {
        id: "essentials",
        title: t("firstVisit.essentials.title"),
        description: t("firstVisit.essentials.text"),
        href: APP_ROUTES.essentials,
        action: { label: t("firstVisit.start"), href: APP_ROUTES.essentials, endArrow: true },
    },
    {
        id: "practice",
        title: t("firstVisit.practice.title"),
        description: t("firstVisit.practice.text"),
        href: APP_ROUTES.practice,
        action: { label: t("firstVisit.start"), href: APP_ROUTES.practice, endArrow: true },
    },
    {
        id: "review",
        title: t("firstVisit.review.title"),
        description: t("firstVisit.review.text"),
        href: APP_ROUTES.review,
        action: { label: t("firstVisit.start"), href: APP_ROUTES.review, endArrow: true },
    },
]

/** The whole page in words. */
const viewOf = (t: ProgressTranslate, format: ProgressFormatter, data: LearnerProgress): ProgressPageView => ({
    ribbon: ribbonOf(t, data),
    essentials: essentialsOf(t, data.essentials),
    harness: harnessOf(t, data.harness),
    projects: projectsOf(t, data),
    practice: practiceOf(t, data.practice),
    review: reviewOf(t, data.review),
    activity: activityOf(t, format, data.activity),
    firstVisit: isFirstVisitOf(data) ? invitationsOf(t) : null,
    isFree: data.plan !== "premium",
})

/** The fixed words of the page. */
const labelsOf = (t: ProgressTranslate): ProgressLabels => ({
    title: t("title"),
    description: t("description"),
    descriptionFree: t("descriptionFree"),
    descriptionFirst: t("descriptionFirst"),
    loading: t("loading"),
    crumbLabel: t("crumb.label"),
    crumbProfile: t("crumb.profile"),
    crumbHref: APP_ROUTES.profile,
    crumbSelf: t("pageTitleShort"),
    ribbonLabel: t("ribbon.label"),
    essentialsTitle: t("essentials.title"),
    harnessTitle: t("harness.title"),
    projectsTitle: t("projects.title"),
    practiceTitle: t("practice.title"),
    reviewTitle: t("review.title"),
    activityTitle: t("activity.title"),
    activityLabel: t("activity.label"),
    activityEmpty: t("activity.empty"),
    unavailable: t("unavailable"),
    pageError: t("pageError"),
    pageErrorText: t("pageErrorText"),
    retry: t("retry"),
    firstVisitTitle: t("firstVisit.title"),
    firstVisitText: t("firstVisit.text"),
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
