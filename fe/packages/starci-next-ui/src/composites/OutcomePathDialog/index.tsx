import { Badge, Button, Cluster, Dialog, Heading, Link, Stack, Text, Timeline } from "@starci/grammar/common"

/** One check of the done outcome, in words. */
export type OutcomeCheckView = {
    readonly text: string
    /** True when only the learner can report it. */
    readonly isSelfReported: boolean
}

/** One step of a stage, in words. */
export type OutcomeStepView = {
    readonly id: string
    readonly title: string
    /** The part the step sends to, in words. */
    readonly part: string
    readonly href: string
}

/** One stage of a path with its steps. */
export type OutcomeStageView = {
    readonly id: string
    readonly title: string
    readonly steps: ReadonlyArray<OutcomeStepView>
}

/** One outcome path opened in full, every word resolved. */
export type OutcomePathDetailView = {
    readonly id: string
    readonly title: string
    readonly done: string
    readonly checks: ReadonlyArray<OutcomeCheckView>
    readonly stages: ReadonlyArray<OutcomeStageView>
    readonly isCurrent: boolean
}

/** The fixed words of the path dialog. */
export type OutcomePathDialogLabels = {
    readonly doneTitle: string
    readonly checksTitle: string
    readonly checksNote: string
    readonly selfReported: string
    readonly stagesTitle: string
    readonly timeline: string
    readonly close: string
    readonly choose: string
    readonly switchTo: string
    readonly current: string
}

/** The dialog of one path. */
type OutcomePathDialogProps = {
    /** The path to show, or undefined while the dialog is shut. */
    readonly path: OutcomePathDetailView | undefined
    readonly hasActive: boolean
    readonly labels: OutcomePathDialogLabels
    readonly isPending: boolean
    readonly onOpenChange: (isOpen: boolean) => void
    readonly onChoose: (id: string) => void
}

/** The steps of one stage as the entry of the timeline holds them. */
type StageStepsProps = { readonly steps: ReadonlyArray<OutcomeStepView> }

const StageSteps = (props: StageStepsProps) => (
    <Stack gap="row">
        {props.steps.map((step) => (
            <Cluster key={step.id} gap="inline" wrap>
                <Badge tone="neutral">{step.part}</Badge>
                <Link variant="plain" href={step.href}>
                    {step.title}
                </Link>
            </Cluster>
        ))}
    </Stack>
)

/** The body of the dialog: the done outcome, how it is counted and the stages in order. */
type PathBodyProps = { readonly path: OutcomePathDetailView; readonly labels: OutcomePathDialogLabels }

const PathBody = (props: PathBodyProps) => (
    <Stack gap="section">
        <Stack gap="row">
            <Heading level={3}>{props.labels.doneTitle}</Heading>
            <Text as="p">{props.path.done}</Text>
        </Stack>
        <Stack gap="row">
            <Heading level={3}>{props.labels.checksTitle}</Heading>
            <Text as="p" size="sm" tone="muted">
                {props.labels.checksNote}
            </Text>
            {props.path.checks.map((check) => (
                <Cluster key={check.text} gap="inline" wrap>
                    <Text as="span">{check.text}</Text>
                    {check.isSelfReported ? <Badge tone="muted">{props.labels.selfReported}</Badge> : null}
                </Cluster>
            ))}
        </Stack>
        <Stack gap="row">
            <Heading level={3}>{props.labels.stagesTitle}</Heading>
            <Timeline
                label={props.labels.timeline}
                items={props.path.stages.map((stage) => ({
                    id: stage.id,
                    title: stage.title,
                    description: <StageSteps steps={stage.steps} />,
                }))}
            />
        </Stack>
    </Stack>
)

/** The footer commands: follow the path, unless the learner already follows it. */
type PathFooterProps = Omit<OutcomePathDialogProps, "path" | "onOpenChange"> & { readonly path: OutcomePathDetailView }

const PathFooter = (props: PathFooterProps) =>
    props.path.isCurrent ? (
        <Badge tone="accent">{props.labels.current}</Badge>
    ) : (
        <Button intent="commit" isPending={props.isPending} onPress={() => props.onChoose(props.path.id)}>
            {props.hasActive ? props.labels.switchTo : props.labels.choose}
        </Button>
    )

/** A path opened in full: what ends it, how that is counted, and its stages with the parts each step opens. */
export const OutcomePathDialog = (props: OutcomePathDialogProps) => {
    const { path } = props
    return (
        <Dialog
            isOpen={path !== undefined}
            onOpenChange={props.onOpenChange}
            title={path?.title ?? ""}
            closeLabel={props.labels.close}
            size="lg"
            footer={path === undefined ? undefined : <PathFooter {...props} path={path} />}
        >
            {path === undefined ? null : <PathBody path={path} labels={props.labels} />}
        </Dialog>
    )
}
