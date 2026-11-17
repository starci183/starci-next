import {
    Alert,
    Badge,
    Button,
    Cluster,
    DescriptionList,
    Grid,
    Link,
    Page,
    Section,
    Stack,
    Terminal,
    Text,
} from "@starci/grammar/common"
import { ConceptCodeRead, MissingNotice, SlotView } from "@starci-next/ui"
import type { ConceptDraftView, DataSlot, ProjectConceptLabels, ProjectConceptView, SlotLabels } from "@/modules/types"

/** Props for {@link ProjectConceptBase}. */
export type ProjectConceptBaseProps = {
    readonly props: {
        readonly slot: DataSlot<ProjectConceptView>
        readonly placeholder: ProjectConceptView
        readonly slotLabels: SlotLabels
        readonly labels: ProjectConceptLabels
        /** True when the project, the milestone or the concept is not there. */
        readonly isNotFound: boolean
        readonly draft: ConceptDraftView
        /** True while the pointer or the code read runs. */
        readonly isBusy: boolean
        readonly isProbing: boolean
        /** The words of the last refusal of a command; empty for none. */
        readonly issueWords: string
    }
    readonly on: {
        readonly retry: () => void
        readonly write: (key: keyof ConceptDraftView, value: string) => void
        readonly savePointer: () => void
        readonly explain: () => void
        readonly runProbes: () => void
    }
}

/** What a section of the body needs: the page props, the concept and whether it is the skeleton. */
export type BodyProps = ProjectConceptBaseProps & { readonly view: ProjectConceptView; readonly isLoading: boolean }

/** The fake concept page with the geometry of a settled one, drawn as a skeleton while the first read runs. */
export const PROJECT_CONCEPT_PLACEHOLDER: ProjectConceptView = {
    concept: {
        id: "placeholder",
        label: "xxxxxxxxxx",
        stateLabel: "xxxxxx",
        stateTone: "muted",
        kindLabel: "xxxxxx",
        proofLine: "xxxxxxxxxxxx",
        lessonHref: "",
        lessonTitle: "",
        where: "xxxxxxxx",
        comingSoon: false,
        chips: [],
        rejection: undefined,
        aiQuestion: "",
        relearnLabel: "",
        relearnHref: "",
        needsCodeRead: false,
    },
    projectName: "xxxxxx",
    milestoneTitle: "xxxxxx",
    deployedUrl: "",
    probeLines: [],
    ci: undefined,
    rubric: [],
    cv: undefined,
}

/** The evidence slots of the concept with their state, what was rejected last and the lesson that teaches it. */
const Slots = (props: BodyProps) => {
    const { concept } = props.view
    const { labels } = props.props
    return (
        <Section title={labels.slotsTitle} headingLevel={2} isLoading={props.isLoading}>
            <Stack gap="row">
                <Cluster gap="inline" wrap>
                    {concept.chips.map((chip) => (
                        <Badge key={chip.id} tone={chip.tone}>
                            {chip.mark === "" ? chip.label : `${chip.label} · ${chip.mark}`}
                        </Badge>
                    ))}
                </Cluster>
                {concept.rejection === undefined ? null : <Alert tone="negative" title={concept.rejection.text} />}
                {concept.aiQuestion === "" ? null : (
                    <Text>
                        <Text as="span" isStrong>
                            {labels.questionLabel}
                        </Text>{" "}
                        {concept.aiQuestion}
                    </Text>
                )}
                {concept.lessonHref === "" ? null : (
                    <Link variant="plain" href={concept.lessonHref}>
                        {`${labels.lesson}: ${concept.lessonTitle}`}
                    </Link>
                )}
            </Stack>
        </Section>
    )
}

/** The probe results of the concept as a terminal log on the deployed address, with the command that runs the probes again. */
const Probe = (props: BodyProps) => {
    const { labels } = props.props
    const { view } = props
    const lines =
        view.probeLines.length === 0
            ? []
            : [
                  `$ probe ${view.deployedUrl}`,
                  ...view.probeLines.map((line) => `${line.passed ? "✓" : "✗"} ${line.text}`),
              ]
    return (
        <Section
            title={view.deployedUrl === "" ? labels.probeTitle : `${labels.probeOn} ${view.deployedUrl}`}
            headingLevel={2}
            isLoading={props.isLoading}
        >
            <Stack gap="row">
                {lines.length === 0 ? (
                    <Text tone="muted">{view.deployedUrl === "" ? labels.probeNoDeploy : labels.probeEmpty}</Text>
                ) : (
                    <Terminal label={labels.probeTitle} lines={lines} />
                )}
                <Cluster gap="inline" wrap>
                    <Button
                        intent="neutral"
                        isPending={props.props.isProbing}
                        isDisabled={view.deployedUrl === "" || props.props.isProbing}
                        onPress={props.on.runProbes}
                    >
                        {props.props.isProbing ? labels.probeRunning : labels.probeRun}
                    </Button>
                </Cluster>
            </Stack>
        </Section>
    )
}

