import { SurfaceCard } from "@starci/grammar/common"

/** The words of the comparison, resolved by its block. */
export type ReflectCompareLabels = {
    readonly title: string
    readonly before: string
    readonly after: string
    /** Said for a criterion with no grade yet. */
    readonly none: string
    /** The words for level 0, 1 and 2 of a graded criterion. */
    readonly levels: readonly [string, string, string]
    readonly empty: string
}

/** The reflection set beside the opening diagnostic. */
type ReflectCompareProps = {
    /** One row per criterion; levels are 0 to 2, and -1 where there is no grade yet. */
    readonly rows: ReadonlyArray<{
        readonly id: string
        readonly criterion: string
        readonly before: number
        readonly after: number
    }>
    readonly labels: ReflectCompareLabels
}

/** The words for a level, or the "no grade" words for -1. */
const wordsOf = (level: number, labels: ReflectCompareLabels): string => labels.levels[level] ?? labels.none

/** The before and after of each criterion: the opening diagnostic against the reflection graded by the same rubric. */
export const ReflectCompare = (props: ReflectCompareProps) => (
    <SurfaceCard
        kind="list"
        label={props.labels.title}
        empty={props.labels.empty}
        items={props.rows.map((row) => ({
            id: row.id,
            title: row.criterion,
            description: `${props.labels.before}: ${wordsOf(row.before, props.labels)} → ${props.labels.after}: ${wordsOf(row.after, props.labels)}`,
        }))}
    />
)
