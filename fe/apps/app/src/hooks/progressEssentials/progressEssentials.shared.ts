import type { ListRowData } from "@starci/grammar/common"
import type { LearnerProgress } from "@/hooks/swr"
import { APP_ROUTES } from "@/modules/routes"
import type { ProgressBlockView, ProgressListView } from "@/modules/types"
import type { ProgressBadge, ProgressTranslate } from "@/hooks/progressWords"

type Essentials = NonNullable<LearnerProgress["essentials"]>
type Lesson = Essentials["topics"][number]["lessons"][number]

/** The chip of a lesson: done, in progress or not started. */
const lessonBadgeOf = (t: ProgressTranslate, lesson: Lesson): ProgressBadge => {
    if (lesson.done) return { label: t("essentials.done"), tone: "success", isDot: true }
    if (lesson.started) return { label: t("essentials.started"), tone: "accent", isDot: true }
    return { label: t("essentials.todo"), tone: "muted", isDot: true }
}

/** The line under a lesson: the opener before and after, or that it was not answered. */
const lessonLineOf = (t: ProgressTranslate, lesson: Lesson): string =>
    lesson.before === null || lesson.after === null
        ? t("essentials.lessonNoOpener")
        : t("essentials.lessonOpener", { before: lesson.before, after: lesson.after, total: lesson.openerTotal })

/** The row of one lesson. */
const lessonRowOf = (t: ProgressTranslate, lesson: Lesson): ListRowData => ({
    id: lesson.lessonId,
    title: lesson.title,
    description: lessonLineOf(t, lesson),
    badges: [lessonBadgeOf(t, lesson)],
})

/** The four parts of a lesson, each with the words of whether the plan opens it. */
const partRowsOf = (t: ProgressTranslate, parts: Essentials["parts"]): ReadonlyArray<ListRowData> => {
    const names: Record<string, string> = {
        essence: t("essentials.part.essence"),
        source: t("essentials.part.source"),
        script: t("essentials.part.script"),
        apply: t("essentials.part.apply"),
    }
    return parts.map((part): ListRowData => ({
        id: part.part,
        title: names[part.part] ?? part.part,
        badges: [
            {
                label: part.access === "unlocked" ? t("essentials.unlocked") : t("essentials.locked"),
                tone: part.access === "unlocked" ? "success" : "muted",
                isDot: true,
            },
        ],
        ...(part.access === "locked"
            ? { action: { label: t("essentials.upgrade"), href: APP_ROUTES.premium, endArrow: true } }
            : {}),
    }))
}

/** The list of one topic with its lessons. */
const topicListOf = (t: ProgressTranslate, topic: Essentials["topics"][number]): ProgressListView => ({
    id: `topic-${topic.topicId}`,
    title: topic.title,
    fact: t("essentials.topicFact", { done: topic.lessonsDone, total: topic.lessonsTotal }),
    rows: topic.lessons.map((lesson) => lessonRowOf(t, lesson)),
    empty: t("essentials.empty"),
})

/** The opener line under the parts: how many questions were right at first and after studying. */
const openerLineOf = (t: ProgressTranslate, data: Essentials): string =>
    data.answered === 0
        ? t("essentials.openerNone")
        : t("essentials.opener", { before: data.beforeCorrect, after: data.afterCorrect, answered: data.answered })

/** The Essentials part: the parts the plan opens with the opener line under them, then one list per topic. */
export const essentialsOf = (t: ProgressTranslate, data: LearnerProgress["essentials"]): ProgressBlockView | null => {
    if (data === null) return null
    return {
        lists: [
            {
                id: "essentials",
                title: t("essentials.title"),
                fact: t("essentials.fact", { done: data.lessonsDone, total: data.lessonsTotal }),
                caption: openerLineOf(t, data),
                link: { label: t("essentials.open"), href: APP_ROUTES.essentials },
                rows: partRowsOf(t, data.parts),
                empty: t("essentials.empty"),
            },
            ...data.topics.map((topic) => topicListOf(t, topic)),
        ],
    }
}
