import { Button, Cluster, Stack, SurfaceCard, Text, Textarea } from "@starci/grammar/common"

/** The words of the answer box of an interview, resolved by its block. */
export type InterviewComposerLabels = {
    readonly answer: string
    readonly placeholder: string
    readonly send: string
    readonly sending: string
    readonly hintNone: string
    readonly hintNote: string
    readonly skip: string
}

/** The answer box of an interview and what it does. */
type InterviewComposerProps = {
    readonly labels: InterviewComposerLabels
    readonly draft: string
    /** The words of the hint button with the hints left. */
    readonly hintLabel: string
    readonly hintsLeft: number
    /** True while the answer is being stored. */
    readonly isSending: boolean
    /** True while a hint is being asked. */
    readonly isHinting: boolean
    /** True while another step holds the room, the reply is missing or the read runs: nothing can be sent. */
    readonly isBusy: boolean
    readonly onWrite: (text: string) => void
    readonly onSend: () => void
    readonly onHint: () => void
    readonly onSkip: () => void
}

/** The answer box of the interview room: the text, send, a hint with the hints left, and skip. The one commit is the send. */
export const InterviewComposer = (props: InterviewComposerProps) => (
    <SurfaceCard label={props.labels.answer}>
        <Stack gap="row">
            <Textarea
                label={props.labels.answer}
                name="interview-answer"
                rows={6}
                placeholder={props.labels.placeholder}
                value={props.draft}
                isDisabled={props.isBusy}
                onValueChange={props.onWrite}
            />
            <Cluster gap="inline" wrap align="center">
                <Button
                    intent="commit"
                    isPending={props.isSending}
                    isDisabled={props.draft.trim() === "" || props.isBusy}
                    onPress={props.onSend}
                >
                    {props.isSending ? props.labels.sending : props.labels.send}
                </Button>
                <Button
                    intent="neutral"
                    isPending={props.isHinting}
                    isDisabled={props.hintsLeft === 0 || props.isBusy}
                    onPress={props.onHint}
                >
                    {props.hintsLeft === 0 ? props.labels.hintNone : props.hintLabel}
                </Button>
                <Button intent="dismiss" isDisabled={props.isBusy} onPress={props.onSkip}>
                    {props.labels.skip}
                </Button>
                <Text size="sm" tone="muted">
                    {props.labels.hintNote}
                </Text>
            </Cluster>
        </Stack>
    </SurfaceCard>
)
