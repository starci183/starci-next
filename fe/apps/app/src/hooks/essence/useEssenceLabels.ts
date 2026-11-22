"use client"

import { useTranslations } from "next-intl"
import type { EssenceLabels } from "@starci-next/ui"
import { useLessonJourneyLabels } from "@/hooks/lessonStudy"
import type { EssenceWords } from "./essence.shared"

/** The words of the lesson page header and the end of the lesson that are not a part's own. */
export type EssenceShellLabels = {
    /** The commands of the header: on to Bản chất, on to Tìm sạn, copy the run command, see the plans. */
    readonly toReading: string
    readonly toBugs: string
    readonly copyRun: string
    readonly upgrade: string
    /** Opens GitHub on the folder of Pattern; the line under it while there is no folder. */
    readonly github: string
    readonly githubSoon: (stack: string) => string
    /** "Xem tổng kết": on from Pattern to the end of the lesson. */
    readonly toEnd: string
    readonly nextLesson: (title: string) => string
    readonly lockedDescription: string
    readonly lockedCompare: string
    readonly lockedEyebrow: string
    readonly lockedTitle: (part: string) => string
    /** The meta line of the header: topic, minutes, parts done and the figure of the part on screen. */
    readonly meta: (topic: string, minutes: number, done: number, total: number) => string
    readonly metaBugs: (passed: number, total: number) => string
    readonly metaApply: (done: number, total: number) => string
    readonly metaReading: (minutes: number) => string
    readonly rail: {
        readonly label: string
        readonly open: string
        readonly summary: (n: number, total: number, part: string, note: string) => string
        readonly questions: (solved: number, total: number) => string
        readonly questionsDone: (total: number, first: number) => string
        readonly readingNote: string
        readonly readingDone: string
        readonly bugsNote: (bugs: number, tests: number) => string
        readonly bugsProgress: (passed: number, total: number) => string
        readonly applyNote: string
        readonly applyProgress: (done: number, total: number) => string
        readonly patternNote: string
        readonly patternDone: string
        readonly premium: string
    }
    readonly end: {
        readonly title: (lesson: string) => string
        readonly summary: string
        readonly before: string
        readonly after: string
        readonly essence: string
        readonly review: string
        readonly figureBefore: string
        readonly figureAfter: string
        readonly figureLevel: string
        readonly right: string
        readonly wrong: (n: number) => string
        readonly bug: (n: number) => string
        readonly pending: string
        readonly levelNone: string
    }
}

/** The translator of the part's own message tree. */
type Translate = ReturnType<typeof useTranslations>

/** The static words of the opener and its result. */
const labelsOf = (t: Translate, markdown: EssenceLabels["markdown"]): EssenceLabels => ({
    markdown,
    opener: {
        barLabel: t("opener.barLabel"),
        hint: t("opener.hint"),
        empty: t("opener.empty"),
        sendFailed: t("opener.sendFailed"),
        retry: t("opener.retry"),
        grading: t("opener.grading"),
        wrongMark: t("opener.wrongMark"),
        rightMark: t("opener.rightMark"),
        again: t("opener.again"),
        essence: t("opener.essence"),
        interview: t("opener.interview"),
        more: t("opener.more"),
        next: t("opener.next"),
        finish: t("opener.finish"),
        why: t("opener.why"),
        correct: t("opener.correct"),
        picked: t("opener.picked"),
        readMore: t("opener.readMore"),
    },
    result: {
        solvedLabel: t("result.solvedLabel"),
        firstTryLabel: t("result.firstTryLabel"),
        listTitle: t("result.listTitle"),
        firstTry: t("result.firstTry"),
        missedTimes: (n) => t("result.missedTimes", { n }),
        retake: t("result.retake"),
        freeTitle: t("result.freeTitle"),
        freeText: t("result.freeText"),
        upgrade: t("shell.upgrade"),
    },
})

/** The words of the lesson shell: the header commands, the meta line, the rail, the locked part and the end. */
const shellOf = (t: Translate): EssenceShellLabels => ({
    toReading: t("shell.toReading"),
    toBugs: t("shell.toBugs"),
    copyRun: t("shell.copyRun"),
    upgrade: t("shell.upgrade"),
    github: t("shell.github"),
    githubSoon: (stack) => t("shell.githubSoon", { stack }),
    toEnd: t("shell.toEnd"),
    nextLesson: (title) => t("shell.nextLesson", { title }),
    lockedDescription: t("locked.description"),
    lockedCompare: t("locked.compare"),
    lockedEyebrow: t("locked.eyebrow"),
    lockedTitle: (part) => t("locked.title", { part }),
    meta: (topic, minutes, done, total) => t("shell.meta", { topic, minutes, done, total }),
    metaBugs: (passed, total) => t("shell.metaBugs", { passed, total }),
    metaApply: (done, total) => t("shell.metaApply", { done, total }),
    metaReading: (minutes) => t("shell.metaReading", { minutes }),
    rail: {
        label: t("rail.label"),
        open: t("rail.open"),
        summary: (n, total, part, note) => t("rail.summary", { n, total, part, note }),
        questions: (solved, total) => t("rail.questions", { solved, total }),
        questionsDone: (total, first) => t("rail.questionsDone", { total, first }),
        readingNote: t("rail.readingNote"),
        readingDone: t("rail.readingDone"),
        bugsNote: (bugs, tests) => t("rail.bugsNote", { bugs, tests }),
        bugsProgress: (passed, total) => t("rail.bugsProgress", { passed, total }),
        applyNote: t("rail.applyNote"),
        applyProgress: (done, total) => t("rail.applyProgress", { done, total }),
        patternNote: t("rail.patternNote"),
        patternDone: t("rail.patternDone"),
        premium: t("rail.premium"),
    },
    end: {
        title: (lesson) => t("end.title", { lesson }),
        summary: t("end.summary"),
        before: t("end.before"),
        after: t("end.after"),
        essence: t("end.essence"),
        review: t("end.review"),
        figureBefore: t("end.figureBefore"),
        figureAfter: t("end.figureAfter"),
        figureLevel: t("end.figureLevel"),
        right: t("end.right"),
        wrong: (n) => t("end.wrong", { n }),
        bug: (n) => t("end.bug", { n }),
        pending: t("end.pending"),
        levelNone: t("end.levelNone"),
    },
})

/** Every word of the essence part (Mở đầu) and of the lesson shell around it, resolved once. */
export const useEssenceLabels = (): {
    readonly labels: EssenceLabels
    readonly words: EssenceWords
    readonly shell: EssenceShellLabels
} => {
    const t = useTranslations("app.essentials.essential.essence")
    const journey = useLessonJourneyLabels()
    return {
        labels: labelsOf(t, journey.markdown),
        words: {
            caption: (n, total, at) => t("caption", { n, total, at }),
            captionPlain: (n, total) => t("captionPlain", { n, total }),
            retakeLine: (right, total, before) => t("result.retakeLine", { right, total, before }),
            readSection: (n) => t("opener.readSection", { n }),
            seeScenario: (title) => t("opener.seeScenario", { title }),
        },
        shell: shellOf(t),
    }
}
