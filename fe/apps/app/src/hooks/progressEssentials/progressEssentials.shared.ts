import type { LearnerProgress } from "@/hooks/swr"
import { APP_ROUTES, topicPath } from "@/modules/routes"
import type { ProgressBlockView, ProgressRowView } from "@/modules/types"
import type { ProgressTranslate } from "@/hooks/progressWords"

type Essentials = NonNullable<LearnerProgress["essentials"]>

/** The four parts of a lesson, each with the words of whether the plan opens it. */
const partRowsOf = (t: ProgressTranslate, parts: Essentials["parts"]): ReadonlyArray<ProgressRowView> => {
    const names: Record<string, string> = {
        essence: t("essentials.part.essence"),
        source: t("essentials.part.source"),
        script: t("essentials.part.script"),
        apply: t("essentials.part.apply"),
    }
    return parts.map((part): ProgressRowView => ({
        id: part.part,
        title: names[part.part] ?? part.part,
        badges: [
            {
                label: part.access === "unlocked" ? t("essentials.unlocked") : t("essentials.locked"),
                tone: part.access === "unlocked" ? "success" : "muted",
                isDot: true,
            },
        ],
    }))
}

/** The row of one topic: its lessons done of all, a thin meter and the whole row a link to the topic. */
const topicRowOf = (t: ProgressTranslate, topic: Essentials["topics"][number]): ProgressRowView => ({
    id: `topic-${topic.topicId}`,
    title: topic.title,
    description: t("essentials.topicFact", { done: topic.lessonsDone, total: topic.lessonsTotal }),
    href: topicPath(topic.topicId),
    percent: topic.lessonsTotal === 0 ? 0 : Math.round((topic.lessonsDone / topic.lessonsTotal) * 100),
})

/** The opener line under the parts: how many questions were right at first and after studying. */
const openerLineOf = (t: ProgressTranslate, data: Essentials): string =>
    data.answered === 0
        ? t("essentials.openerNone")
        : t("essentials.opener", { before: data.beforeCorrect, after: data.afterCorrect, answered: data.answered })

/** The Essentials part: the parts the plan opens with the opener line under them, then a row per topic. */
export const essentialsOf = (t: ProgressTranslate, data: LearnerProgress["essentials"]): ProgressBlockView | null => {
    if (data === null) return null
    return {
        lists: [
            {
                id: "essentials",
                title: t("essentials.title"),
                caption: openerLineOf(t, data),
                link: { label: t("essentials.open"), href: APP_ROUTES.essentials },
                rows: [...partRowsOf(t, data.parts), ...data.topics.map((topic) => topicRowOf(t, topic))],
                empty: t("essentials.empty"),
            },
        ],
    }
}
