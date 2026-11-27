import {
    Alert,
    Button,
    Cluster,
    CopyField,
    Grid,
    Heading,
    InlineStatus,
    Input,
    Stack,
    SurfaceCard,
    Tabs,
    Text,
} from "@starci/grammar/common"
import { LabBoot } from "./Boot"
import type {
    LabBootLabels,
    LabBootView,
    LabOsId,
    LabReadyLabels,
    LabReadyView,
    LabSetupLabels,
    LabSetupView,
    LessonLabActions,
} from "./types"

/** What the setup page needs: the view, the boot once started, the closing line once ready, the words and what the learner does. */
type LabSetupProps = {
    readonly setup: LabSetupView
    readonly boot: LabBootView | undefined
    readonly ready: LabReadyView | undefined
    readonly labels: LabSetupLabels
    readonly bootLabels: LabBootLabels
    readonly readyLabels: LabReadyLabels
    readonly isLoading: boolean
    readonly on: Pick<LessonLabActions, "selectOs" | "newCode" | "changeDir" | "startLab">
}

/** The OS id a tab key names, or undefined for a key that is none of the three. */
const osOf = (labels: LabSetupLabels, key: string): LabOsId | undefined => labels.os.find((os) => os.id === key)?.id

/** A command the learner copies, labelled by its step. */
const CommandField = (props: { readonly label: string; readonly value: string; readonly labels: LabSetupLabels }) => (
    <CopyField
        label={props.label}
        isLabelHidden
        value={props.value}
        copyLabel={props.labels.copy}
        copiedLabel={props.labels.copied}
        copyErrorLabel={props.labels.copyFailed}
    />
)

/** Step 1: the install command, the same on every OS, with the Docker note of the OS on screen. */
const InstallStep = (props: Pick<LabSetupProps, "setup" | "labels" | "on">) => {
    const { setup, labels } = props
    const current = labels.os.find((os) => os.id === setup.os) ?? labels.os[0]
    return (
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
                <CommandField label={labels.installStep} value={setup.installCommand} labels={labels} />
                {current === undefined ? null : (
                    <Text role="body" tone="muted">
                        {current.docker}
                    </Text>
                )}
            </Stack>
        </Stack>
    )
}

/** Step 2: the pairing command with its one-use code, or the machine once it is paired. */
const PairStep = (props: Pick<LabSetupProps, "setup" | "labels" | "on">) => {
    const { setup, labels } = props
    if (setup.isPaired)
        return (
            <Stack gap="identity">
                <Text role="label.item">{`2. ${labels.pairStep}`}</Text>
                <InlineStatus
                    state={setup.isOnline ? "done" : "waiting"}
                    label={setup.isOnline ? labels.connected : labels.notConnected}
                    meta={setup.machine === "" ? undefined : setup.machine}
                />
            </Stack>
        )
    return (
        <Stack gap="identity">
            <Text role="label.item">{`2. ${labels.pairStep}`}</Text>
            {setup.pairCommand === "" ? null : (
                <CommandField label={labels.pairStep} value={setup.pairCommand} labels={labels} />
            )}
            <Text role="body" tone="muted">
                {labels.codeNote}
            </Text>
            <Cluster gap="inline">
                <Button variant="border" size="sm" isPending={setup.isIssuing} onPress={props.on.newCode}>
                    {labels.newCode}
                </Button>
            </Cluster>
            <Text role="body" tone="muted" live="polite">
                {labels.waiting}
            </Text>
        </Stack>
    )
}

/** Step 3: the folder on the learner's machine and the one command that downloads the code and builds the lab. */
const DirStep = (props: Pick<LabSetupProps, "setup" | "labels" | "on">) => {
    const { setup, labels } = props
    return (
        <Stack gap="identity">
            <Text role="label.item">{`3. ${labels.dirStep}`}</Text>
            <Input
                id="course-lab-dir"
                name="dir"
                label={labels.dirLabel}
                description={labels.dirNote}
                value={setup.dir}
                onValueChange={props.on.changeDir}
                isInvalid={setup.dirError !== ""}
                errorMessage={setup.dirError === "" ? undefined : setup.dirError}
            />
            <Cluster gap="inline" wrap align="center">
                <Button
                    variant="primary"
                    isDisabled={!setup.isOnline || setup.dirError !== ""}
                    isPending={setup.isStarting}
                    onPress={props.on.startLab}
                >
                    {setup.isStarting ? labels.starting : labels.start}
                </Button>
                {setup.isOnline ? null : (
                    <Text role="body" tone="muted">
                        {setup.isPaired ? labels.startReasonOffline : labels.startReason}
                    </Text>
                )}
            </Cluster>
        </Stack>
    )
}

/** Before the lab was asked to start: the five stages the relay will run, not run yet, and the note on the first time. */
const BootPlan = (props: Pick<LabSetupProps, "bootLabels">) => (
    <Stack gap="row">
        <Text role="label.item">{props.bootLabels.title("")}</Text>
        {props.bootLabels.plan.map((stage) => (
            <InlineStatus key={stage} state="notRun" label={stage} />
        ))}
        <Text role="caption" tone="muted">
            {props.bootLabels.firstTime}
        </Text>
    </Stack>
)

/**
 * The machine card in the rail of the setup page: the relay's state on the learner's machine, the stages it runs (planned until the lab
 * is asked to start, then live with their times) and, once the first run is done, the file to open.
 */
const MachineCard = (props: LabSetupProps) => {
    const { setup, labels, ready } = props
    return (
        <SurfaceCard
            label={labels.machineTitle}
            headingLevel={2}
            isLoading={props.isLoading}
            labelEnd={
                setup.isPaired ? (
                    <InlineStatus
                        state={setup.isOnline ? "done" : "waiting"}
                        label={setup.isOnline ? labels.connected : labels.notConnected}
                    />
                ) : undefined
            }
        >
            <Stack gap="section">
                {props.boot === undefined ? (
                    <BootPlan bootLabels={props.bootLabels} />
                ) : (
                    <LabBoot boot={props.boot} labels={props.bootLabels} isLoading={props.isLoading} />
                )}
                {ready === undefined ? null : (
                    <Alert
                        tone="affirmative"
                        title={props.readyLabels.title}
                        description={
                            ready.learnerFile === ""
                                ? props.readyLabels.openAny
                                : props.readyLabels.openFile(ready.learnerFile)
                        }
                    />
                )}
            </Stack>
        </SurfaceCard>
    )
}

/**
 * The setup page of the lab, split in two (owner 2026-11-27): in the main column what the relay does and the three steps in order (install
 * it, pair the machine, choose the folder and build the lab); in the rail the machine card, which follows the relay and the boot live and
 * names the file to open once the first run is done.
 */
export const LabSetup = (props: LabSetupProps) => {
    const { labels } = props
    return (
        <Grid
            kind="main-rail"
            railWidth="wide"
            align="start"
            primary={
                <Stack gap="section">
                    <Stack gap="row">
                        <Heading level={2}>{labels.title}</Heading>
                        <Text tone="muted">{labels.note}</Text>
                    </Stack>
                    <Stack gap="row">
                        <InstallStep setup={props.setup} labels={labels} on={props.on} />
                        <PairStep setup={props.setup} labels={labels} on={props.on} />
                        <DirStep setup={props.setup} labels={labels} on={props.on} />
                    </Stack>
                </Stack>
            }
            rail={<MachineCard {...props} />}
        />
    )
}
