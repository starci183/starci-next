"use client"

import { useTranslations } from "next-intl"
import type { CourseAuditLabels, CourseIntroLabels, CoursePatternLabels, CourseProductionLabels } from "@starci-next/ui"
import { useCourseArchitectureLabels, type CourseArchitecturePageLabels } from "./useCourseArchitectureLabels"
import { useCourseNarrationWords } from "./useCourseNarrationWords"
import type { CourseAuditWords, CourseIntroWords, CoursePatternWords, CourseProductionWords } from "@/modules/course-lesson"

/** The words of the intro, the naming and the comparison: what each draws with and what its builder needs. */
export type CoursePageLabels = {
    readonly intro: { readonly labels: CourseIntroLabels; readonly words: CourseIntroWords }
    readonly pattern: { readonly labels: CoursePatternLabels; readonly words: CoursePatternWords }
    readonly production: { readonly labels: CourseProductionLabels; readonly words: CourseProductionWords }
    readonly architecture: CourseArchitecturePageLabels
    /** The dev-only Audit tab: what it draws with and what its builders map the record's codes onto. */
    readonly audit: { readonly labels: CourseAuditLabels; readonly words: CourseAuditWords }
}

/** Resolves every word of the intro page, of the recap page (page 6), of the gift repos of the submit page and of the Audit tab once. */
export const useCoursePageLabels = (): CoursePageLabels => {
    const t = useTranslations("app.courseLesson")
    const architecture = useCourseArchitectureLabels()
    const narration = useCourseNarrationWords()
    return {
        architecture,
        audit: {
            labels: {
                emptyTitle: t("audit.emptyTitle"),
                emptyText: t("audit.emptyText"),
                pagesTitle: t("audit.pagesTitle"),
                casesTitle: t("audit.casesTitle"),
                questionLabel: t("audit.questionLabel"),
                conditionsLabel: t("audit.conditionsLabel"),
                hintsLabel: t("audit.hintsLabel"),
                expectedTitle: t("audit.expectedTitle"),
                expectedEmpty: t("audit.expectedEmpty"),
                learnsLabel: t("audit.learnsLabel"),
                shiftLabel: t("audit.shiftLabel"),
                interviewLabel: t("audit.interviewLabel"),
                topTitle: t("audit.topTitle"),
                allTitle: t("audit.allTitle"),
                findingsEmpty: t("audit.findingsEmpty"),
                whyLabel: t("audit.whyLabel"),
                fixLabel: t("audit.fixLabel"),
            },
            words: {
                verdict: { de: t("audit.verdict.de"), vap: t("audit.verdict.vap"), matDau: t("audit.verdict.mat-dau") },
                kind: { lint: t("audit.kind.lint"), edit: t("audit.kind.bien-tap") },
                status: { open: t("audit.status.open"), fixed: t("audit.status.fixed"), deferred: t("audit.status.deferred") },
                impact: { high: t("audit.impact.high"), medium: t("audit.impact.medium"), low: t("audit.impact.low") },
                caseKind: { happy: t("audit.caseKind.happy"), unhappy: t("audit.caseKind.unhappy") },
                mechanicalTitle: t("audit.mechanicalTitle"),
                mechanicalText: t("audit.mechanicalText"),
                guessTitle: t("audit.guessTitle"),
                rail: {
                    title: t("audit.rail.title"),
                    findingsOpen: t("audit.rail.findingsOpen"),
                    findingsFixed: t("audit.rail.findingsFixed"),
                    lint: t("audit.rail.lint"),
                    edit: t("audit.rail.edit"),
                    casesHigh: t("audit.rail.casesHigh"),
                    casesMedium: t("audit.rail.casesMedium"),
                    casesLow: t("audit.rail.casesLow"),
                    mechanical: t("audit.rail.mechanical"),
                    checked: t("audit.rail.checked"),
                    readerTitle: t("audit.rail.readerTitle"),
                    prerequisitesTitle: t("audit.rail.prerequisitesTitle"),
                },
            },
        },
        intro: {
            labels: {
                architectureTitle: t("intro.architectureTitle"),
                diagramLabel: t("intro.diagramLabel"),
                diagramError: t("intro.diagramError"),
                diagramCaption: t("intro.diagramCaption"),
                diagramCalls: t("intro.diagramCalls"),
                diagramData: t("intro.diagramData"),
                diagramEdit: t("intro.diagramEdit"),
                diagramTo: t("intro.diagramTo"),
                servicesTitle: t("intro.servicesTitle"),
                outcomesTitle: t("intro.outcomesTitle"),
                requiresTitle: t("intro.requiresTitle"),
                requiresNote: t("intro.requiresNote"),
                empty: t("intro.empty"),
            },
            words: {
                entry: t("intro.entry"),
                frame: t("intro.frame"),
                ownDb: (service) => t("intro.ownDb", { service }),
                outcomeCase: (title) => t("intro.outcomeCase", { title }),
                explainerAlt: (title) => t("intro.explainerAlt", { title }),
                labTitle: t("intro.labTitle"),
                labFigure: (green, total) => t("intro.labFigure", { green, total }),
                labMeta: (counts) => t("intro.labMeta", counts),
                labMore: (count) => t("intro.labMore", { count }),
                labStart: t("intro.labStart"),
                labCaption: (total) => t("intro.labCaption", { total }),
                narration,
            },
        },
        pattern: {
            labels: {
                conceptTitle: t("pattern.conceptTitle"),
                conceptNote: t("pattern.conceptNote"),
                stepsTitle: t("pattern.stepsTitle"),
                stepsNote: t("pattern.stepsNote"),
                englishNote: t("pattern.englishNote"),
                stepsEmpty: t("pattern.stepsEmpty"),
                answerTitle: t("pattern.answerTitle"),
                didLabel: t("pattern.didLabel"),
                gainLabel: t("pattern.gainLabel"),
                lockedNote: t("pattern.lockedNote"),
            },
            words: {
                lead: t("pattern.lead"),
                greenLabel: t("pattern.green"),
                openLabel: t("pattern.open"),
                labTitle: t("pattern.labTitle"),
                labStart: t("pattern.labStart"),
                labCaption: (total) => t("pattern.labCaption", { total }),
                narration,
            },
        },
        production: {
            labels: {
                title: t("production.title"),
                lead: t("production.lead"),
                standardTitle: t("production.standardTitle"),
                soon: t("production.soon"),
                stackLabel: t("production.stackLabel"),
                libsLabel: t("production.libsLabel"),
                commandLabel: t("production.commandLabel"),
                reposTitle: t("production.reposTitle"),
                reposNote: t("production.reposNote"),
                reposEmpty: t("production.reposEmpty"),
                beyondTitle: t("production.beyondTitle"),
                externalHint: t("production.externalHint"),
                copy: t("copy.copy"),
                copied: t("copy.copied"),
                copyFailed: t("copy.failed"),
            },
            words: {
                repoMeta: (lang, checked) => t("production.repoMeta", { lang, checked: checked ?? "none" }),
                referenceMeta: (checked) => t("production.referenceMeta", { checked }),
            },
        },
    }
}
