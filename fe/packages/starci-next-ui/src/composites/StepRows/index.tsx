import { FencedCodeBlock, Stack, Text } from "@starci/grammar/common"
import type { DevicesPairStep } from "../ConnectDrawer/types"

/** What the step rows need: the steps. */
type StepRowsProps = {
    readonly steps: ReadonlyArray<DevicesPairStep>
    /** The first read has no data yet: the words draw as skeleton geometry and no command shows. */
    readonly isLoading?: boolean
}

/** The pairing steps as numbered rows, with the command of a step under its title. */
export const StepRows = (props: StepRowsProps) => (
    <Stack gap="row">
        {props.steps.map((step, index) => (
            <Stack key={step.title} gap="identity">
                <Text isStrong isLoading={props.isLoading === true}>{`${index + 1}. ${step.title}`}</Text>
                {step.command === undefined || props.isLoading === true ? null : (
                    <FencedCodeBlock code={step.command} language="bash" />
                )}
                <Text size="sm" tone="muted" isLoading={props.isLoading === true}>
                    {step.note}
                </Text>
            </Stack>
        ))}
    </Stack>
)
