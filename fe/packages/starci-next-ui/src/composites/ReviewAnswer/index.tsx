import { Alert, Button, Cluster, Stack, Text } from "@starci/grammar/common"
import { RichMarkdown } from "../RichMarkdown"
import type { ReviewBackView, ReviewItemCommands, ReviewItemScreen, ReviewSessionLabels } from "../ReviewItemCard/types"

/** What the revealed answer needs. */
type ReviewAnswerProps = {
    readonly item: ReviewItemScreen
    readonly back: ReviewBackView
    readonly labels: ReviewSessionLabels
    readonly on: Pick<ReviewItemCommands, "grade" | "retry">
}

/** The revealed answer: what the learner remembered next to it, then the four grades, each with its next interval right under it. */
export const ReviewAnswer = (props: ReviewAnswerProps) => {
    const markdownLabels = { diagram: props.labels.diagram, diagramError: props.labels.diagramError }
    return (
        <Stack gap="row">
            {props.back.note === "" ? null : (
                <Stack gap="identity">
                    <Text size="sm" tone="muted" isStrong>
                        {props.labels.recalled}
                    </Text>
                    <Text>{props.back.note}</Text>
                </Stack>
            )}
            <Stack gap="identity">
                <Text size="sm" tone="muted" isStrong>
                    {props.labels.answerTitle}
                </Text>
                {props.back.parts.map((part) => (
                    <Stack key={part.id} gap="identity">
                        {part.title === undefined ? null : (
                            <Text size="sm" tone="muted">
                                {part.title}
                            </Text>
                        )}
                        <RichMarkdown source={part.markdown} labels={markdownLabels} />
                    </Stack>
                ))}
            </Stack>
            <Text size="sm" tone="muted" isStrong>
                {props.labels.rateQuestion}
            </Text>
            <Cluster gap="inline" wrap label={props.labels.rateGroup}>
                {props.back.grades.map((each) => (
                    <Stack key={each.grade} gap="identity" align="center">
                        <Button
                            intent={each.grade === "GOOD" ? "commit" : "neutral"}
                            isDisabled={props.item.isGrading}
                            onPress={() => props.on.grade(each.grade)}
                        >
                            {each.label}
                        </Button>
                        <Text size="xs" tone="muted">
                            {each.interval}
                        </Text>
                    </Stack>
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
}
