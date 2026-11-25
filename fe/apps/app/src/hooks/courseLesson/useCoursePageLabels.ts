"use client"

import { useTranslations } from "next-intl"
import type { CourseIntroLabels, CoursePatternLabels, CourseProductionLabels } from "@starci-next/ui"
import type { CourseIntroWords, CoursePatternWords, CourseProductionWords } from "@/modules/course-lesson"

/** The words of the intro, the naming and the comparison: what each draws with and what its builder needs. */
export type CoursePageLabels = {
    readonly intro: { readonly labels: CourseIntroLabels; readonly words: CourseIntroWords }
    readonly pattern: { readonly labels: CoursePatternLabels; readonly words: CoursePatternWords }
    readonly production: { readonly labels: CourseProductionLabels; readonly words: CourseProductionWords }
}

/** Resolves every word of the intro page, of the page that names what the learner built and of the comparison with real repositories once. */
export const useCoursePageLabels = (): CoursePageLabels => {
    const t = useTranslations("app.courseLesson")
    return {
        intro: {
            labels: {
                architectureTitle: t("intro.architectureTitle"),
                diagramLabel: t("intro.diagramLabel"),
                diagramError: t("intro.diagramError"),
                diagramCaption: t("intro.diagramCaption"),
                servicesTitle: t("intro.servicesTitle"),
                outcomesTitle: t("intro.outcomesTitle"),
                requiresTitle: t("intro.requiresTitle"),
                requiresNote: t("intro.requiresNote"),
                empty: t("intro.empty"),
            },
            words: {
                entry: t("intro.entry"),
                frame: t("intro.frame"),
                outcomeCase: (title) => t("intro.outcomeCase", { title }),
                outcomeAnswer: t("intro.outcomeAnswer"),
                outcomeAnswerCase: t("intro.outcomeAnswerCase"),
            },
        },
        pattern: {
            labels: {
                lead: t("pattern.lead"),
                stepsTitle: t("pattern.stepsTitle"),
                stepsNote: t("pattern.stepsNote"),
                stepsEmpty: t("pattern.stepsEmpty"),
            },
            words: {
                named: (count, term) => t("pattern.named", { count, term }),
                greenLabel: t("pattern.green"),
                openLabel: t("pattern.open"),
            },
        },
        production: {
            labels: {
                title: t("production.title"),
                lead: t("production.lead"),
                tableLabel: t("production.tableLabel"),
                repoColumn: t("production.repoColumn"),
                legend: t("production.legend"),
                readTitle: t("production.readTitle"),
                languageNote: (lang) => t("production.languageNote", { lang }),
                beyondTitle: t("production.beyondTitle"),
                answerTitle: t("production.answerTitle"),
                openNearest: t("production.openNearest"),
                externalHint: t("production.externalHint"),
            },
            words: {
                learner: t("production.learner"),
                shows: {
                    yes: t("production.shows.yes"),
                    engine: t("production.shows.engine"),
                    partial: t("production.shows.partial"),
                    no: t("production.shows.no"),
                    manual: t("production.shows.manual"),
                },
            },
        },
    }
}
