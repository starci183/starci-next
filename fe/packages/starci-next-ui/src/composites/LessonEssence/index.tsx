import {
    Alert,
    Badge,
    Button,
    Cluster,
    IconTile,
    ProgressCircle,
    Section,
    Stack,
    SurfaceCard,
    Text,
} from "@starci/grammar/common"
import { LockGlyph } from "../../leaves/Icon"
import type { EssenceLabels, EssenceResultRow, EssenceView } from "./types"

export { LessonOpener } from "./opener"
export { LessonQuestion } from "./question"
export { canMoveOn, optionCardsOf, optionKeyOf, type OptionCard, type OptionCardState } from "./state"

export type {
    EssenceBarPart,
    EssenceCode,
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
    /** Opens the next part (Bản chất). */
    readonly onNext: () => void
    /** Opens the plans, from the end-of-part notice of a reader without Premium. */
    readonly onUpgrade: () => void
}

/** The pill of one result row: right on the first pick, or how many picks it took. */
export const resultTagOf = (
    row: EssenceResultRow,
    labels: EssenceLabels["result"],
): { readonly label: string; readonly tone: "success" | "warning" } =>
    row.isFirstTry
        ? { label: labels.firstTry, tone: "success" }
        : { label: labels.triedTimes(row.misses + 1), tone: "warning" }

/**
 * The result of the five questions: the score ring ("5/5 đã nắm"), "Xong phần Mở đầu" with one sentence on how many were right on the
 * first pick, then one row per moment of the story (its time, the essence it teaches, a pill "Đúng ngay" or "Đúng sau N lần" and, after
 * a retry, where to read it again), and the two ways on: answer the five again, or go to Bản chất.
 */
export const LessonResult = (props: LessonResultProps) => {
    const { view, labels, isLoading } = props
    const result = labels.result
    const ratio = view.total === 0 ? 0 : Math.round((view.solvedCount / view.total) * 100)
    return (
        <Stack gap="region" measure="reading">
            <SurfaceCard ariaLabel={result.title} isLoading={isLoading}>
                <Cluster gap="section" align="center">
                    <ProgressCircle label={`${view.solvedFigure} ${result.scoreCaption}`} value={ratio} size="lg" />
                    <Stack gap="identity">
                        <Cluster gap="inline" align="baseline">
                            <Text role="figure" tabular isLoading={isLoading}>
                                {view.solvedFigure}
                            </Text>
                            <Text role="caption" tone="muted" isLoading={isLoading}>
                                {result.scoreCaption}
                            </Text>
                        </Cluster>
                        <Text role="title.section" isLoading={isLoading}>
                            {result.title}
                        </Text>
                        <Text as="p" isLoading={isLoading}>
                            {result.summary(view.solvedCount, view.total, view.firstTryCount)}
                        </Text>
                    </Stack>
                </Cluster>
            </SurfaceCard>
            <Section
                kind="list"
                title={result.listTitle}
                headingLevel={2}
                isLoading={isLoading}
                empty={labels.opener.empty}
                {...(view.retakeLine === "" ? {} : { caption: view.retakeLine })}
                items={view.resultRows.map((row) => {
                    const tag = resultTagOf(row, result)
                    return {
                        id: row.id,
                        title: row.text.replaceAll("`", ""),
                        description: row.at,
                        value: <Badge tone={tag.tone}>{tag.label}</Badge>,
                        ...(row.link === undefined
                            ? {}
                            : { action: { kind: "link" as const, label: row.link.label, href: row.link.href } }),
                    }
                })}
            />
            <Cluster gap="inline" justify="between" align="center">
                <Button variant="border" onPress={props.onRetake}>
                    {labels.result.retake}
                </Button>
                <Button variant="primary" endArrow onPress={props.onNext}>
                    {result.toNext}
                </Button>
            </Cluster>
            {view.isFree ? (
                <Alert
                    tone="accent"
                    leading={<IconTile source={LockGlyph} />}
                    title={result.freeTitle}
                    description={result.freeText}
                    action={{ label: result.upgrade, onAction: props.onUpgrade }}
                />
            ) : null}
        </Stack>
    )
}
