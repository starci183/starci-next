import { Alert, Button, Cluster, Stack, Sublabel, Text } from "@starci/grammar/common"
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
        <Stack gap="section">
            {props.back.note === "" ? null : (
                <Stack gap="identity">
                    <Sublabel>{props.labels.recalled}</Sublabel>
                    <Text>{props.back.note}</Text>
                </Stack>
            )}
            <Stack gap="row">
                <Sublabel>{props.labels.answerTitle}</Sublabel>
                {props.back.parts.map((part) => (
                    <Stack key={part.id} gap="inline">
                        {part.title === undefined ? null : <Sublabel>{part.title}</Sublabel>}
                        <RichMarkdown source={part.markdown} labels={markdownLabels} />
                    </Stack>
                ))}
            </Stack>
            <Sublabel>{props.labels.rateQuestion}</Sublabel>
            <Cluster gap="inline" wrap label={props.labels.rateGroup}>
                {props.back.grades.map((each) => (
                    <Stack key={each.grade} gap="identity" align="center">
                        <Button
                            variant={each.grade === "GOOD" ? "primary" : "border"}
                            isDisabled={props.item.isGrading}
                            onPress={() => props.on.grade(each.grade)}
                        >
                            {each.label}
                        </Button>
                        <Text role="caption">{each.interval}</Text>
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
            <Text role="caption">{props.labels.shortcuts}</Text>
        </Stack>
    )
}
