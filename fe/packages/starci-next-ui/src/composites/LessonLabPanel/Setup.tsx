import {
    Alert,
    Badge,
    Button,
    Cluster,
    CopyField,
    Grid,
    Heading,
    IconTile,
    InlineStatus,
    Rail,
    Input,
    Stack,
    SurfaceCard,
    Tabs,
    Text,
} from "@starci/grammar/common"
import { FolderGlyph, PairGlyph, TerminalGlyph } from "../../leaves/Icon"
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

/** Where a setup step stands: finished, the one the learner is on, or still ahead. */
type StepPhase = "done" | "current" | "pending"

/** The three steps in order, each with the identity glyph its tile shows while it is not finished. */
type StepId = "install" | "pair" | "dir"

/**
 * Where each step stands, read from the facts the page has: the relay was installed once the machine is paired, the machine is paired and
 * reachable once its relay is online, and the folder step is done once the lab is ready. The first step not done is the current one.
 */
const stepPhasesOf = (
    setup: LabSetupView,
    ready: LabReadyView | undefined,
): Readonly<Record<StepId, StepPhase>> => {
    const done: Readonly<Record<StepId, boolean>> = {
        install: setup.isPaired,
        pair: setup.isOnline,
        dir: ready !== undefined,
    }
    const order: ReadonlyArray<StepId> = ["install", "pair", "dir"]
    const current = order.find((id) => !done[id])
    const phaseOf = (id: StepId): StepPhase => {
        if (done[id]) return "done"
        return id === current ? "current" : "pending"
    }
    return { install: phaseOf("install"), pair: phaseOf("pair"), dir: phaseOf("dir") }
}

/** The glyph of each step's identity tile: a terminal for the install, a link for the pairing, a folder for the lab's folder. */
const STEP_GLYPHS = { install: TerminalGlyph, pair: PairGlyph, dir: FolderGlyph } as const

/** What a step's tile needs: which step it leads and where that step stands. */
type StepTileProps = { readonly id: StepId; readonly phase: StepPhase }

/**
 * The leading tile of a step (lessons.md §7): a finished step is the green done mark, the current one an accent tile, a step still ahead
 * a neutral one. Decorative: the step's words and its controls say where it stands.
 */
const StepTile = (props: StepTileProps) => {
    if (props.phase === "done") return <IconTile state="done" />
    // TODO(grammar step tile): swap the identity glyph for the numbered tile (`step: number`) once Grammar publishes it.
    return <IconTile source={STEP_GLYPHS[props.id]} tone={props.phase === "current" ? "accent" : "neutral"} />
}

/** What a step's head needs: its tile's step and phase, and its title. */
type StepHeadProps = StepTileProps & { readonly title: string }

/** The head of a step: its tile beside its title. */
const StepHead = (props: StepHeadProps) => (
    <Cluster gap="row" align="center" wrap={false}>
        <StepTile id={props.id} phase={props.phase} />
        <Text role="label.item">{props.title}</Text>
    </Cluster>
)

/** What a step needs: the view, its words, what the learner does and where it stands. */
type StepProps = Pick<LabSetupProps, "setup" | "labels" | "on"> & { readonly phase: StepPhase }

/** Step 1: the install command, the same on every OS, with the Docker note of the OS on screen. */
const InstallStep = (props: StepProps) => {
    const { setup, labels } = props
    const current = labels.os.find((os) => os.id === setup.os) ?? labels.os[0]
    return (
        <Stack gap="identity">
            <StepHead id="install" phase={props.phase} title={labels.installStep} />
            <CommandField label={labels.installStep} value={setup.installCommand} labels={labels} />
            {current === undefined ? null : (
                <Text role="body" tone="muted">
                    {current.docker}
                </Text>
            )}
        </Stack>
    )
}

/** The OS tabs above the steps: they pick the Docker note the install step shows. */
const OsTabs = (props: Pick<LabSetupProps, "setup" | "labels" | "on">) => {
    const { setup, labels } = props
    return (
        <Tabs
            label={labels.osTabs}
            selectedKey={setup.os}
            items={labels.os.map((os) => ({ id: os.id, label: os.label }))}
            onSelect={(key) => {
                const os = osOf(labels, key)
                if (os !== undefined) props.on.selectOs(os)
            }}
        />
    )
}

/** Step 2: the pairing command with its one-use code, or the machine once it is paired. */
const PairStep = (props: StepProps) => {
    const { setup, labels } = props
    if (setup.isPaired)
        return (
            <Stack gap="identity">
                <StepHead id="pair" phase={props.phase} title={labels.pairStep} />
                <InlineStatus
                    state={setup.isOnline ? "done" : "waiting"}
                    label={setup.isOnline ? labels.connected : labels.notConnected}
                    meta={setup.machine === "" ? undefined : setup.machine}
                />
            </Stack>
        )
    return (
        <Stack gap="identity">
            <StepHead id="pair" phase={props.phase} title={labels.pairStep} />
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
const DirStep = (props: StepProps) => {
    const { setup, labels } = props
    return (
        <Stack gap="identity">
            <StepHead id="dir" phase={props.phase} title={labels.dirStep} />
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
 * The relay's state as the badge at the end of the machine card's head (the canvas puts it there, beside the title, at every stage): no
 * machine paired yet in neutral, paired with the relay stopped in warning, the relay running in success.
 */
const RelayBadge = (props: Pick<LabSetupProps, "setup" | "labels">) => {
    const { setup, labels } = props
    if (!setup.isPaired)
        return (
            <Badge isDot tone="neutral">
                {labels.notPaired}
            </Badge>
        )
    return (
        <Badge isDot tone={setup.isOnline ? "success" : "warning"}>
            {setup.isOnline ? labels.relayOn : labels.relayOff}
        </Badge>
    )
}

/**
 * The machine card in the rail of the setup page: the relay's state on the learner's machine as the badge of its head (the online machine's
 * name beside the title), the stages it runs (planned until the lab is asked to start, then live with their times) and, once the first run
 * is done, the file to open.
 */
const MachineCard = (props: LabSetupProps) => {
    const { setup, labels, ready } = props
    return (
        <SurfaceCard
            label={labels.machineTitle}
            headingLevel={2}
            isLoading={props.isLoading}
            {...(setup.machine === "" ? {} : { fact: setup.machine })}
            labelEnd={<RelayBadge setup={setup} labels={labels} />}
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
 * The setup page of the lab, split in two (owner 2026-11-27): in the main column what the relay does, the OS tabs and the three steps in
 * order (install it, pair the machine, choose the folder and build the lab), each led by its tile (done, current or ahead); in the rail the
 * machine card, which follows the relay and the boot live and names the file to open once the first run is done.
 */
export const LabSetup = (props: LabSetupProps) => {
    const { labels } = props
    const phases = stepPhasesOf(props.setup, props.ready)
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
                    <OsTabs setup={props.setup} labels={labels} on={props.on} />
                    <Stack gap="row">
                        <InstallStep setup={props.setup} labels={labels} on={props.on} phase={phases.install} />
                        <PairStep setup={props.setup} labels={labels} on={props.on} phase={phases.pair} />
                        <DirStep setup={props.setup} labels={labels} on={props.on} phase={phases.dir} />
                    </Stack>
                </Stack>
            }
            rail={
                <Rail label={props.labels.machineTitle} isLabelHidden mode="sticky" width="wide" inset="none">
                    <MachineCard {...props} />
                </Rail>
            }
        />
    )
}
