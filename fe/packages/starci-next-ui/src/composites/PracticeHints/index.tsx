import { Badge, Button, Cluster, Heading, Stack, SurfaceCard, Text } from "@starci/grammar/common"
import { MarkdownBody, type MarkdownBlock } from "../MarkdownBody"

/** One revealed hint of the ladder. */
export type PracticeHintItem = {
    readonly step: number
    readonly title: string
    readonly blocks: ReadonlyArray<MarkdownBlock>
}

/** The words of the hint ladder, resolved by its block. */
export type PracticeHintsLabels = {
    readonly title: string
    /** "AI only hints, never writes your code". */
    readonly note: string
    readonly reveal: string
    readonly revealing: string
    readonly done: string
    readonly step: (step: number, total: number) => string
    readonly diagram: string
    readonly diagramError: string
}

/** The three-step hint ladder of a problem. */
type PracticeHintsProps = {
    readonly labels: PracticeHintsLabels
    readonly total: number
    readonly revealed: ReadonlyArray<PracticeHintItem>
    readonly isRevealing: boolean
    /** True when the reader may not ask for a hint (locked problem). */
    readonly isDisabled: boolean
    readonly onReveal: () => void
}

/** The hint ladder: revealed hints in order, the button for the next one, and the promise that no code is written for the learner. */
export const PracticeHints = (props: PracticeHintsProps) => {
    const isComplete = props.revealed.length >= props.total
    return (
        <SurfaceCard label={props.labels.title}>
            <Stack gap="section">
                <Text size="sm" tone="muted">
                    {props.labels.note}
                </Text>
                {props.revealed.map((hint) => (
                    <Stack key={hint.step} gap="row">
                        <Cluster gap="inline" wrap align="center">
                            <Badge tone="accent">{props.labels.step(hint.step, props.total)}</Badge>
                            <Heading level={3} scale="standard">
                                {hint.title}
                            </Heading>
                        </Cluster>
                        <MarkdownBody
                            blocks={hint.blocks}
                            diagramLabel={props.labels.diagram}
                            diagramErrorTitle={props.labels.diagramError}
                        />
                    </Stack>
                ))}
                {isComplete ? (
                    <Text size="sm" tone="muted">
                        {props.labels.done}
                    </Text>
                ) : (
                    <Cluster gap="inline">
                        <Button
                            intent="alternative"
                            isPending={props.isRevealing}
                            isDisabled={props.isDisabled || props.isRevealing}
                            onPress={props.onReveal}
                        >
                            {props.isRevealing ? props.labels.revealing : props.labels.reveal}
                        </Button>
                    </Cluster>
                )}
            </Stack>
        </SurfaceCard>
    )
}
