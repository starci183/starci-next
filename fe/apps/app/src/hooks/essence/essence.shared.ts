import type {
    ArticleSectionView,
    EssenceBarPart,
    EssenceJourneyRow,
    EssenceQuestionView,
    EssenceStoryEvent,
    EssenceStage,
    EssenceView,
    QuestionLink,
} from "@starci-next/ui"
import type { AttemptState } from "@/hooks/lesson"
import {
    ESSENTIAL_PARTS,
    type EssentialPart,
    type EssentialQuestionView,
    type EssentialView,
    type LessonPartsView,
    type LessonView,
    type OpenerScoreView,
} from "@/modules/types"
import { articleSectionsOf, linksOf, type EssentialDesk } from "@/hooks/lessonParts"

/** The words the essence builders need, resolved by the hook. */
export type EssenceWords = {
    readonly questionName: (n: number) => string
    /** "Question 2/5 · 1 right". */
    readonly position: (n: number, total: number, right: number) => string
    /** "Question 1/5 · about 1 minute", said before the first answer. */
    readonly positionFirst: (n: number, total: number) => string
    readonly score: (right: number, total: number) => string
    readonly resultFlagged: (sections: string) => string
    readonly resultClean: string
    readonly retakeLine: (right: number, total: number, before: number) => string
    readonly readSection: (n: string, title: string) => string
    readonly seeScenario: (title: string) => string
    readonly articleEyebrow: (minutes: number) => string
    readonly sectionsList: (numbers: ReadonlyArray<number>) => string
    /** The sentence of the result once the opener is passed: how many were right at the first pick. */
    readonly passedText: (first: number, total: number) => string
}

/**
 * One question as the card draws it, from its attempt and the picks graded wrong before it; a retake hides the attempts made before
 * it. A wrong pick stays locked with why it is wrong and the learner picks again; the right pick solves the question.
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
        misses: isHidden
            ? []
            : attempt.misses
                  .filter((miss) => base === undefined || miss.revision > base)
                  .map((miss) => ({ optionId: miss.optionId, explanation: miss.explanation })),
        isSolved,
        insight: isSolved ? result.insight : undefined,
    }
}

/** The developments of the story so far: one per question up to the one on screen, which is current. */
const timelineOf = (opener: ReadonlyArray<EssentialQuestionView>, index: number): ReadonlyArray<EssenceStoryEvent> =>
    opener.slice(0, index + 1).flatMap((question, position) =>
        question.event === undefined
            ? []
            : [
                  {
                      id: question.activityId,
                      at: question.event.at,
                      text: question.event.text,
                      isCurrent: position === index,
                  },
              ],
    )

/**
 * The stage on screen: the learner's own move; else the article for a learner who opens the lesson with every question already
 * answered; else the questions (also right after the last answer of this visit, so the result is one press away).
 */
const stageOf = (desk: EssentialDesk, isDone: boolean): EssenceStage =>
    desk.stage ?? (isDone && desk.openerIndex === undefined ? "article" : "questions")

/** The segment of one question on the five-answer bar: green when right, red when wrong; the one on screen carries the position line. */
const barPartOf = (
    question: EssenceQuestionView,
    index: number,
    current: number,
    position: string,
    words: EssenceWords,
): EssenceBarPart => {
    const isCurrent = index === current
    const label = isCurrent ? position : words.questionName(index + 1)
    if (question.isSolved) return { id: question.id, label, isCurrent, state: "complete" }
    // The question on screen turns red after a wrong pick until it is solved.
    if (isCurrent) return { id: question.id, label, isCurrent, state: question.misses.length > 0 ? "error" : "current" }
    return { id: question.id, label, isCurrent, state: question.misses.length > 0 ? "error" : "upcoming" }
}

