import type {
    RecallItemView,
    ReviewBackView,
    ReviewFlipView,
    ReviewItemScreen,
    ReviewSummaryScreen,
} from "@/modules/types"
import {
    REVIEW_GRADE_ORDER,
    answerPartsOf,
    intervalOf,
    type ReviewCard,
    type ReviewTally,
    type ReviewWords,
} from "@/hooks/review"

/** The revealed answer with one button per grade. */
const backOf = (flipped: ReviewFlipView, note: string, words: ReviewWords): ReviewBackView => ({
    note: note.trim(),
    parts: answerPartsOf(flipped.answer),
    grades: REVIEW_GRADE_ORDER.map((each) => ({
        grade: each.grade,
        label: words.grade(each.grade),
        interval: words.interval(intervalOf(flipped.intervals, each.grade)),
        key: each.key,
    })),
})

/** The result of a cloze check, once there is one. */
const clozeResultOf = (isCorrect: boolean | undefined): "correct" | "wrong" | undefined => {
    if (isCorrect === undefined) return undefined
    return isCorrect ? "correct" : "wrong"
}

/** The item on screen with what the learner typed, picked and revealed. */
export const itemScreenOf = (
    item: RecallItemView,
    card: ReviewCard,
    reviewCount: number,
    words: ReviewWords,
): ReviewItemScreen => {
    const t = words.t
    const isRetrieval = item.source === "retrieval"
    const work = card.work
    return {
        kind: "item",
        isRetrieval,
        sourceLine: isRetrieval
            ? t("session.sourceRetrieval", { lesson: item.lessonTitle ?? "" })
            : t("session.sourceCard", { deck: item.deckTitle ?? "" }),
        kindLine: [
            isRetrieval
                ? t("session.kindRetrieval")
                : item.cloze.length > 0
                  ? t("session.kindCloze")
                  : t("session.kindDirect"),
            reviewCount > 0 ? t("session.reviewCount", { n: reviewCount + 1 }) : t("session.reviewFirst"),
        ].join(" · "),
        lessonLine:
            isRetrieval && item.lessonTitle !== null
                ? t("session.lessonLine", { lesson: item.lessonTitle })
                : undefined,
        question: item.question,
        level: item.level === null ? undefined : words.level(item.level),
        tags: item.tags,
        cloze: item.cloze.map((each) => ({
            n: each.n,
            label: t("session.clozeItem", { n: each.n }),
            choices: each.choices,
            picked: work.picks[each.n],
            result: clozeResultOf(work.clozeResults[each.n]),
        })),
        note: work.note,
        isFlipping: card.isFlipping,
        issue: work.issue,
        back: work.flipped === undefined ? undefined : backOf(work.flipped, work.note, words),
        isConflict: work.isConflict,
        isGrading: card.gradeAction.isGrading,
        isGradeFailed: work.isGradeFailed,
    }
}

/** The end of the session: how many cards, one count per level, and the goal with what is left today. */
export const summaryOf = (tally: ReviewTally, words: ReviewWords): ReviewSummaryScreen => {
    const t = words.t
    const last = tally.last
    const isAllDone = last?.remainingToday === 0
    return {
        kind: "summary",
        title: t("session.summaryTitle", { count: tally.reviewed }),
        levels: REVIEW_GRADE_ORDER.map((each) => ({
            id: each.grade,
            term: words.grade(each.grade),
            value: `${tally.byGrade[each.grade]}`,
        })),
        line:
            last === undefined
                ? t("session.summaryRemaining", { count: 0 })
                : t(isAllDone ? "session.summaryAllDone" : "session.summaryLeft", {
                      done: last.goal.done,
                      daily: last.goal.daily,
                      count: last.remainingToday,
                  }),
        isAllDone,
    }
}
