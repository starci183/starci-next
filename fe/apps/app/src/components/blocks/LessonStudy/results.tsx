import { Badge, Markdown, SurfaceCard } from "@starci/grammar/common"
import { renderLessonCode } from "./code"
import type {
    LessonCompareLabels,
    LessonCompletionLabels,
    LessonResultLabels,
    MarkdownLabels,
    StudyView,
    WrittenDraftView,
} from "@/modules/types"

/** The tone of a graded level: reached, half, not yet. */
const toneOf = (level: number): "success" | "warning" | "muted" => {
    if (level >= 2) return "success"
    return level === 1 ? "warning" : "muted"
}

/** The words of a level, or the "no grade" words for -1. */
const levelWordsOf = (level: number, words: readonly [string, string, string], none: string): string =>
    words[level] ?? none

/** What the result card needs: the graded draft and the words. */
type ResultCardProps = { readonly draft: WrittenDraftView; readonly labels: LessonResultLabels }

/** The line under a criterion: what is missing when the grade is not full, else the quote of the answer that earns it. */
const lineOf = (
    criterion: WrittenDraftView["criteria"][number],
    labels: LessonResultLabels,
): { readonly description?: string } => {
    if (criterion.missing !== "") return { description: `${labels.missing}: ${criterion.missing}` }
    return criterion.evidence === "" ? {} : { description: criterion.evidence }
}

/**
 * The result of a graded written answer: the rubric rows with the level badge and the missing line, the score and the time it was saved
 * in the head, and, for the opening diagnostic, the closing line that says falling short is expected. Nothing before a grade.
 */
export const ResultCard = (props: ResultCardProps) => {
    const { draft, labels } = props
    if (draft.criteria.length === 0) return null
    const fact = [draft.scoreShort, draft.savedAt === "" ? "" : labels.savedAt(draft.savedAt)]
        .filter((each) => each !== "")
        .join(" · ")
    return (
        <SurfaceCard
            kind="list"
            label={labels.title}
            {...(fact === "" ? {} : { fact })}
            empty={labels.title}
            items={[
                ...draft.criteria.map((criterion) => ({
                    id: criterion.id,
                    title: criterion.criterion,
                    ...lineOf(criterion, labels),
                    badges: [
                        { label: levelWordsOf(criterion.level, labels.levels, ""), tone: toneOf(criterion.level) },
                    ] as const,
                })),
                ...(draft.isDiagnostic ? [{ id: "note", title: labels.diagnosticNote }] : []),
            ]}
        />
    )
}

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

/** What the completion card needs: the lesson, when it was completed, the words and where the review and the project lead. */
type CompletionCardProps = {
    readonly lessonTitle: string
    readonly completedAt: string
    readonly time: string
    readonly labels: LessonCompletionLabels
    readonly reviewHref: string
    readonly projectsHref: string
}

/** The completion of the lesson: that it is done and when, the reviews it opened and the way to take it to a project. Nothing before the completion. */
export const CompletionCard = (props: CompletionCardProps) =>
    props.completedAt === "" ? null : (
        <SurfaceCard
            kind="list"
            label={props.labels.title}
            empty={props.labels.title}
            items={[
                { id: "done", title: props.labels.done(props.lessonTitle), meta: { text: props.time } },
                {
                    id: "reviews",
                    title: props.labels.reviewsOpen,
                    action: { label: props.labels.reviewsLink, href: props.reviewHref },
                    actionPlacement: "end",
                },
                {
                    id: "project",
                    title: props.labels.project,
                    action: { label: props.labels.projectLink, href: props.projectsHref },
                    actionPlacement: "end",
                },
            ]}
        />
    )

/** What the explanation of a graded choice needs. */
type ChoiceWhyProps = {
    readonly title: string
    readonly options: ReadonlyArray<{ readonly id: string; readonly label: string }>
    readonly explanations: Readonly<Record<string, string>>
    readonly correctId: string
    readonly correctWords: string
    readonly markdownLabels: MarkdownLabels
}

/** The reason behind each option of a graded choice, in normal text under the option it explains: the right one first, marked. */
export const ChoiceWhy = (props: ChoiceWhyProps) => {
    const ordered = [...props.options].toSorted(
        (a, b) => Number(b.id === props.correctId) - Number(a.id === props.correctId),
    )
    return (
        <SurfaceCard
            kind="list"
            label={props.title}
            empty={props.title}
            items={ordered.flatMap((option) => {
                const explanation = props.explanations[option.id]
                if (explanation === undefined || explanation === "") return []
                return [
                    {
                        id: option.id,
                        title: option.label,
                        ...(option.id === props.correctId
                            ? { badges: [{ label: props.correctWords, tone: "success" as const }] as const }
                            : {}),
                        detail: (
                            <Markdown
                                source={explanation}
                                measure="compact"
                                labels={props.markdownLabels}
                                renderCode={renderLessonCode}
                            />
                        ),
                    },
                ]
            })}
        />
    )
}
