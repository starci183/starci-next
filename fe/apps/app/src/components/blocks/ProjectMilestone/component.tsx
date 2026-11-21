import {
    Badge,
    type PageHeaderContent,
    type ListRowData,
    Cluster,
    EmptyNotice,
    Grid,
    Link,
    Page,
    ProgressCircle,
    Section,
    StaticsProvider,
    Stack,
    StatusDot,
    Stepper,
    SurfaceCard,
    Text,
} from "@starci/grammar/common"
import { ArtImage, areaArt, MissingNotice, SlotView } from "@starci-next/ui"
import type {
    ConceptCardView,
    DataSlot,
    EvidenceRunView,
    ProjectMilestoneLabels,
    ProjectMilestoneView,
    SlotLabels,
} from "@/modules/types"
import { SkeletonBlock } from "@/components/loading/SkeletonBlock"

/** Blank text of the width the skeleton needs: non-breaking spaces carry no readable word into the page or the accessibility tree. */
const blank = (width: number): string => " ".repeat(width)

/** The fake milestone with the geometry of a settled one, drawn as a skeleton while the first read runs. */
export const PROJECT_MILESTONE_PLACEHOLDER: ProjectMilestoneView = {
    title: blank(10),
    projectName: blank(6),
    intro: blank(20),
    stateLabel: blank(6),
    stateTone: "muted",
    runs: [],
    concepts: [1, 2, 3].map((index) => ({
        id: `placeholder-${index}`,
        label: blank(10),
        stateLabel: blank(6),
        stateTone: "muted" as const,
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
    })),
}

/** The extra words of the milestone table: the legend under it. */
export type ProjectMilestoneTableLabels = {
    readonly legend: string
    readonly noLesson: string
    readonly columns: { readonly state: string; readonly lesson: string }
}

/** Props for {@link ProjectMilestoneBase}. */
export type ProjectMilestoneBaseProps = {
    readonly props: {
        readonly slot: DataSlot<ProjectMilestoneView>
        readonly placeholder: ProjectMilestoneView
        readonly slotLabels: SlotLabels
        readonly labels: ProjectMilestoneLabels
        readonly table: ProjectMilestoneTableLabels
        /** True when the back end said the project or the milestone is not there. */
        readonly isNotFound: boolean
        /** True when the back end said the milestone needs Premium and the learner has none. */
        readonly isLocked: boolean
        /** Where each concept of this milestone opens (its evidence page), by concept id. */
        readonly conceptHrefs: Readonly<Record<string, string>>
        /** The public base of the statics, for the milestone picture. */
        readonly staticsBaseUrl: string
        /** The words of the three levels of a concept and of the ring. */
        readonly tally: {
            readonly proved: string
            readonly practising: string
            readonly todo: string
            readonly ring: string
        }
    }
    readonly on: { readonly retry: () => void }
}

/** What the body needs: the page props, the milestone and whether it is the skeleton. */
type BodyProps = {
    readonly props: ProjectMilestoneBaseProps["props"]
    readonly view: ProjectMilestoneView
    readonly isLoading: boolean
}

/** How many concepts stand at each level. */
const tallyOf = (concepts: ReadonlyArray<ConceptCardView>) => ({
    proved: concepts.filter((concept) => concept.stateTone === "success").length,
    practising: concepts.filter((concept) => concept.stateTone === "warning").length,
    total: concepts.length,
})

/** The head of the page: the ring of proved concepts, the three-level tally and the milestone picture. */
const Hero = (props: BodyProps) => {
    const { tally } = props.props
    const count = tallyOf(props.view.concepts)
    const todo = count.total - count.proved - count.practising
    const value = count.total === 0 ? 0 : Math.round((count.proved / count.total) * 100)
    const rows = [
        { id: "proved", tone: "success" as const, n: count.proved, label: tally.proved },
        { id: "practising", tone: "warning" as const, n: count.practising, label: tally.practising },
        { id: "todo", tone: "neutral" as const, n: todo, label: tally.todo },
    ]
    return (
        <Grid
            kind="pair"
            leading={
                <Cluster gap="inline" wrap>
                    <Stack gap="identity">
                        <ProgressCircle label={tally.ring} value={value} size="lg" />
                        <Text size="figure" tabular>
                            {`${count.proved}/${count.total}`}
                        </Text>
                    </Stack>
                    <Stack gap="identity">
                        {rows.map((row) => (
                            <Cluster key={row.id} gap="identity">
                                <StatusDot tone={row.tone} aria-label={row.label} />
                                <Text>{`${row.n} ${row.label}`}</Text>
                            </Cluster>
                        ))}
                    </Stack>
                </Cluster>
            }
            trailing={
                <StaticsProvider baseUrl={props.props.staticsBaseUrl}>
                    <ArtImage asset={areaArt("milestone")} base={props.props.staticsBaseUrl} />
                </StaticsProvider>
            }
        />
    )
}

/** The way from practising to proved as one flow: the lines of the catalogue as steps, the current one by how far the concepts got. */
const ProofFlow = (props: BodyProps) => {
    const { labels } = props.props
    const count = tallyOf(props.view.concepts)
    const steps = labels.how.map((line, index) => ({ id: `step-${index}`, label: line }))
    const current = count.proved > 0 ? steps.length - 1 : count.practising > 0 ? Math.min(1, steps.length - 1) : 0
    return (
        <Section title={labels.howTitle} headingLevel={2} isLoading={props.isLoading}>
            <Stepper label={labels.howTitle} steps={steps} currentStepId={steps[current]?.id ?? ""} />
        </Section>
    )
}

