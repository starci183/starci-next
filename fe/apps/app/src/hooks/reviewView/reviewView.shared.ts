import type {
    RecallItemView,
    ReviewBackView,
    ReviewFlipView,
    ReviewItemScreen,
    ReviewQueueItemView,
    ReviewSummaryScreen,
    ReviewTodayRow,
    ReviewTodayScreen,
    ReviewTodayView,
} from "@/modules/types"
import {
    REVIEW_GRADE_ORDER,
    answerPartsOf,
    intervalOf,
    type ReviewCard,
    type ReviewTally,
    type ReviewWords,
} from "@/hooks/review"

/** The row of one item of the queue. */
const rowOf = (item: ReviewQueueItemView, today: ReviewTodayView, words: ReviewWords): ReviewTodayRow => {
    const t = words.t
    const isRetrieval = item.source === "retrieval"
    const level = item.level === null ? undefined : t("today.levelLabel", { level: words.level(item.level) })
    const meta = [isRetrieval ? t("today.splitRetrieval") : t("today.splitCards"), level]
        .filter((part): part is string => part !== undefined)
        .join(" · ")
    const base = {
        id: item.itemId,
        title: (isRetrieval ? item.lessonTitle : item.deckTitle) ?? item.itemId,
        meta,
        isLocked: item.locked,
    }
    if (item.status === "new") return { ...base, badge: t("today.newBadge"), badgeTone: "accent" }
    const isOverdue = item.dueOn < today.date
    return {
        ...base,
        badge: isOverdue ? t("today.overdueBadge") : t("today.dueTitle"),
        badgeTone: isOverdue ? "warning" : "neutral",
    }
}

/** Which state the day is in: items to review, nothing at all, or the goal met with nothing left. */
const stateOf = (today: ReviewTodayView): ReviewTodayScreen["state"] => {
    if (today.items.some((item) => !item.locked)) return "ready"
    return today.goal.done > 0 && today.goal.done >= today.goal.daily ? "done" : "empty"
}

/** Today's review as it is drawn. */
export const todayScreenOf = (today: ReviewTodayView, words: ReviewWords): ReviewTodayScreen => {
    const t = words.t
    const open = today.items.filter((item) => !item.locked)
    const cards = open.filter((item) => item.source !== "retrieval").length
    const lessons = open.length - cards
    return {
        state: stateOf(today),
        goalPercent: Math.min(100, Math.round((today.goal.done / Math.max(1, today.goal.daily)) * 100)),
        goalText: t("today.goalValue", { done: today.goal.done, daily: today.goal.daily }),
        dueLine: t("today.dueLine", { due: today.due, overdue: today.overdue }),
        newLine: today.newAvailable > 0 ? t("today.newLine", { count: today.newAvailable }) : undefined,
        splitCards: `${t("today.splitCards")} · ${cards}`,
        splitRetrieval: `${t("today.splitRetrieval")} · ${lessons}`,
        doneBody: t("today.doneBody", { daily: today.goal.daily }),
        lockedBody: today.lockedCount > 0 ? t("today.lockedBody", { count: today.lockedCount }) : undefined,
        canStartNew: open.length > 0 && open.every((item) => item.status === "new"),
        rows: today.items.map((item) => rowOf(item, today, words)),
        sourceDeck: `${t("today.sourceDeck")} · ${cards}`,
        sourceLesson: `${t("today.sourceLesson")} · ${lessons}`,
    }
}

/** The revealed answer with one button per grade. */
const backOf = (flipped: ReviewFlipView, words: ReviewWords): ReviewBackView => ({
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
export const itemScreenOf = (item: RecallItemView, card: ReviewCard, words: ReviewWords): ReviewItemScreen => {
    const t = words.t
    const isRetrieval = item.source === "retrieval"
    const work = card.work
    return {
        kind: "item",
        isRetrieval,
        sourceLine: isRetrieval
            ? t("session.sourceRetrieval", { lesson: item.lessonTitle ?? "" })
            : t("session.sourceCard", { deck: item.deckTitle ?? "" }),
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
        back: work.flipped === undefined ? undefined : backOf(work.flipped, words),
        isGrading: card.gradeAction.isGrading,
        isGradeFailed: work.isGradeFailed,
    }
}

/** The end of the session: what was reviewed, the share remembered, the goal and what is left today. */
export const summaryOf = (tally: ReviewTally, words: ReviewWords): ReviewSummaryScreen => {
    const t = words.t
    const recall = tally.reviewed === 0 ? 0 : Math.round((tally.remembered / tally.reviewed) * 100)
    return {
        kind: "summary",
        reviewed: `${tally.reviewed}`,
        recall: `${recall}%`,
        goal:
            tally.last === undefined
                ? undefined
                : t("session.summaryGoalValue", { done: tally.last.goal.done, daily: tally.last.goal.daily }),
        remaining: t("session.summaryRemaining", { count: tally.last?.remainingToday ?? 0 }),
        isAllDone: tally.last?.remainingToday === 0,
    }
}

/** The distinct values of a list, sorted, as filter options after an "all" option. */
export const filterOptionsOf = (
    all: string,
    values: ReadonlyArray<string> | undefined,
    label: (value: string) => string,
): ReadonlyArray<{ readonly id: string; readonly label: string }> => [
    { id: "all", label: all },
    ...[...new Set(values)].sort((a, b) => a.localeCompare(b)).map((value) => ({ id: value, label: label(value) })),
]
