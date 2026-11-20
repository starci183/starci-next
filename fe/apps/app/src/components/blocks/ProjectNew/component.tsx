import {
    Alert,
    Button,
    Cluster,
    Grid,
    Input,
    Page,
    RadioGroup,
    Section,
    Stack,
    Terminal,
    Text,
} from "@starci/grammar/common"

/** One choice of a choice list, with the words that explain it. */
export type ProjectChoice = { readonly id: string; readonly label: string }

/** The fixed words of the new-project screen. */
export type ProjectNewLabels = {
    readonly breadcrumbs: string
    readonly projects: string
    readonly title: string
    readonly description: string
    readonly infoLabel: string
    readonly kindLabel: string
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

/** One short choice of the form as a radio group: one is always chosen. */
const Choice = (props: ChoiceProps) => (
    <RadioGroup
        label={props.label}
        orientation="horizontal"
        options={props.options.map((each) => ({ value: each.id, label: each.label }))}
        value={props.props.state[props.id]}
        onValueChange={(next) => props.on.set(props.id, next)}
        isDisabled={props.props.isCreating}
    />
)

/** What the form needs: the page props and its commands. */
type FormProps = Pick<ProjectNewBaseProps, "props" | "on">

/** The init panel needs: its words and the project name typed so far. */
type InitPanelProps = { readonly labels: ProjectNewLabels; readonly name: string }

/** The form: name, kind (and the agent tool of an agent), the repo, the deploy address, and the create action. */
const Form = (props: FormProps) => {
    const { labels, state } = props.props
    return (
        <Section title={labels.infoLabel} headingLevel={2}>
            <TextField id="name" label={labels.name} placeholder={labels.namePlaceholder} {...props} />
            <Choice id="kind" label={labels.kindLabel} options={props.props.kinds} {...props} />
            {state.kind === "agent" ? (
                <Choice id="track" label={labels.trackLabel} options={props.props.tracks} {...props} />
            ) : null}
            <TextField id="repoUrl" label={labels.repo} placeholder={labels.repoPlaceholder} {...props} />
            <TextField id="deployedUrl" label={labels.deployed} description={labels.deployedHint} {...props} />
            {props.props.issueWords === "" ? null : <Alert tone="negative" title={props.props.issueWords} />}
            <Cluster gap="identity" wrap>
                <Button
                    intent="commit"
                    startGlyph="plus"
                    isPending={props.props.isCreating}
                    isDisabled={state.name.trim() === "" || props.props.isCreating}
                    disabledReason={props.props.isCreating ? labels.submitting : labels.submitNeedsName}
                    onPress={props.on.submit}
                >
                    {props.props.isCreating ? labels.submitting : labels.submit}
                </Button>
                <Button intent="neutral" href={props.props.projectsHref}>
                    {labels.cancel}
                </Button>
            </Cluster>
            {state.name.trim() === "" && !props.props.isCreating ? (
                <Text size="xs" tone="muted">
                    {labels.submitNeedsName}
                </Text>
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
        <Button intent="commit" href={props.created.href}>
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
            <Grid
                kind="pair"
                leading={
                    props.props.created === undefined ? (
                        <Form props={props.props} on={props.on} />
                    ) : (
                        <Created labels={labels} created={props.props.created} />
                    )
                }
                trailing={<InitPanel labels={labels} name={state.name} />}
            />
        </Page>
    )
}
