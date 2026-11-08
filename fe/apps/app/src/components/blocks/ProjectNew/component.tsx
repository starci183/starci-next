import { Alert, Button, Cluster, Grid, Input, Page, Select, Stack, SurfaceCard, Text } from "@starci/grammar/common"
import { CatalogIntro } from "@starci-next/ui"

/** One choice of a select. */
export type ProjectChoice = { readonly id: string; readonly label: string }

/** The fixed words of the new-project screen. */
export type ProjectNewLabels = {
    readonly eyebrow: string
    readonly title: string
    readonly description: string
    readonly name: string
    readonly kind: string
    readonly topic: string
    readonly language: string
    readonly stack: string
    readonly track: string
    readonly repo: string
    readonly submit: string
    readonly submitting: string
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

/** Props for {@link ProjectNewBase}. */
export type ProjectNewBaseProps = {
    readonly props: {
        readonly labels: ProjectNewLabels
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

/** One select of the form. */
const ChoiceField = (props: ChoiceProps) => (
    <Select
        label={props.label}
        options={props.options.map((each) => ({ id: each.id, label: each.label }))}
        value={props.props.state[props.id]}
        isDisabled={props.props.isCreating}
        onValueChange={(next) => {
            if (next !== null) props.on.set(props.id, next)
        }}
    />
)

/** What the created card needs: the words and the project just created. */
type CreatedProps = { readonly labels: ProjectNewLabels; readonly created: ProjectCreatedView }

/** The card shown after the create: the secret once, and the way into the project. */
const Created = (props: CreatedProps) => (
    <SurfaceCard label={props.labels.createdTitle}>
        <Stack gap="row">
            <Text>{props.labels.createdText}</Text>
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

/** Draws the new-project form: a name and kind, the topic, language and stack, and the repository address. */
export const ProjectNewBase = (props: ProjectNewBaseProps) => {
    const { labels, state } = props.props
    return (
        <Page>
            <Stack gap="region">
                <CatalogIntro
                    eyebrow={labels.eyebrow}
                    title={labels.title}
                    description={labels.description}
                    facts={[]}
                    upsell={undefined}
                />
                {props.props.created === undefined ? (
                    <SurfaceCard label={labels.title}>
                        <Stack gap="row">
                            <Grid kind="form">
                                <TextField id="name" label={labels.name} {...props} />
                                <ChoiceField id="kind" label={labels.kind} options={props.props.kinds} {...props} />
                                <TextField id="topic" label={labels.topic} {...props} />
                                <TextField id="language" label={labels.language} {...props} />
                                <TextField id="stack" label={labels.stack} {...props} />
                                {state.kind === "agent" ? (
                                    <ChoiceField
                                        id="track"
                                        label={labels.track}
                                        options={props.props.tracks}
                                        {...props}
                                    />
                                ) : null}
                                <TextField id="repoUrl" label={labels.repo} {...props} />
                            </Grid>
                            {props.props.issueWords === "" ? null : (
                                <Alert tone="negative" title={props.props.issueWords} />
                            )}
                            <Cluster gap="inline" wrap>
                                <Button
                                    intent="commit"
                                    isPending={props.props.isCreating}
                                    isDisabled={state.name.trim() === "" || props.props.isCreating}
                                    onPress={props.on.submit}
                                >
                                    {props.props.isCreating ? labels.submitting : labels.submit}
                                </Button>
                            </Cluster>
                        </Stack>
                    </SurfaceCard>
                ) : (
                    <Created labels={labels} created={props.props.created} />
                )}
            </Stack>
        </Page>
    )
}
