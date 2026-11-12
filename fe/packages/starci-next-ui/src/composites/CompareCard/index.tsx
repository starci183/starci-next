import { Badge, SurfaceCard } from "@starci/grammar/common"
import { levelWordsOf, toneOf } from "../ResultCard/levels"
import type { LessonCompareLabels, StudyView } from "../StudyBody/types"

/** What the comparison needs. */
type CompareCardProps = {
    readonly rows: StudyView["compare"]
    readonly score: string
    readonly labels: LessonCompareLabels
}

/** The opening words of a reason, by how the criterion moved. */
const HEAD_OF: Readonly<Record<"same" | "better" | "worse", (labels: LessonCompareLabels) => string>> = {
    same: (labels) => labels.same,
    better: (labels) => labels.better,
    worse: (labels) => labels.worse,
}

/** The reason a criterion moved, as one line. */
const reasonOf = (row: StudyView["compare"][number], labels: LessonCompareLabels): string => {
    const { kind, detail, missing } = row.reason
    if (kind === "none") return ""
    const head = HEAD_OF[kind](labels)
    const parts = [kind === "same" || detail === "" ? head : `${head}: ${detail}`]
    if (missing !== "") parts.push(`${labels.missing}: ${missing}`)
    return parts.join("; ")
}

/** What a level badge needs. */
type LevelBadgeProps = { readonly level: number; readonly labels: LessonCompareLabels }

/** A level as a badge; the words "not done" when there is no grade. */
const LevelBadge = (props: LevelBadgeProps) => (
    <Badge tone={props.level < 0 ? "muted" : toneOf(props.level)}>
        {levelWordsOf(props.level, props.labels.levels, props.labels.none)}
    </Badge>
)

/** The before and after of the closing interview: per criterion the first level, the level now and why, with the two totals in the head. */
export const CompareCard = (props: CompareCardProps) => (
    <SurfaceCard
        kind="table"
        label={props.labels.title}
        {...(props.score === "" ? {} : { fact: props.score })}
        empty={props.labels.empty}
        columns={[
            { id: "criterion", label: props.labels.criterion, width: "fill", minWidth: 220 },
            { id: "before", label: props.labels.before, width: "fit" },
            { id: "after", label: props.labels.after, width: "fit" },
            { id: "why", label: props.labels.why, priority: "low" },
        ]}
        rows={props.rows.map((row) => ({
            id: row.id,
            cells: {
                criterion: row.criterion,
                before: <LevelBadge level={row.before} labels={props.labels} />,
                after: <LevelBadge level={row.after} labels={props.labels} />,
                why: reasonOf(row, props.labels),
            },
        }))}
    />
)
