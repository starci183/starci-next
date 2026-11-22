import { Button, Cluster, Heading, InlineStatus, Section, Stack, Text } from "@starci/grammar/common"

/** One essence of the lesson with where the learner stood before and after. */
export type LessonEndRow = {
    readonly id: string
    /** The time in the opener story (`23:58`). */
    readonly at: string
    readonly title: string
    /** "Đúng ngay" or "Sai 1 lần". */
    readonly before: { readonly label: string; readonly isRight: boolean }
    /** "Sạn 1 pass", or "Chưa chạy" while the test is not green. */
    readonly after: { readonly label: string; readonly isDone: boolean }
}

/** The end of the lesson as drawn. */
export type LessonEndView = {
    readonly title: string
    readonly summary: string
    readonly figures: ReadonlyArray<{ readonly id: string; readonly term: string; readonly value: string }>
    readonly rows: ReadonlyArray<LessonEndRow>
}

/** The words of the end of the lesson. */
export type LessonEndLabels = {
    readonly before: string
    readonly after: string
    readonly essence: string
    readonly review: string
}

/** What the end of the lesson needs. */
type LessonEndProps = {
    readonly view: LessonEndView
    readonly labels: LessonEndLabels
    readonly isLoading: boolean
    /** Opens the lesson's questions in the review queue; undefined draws none. */
    readonly reviewHref: string | undefined
}

/**
 * The end of the lesson, "trước và sau": the three figures that sum it up (right on the first pick, tests passed, the best challenge)
 * and, per essence, how the learner answered before reading against the test that proved it after.
 */
export const LessonEnd = (props: LessonEndProps) => {
    const { view, labels } = props
    return (
        <Stack gap="region">
            <Stack gap="inline">
                <Heading level={2}>{view.title}</Heading>
                <Text as="p">{view.summary}</Text>
            </Stack>
            <Section
                kind="figures"
                ariaLabel={view.title}
                isLoading={props.isLoading}
                items={view.figures.map((figure) => ({ id: figure.id, term: figure.term, value: figure.value }))}
            />
            <Section
                kind="list"
                title={labels.essence}
                headingLevel={2}
                isLoading={props.isLoading}
                empty={labels.essence}
                items={view.rows.map((row) => ({
                    id: row.id,
                    title: row.title,
                    meta: { text: row.at },
                    value: (
                        <Cluster gap="section" align="center">
                            <InlineStatus
                                state={row.before.isRight ? "done" : "error"}
                                label={`${labels.before}: ${row.before.label}`}
                            />
                            <InlineStatus
                                state={row.after.isDone ? "done" : "notRun"}
                                label={`${labels.after}: ${row.after.label}`}
                            />
                        </Cluster>
                    ),
                }))}
            />
            {props.reviewHref === undefined ? null : (
                <Stack gap="inline">
                    <Button variant="border" href={props.reviewHref}>
                        {labels.review}
                    </Button>
                </Stack>
            )}
        </Stack>
    )
}