/** The four parts as the journey lists them. */
const journeyOf = (
    essential: EssentialView,
    parts: LessonPartsView | undefined,
    part: EssentialPart,
    titles: Readonly<Record<EssentialPart, string>>,
): ReadonlyArray<EssenceJourneyRow> =>
    ESSENTIAL_PARTS.map((id) => ({
        id,
        title: titles[id],
        isCurrent: id === part,
        isLocked: essential.lockedParts.includes(id),
        isDone: parts?.parts.find((each) => each.part === id)?.state === "done",
    }))

/** What {@link essenceOf} is drawn from. */
type EssenceInput = {
    readonly lesson: LessonView
    readonly essential: EssentialView
    readonly attempts: Readonly<Record<string, AttemptState>>
    readonly desk: EssentialDesk
    readonly score: OpenerScoreView | undefined
    readonly parts: LessonPartsView | undefined
    readonly part: EssentialPart
    readonly titles: Readonly<Record<EssentialPart, string>>
    readonly readIds: ReadonlyArray<string>
    readonly words: EssenceWords
}

/** The sections a wrong opener answer pointed at: the first answer was wrong, or the newest one is. */
const flaggedIdsOf = (input: EssenceInput, questions: ReadonlyArray<EssenceQuestionView>): ReadonlySet<string> =>
    new Set(
        input.essential.opener
            .filter((question) => {
                const first = input.score?.questions.find((each) => each.activityId === question.activityId)
                const card = questions.find((each) => each.id === question.activityId)
                return (
                    (first !== undefined && first.attempts > 0 && !first.firstCorrect) ||
                    (card !== undefined && card.misses.length > 0)
                )
            })
            .map((question) => question.sectionId),
    )

/** The sentence under the result: the first-pick score once passed, then which sections a wrong pick pointed at. */
const resultTextOf = (
    isPassed: boolean,
    flagged: ReadonlyArray<number>,
    firstRight: number,
    total: number,
    words: EssenceWords,
): string => {
    const sections = flagged.length === 0 ? words.resultClean : words.resultFlagged(words.sectionsList(flagged))
    return isPassed ? `${words.passedText(firstRight, total)} ${flagged.length === 0 ? "" : sections}`.trim() : sections
}

/**
 * The essence part: the five opener questions one at a time, the result, the article with its contents and the journey. The article
 * sections a wrong answer pointed at are flagged "read closely" until the learner marks them read.
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
    const flagged = flaggedIdsOf(input, questions)
    const sections: ReadonlyArray<ArticleSectionView> = articleSectionsOf(lesson).map((section) => ({
        id: section.id,
        title: section.title,
        markdown: section.markdown,
        isLocked: section.isLocked,
        isFlagged: flagged.has(section.id) && !input.readIds.includes(section.id),
    }))
    const flaggedNumbers = sections.flatMap((section, position) => (section.isFlagged ? [position + 1] : []))
    const isRetake = Object.keys(desk.retakeFrom).length > 0
    const stage = stageOf(desk, isDone)
    const positionLine = questions.every((question) => question.status !== "graded")
        ? words.positionFirst(index + 1, questions.length)
        : words.position(index + 1, questions.length, right)
    return {
        stage,
        story: essential.story,
        timeline: timelineOf(essential.opener, index),
        isPassed: isDone,
        questions,
        index,
        bar: questions.map((question, position) =>
            barPartOf(question, position, stage === "questions" ? index : -1, positionLine, words),
        ),
        resultTitle: words.score(right, questions.length),
        resultText: resultTextOf(isDone, flaggedNumbers, firstRight, questions.length, words),
        retakeLine:
            isRetake && isDone && input.score !== undefined
                ? words.retakeLine(right, questions.length, input.score.firstCorrect)
                : "",
        toc: sections.map((section) => ({
            id: section.id,
            title: section.title,
            href: `#section-${section.id}`,
            isFlagged: section.isFlagged,
            isRead: input.readIds.includes(section.id),
        })),
        articleEyebrow: words.articleEyebrow(lesson.minutes),
        sections,
        journey: journeyOf(essential, input.parts, input.part, input.titles),
        isFree: essential.lockedParts.length > 0,
    }
}
