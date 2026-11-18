import { Meter, Section } from "@starci/grammar/common"
import type { ReactNode } from "react"

/** The four parts of a lesson: how many are finished. */
const PART_SEGMENTS = 4

/** One lesson as its row draws it, every word resolved by the block. */
export type LessonListRow = {
    readonly id: string
    readonly title: string
    /** The one-line problem the lesson solves. */
    readonly problem: string
    readonly href: string
    readonly minutes: string
    /** How many of the four parts are finished. */
    readonly doneParts: number
    /** The words of the Meter (for example "2 of 4 parts"), its accessible name. */
    readonly partsLabel: string
    readonly badge: { readonly label: string; readonly tone: "success" | "warning" | "neutral" }
    /** The lesson the learner is on: its row is tinted. */
    readonly isCurrent: boolean
    /** The opener score (for example "Opener 3/5") the topic page shows at the end of the row; empty hides it. */
    readonly opener: string
}

/** Props of the lesson list. */
type LessonListProps = {
    /** The accessible name of the list. */
    readonly ariaLabel: string
    readonly rows: ReadonlyArray<LessonListRow>
    /** True while the first read runs: the rows draw as geometry. */
    readonly isLoading?: boolean
    /** Numbers the rows (the topic page); the catalog leaves them out. */
    readonly isNumbered?: boolean
    /** What an empty list says. */
    readonly empty: ReactNode
}

/** The width the four-part meter takes in a row: a row detail has no width of its own, and a full-width meter would stretch the four dashes across the row. */
const METER_WIDTH = "6.5rem"

/** One lesson row of the list; position 0 leaves the row unnumbered. */
const itemOf = (row: LessonListRow, position: number, isLoading: boolean) => ({
    id: row.id,
    title: row.title,
    description: row.problem,
    ...(position === 0 ? {} : { leading: { position } }),
    detail: (
        <span style={{ display: "block", width: METER_WIDTH }}>
            <Meter
                label={row.partsLabel}
                isLabelHidden
                value={row.doneParts}
                minValue={0}
                maxValue={PART_SEGMENTS}
                segments={PART_SEGMENTS}
                size="sm"
                tone="foreground"
                isLoading={isLoading}
            />
        </span>
    ),
    badges: [{ label: row.badge.label, tone: row.badge.tone }] as const,
    ...(row.opener === "" ? {} : { value: row.opener }),
    meta: { text: row.minutes },
    state: row.isCurrent ? ("informative" as const) : ("neutral" as const),
    href: row.href,
})

/**
 * The lessons of a topic as one flat list: the name and the one-line problem, the four parts as a segmented Meter under them, the state
 * as the badge and the minutes at the end. The lesson the learner is on is the informative (grey) row.
 */
export const LessonList = (props: LessonListProps) => (
    <Section
        kind="list"
        isLoading={props.isLoading ?? false}
        ariaLabel={props.ariaLabel}
        empty={props.empty}
        items={props.rows.map((row, index) =>
            itemOf(row, props.isNumbered === true ? index + 1 : 0, props.isLoading ?? false),
        )}
    />
)
