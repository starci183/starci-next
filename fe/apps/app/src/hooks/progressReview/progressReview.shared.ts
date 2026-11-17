import type { LearnerProgress } from "@/hooks/swr"
import { APP_ROUTES } from "@/modules/routes"
import type { ProgressActivityEntry, ProgressBlockView } from "@/modules/types"
import type { ProgressFormatter, ProgressTranslate } from "@/hooks/progressWords"

type Review = NonNullable<LearnerProgress["review"]>

/** The figure of the cards due: the count, and how many of them are overdue. */
const dueFigureOf = (t: ProgressTranslate, data: Review) => ({
    id: "due",
    term: t("review.due"),
    value: data.due,
    ...(data.overdue > 0 ? { meta: `${data.overdue} ${t("review.overdue")}` } : {}),
})

/** The Review part: the cards due and the streak, as figures. */
export const reviewOf = (t: ProgressTranslate, data: LearnerProgress["review"]): ProgressBlockView | null =>
    data === null
        ? null
        : {
              lists: [],
              figures: {
                  title: t("review.title"),
                  link: { label: t("review.open"), href: APP_ROUTES.review },
                  items: [
                      dueFigureOf(t, data),
                      { id: "done", term: t("review.doneToday"), value: data.doneToday, unit: `/${data.goalDaily}` },
                      {
                          id: "streak",
                          term: t("review.streak"),
                          value: data.streak,
                          meta: data.todayCounted ? t("review.today") : t("review.notToday"),
                      },
                      { id: "longest", term: t("review.longest"), value: data.longestStreak },
                  ],
              },
          }

/** The recent activity in words, newest first. */
export const activityOf = (
    t: ProgressTranslate,
    format: ProgressFormatter,
    data: LearnerProgress["activity"],
): ReadonlyArray<ProgressActivityEntry> =>
    data.map((entry) => {
        const title = entry.title
        const words: Record<string, string> = {
            "lesson-done": t("activity.lesson", { title }),
            "concept-proved": t("activity.concept", { title }),
            "experience-verified": t("activity.verified", { title }),
            "harness-stage": t("activity.harness", { title }),
        }
        return {
            id: entry.id,
            title: words[entry.kind] ?? title,
            at: entry.at,
            when: format.relativeTime(new Date(entry.at)),
        }
    })
