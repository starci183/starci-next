import {
    Alert,
    Badge,
    Button,
    ChoiceChips,
    Cluster,
    Heading,
    Kbd,
    Stack,
    SurfaceCard,
    Text,
    Textarea,
} from "@starci/grammar/common"
import { ReviewAnswer } from "../ReviewAnswer"
import type { ReviewItemCommands, ReviewItemScreen, ReviewSessionLabels } from "./types"

/** What the item the learner works on needs: the screen, the words, the handlers and whether it is a skeleton. */
type ReviewItemCardProps = {
    readonly item: ReviewItemScreen
    readonly labels: ReviewSessionLabels
    readonly isLoading: boolean
    readonly on: ReviewItemCommands
}

/** The cloze checks: pick the hidden term among the choices; the check answers at once and calls no AI. */
const Cloze = (props: {
    readonly item: ReviewItemScreen
    readonly labels: ReviewSessionLabels
    readonly onPick: (n: number, choice: string) => void
}) =>
    props.item.cloze.length === 0 ? null : (
        <Stack gap="row">
            {props.item.cloze.map((each) => (
                <Stack key={each.n} gap="inline">
                    <ChoiceChips
                        label={each.label}
                        options={each.choices.map((choice) => ({ value: choice, label: choice }))}
                        {...(each.picked === undefined ? {} : { value: each.picked })}
                        onValueChange={(choice) => props.onPick(each.n, choice)}
                        empty={null}
                    />
                    {each.result === undefined ? null : (
                        <Badge tone={each.result === "correct" ? "success" : "warning"}>
                            {each.result === "correct" ? props.labels.clozeCorrect : props.labels.clozeWrong}
                        </Badge>
                    )}
                </Stack>
            ))}
        </Stack>
    )

/** The notices under the answer box: written grading is not available yet, or the call failed. */
const Notices = (props: { readonly issue: ReviewItemScreen["issue"]; readonly labels: ReviewSessionLabels }) => (
    <>
        {props.issue === "soon" ? (
            <Alert tone="informative" title={props.labels.retrievalSoon} description={props.labels.retrievalSoonNote} />
        ) : null}
        {props.issue === "failed" ? (
            <Alert tone="negative" title={props.labels.saveFailedTitle} description={props.labels.saveFailedBody} />
        ) : null}
    </>
)

/** The answer box before the flip: the optional note of what the learner remembers, then the one command that shows the answer. */
const Recall = (props: {
    readonly item: ReviewItemScreen
    readonly labels: ReviewSessionLabels
    readonly on: Pick<ReviewItemCommands, "setNote" | "flip" | "submitAnswer" | "skip">
}) => {
    const isRetrieval = props.item.isRetrieval
    const isSoon = props.item.issue === "soon"
    return (
        <Stack gap="row">
            <Textarea
                label={isRetrieval ? props.labels.retrievalLabel : props.labels.noteLabel}
                placeholder={isRetrieval ? props.labels.retrievalPlaceholder : props.labels.notePlaceholder}
                rows={3}
                value={props.item.note}
                isDisabled={props.item.isFlipping || isSoon}
                {...(props.item.issue === "invalid" ? { isInvalid: true, errorMessage: props.labels.answerError } : {})}
                onValueChange={props.on.setNote}
            />
            <Notices issue={props.item.issue} labels={props.labels} />
            <Cluster gap="inline" wrap align="center">
                {isSoon ? (
                    <Button intent="neutral" onPress={props.on.skip}>
                        {props.labels.skip}
                    </Button>
                ) : (
                    <Button
                        intent="commit"
                        isPending={props.item.isFlipping}
                        isDisabled={isRetrieval && props.item.note.trim() === ""}
                        onPress={isRetrieval ? props.on.submitAnswer : props.on.flip}
                    >
                        {isRetrieval ? props.labels.revealRetrieval : props.labels.flip}
                    </Button>
                )}
                {isRetrieval ? null : <Kbd keys={["space"]} />}
            </Cluster>
        </Stack>
    )
}

/** One item: where it comes from and what kind it is, the question, the cloze checks, the answer box, then the revealed answer and the grades. */
export const ReviewItemCard = (props: ReviewItemCardProps) => (
    <SurfaceCard ariaLabel={props.item.question} isLoading={props.isLoading}>
        <Stack gap="row">
            <Cluster gap="inline" wrap align="center">
                <Badge tone="muted">{props.item.sourceLine}</Badge>
                <Text size="sm" tone="muted">
                    {props.item.kindLine}
                </Text>
            </Cluster>
            <Heading level={2} scale="standard">
                {props.item.question}
            </Heading>
            {props.item.isConflict ? (
                <Alert
                    tone="cautionary"
                    title={props.labels.conflictTitle}
                    description={props.labels.conflictBody}
                    action={{ label: props.labels.reload, onAction: props.on.reload }}
                />
            ) : props.item.back === undefined ? (
                <Stack gap="inline">
                    <Cloze item={props.item} labels={props.labels} onPick={props.on.pick} />
                    <Recall item={props.item} labels={props.labels} on={props.on} />
                </Stack>
            ) : (
                <ReviewAnswer item={props.item} labels={props.labels} on={props.on} back={props.item.back} />
            )}
        </Stack>
    </SurfaceCard>
)
