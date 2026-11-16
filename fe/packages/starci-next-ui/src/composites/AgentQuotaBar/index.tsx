import { Alert, Progress, Section, Stack, Text } from "@starci/grammar/common"

/** The state of the model-call line: a bar to count down, the own account of the learner, or the hard stop. */
export type AgentQuotaBarTone = "remaining" | "ownAccount" | "stopped"

/** The model-call line of the agent lab, already in words. */
type AgentQuotaBarProps = {
    /** The headline, for example the calls left today, or that the own account of the learner is used. */
    readonly title: string
    /** The line under it: who pays, and what happens at the limit. */
    readonly description: string
    readonly tone: AgentQuotaBarTone
    /** The share of the calls of today still left, 0 to 100; undefined draws no bar (own account). */
    readonly percentLeft: number | undefined
    /** The accessible name of the bar. */
    readonly barLabel: string
    /** The spoken reading of the bar. */
    readonly valueText: string
    readonly isLoading?: boolean
}

/** The quota bar: the calls left today with a bar, the hard-stop state at zero, or the note that the learner pays on their own account. */
export const AgentQuotaBar = (props: AgentQuotaBarProps) =>
    props.tone === "stopped" ? (
        <Alert
            tone="negative"
            title={props.title}
            description={props.description}
            {...(props.isLoading === true ? { isLoading: true } : {})}
        />
    ) : (
        <Section title={props.title} headingLevel={2} {...(props.isLoading === true ? { isLoading: true } : {})}>
            <Stack gap="row">
                {props.percentLeft === undefined ? null : (
                    <Progress
                        label={props.barLabel}
                        value={props.percentLeft}
                        valueText={props.valueText}
                        tone="accent"
                    />
                )}
                <Text tone="muted">{props.description}</Text>
            </Stack>
        </Section>
    )
