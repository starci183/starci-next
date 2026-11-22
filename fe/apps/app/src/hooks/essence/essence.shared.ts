import type {
    EssenceBarPart,
    EssenceQuestionView,
    EssenceReason,
    EssenceResultRow,
    EssenceStage,
    EssenceView,
    QuestionLink,
} from "@starci-next/ui"
import type { AttemptState } from "@/hooks/lesson"
import type { EssentialQuestionView, EssentialView, LessonView, OpenerScoreView } from "@/modules/types"
import { linksOf, type EssentialDesk } from "@/hooks/lessonParts"

/** The words the essence builders need, resolved by the hook. */
export type EssenceWords = {
    /** "Question 2/5 · 00:00", the line above the question on screen. */
    readonly caption: (n: number, total: number, at: string) => string
    /** "Question 2/5", for a question that has no time in the story. */
    readonly captionPlain: (n: number, total: number) => string
    readonly retakeLine: (right: number, total: number, before: number) => string
    readonly readSection: (n: string, title: string) => string
    readonly seeScenario: (title: string) => string
}

/** The reasons of a solved question: every option with its one reason, from the grade that solved it and the wrong picks before. */
const reasonsOf = (
    question: EssentialQuestionView,
    result: NonNullable<NonNullable<AttemptState["view"]>["result"]> | undefined,
    misses: ReadonlyArray<{ readonly optionId: string; readonly explanation: string }>,
): ReadonlyArray<EssenceReason> =>
    question.choices.flatMap((choice): ReadonlyArray<EssenceReason> => {
        const own = result?.options.find((option) => option.optionId === choice.id)
        const miss = misses.find((each) => each.optionId === choice.id)
        const explanation = own?.explanation ?? miss?.explanation ?? ""
        return explanation === ""
            ? []
            : [
                  {
                      optionId: choice.id,
                      label: choice.label,
                      isCorrect: own?.isCorrect === true,
                      explanation,
                  },
              ]
    })

/**
 * One question as the card draws it, from its attempt and the picks graded wrong before it; a retake hides the attempts made before
 * it. A wrong pick stays locked with why it is wrong and the learner picks again; the right pick solves the question and releases the
 * reason of every option.
 */
const questionOf = (
    question: EssentialQuestionView,
    attempt: AttemptState | undefined,
    desk: EssentialDesk,
    links: ReadonlyArray<QuestionLink>,
): EssenceQuestionView => {
    const base = desk.retakeFrom[question.activityId]
    const isHidden = attempt === undefined || (base !== undefined && attempt.revision <= base)
    const view = isHidden ? undefined : attempt.view
    const result = view?.result
    const isSolved = result?.correct === true
    const misses = isHidden
        ? []
        : attempt.misses
              .filter((miss) => base === undefined || miss.revision > base)
              .map((miss) => ({ optionId: miss.optionId, explanation: miss.explanation }))
    return {
        id: question.activityId,
        prompt: question.prompt,
        choices: question.choices,
        pickedId: desk.picks[question.activityId] ?? view?.answer.optionId ?? "",
        correctId: isSolved ? (result.options.find((option) => option.isCorrect)?.optionId ?? "") : "",
        status: isHidden ? "idle" : attempt.status,
        isSendFailed: !isHidden && attempt.isSendFailed,
        isCorrect: isSolved,
        explanation: result?.options.find((option) => option.selected)?.explanation ?? "",
        links,
        misses,
        isSolved,
        insight: isSolved ? result.insight : undefined,
        reasons: isSolved ? reasonsOf(question, result, misses) : [],
        event: question.event,
    }
}

/**
 * The stage on screen: the learner's own move; else the result for a learner who opens the lesson with every question already
 * answered; else the questions (also right after the last answer of this visit, so the result is one press away).
 */
const stageOf = (desk: EssentialDesk, isDone: boolean): EssenceStage =>
    desk.stage ?? (isDone && desk.openerIndex === undefined ? "result" : "questions")

/** The segment of one question on the bar: green when right on the first pick, amber once a pick was wrong, plain before any answer. */
const barPartOf = (question: EssenceQuestionView, index: number, current: number): EssenceBarPart => {
    const label = question.event?.at ?? String(index + 1)
    const isCurrent = index === current
    if (question.isSolved)
        return { id: question.id, label, isCurrent, tone: question.misses.length === 0 ? "success" : "warning" }
    return { id: question.id, label, isCurrent, tone: question.misses.length > 0 ? "warning" : "neutral" }
}

/** What {@link essenceOf} is drawn from. */
type EssenceInput = {
    readonly lesson: LessonView
    readonly essential: EssentialView
    readonly attempts: Readonly<Record<string, AttemptState>>
    readonly desk: EssentialDesk
    readonly score: OpenerScoreView | undefined
    readonly words: EssenceWords
}

/** The result rows: one per question solved, with its time, the essence it teaches and how the learner fared on the first pick. */
const resultRowsOf = (
    questions: ReadonlyArray<EssenceQuestionView>,
    score: OpenerScoreView | undefined,
): ReadonlyArray<EssenceResultRow> =>
    questions.map((question) => {
        const own = score?.questions.find((each) => each.activityId === question.id)
        const isFirstTry = own === undefined ? question.misses.length === 0 : own.firstCorrect
        const link = question.links.find((each) => each.id.startsWith("section-"))
        return {
            id: question.id,
            at: question.event?.at ?? "",
            text: question.insight?.essence ?? question.prompt,
            isFirstTry,
            misses: isFirstTry ? 0 : Math.max(1, (own?.attempts ?? 1) - 1, question.misses.length),
            link: isFirstTry || link === undefined ? undefined : { label: link.label, href: link.href },
        }
    })

/**
 * The essence part (Mở đầu): the five opener questions one at a time with the bar of the five, and the result with one row per
 * question. The reading the result links to is its own part (Bản chất).
 */
export const essenceOf = (input: EssenceInput): EssenceView => {
    const { lesson, essential, desk, words } = input
    const questions = essential.opener.map((question) =>
        questionOf(question, input.attempts[question.activityId], desk, linksOf(lesson, question, words)),
    )
    const firstOpen = questions.findIndex((question) => !question.isSolved)
    const index = Math.min(desk.openerIndex ?? (firstOpen === -1 ? 0 : firstOpen), Math.max(questions.length - 1, 0))
    const isDone =
        questions.length > 0 && (questions.every((question) => question.isSolved) || input.score?.isPassed === true)
    const right = questions.filter((question) => question.isSolved).length
    const firstRight = input.score?.firstCorrect ?? right
    const isRetake = Object.keys(desk.retakeFrom).length > 0
    const stage = stageOf(desk, isDone)
    const current = questions[index]
    return {
        stage,
        story: essential.story,
        isPassed: isDone,
        questions,
        index,
        bar: questions.map((question, position) => barPartOf(question, position, stage === "questions" ? index : -1)),
        caption:
            current?.event === undefined
                ? words.captionPlain(index + 1, questions.length)
                : words.caption(index + 1, questions.length, current.event.at),
        resultRows: resultRowsOf(questions, input.score),
        solvedFigure: `${right}/${questions.length}`,
        firstTryFigure: `${firstRight}/${questions.length}`,
        isFree: essential.lockedParts.length > 0,
        retakeLine:
            isRetake && isDone && input.score !== undefined
                ? words.retakeLine(right, questions.length, input.score.firstCorrect)
                : "",
    }
}
