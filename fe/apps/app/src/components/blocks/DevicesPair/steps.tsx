import { FencedCodeBlock, Stack, Text } from "@starci/grammar/common"
import type { DevicesPairStep } from "./types"

/** What the step rows need: the steps. */
type StepRowsProps = { readonly steps: ReadonlyArray<DevicesPairStep> }

/** The pairing steps as numbered rows, with the command of a step under its title. */
export const StepRows = (props: StepRowsProps) => (
    <Stack gap="row">
        {props.steps.map((step, index) => (
            <Stack key={step.title} gap="identity">
                <Text isStrong>{`${index + 1}. ${step.title}`}</Text>
                {step.command === undefined ? null : <FencedCodeBlock code={step.command} language="bash" />}
                <Text size="sm" tone="muted">
                    {step.note}
                </Text>
            </Stack>
        ))}
    </Stack>
)
