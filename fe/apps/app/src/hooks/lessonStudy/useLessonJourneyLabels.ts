"use client"

import { useTranslations } from "next-intl"
import type {
    LessonCompareLabels,
    LessonCompletionLabels,
    LessonNavLabels,
    LessonProgressLabels,
    LessonResultLabels,
    MarkdownLabels,
} from "@/modules/types"

/** The words of the journey through a lesson: the stepper and the previous and next controls, the result and comparison cards, the completion card and the aside. */
type LessonJourneyLabels = {
    readonly nav: LessonNavLabels
    readonly result: LessonResultLabels
    readonly lessonCompare: LessonCompareLabels
    readonly completion: LessonCompletionLabels
    readonly progress: LessonProgressLabels
    readonly markdown: MarkdownLabels
    readonly filesOpen: string
    readonly filesClose: string
    readonly filesDownload: (language: string) => string
}

/** A number as two digits. */
const twoDigits = (n: number): string => String(n).padStart(2, "0")

/** A due date as day and month (`02/12`). */
const dateOf = (iso: string): string => {
    const date = new Date(iso)
    return Number.isNaN(date.getTime()) ? "" : `${twoDigits(date.getDate())}/${twoDigits(date.getMonth() + 1)}`
}

/** The words of the aside, the markdown body and the files card. */
const useLessonAsideLabels = (): Pick<
    LessonJourneyLabels,
    "progress" | "markdown" | "filesOpen" | "filesClose" | "filesDownload"
> => {
    const t = useTranslations("app.essentials")
    return {
        progress: {
            title: t("progress.title"),
            outcomes: t("progress.outcomes"),
            outcomeStates: {
                none: t("progress.outcomeNone"),
                learning: t("progress.outcomeLearning"),
                understood: t("progress.outcomeUnderstood"),
                review: t("progress.outcomeReview"),
            },
            rule: t("progress.rule"),
            phases: t("progress.phases"),
            phaseStatus: {
                none: t("progress.statusNone"),
                saved: t("progress.statusSaved"),
                correct: t("progress.statusCorrect"),
                wrong: t("progress.statusWrong"),
                graded: t("progress.statusGraded"),
            },
            saved: t("progress.statusGraded"),
            checksTitle: t("progress.checksTitle"),
            checkRow: (n) => t("progress.checkRow", { n }),
            checkStatus: {
                none: t("progress.checkNone"),
                correct: t("progress.checkCorrect"),
                wrong: t("progress.checkWrong"),
            },
            reviews: t("progress.reviews"),
            reviewsLocked: t("progress.reviewsLocked"),
            reviewAfter: (days) => t("progress.reviewAfter", { days }),
            dateOf,
        },
        markdown: {
            copy: t("markdown.copy"),
            copied: t("markdown.copied"),
            copyError: t("markdown.copyError"),
            diagram: t("markdown.diagram"),
            diagramError: t("markdown.diagramError"),
            table: t("markdown.table"),
            taskDone: t("markdown.taskDone"),
            taskOpen: t("markdown.taskOpen"),
            externalHint: t("markdown.externalHint"),
        },
        filesOpen: t("files.open"),
        filesClose: t("files.close"),
        filesDownload: (language) => t("files.download", { language }),
    }
}

/** Resolves the words of the journey through a lesson once. */
export const useLessonJourneyLabels = (): LessonJourneyLabels => {
    const t = useTranslations("app.essentials")
    const levels = [t("levels.none"), t("levels.half"), t("levels.reached")] as const
    return {
        nav: {
            stepper: t("nav.stepper"),
            stepStates: { done: t("nav.stepDone"), current: t("nav.stepCurrent"), later: t("nav.stepLater") },
            phaseOf: (n, total) => t("nav.phaseOf", { n, total }),
            sectionOf: (n, total) => t("nav.sectionOf", { n, total }),
            free: t("nav.free"),
            previousPhase: t("nav.previousPhase"),
            nextPhase: (title) => t("nav.nextPhase", { title }),
            previousSection: t("nav.previousSection"),
            nextSection: (n, title) => t("nav.nextSection", { n, title }),
            nextLesson: t("nav.nextLesson"),
        },
        result: {
            title: t("result.title"),
            savedAt: (time) => t("result.savedAt", { time }),
            missing: t("result.missing"),
            levels,
            diagnosticNote: t("result.diagnosticNote"),
            why: t("result.why"),
            check: t("result.check"),
        },
        lessonCompare: {
            title: t("compareTable.title"),
            criterion: t("compareTable.criterion"),
            before: t("compareTable.before"),
            after: t("compareTable.after"),
            why: t("compareTable.why"),
            none: t("compareTable.none"),
            levels,
            same: t("compareTable.same"),
            better: t("compareTable.better"),
            worse: t("compareTable.worse"),
            missing: t("compareTable.missing"),
            empty: t("compareTable.empty"),
        },
        completion: {
            title: t("completion.title"),
            done: (lesson) => t("completion.done", { lesson }),
            reviewsOpen: t("completion.reviewsOpen"),
            reviewsLink: t("completion.reviewsLink"),
            project: t("completion.project"),
            projectLink: t("completion.projectLink"),
        },
        ...useLessonAsideLabels(),
    }
}
