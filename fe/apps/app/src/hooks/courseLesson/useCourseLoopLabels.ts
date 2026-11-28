"use client"

import { useTranslations } from "next-intl"
import type { CourseCaseLoopLabels } from "@starci-next/ui"
import type { CourseLoopKind, CourseLoopWords } from "@/modules/course-lesson"
import { useCourseNarrationWords } from "./useCourseNarrationWords"

/** The words of the two loop pages: the labels a loop draws with and the words its builders need. */
export type CourseLoopLabels = {
    readonly words: CourseLoopWords
    /** The labels of one loop, with how many of its cases are green. */
    readonly labelsOf: (kind: CourseLoopKind, green: number, total: number) => CourseCaseLoopLabels
}

/** Resolves every word of the happy and unhappy loops once. */
export const useCourseLoopLabels = (): CourseLoopLabels => {
    const t = useTranslations("app.courseLesson")
    const narration = useCourseNarrationWords()
    const words: CourseLoopWords = {
        status: {
            green: t("status.green"),
            red: t("status.red"),
            error: t("status.error"),
            open: t("status.open"),
            locked: t("status.locked"),
        },
        lockedNote: {
            happy: t("loop.lockedNoteHappy"),
            firstQuestion: t("loop.lockedNoteFirst"),
            question: t("loop.lockedNote"),
        },
        runTitle: t("loop.runTitle"),
        runNote: t("loop.runNote"),
        diffTitle: t("loop.diffTitle"),
        diffNote: t("loop.diffNote"),
        resetTitle: t("loop.resetTitle"),
        resetNote: t("loop.resetNote"),
        resetWarning: (caseId) => t("loop.resetWarning", { caseId }),
        hintTitle: (level) => t("loop.hintTitle", { level }),
        happyIntro: t("loop.happyIntro"),
        unhappyIntro: t("loop.unhappyIntro"),
        progress: (kind, green, total) =>
            kind === "happy" ? t("loop.happyProgress", { green, total }) : t("loop.unhappyProgress", { green, total }),
        narration,
    }
    const labelsOf = (kind: CourseLoopKind, green: number, total: number): CourseCaseLoopLabels => ({
        listTitle: kind === "happy" ? t("loop.happyTitle", { green, total }) : t("loop.unhappyTitle", { green, total }),
        empty: t("loop.empty"),
        situationTitle: t("loop.situationTitle"),
        checkTitle: t("loop.checkTitle"),
        stuckTitle: t("loop.stuckTitle"),
        invariantsTitle: t("loop.invariantsTitle"),
        noInvariants: t("loop.noInvariants"),
        chaosTitle: t("loop.chaosTitle"),
        noChaos: t("loop.noChaos"),
        hintsTitle: t("loop.hintsTitle"),
        openHint: (level) => t("loop.openHint", { level }),
        copy: { copy: t("copy.copy"), copied: t("copy.copied"), copyFailed: t("copy.failed") },
        beforeAfter: {
            storyTitle: t("loop.beforeAfter.storyTitle"),
            brokenTitle: t("loop.beforeAfter.brokenTitle"),
            fixTitle: t("loop.beforeAfter.fixTitle"),
            fixLocked: t("loop.beforeAfter.fixLocked"),
            beforeTitle: t("loop.beforeAfter.beforeTitle"),
            afterTitle: t("loop.beforeAfter.afterTitle"),
            resultLabel: t("loop.beforeAfter.resultLabel"),
            gainLabel: t("loop.beforeAfter.gainLabel"),
            ideaTitle: t("loop.beforeAfter.ideaTitle"),
        },
    })
    return { words, labelsOf }
}
