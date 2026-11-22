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
    /** A few words naming the moment (the header of the question and its line on the rail); empty when it ships none. */
    readonly title: string
    /** What is seen going wrong (Triệu chứng); empty when it ships none. */
    readonly symptom: string
    /** What the interviewer wants to know: the skill the question tests; empty when it ships none. */
    readonly probe: string
    /** The system the question touches, as a Mermaid flowchart drawn in the context; empty when it ships none. */
    readonly contextDiagram: string
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
export type EssenceInsight = {
    readonly essence: string
    readonly why: string
    readonly interview: string
    /** The one figure of the question as Mermaid text (sequence, flowchart or state diagram), shown only after the right pick; empty when none. */
    readonly diagram: string
    /** The demo code: lines of the lesson's source, shown only after the right pick; undefined when the question ships none. */
    readonly code: EssenceCode | undefined
}

/** The demo code of a question: the lines, their file, the number of the first line, the key lines and what to look at. */
export type EssenceCode = {
    readonly file: string
    readonly lang: string
    readonly start: number
    readonly highlight: ReadonlyArray<number>
    readonly code: string
    readonly note: string
}

/** The situation the opener tells, framed as a business: its line (domain, kind of shop, your role) and three key figures. */
export type EssenceStory = {
    readonly title: string
    readonly body: string
    readonly company: string
    readonly facts: ReadonlyArray<string>
}

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
    /** "Câu 2 / 5 · Mở đầu": the line of the header beside the time chip. */
    readonly caption: string
    /** The solved questions as the result lists them. */
    readonly resultRows: ReadonlyArray<EssenceResultRow>
    /** "5/5": the questions solved. */
    readonly solvedFigure: string
    /** "3/5": the questions right on the first pick. */
    readonly firstTryFigure: string
    /** The counts behind the two figures: solved, right on the first pick, and the questions of the opener. */
    readonly solvedCount: number
    readonly firstTryCount: number
    readonly total: number
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
        /** The mark on an option card after a pick: wrong ("Chưa đúng") and right ("Đúng"). */
        readonly wrongMark: string
        readonly rightMark: string
        /** The label of what to say in an interview ("Nói trong phỏng vấn"). */
        readonly interview: string
        /** The fold of the longer story behind a right pick. */
        readonly more: string
        /** The command to the next question, and after the last one to the result. */
        readonly next: string
        readonly finish: string
        /** The context card: its title ("Ngữ cảnh"), what is happening now ("Lúc này"), its result ("Kết quả"), the fold of the system it
         * touches ("Bối cảnh") and, after the right pick, what the interviewer wanted to know ("Người phỏng vấn muốn biết"). Its timeline is named by `barLabel`. */
        readonly scenario: string
        readonly now: string
        readonly symptom: string
        readonly system: string
        readonly probe: string
        /** The eyebrow of the question block ("Câu hỏi phỏng vấn"). */
        readonly question: string
        /** The section after "Vì sao": the demo code, its line range ("dòng 64–72") and its key lines ("dòng then chốt: 67, 72"). */
        readonly code: string
        readonly lines: (from: number, to: number) => string
        readonly keyLines: (lines: string) => string
        /** The line beside the pill: a wrong pick costs nothing, it only locks that option. */
        readonly noPenalty: string
        /** The hint command and the title of its panel. */
        readonly hintAction: string
        /** The command an option card is pressed with ("Chọn đáp án {key}"). */
        readonly pick: (key: string) => string
        /** The title of the block a right pick opens ("Vì sao"), the name of its figure and the line of a figure that cannot be drawn. */
        readonly whyTitle: string
        readonly diagram: string
        readonly diagramError: string
        /** The reason the next command waits ("Chọn đúng để đi tiếp"). */
        readonly nextWait: string
        /** The explanation of the right pick when the question ships no insight. */
        readonly why: string
        /** The words of a challenge's essence question (graded in place): the right option, the learner's pick, where to read on. */
        readonly correct: string
        readonly picked: string
        readonly readMore: string
    }
    readonly result: {
        readonly listTitle: string
        readonly firstTry: string
        /** "Đúng sau 3 lần": the picks it took, the right one included. */
        readonly triedTimes: (n: number) => string
        /** The words under the score ("đã nắm"), the heading ("Xong phần Mở đầu") and the one summary sentence. */
        readonly scoreCaption: string
        readonly title: string
        readonly summary: (solved: number, total: number, first: number) => string
        /** The command on to the next part ("Sang phần Bản chất"). */
        readonly toNext: string
        readonly retake: string
        readonly freeTitle: string
        readonly freeText: string
        readonly upgrade: string
    }
}