/** The latest signed CI run of the project: its run and commit, its verdict and when it ran. */
const Ci = (props: BodyProps) => {
    const { labels } = props.props
    const { ci } = props.view
    return (
        <Section title={labels.ciTitle} headingLevel={2} isLoading={props.isLoading}>
            {ci === undefined ? (
                <Text tone="muted">{labels.ciEmpty}</Text>
            ) : (
                <DescriptionList
                    density="compact"
                    isDivided
                    items={[
                        { id: "run", term: labels.ciRun, description: ci.run },
                        { id: "commit", term: labels.ciCommit, description: <Text mono>{ci.commit}</Text> },
                        {
                            id: "verdict",
                            term: labels.ciVerdict,
                            description: <Badge tone={ci.verdictTone}>{ci.verdictLabel}</Badge>,
                        },
                        { id: "when", term: labels.ciWhen, description: ci.when },
                    ]}
                />
            )}
        </Section>
    )
}

/** The CV line the concept earns, as a preview, and the way to ask Claude about it through the MCP. */
const CvPreview = (props: BodyProps) => {
    const { labels } = props.props
    const { cv } = props.view
    return (
        <Section title={labels.cvTitle} headingLevel={2} isLoading={props.isLoading} caption={labels.cvNote}>
            <Stack gap="row">
                {cv === undefined ? (
                    <Text tone="muted">{labels.cvEmpty}</Text>
                ) : (
                    <Stack gap="identity">
                        <Badge tone={cv.isProved ? "success" : "muted"}>
                            {cv.isProved ? labels.cvVerified : labels.cvPreview}
                        </Badge>
                        <Text>{cv.text}</Text>
                        <Text size="sm" tone="muted">
                            {cv.evidence}
                        </Text>
                    </Stack>
                )}
                <Cluster gap="inline" wrap>
                    <Button intent="neutral" href={labels.askClaudeHref}>
                        {labels.askClaude}
                    </Button>
                </Cluster>
            </Stack>
        </Section>
    )
}

/**
 * Draws the evidence page of one concept: its slots and what was last rejected, the probe log and the signed CI run on one side, the
 * AI code read with its rubric on the other, and the preview of the CV line it earns. Flat sections, no cards.
 */
export const ProjectConceptBase = (props: ProjectConceptBaseProps) => {
    const { labels, slot } = props.props
    if (props.props.isNotFound) {
        return (
            <Page>
                <MissingNotice
                    message={labels.notFound}
                    description={labels.notFoundText}
                    backLabel={labels.back}
                    backHref={labels.milestoneHref}
                />
            </Page>
        )
    }
    const isReady = "items" in slot
    const view = isReady ? slot.items : props.props.placeholder
    const loadingCrumb = isReady ? {} : { isLoading: true as const }
    return (
        <Page
            header={{
                breadcrumbs: {
                    label: labels.crumbTrail,
                    items: [
                        { id: "projects", label: labels.crumbRoot, href: labels.crumbRootHref },
                        { id: "project", label: view.projectName, href: labels.projectHref, ...loadingCrumb },
                        { id: "milestone", label: view.milestoneTitle, href: labels.milestoneHref, ...loadingCrumb },
                        { id: "concept", label: view.concept.label, ...loadingCrumb },
                    ],
                },
                title: view.concept.label,
                meta: view.concept.proofLine,
                status: <Badge tone={view.concept.stateTone}>{view.concept.stateLabel}</Badge>,
            }}
            isLoading={!isReady}
        >
            <SlotView
                slot={slot}
                placeholder={props.props.placeholder}
                labels={props.props.slotLabels}
                onRetry={props.on.retry}
                render={(data, loading) => {
                    const body = { ...props, view: data, isLoading: loading }
                    return (
                        <Stack gap="region">
                            <Slots {...body} />
                            <Grid
                                kind="pair"
                                leading={
                                    <Stack gap="region">
                                        <Probe {...body} />
                                        <Ci {...body} />
                                    </Stack>
                                }
                                trailing={
                                    <Stack gap="region">
                                        <ConceptCodeRead
                                            concept={data.concept}
                                            labels={labels}
                                            draft={props.props.draft}
                                            rubric={data.rubric}
                                            verdictLabels={labels.verdict}
                                            isBusy={props.props.isBusy}
                                            isLoading={loading}
                                            issueWords={props.props.issueWords}
                                            on={props.on}
                                        />
                                    </Stack>
                                }
                            />
                            <CvPreview {...body} />
                        </Stack>
                    )
                }}
            />
        </Page>
    )
}
