import { Alert, Button, IconTile, InlineStatus, Link, Section, Stack } from "@starci/grammar/common"
import { LockGlyph } from "../../leaves/Icon"
import type { EssenceLabels, EssenceView } from "./types"

export { LessonOpener } from "./opener"
export { LessonQuestion } from "./question"

export type {
    EssenceBarPart,
    EssenceInsight,
    EssenceLabels,
    EssenceMiss,
    EssenceQuestionView,
    EssenceReason,
    EssenceResultRow,
    EssenceStage,
    EssenceStory,
    EssenceView,
} from "./types"

/** What the result needs. */
type LessonResultProps = {
    readonly view: EssenceView
    readonly labels: EssenceLabels
    readonly isLoading: boolean
    /** Answers the five again. */
    readonly onRetake: () => void
    /** Opens the plans, from the end-of-part notice of a reader without Premium. */
    readonly onUpgrade: () => void
}

/**
 * The result of the five questions: how many were solved and how many right on the first pick, then one row per question (its time, the
 * essence it teaches, right first time or how many picks were wrong, and where to read it again), and the way to answer them again.
 */
export const LessonResult = (props: LessonResultProps) => {
    const { view, labels } = props
    return (
        <Stack gap="region">
            <Section
                kind="figures"
                ariaLabel={labels.result.listTitle}
                isLoading={props.isLoading}
                items={[
                    { id: "solved", term: labels.result.solvedLabel, value: view.solvedFigure },
                    { id: "first", term: labels.result.firstTryLabel, value: view.firstTryFigure },
                ]}
            />
            <Section
                kind="list"
                title={labels.result.listTitle}
                headingLevel={2}
                isLoading={props.isLoading}
                empty={labels.opener.empty}
                {...(view.retakeLine === "" ? {} : { caption: view.retakeLine })}
                items={view.resultRows.map((row) => ({
                    id: row.id,
                    title: row.text.replaceAll("`", ""),
                    meta: { text: row.at },
                    value: row.isFirstTry ? (
                        <InlineStatus state="done" label={labels.result.firstTry} />
                    ) : (
                        <InlineStatus state="error" label={labels.result.missedTimes(row.misses)} />
                    ),
                    ...(row.link === undefined
                        ? {}
                        : {
                              description: (
                                  <Link href={row.link.href}>{row.link.label}</Link>
                              ),
                          }),
                }))}
            />
            <Stack gap="inline">
                <Button variant="border" onPress={props.onRetake}>
                    {labels.result.retake}
                </Button>
            </Stack>
            {view.isFree ? (
                <Alert
                    tone="accent"
                    leading={<IconTile source={LockGlyph} />}
                    title={labels.result.freeTitle}
                    description={labels.result.freeText}
                    action={{ label: labels.result.upgrade, onAction: props.onUpgrade }}
                />
            ) : null}
        </Stack>
    )
}
