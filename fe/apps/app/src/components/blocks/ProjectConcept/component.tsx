import {
    Alert,
    Badge,
    Button,
    Cluster,
    DescriptionList,
    EmptyNotice,
    Grid,
    Link,
    Page,
    Section,
    Stack,
    Terminal,
    Text,
    type PageHeaderContent,
} from "@starci/grammar/common"
import { ConceptCodeRead, MissingNotice, SlotView } from "@starci-next/ui"
import type { ConceptDraftView, DataSlot, ProjectConceptLabels, ProjectConceptView, SlotLabels } from "@/modules/types"
import { SkeletonBlock } from "@/components/loading/SkeletonBlock"

/** Blank text of the width the skeleton needs: non-breaking spaces carry no readable word into the page or the accessibility tree. */
const blank = (width: number): string => " ".repeat(width)

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
        label: blank(10),
        stateLabel: blank(6),
        stateTone: "muted",
        kindLabel: blank(6),
        proofLine: blank(12),
        lessonHref: "",
        lessonTitle: "",
        where: blank(8),
        comingSoon: false,
        chips: [],
        rejection: undefined,
        aiQuestion: "",
        relearnLabel: "",
        relearnHref: "",
        needsCodeRead: false,
    },
    projectName: blank(6),
    milestoneTitle: blank(6),
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
            <Stack gap="inline">
                <Cluster gap="identity" wrap>
                    {concept.chips.map((chip) => (
                        <Badge key={chip.id} tone={chip.tone}>
                            {chip.mark === "" ? chip.label : `${chip.label} · ${chip.mark}`}
                        </Badge>
                    ))}
                </Cluster>
                {concept.rejection === undefined ? null : <Alert tone="negative" title={concept.rejection.text} />}
                {concept.aiQuestion === "" ? null : <Text>{`${labels.questionLabel}: ${concept.aiQuestion}`}</Text>}
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
            <Stack gap="inline">
                {lines.length === 0 ? (
                    <EmptyNotice
                        message={view.deployedUrl === "" ? labels.probeNoDeploy : labels.probeEmpty}
                        mark="none"
                        frame="frameless"
                    />
                ) : (
                    <Terminal label={labels.probeTitle} lines={lines} />
                )}
                <Cluster gap="identity" wrap>
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
                <EmptyNotice message={labels.ciEmpty} mark="none" frame="frameless" />
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
            <Stack gap="inline">
                {cv === undefined ? (
                    <EmptyNotice message={labels.cvEmpty} mark="none" frame="frameless" />
                ) : (
                    <Stack gap="identity">
                        <Badge tone={cv.isProved ? "success" : "muted"}>
                            {cv.isProved ? labels.cvVerified : labels.cvPreview}
                        </Badge>
                        <Text>{cv.text}</Text>
                        <Text tone="muted">{cv.evidence}</Text>
                    </Stack>
                )}
                <Cluster gap="identity" wrap>
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
    return (
        <SlotView<ProjectConceptView, PageHeaderContent>
            slot={slot}
            placeholder={props.props.placeholder}
            labels={props.props.slotLabels}
            onRetry={props.on.retry}
            header={(view, loading) => {
                const loadingCrumb = loading ? { isLoading: true as const } : {}
                return {
                    breadcrumbs: {
                        label: labels.crumbTrail,
                        items: [
                            { id: "projects", label: labels.crumbRoot, href: labels.crumbRootHref },
                            { id: "project", label: view.projectName, href: labels.projectHref, ...loadingCrumb },
                            {
                                id: "milestone",
                                label: view.milestoneTitle,
                                href: labels.milestoneHref,
                                ...loadingCrumb,
                            },
                            { id: "concept", label: view.concept.label, ...loadingCrumb },
                        ],
                    },
                    title: view.concept.label,
                    meta: view.concept.proofLine,
                    status: (
                        <Badge isDot tone={view.concept.stateTone}>
                            {view.concept.stateLabel}
                        </Badge>
                    ),
                }
            }}
            headerFallback={{
                breadcrumbs: { label: labels.crumbTrail, items: [{ id: "projects", label: labels.crumbRoot }] },
                title: labels.crumbRoot,
            }}
            frame={({ header, isLoading, body }) => (
                <Page isLoading={isLoading} header={header}>
                    {body}
                </Page>
            )}
            render={(data, loading) => {
                const body = { ...props, view: data, isLoading: loading }
                if (loading)
                    return (
                        <Stack gap="section">
                            <SkeletonBlock lines={4} />
                            <Grid
                                kind="pair"
                                leading={
                                    <Stack gap="section">
                                        <SkeletonBlock lines={4} />
                                        <SkeletonBlock lines={3} />
                                    </Stack>
                                }
                                trailing={<SkeletonBlock lines={9} />}
                            />
                            <SkeletonBlock lines={4} />
                        </Stack>
                    )
                return (
                    <Stack gap="section">
                        <Slots {...body} />
                        <Grid
                            kind="pair"
                            leading={
                                <Stack gap="section">
                                    <Probe {...body} />
                                    <Ci {...body} />
                                </Stack>
                            }
                            trailing={
                                <Stack gap="section">
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
    )
}
