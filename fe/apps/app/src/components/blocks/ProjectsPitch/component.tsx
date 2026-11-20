import {
    Badge,
    Button,
    DataTable,
    EmptyNotice,
    Page,
    Section,
    Stack,
    Text,
    type BadgeTone,
} from "@starci/grammar/common"

/** One row of the sample concept table the pitch shows. */
export type PitchSampleRow = {
    readonly id: string
    readonly concept: string
    readonly slots: string
    readonly state: string
    readonly stateTone: BadgeTone
}

/** The sample CV line the pitch shows: the role, the sentence and the evidence it stands on. */
export type PitchCvView = {
    readonly role: string
    readonly badge: string
    readonly text: string
    readonly evidence: string
}

/** One titled line of a list of the pitch. */
export type PitchLine = { readonly id: string; readonly title: string; readonly text: string }

/** The fixed words of the pitch. */
export type ProjectsPitchLabels = {
    readonly title: string
    readonly description: string
    readonly subscribe: string
    readonly subscribeHref: string
    readonly stepsTitle: string
    readonly steps: ReadonlyArray<PitchLine>
    readonly sampleNote: string
    readonly conceptsTitle: string
    readonly columns: { readonly concept: string; readonly evidence: string; readonly state: string }
    readonly cvTitle: string
    readonly includedTitle: string
    readonly included: ReadonlyArray<PitchLine>
    readonly noTable: string
}

/** Props for {@link ProjectsPitchBase}. */
export type ProjectsPitchBaseProps = {
    readonly props: {
        readonly labels: ProjectsPitchLabels
        readonly sample: ReadonlyArray<PitchSampleRow>
        readonly cv: PitchCvView
    }
}

/** The sample concept table: concepts with the evidence they need and where each stands, flat on the page. */
const SampleTable = (props: ProjectsPitchBaseProps["props"]) => (
    <DataTable
        label={props.labels.conceptsTitle}
        columns={[
            { id: "concept", label: props.labels.columns.concept },
            { id: "evidence", label: props.labels.columns.evidence, hideBelow: "tablet" },
            { id: "state", label: props.labels.columns.state, width: "fit" },
        ]}
        rows={props.sample}
        renderCell={(row, columnId) => {
            if (columnId === "concept") return <Text isStrong>{row.concept}</Text>
            if (columnId === "evidence") return <Text>{row.slots}</Text>
            return <Badge tone={row.stateTone}>{row.state}</Badge>
        }}
        emptyContent={<EmptyNotice message={props.labels.noTable} mark="none" frame="frameless" />}
    />
)

/** The sample CV line: the role with its verified badge, the sentence, and the evidence line. */
const SampleCv = (props: ProjectsPitchBaseProps["props"]) => (
    <Stack gap="identity">
        <Text isStrong>{props.cv.role}</Text>
        <Badge tone="success">{props.cv.badge}</Badge>
        <Text>{props.cv.text}</Text>
        <Text tone="muted">{props.cv.evidence}</Text>
    </Stack>
)

/**
 * Draws the Projects pitch a reader without Premium sees: what Projects proves (your own repo, proved concepts, a verified CV line),
 * a sample of the concept table and the CV line, and the one Subscribe action. No tool is shown in a reduced form.
 */
export const ProjectsPitchBase = (props: ProjectsPitchBaseProps) => {
    const { labels } = props.props
    return (
        <Page
            header={{
                title: labels.title,
                breadcrumbs: "root",
                description: labels.description,
                actions: (
                    <Button intent="commit" href={labels.subscribeHref}>
                        {labels.subscribe}
                    </Button>
                ),
            }}
        >
            <Stack gap="region">
                <Section
                    title={labels.stepsTitle}
                    headingLevel={2}
                    kind="list"
                    items={labels.steps.map((step, index) => ({
                        id: step.id,
                        title: step.title,
                        description: step.text,
                        leading: { position: index + 1 },
                    }))}
                    empty={null}
                />
                <Section title={labels.conceptsTitle} headingLevel={2} caption={labels.sampleNote}>
                    <SampleTable {...props.props} />
                </Section>
                <Section title={labels.cvTitle} headingLevel={2}>
                    <SampleCv {...props.props} />
                </Section>
                <Section
                    title={labels.includedTitle}
                    headingLevel={2}
                    kind="list"
                    items={labels.included.map((each) => ({ id: each.id, title: each.title, description: each.text }))}
                    empty={null}
                />
            </Stack>
        </Page>
    )
}
