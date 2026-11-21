import type { MarkdownLabels } from "@starci/grammar/common"
import type { ArticleSectionView, QuestionLink, QuestionStatus } from "../EssentialParts/types"

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
}

/** One wrong pick of a question: the option, locked, and why it is wrong. */
export type EssenceMiss = { readonly optionId: string; readonly explanation: string }

/** The three-part explanation of a right pick. */
export type EssenceInsight = { readonly essence: string; readonly why: string; readonly interview: string }

/** One development of the opener story on its timeline. */
export type EssenceStoryEvent = {
    readonly id: string
    /** When it happens (`21:03`). */
    readonly at: string
    readonly text: string
    /** True for the development of the question on screen. */
    readonly isCurrent: boolean
}

/** The situation the opener tells. */
export type EssenceStory = { readonly title: string; readonly body: string }

/** One segment of the five-answer bar: how that question stands (right is complete, wrong is error). */
export type EssenceBarPart = {
    readonly id: string
    /** "Question 2"; the segment of the question on screen carries the position line instead ("Question 2/5 · 1 right"). */
    readonly label: string
    readonly state: "complete" | "error" | "current" | "upcoming"
    /** True for the question on screen: its label is the caption under the bar. */
    readonly isCurrent: boolean
}

/** One row of the contents of the article. */
export type EssenceTocRow = {
    readonly id: string
    readonly title: string
    readonly href: string
    /** True when a wrong opener answer pointed here ("read closely"). */
    readonly isFlagged: boolean
    /** True once the learner marked the section read. */
    readonly isRead: boolean
}

/** One of the four parts as the journey block lists it. */
export type EssenceJourneyRow = {
    readonly id: string
    readonly title: string
    readonly isCurrent: boolean
    readonly isLocked: boolean
    readonly isDone: boolean
}

/** Which of its three screens the part shows: the questions one at a time, the result of the five, or the article. */
export type EssenceStage = "questions" | "result" | "article"

/** The essence part as drawn, every word resolved. */
export type EssenceView = {
    readonly stage: EssenceStage
    /** The situation the opener tells; undefined for a lesson written before the story. */
    readonly story: EssenceStory | undefined
    /** The developments so far: one per question up to the one on screen, which is current. */
    readonly timeline: ReadonlyArray<EssenceStoryEvent>
    /** True once every question is picked right: the opener is passed. */
    readonly isPassed: boolean
    readonly questions: ReadonlyArray<EssenceQuestionView>
    /** The question on screen. */
    readonly index: number
    readonly bar: ReadonlyArray<EssenceBarPart>
    /** "3/5 right", the title of the result. */
    readonly resultTitle: string
    /** The sentence under it: which sections are flagged, or that nothing is. */
    readonly resultText: string
    /** "Again: 5/5 (before 3/5)" once the learner answered the five again; empty before. */
    readonly retakeLine: string
    readonly toc: ReadonlyArray<EssenceTocRow>
    /** "Article · 20 min read". */
    readonly articleEyebrow: string
    readonly sections: ReadonlyArray<ArticleSectionView>
    readonly journey: ReadonlyArray<EssenceJourneyRow>
    /** True when the reader has no Premium: the end of part 1 says what the other parts need. */
    readonly isFree: boolean
}

/** Every word of the essence part and its aside. */
export type EssenceLabels = {
    readonly markdown: MarkdownLabels
    readonly opener: {
        readonly eyebrow: string
        readonly barLabel: string
        readonly hint: string
        readonly empty: string
        readonly correct: string
        readonly picked: string
        readonly why: string
        readonly sendFailed: string
        readonly retry: string
        readonly grading: string
        readonly readMore: string
        /** The name of the story timeline. */
        readonly timeline: string
        /** The mark of a wrong pick ("Sai") and the title of why ("Vì sao sai"). */
        readonly wrongMark: string
        readonly wrongTitle: string
        /** The line under the options after a wrong pick: pick again. */
        readonly again: string
        /** The mark of the right pick ("Đúng") and the title of its panel. */
        readonly rightMark: string
        readonly rightTitle: string
        /** The three parts of the insight. */
        readonly essence: string
        readonly need: string
        readonly interview: string
        /** The command to the next development of the story, and after the last question to the result. */
        readonly next: string
        readonly finish: string
    }
    readonly result: {
        readonly eyebrow: string
        /** The title of the result once every question is picked right ("Pass phần mở đầu"). */
        readonly passed: string
        readonly readArticle: string
        readonly review: string
        readonly freeTitle: string
        readonly freeText: string
    }
    readonly toc: { readonly title: string; readonly flagged: string }
    readonly article: { readonly locked: string; readonly empty: string }
    readonly aside: {
        readonly journeyTitle: string
        readonly journeyNote: string
        readonly retakeTitle: string
        readonly retakeText: string
        readonly lockedPart: string
    }
}
