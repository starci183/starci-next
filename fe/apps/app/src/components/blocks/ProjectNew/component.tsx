import {
    Alert,
    Button,
    Cluster,
    Grid,
    Input,
    Page,
    Section,
    Select,
    Stack,
    Stepper,
    SurfaceCard,
    Terminal,
    Text,
} from "@starci/grammar/common"
import { ArtImage, areaArt } from "@starci-next/ui"

/** One choice of a choice list, with the words that explain it. */
export type ProjectChoice = { readonly id: string; readonly label: string; readonly description?: string }

/** The fixed words of the new-project screen. */
export type ProjectNewLabels = {
    readonly breadcrumbs: string
    readonly projects: string
    readonly title: string
    readonly description: string
    readonly infoLabel: string
    readonly kindLabel: string
    readonly stepsLabel: string
    readonly steps: ReadonlyArray<string>
    readonly trackLabel: string
    readonly name: string
    readonly repo: string
    readonly namePlaceholder: string
    readonly repoPlaceholder: string
    readonly deployed: string
    readonly deployedHint: string
    readonly submit: string
    readonly submitting: string
    readonly submitNeedsName: string
    readonly cancel: string
    readonly initTitle: string
    readonly initNote: string
    readonly initLog: ReadonlyArray<string>
    readonly createdTitle: string
    readonly createdText: string
    readonly secretLabel: string
    readonly copy: string
    readonly copied: string
    readonly openProject: string
}

/** What the form holds. */
export type ProjectNewState = {
    readonly name: string
    readonly kind: string
    readonly track: string
    readonly repoUrl: string
    readonly deployedUrl: string
}

/** The project just created, already in words: the secret shown once and where the project opens. */
export type ProjectCreatedView = { readonly secret: string; readonly href: string }

/** Props for {@link ProjectNewBase}. */
export type ProjectNewBaseProps = {
    readonly props: {
        readonly labels: ProjectNewLabels
        readonly projectsHref: string
        readonly kinds: ReadonlyArray<ProjectChoice>
        readonly tracks: ReadonlyArray<ProjectChoice>
        readonly state: ProjectNewState
        readonly isCreating: boolean
        /** The words of the refusal of the last create; empty for none. */
        readonly issueWords: string
        readonly created: ProjectCreatedView | undefined
        /** The public base of the statics, for the picture beside the init command. */
        readonly staticsBaseUrl: string
    }
    readonly on: { readonly set: (key: keyof ProjectNewState, value: string) => void; readonly submit: () => void }
}

/** What a text field of the form needs. */
type FieldProps = {
    readonly id: keyof ProjectNewState
    readonly label: string
    readonly description?: string
    readonly placeholder?: string
    readonly props: ProjectNewBaseProps["props"]
    readonly on: ProjectNewBaseProps["on"]
}

/** One text field of the form. */
const TextField = (props: FieldProps) => (
    <Input
        id={`project-${props.id}`}
        name={props.id}
        label={props.label}
        kind="text"
        value={props.props.state[props.id]}
        isDisabled={props.props.isCreating}
        onValueChange={(value) => props.on.set(props.id, value)}
        {...(props.description === undefined ? {} : { description: props.description })}
        {...(props.placeholder === undefined ? {} : { placeholder: props.placeholder })}
    />
)

/** What a choice of the form needs. */
type ChoiceProps = {
    readonly id: keyof ProjectNewState
    readonly label: string
    readonly options: ReadonlyArray<ProjectChoice>
    readonly props: ProjectNewBaseProps["props"]
    readonly on: ProjectNewBaseProps["on"]
}

/** One choice of the form as a dropdown: one is always chosen (owner 2026-11-24: one value in a form is a Select, "trong form thì chọn dropdown"). */
const Choice = (props: ChoiceProps) => (
    <Select
        label={props.label}
        options={props.options.map((each) => ({ id: each.id, label: each.label }))}
        value={props.props.state[props.id]}
        onValueChange={(next) => {
            if (next !== null) props.on.set(props.id, next)
        }}
        isDisabled={props.props.isCreating}
    />
)

/** The kind of the project as two large cards: the chosen one is tinted, each a button that sets it. */
const KindCards = (props: FormProps) => (
    <Stack gap="inline">
        <Text role="label.item">{props.props.labels.kindLabel}</Text>
        <Grid kind="cards" columns={2}>
            {props.props.kinds.map((kind) => (
                <SurfaceCard
                    key={kind.id}
                    kind="tile"
                    name={kind.label}
                    {...(kind.description === undefined ? {} : { description: kind.description })}
                    {...(props.props.state.kind === kind.id ? { groundTone: "accent" as const } : {})}
                    wholeAction={{
                        kind: "button",
                        label: kind.label,
                        press: () => {
                            if (!props.props.isCreating) props.on.set("kind", kind.id)
                        },
                    }}
                />
            ))}
        </Grid>
    </Stack>
)

