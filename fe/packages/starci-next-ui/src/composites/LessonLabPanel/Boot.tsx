import { InlineStatus, Section, Stack, Text } from "@starci/grammar/common"
import type { LabBootLabels, LabBootView } from "./types"

/** What the boot needs: the stages and the words. */
type LabBootProps = {
    readonly boot: LabBootView
    readonly labels: LabBootLabels
    readonly isLoading: boolean
}

/**
 * The lab while the machine brings it up: the stages in order (machine checks, source, compose up, seed, first test run), each with
 * its state and how long it took, and the note that the first time waits for the Docker images.
 */
export const LabBoot = (props: LabBootProps) => {
    const { boot, labels } = props
    return (
        <Section title={labels.title(boot.machine)} headingLevel={2} isLoading={props.isLoading}>
            <Stack gap="row">
                {boot.stages.map((stage) => (
                    <Stack key={stage.id} gap="identity">
                        <InlineStatus
                            state={stage.state}
                            label={stage.label}
                            meta={stage.duration === "" ? undefined : stage.duration}
                        />
                        {stage.state === "error" && stage.detail !== "" ? (
                            <Text role="body" tone="muted">
                                {stage.detail}
                            </Text>
                        ) : null}
                    </Stack>
                ))}
                <Text role="body" tone="muted">
                    {labels.firstTime}
                </Text>
            </Stack>
        </Section>
    )
}
