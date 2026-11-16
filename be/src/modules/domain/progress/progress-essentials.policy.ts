import type {
    EssentialsLessonSource,
    EssentialsPartId,
    ProgressEssentialsView,
    ProgressLessonView,
    ProgressPartView,
    ProgressPlan,
    ProgressTopicView,
} from "./progress.contracts"

/** The questions of a lesson opener (owner: the 5-question opener before the article). */
export const OPENER_QUESTIONS = 5

/** The four parts of a lesson in order; the first is free, the rest need a subscription. */
export const ESSENTIALS_PARTS: ReadonlyArray<EssentialsPartId> = ["essence", "source", "script", "apply"]

/** The parts a free learner may open. */
export const FREE_ESSENTIALS_PARTS: ReadonlyArray<EssentialsPartId> = ["essence"]

/** Which parts the plan opens: every part for a subscriber, the free ones otherwise. */
export const partsOf = (plan: ProgressPlan): Array<ProgressPartView> =>
    ESSENTIALS_PARTS.map((part, index) => ({
        part,
        order: index + 1,
        access: plan === "premium" || FREE_ESSENTIALS_PARTS.includes(part) ? "unlocked" : "locked",
    }))

const lessonOf = (lesson: EssentialsLessonSource): ProgressLessonView => ({
    lessonId: lesson.id,
    title: lesson.title,
    done: lesson.completedAt !== null,
    started: lesson.started,
    openerTotal: OPENER_QUESTIONS,
    openerAnswered: lesson.opener?.answered ?? 0,
    before: lesson.opener === null || lesson.opener.answered === 0 ? null : lesson.opener.firstCorrect,
    after: lesson.opener === null || lesson.opener.answered === 0 ? null : lesson.opener.latestCorrect,
})

/** Groups the lessons by topic in the catalog order; the topics the learner touched come first, the rest keep their order. */
export const topicsOf = (lessons: ReadonlyArray<EssentialsLessonSource>): Array<ProgressTopicView> => {
    const order: Array<string> = []
    const byTopic = new Map<string, { title: string; lessons: Array<EssentialsLessonSource> }>()
    for (const lesson of lessons) {
        const entry = byTopic.get(lesson.topicId) ?? { title: lesson.topicTitle, lessons: [] }
        if (entry.lessons.length === 0) order.push(lesson.topicId)
        entry.lessons.push(lesson)
        byTopic.set(lesson.topicId, entry)
    }
    const topics = order.flatMap((topicId): Array<ProgressTopicView & { touched: boolean }> => {
        const entry = byTopic.get(topicId)
        if (entry === undefined) return []
        return [
            {
                topicId,
                title: entry.title,
                lessonsDone: entry.lessons.filter((lesson) => lesson.completedAt !== null).length,
                lessonsTotal: entry.lessons.length,
                lessons: entry.lessons.map((lesson) => lessonOf(lesson)),
                touched: entry.lessons.some((lesson) => lesson.started),
            },
        ]
    })
    const touched = topics.filter((topic) => topic.touched)
    const rest = topics.filter((topic) => !topic.touched)
    return [...touched, ...rest].map(({ touched: _touched, ...topic }) => topic)
}

/** The Essentials section: lessons done, the opener before and after, the topics and the parts the plan opens. */
export const buildEssentials = (
    lessons: ReadonlyArray<EssentialsLessonSource>,
    plan: ProgressPlan,
): ProgressEssentialsView => ({
    lessonsDone: lessons.filter((lesson) => lesson.completedAt !== null).length,
    lessonsStarted: lessons.filter((lesson) => lesson.started).length,
    lessonsTotal: lessons.length,
    beforeCorrect: lessons.reduce((sum, lesson) => sum + (lesson.opener?.firstCorrect ?? 0), 0),
    afterCorrect: lessons.reduce((sum, lesson) => sum + (lesson.opener?.latestCorrect ?? 0), 0),
    answered: lessons.reduce((sum, lesson) => sum + (lesson.opener?.answered ?? 0), 0),
    topics: topicsOf(lessons),
    parts: partsOf(plan),
})
