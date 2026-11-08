import { Badge, Button, Cluster, Input, Stack, SurfaceCard, Text } from "@starci/grammar/common"
import type { ReactNode } from "react"
import type { ProjectDetailBusy, ProjectDetailLabels, ProjectDetailView } from "./types"

/** What the practice card needs: the note about machine-only results and the sync command. */
type PracticeCardProps = {
    readonly labels: ProjectDetailLabels
    readonly practising: string
    readonly isSyncing: boolean
    readonly onSync: () => void
}

/** What the proof cards need: the last runs, the address field and the commands that save and probe it. */
type ProofCardsProps = {
    readonly labels: ProjectDetailLabels
    readonly view: ProjectDetailView
    readonly deployed: string
    readonly busy: ProjectDetailBusy
    readonly on: {
        readonly deployed: (value: string) => void
        readonly saveDeployed: () => void
        readonly runProbes: () => void
    }
}

/** What the secret card needs: the new secret once, and the rotate command. */
type SecretCardProps = {
    readonly labels: ProjectDetailLabels
    readonly secret: string | undefined
    readonly isRotating: boolean
    readonly onRotate: () => void
}

/** What the layout card needs: the words only. */
type LayoutCardProps = { readonly labels: ProjectDetailLabels }

/** The tone of the badge of a run: the verdict, or none before the first run. */
const verdictOf = (passed: boolean | undefined, labels: ProjectDetailLabels): ReactNode => {
    if (passed === undefined) return null
    return <Badge tone={passed ? "success" : "warning"}>{passed ? labels.passed : labels.failed}</Badge>
}

/** The practice card: results the learner machine reported, and the command that pulls them. */
export const PracticeCard = (props: PracticeCardProps) => (
    <SurfaceCard label={props.labels.syncTitle}>
        <Stack gap="row">
            <Text tone="muted">{props.labels.syncText}</Text>
            {props.practising === "" ? null : <Text>{props.practising}</Text>}
            <Cluster gap="inline" wrap>
                <Button intent="neutral" isPending={props.isSyncing} onPress={props.onSync}>
                    {props.isSyncing ? props.labels.syncing : props.labels.sync}
                </Button>
            </Cluster>
        </Stack>
    </SurfaceCard>
)

/** The proof cards: the last signed CI run, and the server probes of the deployed address. */
export const ProofCards = (props: ProofCardsProps) => {
    const { labels, busy, view } = props
    return (
        <>
            <SurfaceCard label={labels.ciTitle}>
                <Cluster gap="inline" wrap align="center">
                    {verdictOf(view.ciPassed, labels)}
                    <Text>{view.ciLine}</Text>
                </Cluster>
            </SurfaceCard>
            <SurfaceCard label={labels.probeTitle}>
                <Stack gap="row">
                    <Text tone="muted">{labels.probeText}</Text>
                    <Input
                        id="project-deployed"
                        name="deployed"
                        label={labels.deployedLabel}
                        kind="text"
                        value={props.deployed}
                        isDisabled={busy.isSaving}
                        onValueChange={props.on.deployed}
                    />
                    <Cluster gap="inline" wrap align="center">
                        <Button intent="neutral" isPending={busy.isSaving} onPress={props.on.saveDeployed}>
                            {labels.saveDeployed}
                        </Button>
                        <Button
                            intent="commit"
                            isPending={busy.isProbing}
                            isDisabled={view.deployedUrl === "" || busy.isProbing}
                            onPress={props.on.runProbes}
                        >
                            {busy.isProbing ? labels.runningProbes : labels.runProbes}
                        </Button>
                        {verdictOf(view.probePassed, labels)}
                        <Text size="sm">{view.probeLine}</Text>
                    </Cluster>
                    {view.probes.map((probe) => (
                        <Text key={probe.id} size="sm" tone={probe.isPassed ? "default" : "muted"}>
                            {probe.text}
                        </Text>
                    ))}
                </Stack>
            </SurfaceCard>
        </>
    )
}

/** The secret card: rotate the CI secret and read the new one once. */
export const SecretCard = (props: SecretCardProps) => (
    <SurfaceCard label={props.labels.secretTitle}>
        <Stack gap="row">
            <Text tone="muted">{props.labels.secretText}</Text>
            {props.secret === undefined ? null : (
                <Input
                    id="project-new-secret"
                    name="secret"
                    label={props.labels.newSecret}
                    kind="text"
                    value={props.secret}
                    isReadOnly
                    isCopyable
                    copyLabel={props.labels.copy}
                    copiedLabel={props.labels.copied}
                />
            )}
            <Cluster gap="inline" wrap>
                <Button intent="neutral" isPending={props.isRotating} onPress={props.onRotate}>
                    {props.isRotating ? props.labels.rotating : props.labels.rotate}
                </Button>
            </Cluster>
        </Stack>
    </SurfaceCard>
)

/** The card that shows the layout of the starci/ folder and where tests live. */
export const LayoutCard = (props: LayoutCardProps) => (
    <SurfaceCard label={props.labels.layoutTitle}>
        <Stack gap="row">
            <Text size="sm" mono>
                {props.labels.layoutTree}
            </Text>
            <Text isStrong>{props.labels.layoutTests}</Text>
            <Text tone="muted">{props.labels.layoutTestsText}</Text>
            <Text size="sm" tone="muted">
                {props.labels.layoutFlow}
            </Text>
        </Stack>
    </SurfaceCard>
)
