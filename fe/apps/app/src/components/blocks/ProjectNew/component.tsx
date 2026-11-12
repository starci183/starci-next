import {
    Alert,
    Button,
    Cluster,
    Grid,
    Input,
    Page,
    Stack,
    SurfaceCard,
    type SurfaceCardProps,
} from "@starci/grammar/common"

/** One choice of a choice list, with the words that explain it. */
export type ProjectChoice = { readonly id: string; readonly label: string; readonly hint: string }

/** The fixed words of the new-project screen. */
export type ProjectNewLabels = {
    readonly breadcrumbs: string
    readonly projects: string
    readonly title: string
    readonly infoLabel: string
    readonly kindLabel: string
    readonly trackLabel: string
    readonly howLabel: string
    readonly howEmpty: string
    readonly name: string
    readonly topic: string
    readonly language: string
    readonly stack: string
    readonly repo: string
    readonly submit: string
    readonly submitting: string
    readonly cancel: string
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
    readonly topic: string
    readonly language: string
    readonly stack: string
    readonly track: string
    readonly repoUrl: string
}

/** The project just created, already in words: the secret shown once and where the project opens. */
export type ProjectCreatedView = { readonly secret: string; readonly href: string }

/** One numbered step of the how-to list. */
export type ProjectStep = { readonly id: string; readonly title: string; readonly text: string }

/** Props for {@link ProjectNewBase}. */
export type ProjectNewBaseProps = {
    readonly props: {
        readonly labels: ProjectNewLabels
        readonly projectsHref: string
        readonly kinds: ReadonlyArray<ProjectChoice>
        readonly tracks: ReadonlyArray<ProjectChoice>
        readonly steps: ReadonlyArray<ProjectStep>
        readonly state: ProjectNewState
        readonly isCreating: boolean
        /** The words of the refusal of the last create; empty for none. */
        readonly issueWords: string
        readonly created: ProjectCreatedView | undefined
    }
    readonly on: { readonly set: (key: keyof ProjectNewState, value: string) => void; readonly submit: () => void }
}

type FieldProps = {
    readonly id: keyof ProjectNewState
    readonly label: string
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
    />
)

type ChoiceProps = {
    readonly id: keyof ProjectNewState
    readonly label: string
    readonly options: ReadonlyArray<ProjectChoice>
    readonly props: ProjectNewBaseProps["props"]
    readonly on: ProjectNewBaseProps["on"]
}

/** One choice list of the form: a select card with one checked row. */
const ChoiceCard = (props: ChoiceProps) => (
    <SurfaceCard
        label={props.label}
        kind="select"
        selectionMode="single"
        items={props.options.map((each) => ({
            id: each.id,
            title: each.label,
            ...(each.hint === "" ? {} : { subtitle: each.hint }),
        }))}
        value={props.props.state[props.id]}
        onChange={(next) => props.on.set(props.id, next)}
    />
)

/** The numbered how-to rows as a list card. */
const stepsCard = (props: ProjectNewBaseProps["props"]): SurfaceCardProps => ({
    label: props.labels.howLabel,
    kind: "list",
    items: props.steps.map((step, index) => ({
        id: step.id,
        title: step.title,
        description: step.text,
        leading: { position: index + 1 },
    })),
    empty: props.labels.howEmpty,
})

/** What the created card needs: the words and the project just created. */
type CreatedProps = { readonly labels: ProjectNewLabels; readonly created: ProjectCreatedView }

/** The card shown after the create: the secret once, and the way into the project. */
const Created = (props: CreatedProps) => (
    <SurfaceCard label={props.labels.createdTitle}>
        <Stack gap="row">
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
            <Cluster gap="inline" wrap>
                <Button intent="commit" href={props.created.href}>
                    {props.labels.openProject}
                </Button>
            </Cluster>
        </Stack>
    </SurfaceCard>
)

/** Draws the new-project page: the kind choice, the details form with its commands, and the how-to list. */
export const ProjectNewBase = (props: ProjectNewBaseProps) => {
    const { labels, state } = props.props
    return (
        <Page
            header={{
                title: labels.title,
                breadcrumbs: {
                    label: labels.breadcrumbs,
                    items: [
                        { id: "projects", label: labels.projects, href: props.props.projectsHref },
                        { id: "new", label: labels.title },
                    ],
                },
            }}
        >
            <Stack gap="region">
                {props.props.created === undefined ? (
                    <>
                        <ChoiceCard id="kind" label={labels.kindLabel} options={props.props.kinds} {...props} />
                        {state.kind === "agent" ? (
                            <ChoiceCard id="track" label={labels.trackLabel} options={props.props.tracks} {...props} />
                        ) : null}
                        <SurfaceCard
                            label={labels.infoLabel}
                            footers={[
                                {
                                    kind: "custom",
                                    children: (
                                        <Cluster gap="inline" wrap justify="end">
                                            <Button intent="neutral" href={props.props.projectsHref}>
                                                {labels.cancel}
                                            </Button>
                                            <Button
                                                intent="commit"
                                                startGlyph="plus"
                                                isPending={props.props.isCreating}
                                                isDisabled={state.name.trim() === "" || props.props.isCreating}
                                                onPress={props.on.submit}
                                            >
                                                {props.props.isCreating ? labels.submitting : labels.submit}
                                            </Button>
                                        </Cluster>
                                    ),
                                },
                            ]}
                        >
                            <Stack gap="region">
                                <Grid kind="form">
                                    <TextField id="name" label={labels.name} {...props} />
                                    <TextField id="repoUrl" label={labels.repo} {...props} />
                                    <TextField id="stack" label={labels.stack} {...props} />
                                    <TextField id="topic" label={labels.topic} {...props} />
                                    <TextField id="language" label={labels.language} {...props} />
                                </Grid>
                                {props.props.issueWords === "" ? null : (
                                    <Alert tone="negative" title={props.props.issueWords} />
                                )}
                            </Stack>
                        </SurfaceCard>
                    </>
                ) : (
                    <Created labels={labels} created={props.props.created} />
                )}
                <SurfaceCard {...stepsCard(props.props)} />
            </Stack>
        </Page>
    )
}
