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
    /** The explanation the right pick released; undefined before, or for a question without one (`explanation` stands in). */
    readonly insight: EssenceInsight | undefined
    /** Once solved: every option with its one reason, in the order of the choices (the right one marked); empty before. */
    readonly reasons: ReadonlyArray<EssenceReason>
    /** The development of the story this question adds (`00:00` and its words); undefined for a challenge question. */
    readonly event: { readonly at: string; readonly text: string } | undefined
    /** A few words naming the moment, the heading of the question; empty when it ships none. */
    readonly title: string
    /** What is seen going wrong, appended to the last paragraph of the scene; empty when it ships none. */
    readonly symptom: string
    /** What the interviewer wants to know: the skill the question tests, inside Xem kỹ thuật; empty when it ships none. */
    readonly probe: string
    /** The system the question touches, as a Mermaid flowchart; not drawn by the opener; empty when it ships none. */
    readonly contextDiagram: string
    /** The one line that says which parts the flowchart touches; not drawn by the opener; empty when it ships none. */
    readonly contextCaption: string
    /** Chuyện gì xảy ra: the scene in plain business words, as prose paragraphs. */
    readonly steps: ReadonlyArray<string>
    /** The code and table names, the first line inside Xem kỹ thuật; empty when it ships none. */
    readonly technical: string
    /** The condition the right option must meet; not drawn by the opener; empty when it ships none. */
    readonly condition: string
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

/**
 * The explanation of a right pick: Vì sao (the analogy, the term, Cách sửa), Xem kỹ thuật (the walk-through table, `why`, the figure,
 * Lưu ý, the code, the probe and the interview answer) and Nói gọn (`essence`).
 */
export type EssenceInsight = {
    readonly essence: string
    /** The prose of Xem kỹ thuật after the walk-through table, paragraphs split by a blank line; may be empty. */
    readonly why: string
    readonly interview: string
    /** Anh Senior's everyday picture of the fault, drawn as a quote; empty when it ships none. */
    readonly analogy: string
    /** The paragraph that names the term(s), `**bold**` spans drawn strong; empty when it ships none. */
    readonly term: string
    /** The header of the walk-through table's third column; empty for a two-column table. */
    readonly stateLabel: string
    /** The one figure of the question as Mermaid text (sequence, flowchart or state diagram), shown only after the right pick; empty when none. */
    readonly diagram: string
    /** The demo code: lines of the lesson's source, shown only after the right pick; undefined when the question ships none. */
    readonly code: EssenceCode | undefined
    /** The one line that says where to look in the figure; empty when none. */
    readonly diagramCaption: string
    /** Đi từng bước: the rows of the walk-through table, grouped, the faulty one marked; empty for an opener without one. */
    readonly happened: ReadonlyArray<EssenceStep>
    /** Cách sửa (paragraphs split by a blank line) and Lưu ý; empty for an older opener. */
    readonly fix: string
    readonly cost: string
    /** The interview answer in four beats; undefined for an older opener (`interview` stands in). */
    readonly interviewBeats:
        { readonly symptom: string; readonly cause: string; readonly fix: string; readonly cost: string } | undefined
}

/**
 * One row of the walk-through table: who acts (empty when none), what happens, the third-column cell (empty for a two-column table),
 * the group of rows it starts (empty when it continues the current one) and whether it is the faulty step.
 */
