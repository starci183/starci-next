import { Button, Cluster, CopyField, Heading, Stack, Tabs, Text } from "@starci/grammar/common"
import type { LabOsId, LabSetupLabels, LabSetupView, LessonLabActions } from "./types"

/** What the setup needs: the view, the words and the two commands it sends. */
type LabSetupProps = {
    readonly setup: LabSetupView
    readonly labels: LabSetupLabels
    readonly on: Pick<LessonLabActions, "selectOs" | "newCode">
}

/** The OS id a tab key names, or undefined for a key that is none of the three. */
const osOf = (labels: LabSetupLabels, key: string): LabOsId | undefined => labels.os.find((os) => os.id === key)?.id

/**
 * The lab of a learner with no machine paired: what the relay does, the install command (the same on every OS, only the Docker
 * note changes), the pairing command with its one-use code, and the line that says nothing else has to be typed.
 */
export const LabSetup = (props: LabSetupProps) => {
    const { setup, labels } = props
    const current = labels.os.find((os) => os.id === setup.os) ?? labels.os[0]
    const field = (label: string, value: string) => (
        <CopyField
            label={label}
            isLabelHidden
            value={value}
            copyLabel={labels.copy}
            copiedLabel={labels.copied}
            copyErrorLabel={labels.copyFailed}
        />
    )
    return (
        <Stack gap="section">
            <Stack gap="row">
                <Heading level={2}>{labels.title}</Heading>
                <Text tone="muted">{labels.note}</Text>
            </Stack>
            <Stack gap="row">
                <Tabs
                    label={labels.osTabs}
                    selectedKey={setup.os}
                    items={labels.os.map((os) => ({ id: os.id, label: os.label }))}
                    onSelect={(key) => {
                        const os = osOf(labels, key)
                        if (os !== undefined) props.on.selectOs(os)
                    }}
                />
                <Stack gap="identity">
                    <Text role="label.item">{`1. ${labels.installStep}`}</Text>
                    {field(labels.installStep, setup.installCommand)}
                    {current === undefined ? null : (
                        <Text role="body" tone="muted">
                            {current.docker}
                        </Text>
                    )}
                </Stack>
                <Stack gap="identity">
                    <Text role="label.item">{`2. ${labels.pairStep}`}</Text>
                    {setup.pairCommand === "" ? null : field(labels.pairStep, setup.pairCommand)}
                    <Text role="body" tone="muted">
                        {labels.codeNote}
                    </Text>
                    <Cluster gap="inline">
                        <Button variant="border" size="sm" isPending={setup.isIssuing} onPress={props.on.newCode}>
                            {labels.newCode}
                        </Button>
                    </Cluster>
                </Stack>
                <Text role="body">{`3. ${labels.doneStep}`}</Text>
            </Stack>
            <Text role="body" tone="muted" live="polite">
                {labels.waiting}
            </Text>
        </Stack>
    )
}
