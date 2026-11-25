"use client"

import { useTranslations } from "next-intl"
import type { CoursePage } from "@/modules/course-lesson"

/** A notice above a page: what is the case, what to do about it and the one way to do it. */
export type CourseNoticeWords = {
    readonly title: string
    readonly text: string
    readonly action: string
}

/** The words around the pages: the header band, the page tabs, the leads of the lab pages, the notices of a page reached early and of a hint that failed. */
export type CourseShellLabels = {
    readonly title: (lab: string) => string
    /** The one line under the title of the first page: what the lab is, with how many cases the learner makes pass. */
    readonly description: (total: number) => string
    readonly meta: (counts: {
        readonly services: number
        readonly happy: number
        readonly unhappy: number
        readonly green: number
        readonly total: number
    }) => string
    readonly breadcrumbs: string
    readonly essentials: string
    readonly tabsLabel: string
    readonly pages: Readonly<Record<CoursePage, string>>
    /** The command that goes on from a page; the last page has none. */
    readonly next: Readonly<Partial<Record<CoursePage, string>>>
    readonly upgrade: string
    readonly signIn: string
    /** The line under the notice a reader without the plan, or not signed in, sees instead of the lesson. */
    readonly forbiddenGuest: string
    readonly forbiddenPremium: string
    readonly errorText: string
    readonly setupLead: string
    /** What a page reached before the one it needs says; `count` is how many cases are not green yet. */
    readonly missing: {
        readonly setup: CourseNoticeWords
        readonly happy: (count: number) => CourseNoticeWords
        readonly unhappy: (count: number) => CourseNoticeWords
        readonly submit: (count: number) => CourseNoticeWords
    }
    readonly hintFailure: {
        readonly premium: CourseNoticeWords
        readonly other: CourseNoticeWords
        readonly dismiss: string
    }
}

/** Resolves the words around the pages once. */
export const useCourseShellLabels = (): CourseShellLabels => {
    const t = useTranslations("app.courseLesson")
    return {
        title: (lab) => t("shell.title", { lab }),
        description: (total) => t("shell.description", { total }),
        meta: (counts) => t("shell.meta", counts),
        breadcrumbs: t("shell.breadcrumbs"),
        essentials: t("shell.essentials"),
        tabsLabel: t("shell.tabsLabel"),
        pages: {
            intro: t("pages.intro"),
            setup: t("pages.setup"),
            happy: t("pages.happy"),
            unhappy: t("pages.unhappy"),
            pattern: t("pages.pattern"),
            submit: t("pages.submit"),
        },
        next: {
            intro: t("next.intro"),
            happy: t("next.happy"),
        },
        upgrade: t("shell.upgrade"),
        signIn: t("shell.signIn"),
        forbiddenGuest: t("shell.forbiddenGuest"),
        forbiddenPremium: t("shell.forbiddenPremium"),
        errorText: t("error.text"),
        setupLead: t("lead.setup"),
        missing: {
            setup: { title: t("missing.setupTitle"), text: t("missing.setupText"), action: t("missing.setupAction") },
            happy: (count) => ({
                title: t("missing.happyTitle", { count }),
                text: t("missing.happyText"),
                action: t("missing.happyAction"),
            }),
            unhappy: (count) => ({
                title: t("missing.unhappyTitle", { count }),
                text: t("missing.unhappyText"),
                action: t("missing.unhappyAction"),
            }),
            submit: (count) => ({
                title: t("missing.submitTitle", { count }),
                text: t("missing.submitText"),
                action: t("missing.submitAction"),
            }),
        },
        hintFailure: {
            premium: {
                title: t("hintFailure.premiumTitle"),
                text: t("hintFailure.premiumText"),
                action: t("hintFailure.premiumAction"),
            },
            other: { title: t("hintFailure.otherTitle"), text: t("hintFailure.otherText"), action: "" },
            dismiss: t("hintFailure.dismiss"),
        },
    }
}