/** What the form needs: the page props and its commands. */
type FormProps = Pick<ProjectNewBaseProps, "props" | "on">

/** The init panel needs: its words and the project name typed so far. */
type InitPanelProps = { readonly labels: ProjectNewLabels; readonly name: string; readonly staticsBaseUrl: string }

/** The form: name, kind (and the agent tool of an agent), the repo, the deploy address, and the create action. */
const Form = (props: FormProps) => {
    const { labels, state } = props.props
    return (
        <Section title={labels.infoLabel} headingLevel={2}>
            <TextField id="name" label={labels.name} placeholder={labels.namePlaceholder} {...props} />
            <KindCards {...props} />
            {state.kind === "agent" ? (
                <Choice id="track" label={labels.trackLabel} options={props.props.tracks} {...props} />
            ) : null}
            <TextField id="repoUrl" label={labels.repo} placeholder={labels.repoPlaceholder} {...props} />
            <TextField id="deployedUrl" label={labels.deployed} description={labels.deployedHint} {...props} />
            {props.props.issueWords === "" ? null : <Alert tone="negative" title={props.props.issueWords} />}
            <Cluster gap="identity" wrap>
                <Button
                    variant="primary"
                    startGlyph="plus"
                    isPending={props.props.isCreating}
                    isDisabled={state.name.trim() === "" || props.props.isCreating}
                    disabledReason={props.props.isCreating ? labels.submitting : labels.submitNeedsName}
                    onPress={props.on.submit}
                >
                    {props.props.isCreating ? labels.submitting : labels.submit}
                </Button>
                <Button variant="border" href={props.props.projectsHref}>
                    {labels.cancel}
                </Button>
            </Cluster>
            {state.name.trim() === "" && !props.props.isCreating ? (
                <Text role="caption">{labels.submitNeedsName}</Text>
            ) : null}
        </Section>
    )
}

/** The init panel: the commands to run in the learner's own repository, as a terminal, and the line that says what StarCi does and does not touch. */
const InitPanel = (props: InitPanelProps) => (
    <Section title={props.labels.initTitle} headingLevel={2}>
        <Stack gap="inline">
            <Terminal
                label={props.labels.initTitle}
                lines={props.labels.initLog.map((line) =>
                    line.replaceAll("{name}", props.name.trim() === "" ? "my-project" : props.name.trim()),
                )}
            />
            <ArtImage asset={areaArt("projects")} base={props.staticsBaseUrl} />
            <Text tone="muted">{props.labels.initNote}</Text>
        </Stack>
    </Section>
)

/** What the created section needs: the words and the project just created. */
type CreatedProps = { readonly labels: ProjectNewLabels; readonly created: ProjectCreatedView }

/** The section shown after the create: the secret once, and the way into the project. */
const Created = (props: CreatedProps) => (
    <Section title={props.labels.createdTitle} headingLevel={2}>
        <Alert tone="informative" title={props.labels.createdText} />
        <Input
            id="project-secret"
            name="secret"
            label={props.labels.secretLabel}
            kind="text"
            value={props.created.secret}
            isReadOnly
            isCopyable
            copyLabel={props.labels.copy}
            copiedLabel={props.labels.copied}
        />
        <Button variant="primary" href={props.created.href}>
            {props.labels.openProject}
        </Button>
    </Section>
)

/** Draws the new-project page: the form on one side, the init panel with the commands of the learner's repository on the other. */
export const ProjectNewBase = (props: ProjectNewBaseProps) => {
    const { labels, state } = props.props
    return (
        <Page
            header={{
                title: labels.title,
                description: labels.description,
                breadcrumbs: {
                    label: labels.breadcrumbs,
                    items: [
                        { id: "projects", label: labels.projects, href: props.props.projectsHref },
                        { id: "new", label: labels.title },
                    ],
                },
            }}
        >
            <Stepper
                label={labels.stepsLabel}
                currentStepId={props.props.created === undefined ? "step-0" : "step-2"}
                steps={labels.steps.map((label, index) => ({
                    id: `step-${index}`,
                    label,
                    state:
                        props.props.created === undefined
                            ? index === 0
                                ? ("current" as const)
                                : ("upcoming" as const)
                            : index < 2
                              ? ("complete" as const)
                              : ("current" as const),
                }))}
            />
            <Grid
                kind="pair"
                leading={
                    props.props.created === undefined ? (
                        <Form props={props.props} on={props.on} />
                    ) : (
                        <Created labels={labels} created={props.props.created} />
                    )
                }
                trailing={<InitPanel labels={labels} name={state.name} staticsBaseUrl={props.props.staticsBaseUrl} />}
            />
        </Page>
    )
}