/** One concept as a card that opens its evidence page: its level, its kind, and one badge per evidence slot. */
const ConceptCard = (props: {
    readonly concept: ConceptCardView
    readonly body: BodyProps
    readonly isAllSoon: boolean
}) => {
    const { concept } = props
    const { labels, table } = props.body.props
    const subtitle = [
        props.isAllSoon || !concept.comingSoon ? concept.kindLabel : labels.comingSoon,
        concept.lessonHref === "" ? "" : `${table.columns.lesson}: ${concept.lessonTitle}`,
    ]
        .filter((part) => part !== "")
        .join(" · ")
    return (
        <SurfaceCard
            kind="tile"
            name={concept.label}
            byline={subtitle}
            badge={{ label: concept.stateLabel, tone: concept.stateTone }}
            facts={concept.chips.map((chip) => (chip.mark === "" ? chip.label : `${chip.label} · ${chip.mark}`))}
            wholeAction={{ kind: "link", href: props.body.props.conceptHrefs[concept.id] ?? "", label: concept.label }}
        />
    )
}

/** The concepts of the milestone as a grid of cards, each opening its evidence page. */
const ConceptsTable = (props: BodyProps) => {
    const { labels, table } = props.props
    const isAllSoon = props.view.concepts.length > 0 && props.view.concepts.every((concept) => concept.comingSoon)
    return (
        <Section
            title={labels.conceptsLabel}
            headingLevel={2}
            count={props.view.concepts.length}
            isLoading={props.isLoading}
            caption={isAllSoon ? `${table.legend} ${labels.comingSoon}` : table.legend}
        >
            {props.view.concepts.length === 0 ? (
                <EmptyNotice message={labels.runsEmpty} mark="none" frame="frameless" />
            ) : (
                <Grid kind="cards" columns={3}>
                    {props.view.concepts.map((concept) => (
                        <ConceptCard key={concept.id} concept={concept} body={props} isAllSoon={isAllSoon} />
                    ))}
                </Grid>
            )}
        </Section>
    )
}

/** One evidence run as a row: the concept, the slot and its level, the result as a chip and when it ran. */
const runRowOf = (run: EvidenceRunView): ListRowData => ({
    id: run.id,
    title: run.concept,
    description: [run.evidence, run.levelLabel].filter((part) => part !== "").join(" · "),
    badges: [{ label: run.resultLabel, tone: run.resultTone }],
    meta: { text: run.when },
})

/** The recent evidence runs of the milestone, one row per slot that has a result. */
const RunsTable = (props: BodyProps) => {
    const { labels } = props.props
    return (
        <Section
            kind="list"
            title={labels.runsLabel}
            headingLevel={2}
            count={props.view.runs.length}
            isLoading={props.isLoading}
            items={props.view.runs.map((run) => runRowOf(run))}
            empty={
                <EmptyNotice
                    message={labels.runsEmpty}
                    description={labels.runsEmptyText}
                    mark="none"
                    frame="frameless"
                />
            }
        />
    )
}

/** The signed CI attestation: what it is, and where to read how to set it up. */
const CiNote = (props: { readonly labels: ProjectMilestoneLabels }) => (
    <Section title={props.labels.ciTitle} headingLevel={2}>
        <Stack gap="inline">
            <Text tone="muted">{props.labels.ciText}</Text>
            <Link href={props.labels.ciHref} variant="head">
                {props.labels.ciLink}
            </Link>
        </Stack>
    </Section>
)

/**
 * Draws one milestone of a project: the trail and state in the head, the concept table with the evidence slots and the two levels
 * (practising, proved), the recent runs, and how a concept gets proved. Everything sits flat on the page.
 */
export const ProjectMilestoneBase = (props: ProjectMilestoneBaseProps) => {
    const { labels, slot } = props.props
    if (props.props.isNotFound || props.props.isLocked) {
        return (
            <Page>
                <MissingNotice
                    message={props.props.isLocked ? labels.lockedTitle : labels.notFound}
                    description={props.props.isLocked ? labels.lockedText : labels.notFoundText}
                    backLabel={labels.back}
                    backHref={labels.backHref}
                    action={
                        props.props.isLocked ? (
                            <Link variant="plain" href={labels.plansHref}>
                                {labels.plans}
                            </Link>
                        ) : null
                    }
                />
            </Page>
        )
    }
    return (
        <SlotView<ProjectMilestoneView, PageHeaderContent>
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
                            { id: "project", label: view.projectName, href: labels.backHref, ...loadingCrumb },
                            { id: "milestone", label: view.title, ...loadingCrumb },
                        ],
                    },
                    title: view.title,
                    meta: view.intro,
                    status: (
                        <Badge isDot tone={view.stateTone}>
                            {view.stateLabel}
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
            render={(data, loading) =>
                loading ? (
                    <Stack gap="region">
                        <SkeletonBlock lines={6} />
                        <SkeletonBlock lines={4} />
                        <SkeletonBlock lines={3} />
                    </Stack>
                ) : (
                    <Stack gap="region">
                        <Hero props={props.props} view={data} isLoading={loading} />
                        <ProofFlow props={props.props} view={data} isLoading={loading} />
                        <ConceptsTable props={props.props} view={data} isLoading={loading} />
                        <RunsTable props={props.props} view={data} isLoading={loading} />
                        <CiNote labels={labels} />
                    </Stack>
                )
            }
        />
    )
}
