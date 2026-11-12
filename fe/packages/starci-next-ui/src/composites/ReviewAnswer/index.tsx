import { Alert, Button, Cluster, Stack, Text } from "@starci/grammar/common"
import { MarkdownBody } from "../MarkdownBody"
import type { ReviewBackView, ReviewItemCommands, ReviewItemScreen, ReviewSessionLabels } from "../ReviewItemCard/types"

/** What the revealed answer needs. */
type ReviewAnswerProps = {
    readonly item: ReviewItemScreen
    readonly back: ReviewBackView
    readonly labels: ReviewSessionLabels
    readonly on: Pick<ReviewItemCommands, "grade" | "retry">
}

/** The revealed answer with its muted sections and the four grade buttons. */
export const ReviewAnswer = (props: ReviewAnswerProps) => (
    <Stack gap="row">
        {props.back.parts.map((part) => (
            <Stack key={part.id} gap="inline">
                {part.title === undefined ? null : (
                    <Text size="sm" tone="muted" isStrong>
                        {part.title}
                    </Text>
                )}
                <MarkdownBody
                    blocks={part.blocks}
                    diagramLabel={props.labels.diagram}
                    diagramErrorTitle={props.labels.diagramError}
                />
            </Stack>
        ))}
        <Text size="sm" tone="muted">
            {props.labels.rateQuestion}
        </Text>
        <Cluster gap="inline" wrap label={props.labels.rateGroup}>
            {props.back.grades.map((each) => (
                <Button
                    key={each.grade}
                    intent={each.grade === "AGAIN" ? "neutral" : "alternative"}
                    isDisabled={props.item.isGrading}
                    onPress={() => props.on.grade(each.grade)}
                >
                    {`${each.key} · ${each.label} · ${each.interval}`}
                </Button>
            ))}
        </Cluster>
        {props.item.isGradeFailed ? (
            <Alert
                tone="negative"
                title={props.labels.saveFailedTitle}
                description={props.labels.saveFailedBody}
                action={{ label: props.labels.retry, onAction: props.on.retry }}
            />
        ) : null}
        <Text size="sm" tone="muted">
            {props.labels.shortcuts}
        </Text>
    </Stack>
)
