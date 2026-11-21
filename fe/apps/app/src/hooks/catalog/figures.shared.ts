import type { CatalogGroupView, CatalogView, CatalogWords } from "@/modules/types"
import type { Standing } from "./catalog.shared"

/** Whole hours and the minutes left over. */
export const hoursOf = (minutes: number): [number, number] => [Math.floor(minutes / 60), minutes % 60]

/** The minutes of a set of lessons. */
export const minutesOf = (standings: ReadonlyArray<Standing>): number =>
    standings.reduce((sum, each) => sum + each.lesson.minutes, 0)

/** The state badge of a topic: done when every lesson is, under way when one was started, else not started. */
export const groupBadgeOf = (
    done: number,
    all: ReadonlyArray<Standing>,
    words: CatalogWords,
): CatalogGroupView["badge"] => {
    if (all.length > 0 && done === all.length) return { label: words.groupState.done, tone: "success" }
    if (done > 0 || all.some((each) => each.state === "doing"))
        return { label: words.groupState.doing, tone: "warning" }
    return { label: words.groupState.todo, tone: "neutral" }
}

/** The four key figures of the band: lessons done, under way, not started and the time left. */
export const figuresOf = (standings: ReadonlyArray<Standing>, words: CatalogWords): CatalogView["figures"] => {
    const count = (state: Standing["state"]): number => standings.filter((each) => each.state === state).length
    return [
        { id: "done", term: words.figure.done, value: String(count("done")), unit: `/ ${standings.length}` },
        { id: "doing", term: words.figure.doing, value: String(count("doing")) },
        { id: "todo", term: words.figure.todo, value: String(count("todo")) },
        {
            id: "time",
            term: words.figure.time,
            value: words.hours(...hoursOf(minutesOf(standings.filter((each) => each.state !== "done")))),
        },
    ]
}
