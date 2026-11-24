import { Stack, Text } from "@starci/grammar/common"
import { HighlightedFence } from "../../branches/HighlightedCode/fence"
/** One install or sign-in step of a setup guide: its title, the command to run when it has one, and the line under it. */
export type DevicesPairStep = { readonly title: string; readonly command: string | undefined; readonly note: string }

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
                <Text role="label.item" isLoading={props.isLoading === true}>{`${index + 1}. ${step.title}`}</Text>
                {step.command === undefined || props.isLoading === true ? null : (
                    <HighlightedFence code={step.command} language="bash" />
                )}
                <Text role="body" tone="muted" isLoading={props.isLoading === true}>
                    {step.note}
                </Text>
            </Stack>
        ))}
    </Stack>
)
