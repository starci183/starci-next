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
        /** The progress bar of the rail ("Tiến độ", "1/5 phần · 40 phút"), the title of the questions under the part on screen and the word of a solved one. */
        readonly progress: string
        readonly progressText: (done: number, total: number, minutes: number) => string
        readonly questionsTitle: string
        readonly questionDone: string
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
        interview: t("opener.interview"),
        more: t("opener.more"),
        next: t("opener.next"),
        finish: t("opener.finish"),
        why: t("opener.why"),
        scenario: t("opener.scenario"),
        now: t("opener.now"),
        symptom: t("opener.symptom"),
        system: t("opener.system"),
        probe: t("opener.probe"),
        question: t("opener.question"),
        code: t("opener.code"),
        lines: (from, to) => t("opener.lines", { from, to }),
        overview: t("opener.overview"),
        glossary: t("opener.glossary"),
        technical: t("opener.technical"),
        situation: t("opener.situation"),
        happened: t("opener.happened"),
        faultStep: t("opener.faultStep"),
        root: t("opener.root"),
        fix: t("opener.fix"),
        cost: t("opener.cost"),
        beats: {
            symptom: t("opener.beats.symptom"),
            cause: t("opener.beats.cause"),
            fix: t("opener.beats.fix"),
            cost: t("opener.beats.cost"),
        },
        keyLines: (lines) => t("opener.keyLines", { lines }),
        noPenalty: t("opener.noPenalty"),
        hintAction: t("opener.hintAction"),
        pick: (key) => t("opener.pick", { key }),
        whyTitle: t("opener.whyTitle"),
        diagram: t("opener.diagram"),
        diagramError: t("opener.diagramError"),
        nextWait: t("opener.nextWait"),
        correct: t("opener.correct"),
        picked: t("opener.picked"),
        readMore: t("opener.readMore"),
        interviewerAsks: t("opener.interviewerAsks"),
        condition: t("opener.condition"),
        relatedSystem: t("opener.relatedSystem"),
        termsAside: t("opener.termsAside"),
        termsFold: (count) => t("opener.termsFold", { count }),
        inThisPart: t("opener.inThisPart"),
        whyNot: t("opener.whyNot"),
        pickHint: t("opener.pickHint"),
        retryHint: t("opener.retryHint"),
        copyAnswer: t("opener.copyAnswer"),
        answerOrder: t("opener.answerOrder"),
        nextUp: t("opener.nextUp"),
        questionNumber: (n) => t("opener.questionNumber", { n }),
        questionOf: (n, total) => t("opener.questionOf", { n, total }),
        progress: (n, total) => t("opener.progress", { n, total }),
    },
    result: {
        listTitle: t("result.listTitle"),
        firstTry: t("result.firstTry"),
        triedTimes: (n) => t("result.triedTimes", { n }),
        scoreCaption: t("result.scoreCaption"),
        title: t("result.title"),
        summary: (solved, total, first) => {
            if (first === total) return t("result.summaryAll", { solved })
            return first === 0 ? t("result.summaryNone", { solved }) : t("result.summarySome", { solved, total, first })
        },
        toNext: t("result.toNext"),
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
        progress: t("rail.progress"),
        progressText: (done, total, minutes) => t("rail.progressText", { done, total, minutes }),
        questionsTitle: t("rail.questionsTitle"),
        questionDone: t("rail.questionDone"),
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
