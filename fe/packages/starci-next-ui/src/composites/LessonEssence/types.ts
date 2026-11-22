import type { MarkdownLabels } from "@starci/grammar/common"
import type { QuestionLink, QuestionStatus } from "../EssentialParts/types"

/** One opener question as the essence part draws it: the words, the pick and, once graded, the verdict with the right option. */
export type EssenceQuestionView = {
    /** The activity id the pick is submitted under. */
    readonly id: string
    readonly prompt: string
    readonly choices: ReadonlyArray<{ readonly id: string; readonly label: string }>
    readonly pickedId: string
    /** The option the grade named as right; empty before the grade. */
    readonly correctId: string
    readonly status: QuestionStatus
    readonly isSendFailed: boolean
    readonly isCorrect: boolean
    /** The explanation the grade released for the pick; empty before. */
    readonly explanation: string
    /** Where to read or see more after a wrong answer. */
    readonly links: ReadonlyArray<QuestionLink>
    /** The wrong picks of the question, locked, each with why it is wrong (the story opener lets the learner pick again). */
    readonly misses: ReadonlyArray<EssenceMiss>
    /** True once the learner picked the right option. */
    readonly isSolved: boolean
    /** The three-part explanation the right pick released; undefined before, or for a question without one (`explanation` stands in). */
    readonly insight: EssenceInsight | undefined
    /** Once solved: every option with its one reason, in the order of the choices (the right one marked); empty before. */
    readonly reasons: ReadonlyArray<EssenceReason>
    /** The development of the story this question adds (`00:00` and its words); undefined for a challenge question. */
    readonly event: { readonly at: string; readonly text: string } | undefined
}

/** The reason of one option, released once the question is solved. */
export type EssenceReason = {
    readonly optionId: string
    readonly label: string
    readonly isCorrect: boolean
    readonly explanation: string
}

/** One wrong pick of a question: the option, locked, and why it is wrong. */
export type EssenceMiss = { readonly optionId: string; readonly explanation: string }

/** The three-part explanation of a right pick. */
export type EssenceInsight = { readonly essence: string; readonly why: string; readonly interview: string }

/** The situation the opener tells. */
export type EssenceStory = { readonly title: string; readonly body: string }

/** One segment of the five-answer bar: how that question stands (right is complete, wrong is error). */
export type EssenceBarPart = {
    readonly id: string
    /** The time of the question in the story (`00:12`), the label under its segment. */
    readonly label: string
    /** Green: right on the first pick. Amber: needed a retry (solved or not yet). Neutral: not answered. */
    readonly tone: "success" | "warning" | "neutral"
    /** True for the question on screen. */
    readonly isCurrent: boolean
}

/** One row of the result: a development of the story, its essence and how the learner fared on it. */
export type EssenceResultRow = {
    readonly id: string
    /** The time in the story (`23:58`). */
    readonly at: string
    /** The essence the question teaches (its insight), or its prompt before one was released. */
    readonly text: string
    /** True when the first pick was right. */
    readonly isFirstTry: boolean
    /** The picks that were wrong before the right one. */
    readonly misses: number
    /** Where to read it again after a retry; undefined when the first pick was right or the lesson names none. */
    readonly link: { readonly label: string; readonly href: string } | undefined
}

/** Which of its two screens the part shows: the questions one at a time, or the result of the five. */
export type EssenceStage = "questions" | "result"

/** The essence part as drawn, every word resolved. */
export type EssenceView = {
    readonly stage: EssenceStage
    /** The one situation the five questions share; undefined for a lesson written before the story. */
    readonly story: EssenceStory | undefined
    /** True once every question is picked right: the opener is passed. */
    readonly isPassed: boolean
    readonly questions: ReadonlyArray<EssenceQuestionView>
    /** The question on screen. */
    readonly index: number
    readonly bar: ReadonlyArray<EssenceBarPart>
    /** "Question 2/5 · 00:00", the line above the question. */
    readonly caption: string
    /** The solved questions as the result lists them. */
    readonly resultRows: ReadonlyArray<EssenceResultRow>
    /** "5/5": the questions solved. */
    readonly solvedFigure: string
    /** "3/5": the questions right on the first pick. */
    readonly firstTryFigure: string
    /** True when the reader has no Premium: the end of part 1 says what the other parts need. */
    readonly isFree: boolean
    /** "Again: 5/5 (before 3/5)" once the learner answered the five again; empty before. */
    readonly retakeLine: string
}

/** Every word of the essence part (Mở đầu). */
export type EssenceLabels = {
    readonly markdown: MarkdownLabels
    readonly opener: {
        readonly barLabel: string
        readonly hint: string
        readonly empty: string
        readonly sendFailed: string
        readonly retry: string
        readonly grading: string
        /** The mark of a wrong pick ("Sai") and of the right pick ("Đúng"). */
        readonly wrongMark: string
        readonly rightMark: string
        /** The line under the options after a wrong pick: pick again. */
        readonly again: string
        /** The two lines a right pick opens with, and the title of the reasons of every option. */
        readonly essence: string
        readonly interview: string
        /** The fold of the longer story behind a right pick. */
        readonly more: string
        /** The command to the next question, and after the last one to the result. */
        readonly next: string
        readonly finish: string
        /** The explanation of the right pick when the question ships no insight. */
        readonly why: string
        /** The words of a challenge's essence question (graded in place): the right option, the learner's pick, where to read on. */
        readonly correct: string
        readonly picked: string
        readonly readMore: string
    }
    readonly result: {
        readonly solvedLabel: string
        readonly firstTryLabel: string
        readonly listTitle: string
        readonly firstTry: string
        readonly missedTimes: (n: number) => string
        readonly retake: string
        readonly freeTitle: string
        readonly freeText: string
        readonly upgrade: string
    }
}