export type EssenceStep = {
    readonly who: string
    readonly text: string
    readonly isFault: boolean
    readonly state: string
    readonly group: string
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

/** The situation the opener tells: the title, the hook, the context (Bối cảnh), the system figure, the glossary and the closing. */
export type EssenceStory = {
    readonly title: string
    /** Bối cảnh, paragraphs split by a blank line. */
    readonly body: string
    /** The opening hook, the lede under the title; empty when the story ships none. */
    readonly hook: string
    /** The closing read once the last question is solved (Hết đêm); undefined when the story ships none. */
    readonly closing: { readonly body: string; readonly question: string } | undefined
    readonly company: string
    readonly facts: ReadonlyArray<string>
    /** The whole system, drawn once at the top of Mở đầu; undefined when the lesson ships none. */
    readonly system: { readonly diagram: string; readonly caption: string } | undefined
    /** The lesson's glossary: each term with its one-line definition. */
    readonly glossary: ReadonlyArray<{ readonly term: string; readonly definition: string }>
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
    /** "Câu 2 / 5 · 23:58" ("Câu 2 / 5" for a question without a time): the eyebrow of the question on screen. */
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
        /** The line under a challenge question before its pick. */
        readonly hint: string
        readonly empty: string
        readonly sendFailed: string
        readonly retry: string
        readonly grading: string
        /** The mark on an option card after a pick: wrong ("Chưa đúng") and right ("Đúng"). */
        readonly wrongMark: string
        readonly rightMark: string
        /** The command to the next question, and after the last one to the result. */
        readonly next: string
        readonly finish: string
        /** The eyebrow of the opening before question 1 ("Mở đầu · 5 câu · một đêm"), its context heading ("Bối cảnh") and the name of
         * the whole system's figure ("Toàn bộ hệ thống"). */
        readonly opening: (total: number) => string
        readonly context: string
        readonly overview: string
        /** The heading of a question's scene ("Chuyện gì xảy ra"). */
        readonly happened: string
        /** Vì sao, after the right pick: its title, the source of anh Senior's quote ("Anh Senior") and the heading of the fix ("Cách sửa"). */
        readonly whyTitle: string
        readonly senior: string
        readonly fix: string
        /** The fold of the technical side ("Xem kỹ thuật") and its summary line. */
        readonly technical: string
        readonly technicalSummary: string
        /** Đi từng bước: its heading, the step column ("Bước"), the what-happens column ("Chuyện gì xảy ra") and the status of the faulty
         * step ("chỗ hỏng"). */
        readonly walkthrough: string
        readonly step: string
        readonly stepWhat: string
        readonly faultStep: string
        /** The name of the figure and the line of a figure that cannot be drawn. */
        readonly diagram: string
        readonly diagramError: string
        /** The headings inside Xem kỹ thuật: Lưu ý, what the interviewer wants to know, and the interview answer. */
        readonly cost: string
        readonly probe: string
        readonly interview: string
        /** The four beats of the interview answer. */
        readonly beats: {
            readonly symptom: string
            readonly cause: string
            readonly fix: string
            readonly cost: string
        }
        /** The copy command of the interview answer and the line beside it. */
        readonly copyAnswer: string
        readonly answerOrder: string
        /** The lead of the take-away line ("Nói gọn:"). */
        readonly inShort: string
        /** The heading of the closing after the last question ("Hết đêm"). */
        readonly closingTitle: string
        /** The words of the code block: its line range ("dòng 64–72"), copy, copied, a copy that failed, and how many lines are marked
         * on its folded row. */
        readonly lines: (from: number, to: number) => string
        readonly codeCopy: string
        readonly codeCopied: string
        readonly codeCopyError: string
        readonly codeMarked: (count: number) => string
        /** The reason the next command waits ("Chọn đúng để đi tiếp"). */
        readonly nextWait: string
        /** The explanation of a right pick when the question ships no insight, and of a challenge question ("Vì sao."). */
        readonly why: string
        /** The words of a challenge's essence question (graded in place): the right option, the learner's pick, where to read on. */
        readonly correct: string
        readonly picked: string
        readonly readMore: string
        /** The margin of terms ("Thuật ngữ trong câu", folded at phone width as "Thuật ngữ (4)"), the mark of an option never picked
         * ("Vì sao không phải") and the two lines under the options. */
        readonly termsAside: string
        readonly termsFold: (count: number) => string
        readonly whyNot: string
        readonly pickHint: string
        readonly retryHint: string
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
