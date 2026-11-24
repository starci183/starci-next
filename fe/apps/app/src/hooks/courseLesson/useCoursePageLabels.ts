"use client"

import { useTranslations } from "next-intl"
import type { CourseIntroLabels, CoursePatternLabels } from "@starci-next/ui"
import type { CourseIntroWords, CoursePatternWords } from "@/modules/course-lesson"

/** The words of the intro and the naming pages: what each draws with and what its builder needs. */
export type CoursePageLabels = {
    readonly intro: { readonly labels: CourseIntroLabels; readonly words: CourseIntroWords }
    readonly pattern: { readonly labels: CoursePatternLabels; readonly words: CoursePatternWords }
}

/** Resolves every word of the intro page and of the page that names the pattern once. */
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
                infraTitle: t("intro.infraTitle"),
                outcomesTitle: t("intro.outcomesTitle"),
                requiresTitle: t("intro.requiresTitle"),
                requiresNote: t("intro.requiresNote"),
                figuresLabel: t("intro.figuresLabel"),
                empty: t("intro.empty"),
            },
            words: {
                entry: t("intro.entry"),
                summary: (counts) => t("intro.summary", counts),
                service: (part) =>
                    [
                        part.role,
                        part.db === "" ? "" : t("intro.serviceDb", { db: part.db }),
                        part.uses === "" ? "" : t("intro.serviceUses", { uses: part.uses }),
                    ]
                        .filter((each) => each !== "")
                        .join(" · "),
                dep: (part) => [part.role, part.image].filter((each) => each !== "").join(" · "),
                outcomeFile: (file) => t("intro.outcomeFile", { file }),
                outcomeCase: (title) => t("intro.outcomeCase", { title }),
                legendLearner: (file) => t("intro.legendLearner", { file }),
                happyTerm: t("intro.happyTerm"),
                unhappyTerm: t("intro.unhappyTerm"),
                servicesTerm: t("intro.servicesTerm"),
            },
        },
        pattern: {
            labels: {
                lead: t("pattern.lead"),
                diagramTitle: t("pattern.diagramTitle"),
                diagramLabel: t("pattern.diagramLabel"),
                diagramError: t("pattern.diagramError"),
                stepsTitle: t("pattern.stepsTitle"),
                stepsNote: t("pattern.stepsNote"),
                stepsEmpty: t("pattern.stepsEmpty"),
                mapTitle: t("pattern.mapTitle"),
                mapNote: t("pattern.mapNote"),
                mapFrom: t("pattern.mapFrom"),
                mapTo: t("pattern.mapTo"),
                mapEmpty: t("pattern.mapEmpty"),
            },
            words: { entry: t("intro.entry"), greenLabel: t("pattern.green"), openLabel: t("pattern.open") },
        },
    }
}
