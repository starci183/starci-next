import type { LearnerProgress } from "@/hooks/swr"
import { APP_ROUTES, practicePatternPath } from "@/modules/routes"
import type { ProgressBlockView, ProgressRowView } from "@/modules/types"
import type { ProgressTranslate } from "@/hooks/progressWords"

/** The patterns the progress page lists before it points to the practice page for the rest. */
const SHOWN_PATTERNS = 5

type Practice = NonNullable<LearnerProgress["practice"]>

/** The row of one pattern: the problems Accepted of all, a thin meter and the whole row a link to the pattern. */
const patternRowOf = (t: ProgressTranslate, pattern: Practice["patterns"][number]): ProgressRowView => ({
    id: pattern.patternId,
    title: pattern.title,
    description: t("practice.accepted", { done: pattern.acceptedCount }),
    href: practicePatternPath(pattern.patternId),
    percent: pattern.problemCount === 0 ? 0 : Math.round((pattern.acceptedCount / pattern.problemCount) * 100),
})

/** The Luyện code part: how many problems are Accepted of all, the patterns under way and done, then a row per pattern with progress. */
export const practiceOf = (t: ProgressTranslate, data: LearnerProgress["practice"]): ProgressBlockView | null => {
    if (data === null) return null
    return {
        figures: {
            title: t("practice.title"),
            link: { label: t("practice.open"), href: APP_ROUTES.practice },
            items: [
                {
                    id: "accepted",
                    term: t("practice.acceptedTerm"),
                    value: data.acceptedCount,
                    unit: `/${data.problemCount}`,
                },
                { id: "doing", term: t("practice.doing"), value: data.patternsInProgress },
                { id: "done", term: t("practice.done"), value: data.patternsDone },
            ],
        },
        lists: [
            {
                id: "practice-patterns",
                title: t("practice.title"),
                rows: data.patterns.slice(0, SHOWN_PATTERNS).map((pattern) => patternRowOf(t, pattern)),
                ...(data.patterns.length > SHOWN_PATTERNS
                    ? { caption: t("practice.more", { count: data.patterns.length - SHOWN_PATTERNS }) }
                    : {}),
                empty: t("practice.empty"),
            },
        ],
    }
}
