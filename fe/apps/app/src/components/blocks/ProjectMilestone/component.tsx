import {
    Badge,
    Divider,
    Link,
    Page,
    Pane,
    PaneGrid,
    PaneSection,
    Section,
    Stack,
    SurfaceCard,
    Text,
    type ListRowData,
    type TableRowData,
} from "@starci/grammar/common"
import { MissingNotice, SlotView } from "@starci-next/ui"
import type { DataSlot, SlotLabels } from "@/modules/types"
import { ConceptDrawer } from "./drawer"
import type {
    ConceptCardView,
    ConceptDraftView,
    EvidenceRunView,
    ProjectMilestoneLabels,
    ProjectMilestoneView,
} from "./types"

/** The fake milestone with the geometry of a settled one, drawn as a skeleton while the first read runs. */
export const PROJECT_MILESTONE_PLACEHOLDER: ProjectMilestoneView = {
    title: "xxxxxxxxxx",
    projectName: "xxxxxx",
    intro: "xxxxxxxxxxxxxxxxxxxx",
    stateLabel: "xxxxxx",
    stateTone: "muted",
    runs: [1, 2].map((index) => ({
        id: `placeholder-run-${index}`,
        concept: "xxxxxxxxxx",
        evidence: "xxxxxx",
        resultLabel: "xxxx",
        resultTone: "muted" as const,
        levelLabel: "xxxxxx",
        when: "xxxxxx",
    })),
    concepts: [1, 2, 3].map((index) => ({
        id: `placeholder-${index}`,
        label: "xxxxxxxxxx",
        stateLabel: "xxxxxx",
        stateTone: "muted" as const,
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
    })),
}

/** Props for {@link ProjectMilestoneBase}. */
export type ProjectMilestoneBaseProps = {
    readonly props: {
        readonly slot: DataSlot<ProjectMilestoneView>
        readonly placeholder: ProjectMilestoneView
        readonly slotLabels: SlotLabels
        readonly labels: ProjectMilestoneLabels
        /** True when the back end said the project or the milestone is not there. */
        readonly isNotFound: boolean
        /** True when the milestone needs Premium and the learner has none. */
        readonly isLocked: boolean
        /** What the learner typed, by concept id; a concept missing here has an empty draft. */
        readonly drafts: Readonly<Record<string, ConceptDraftView>>
        /** The concept whose command is running, or undefined. */
        readonly pendingId: string | undefined
        /** The concept the last refusal belongs to, or undefined. */
        readonly issueId: string | undefined
        readonly issueWords: string
        /** The concept whose drawer is open, or undefined. */
        readonly openId: string | undefined
    }
    readonly on: {
        readonly retry: () => void
        readonly write: (conceptId: string, key: keyof ConceptDraftView, value: string) => void
        readonly savePointer: (conceptId: string) => void
        readonly explain: (conceptId: string) => void
        readonly open: (conceptId: string | undefined) => void
    }
}

/** What the well needs: the page props, the milestone and whether it is the skeleton. */
type WellProps = ProjectMilestoneBaseProps & { readonly view: ProjectMilestoneView; readonly isLoading: boolean }

/** What the aside needs: the fixed words. */
type AsideProps = { readonly labels: ProjectMilestoneLabels }

/** The row of one concept in the list card: name, proof kinds, state chip and the lesson link. */
const conceptRowOf = (concept: ConceptCardView, props: ProjectMilestoneBaseProps): ListRowData => ({
    id: concept.id,
    title: concept.label,
    description: (
        <Text size="sm" tone="muted">
            {concept.proofLine}
        </Text>
    ),
    badges: [{ label: concept.stateLabel, tone: concept.stateTone }],
    onPress: () => props.on.open(concept.id),
    ...(concept.lessonHref === ""
        ? {}
        : { detail: <Link variant="plain" href={concept.lessonHref}>{props.props.labels.lessonLink}</Link> }),
})

/** The row of one evidence run in the runs table. */
const runRowOf = (run: EvidenceRunView): TableRowData => ({
    id: run.id,
    cells: {
        concept: <Text isStrong>{run.concept}</Text>,
        evidence: run.evidence,
        result: <Badge tone={run.resultTone}>{run.resultLabel}</Badge>,
        level: run.levelLabel,
        when: run.when,
    },
})

/** The well: the concept list card and the runs table card, separate floating cards. */
const Well = (props: WellProps) => {
    const { view, isLoading } = props
    const { labels } = props.props
    const open = view.concepts.find((concept) => concept.id === props.props.openId)
    return (
        <Stack gap="region">
            <SurfaceCard
                label={labels.conceptsLabel}
                count={view.concepts.length}
                isLoading={isLoading}
                kind="list"
                items={view.concepts.map((concept) => conceptRowOf(concept, props))}
                empty={<Text tone="muted">{labels.runsEmpty}</Text>}
            />
            <SurfaceCard
                label={labels.runsLabel}
                count={view.runs.length}
                isLoading={isLoading}
                kind="table"
                columns={[
                    { id: "concept", label: labels.columns.concept },
                    { id: "evidence", label: labels.columns.evidence, hideBelow: "tablet" },
                    { id: "result", label: labels.columns.result, width: "fit" },
                    { id: "level", label: labels.columns.level, hideBelow: "tablet" },
                    { id: "when", label: labels.columns.when, width: "fit" },
                ]}
                rows={view.runs.map((run) => runRowOf(run))}
                empty={
                    <Stack gap="identity">
                        <Text isStrong>{labels.runsEmpty}</Text>
                        <Text size="sm" tone="muted">
                            {labels.runsEmptyText}
                        </Text>
                    </Stack>
                }
            />
            {open === undefined ? null : (
                <ConceptDrawer
                    concept={open}
                    labels={labels}
                    draft={props.props.drafts[open.id]}
                    isBusy={props.props.pendingId === open.id}
                    issueWords={props.props.issueId === open.id ? props.props.issueWords : ""}
                    on={props.on}
                />
            )}
        </Stack>
    )
}

/** The aside: how to prove (numbered rows), then the signed CI attestation. */
const Aside = (props: AsideProps) => (
    <Stack gap="section">
        <Section
            title={props.labels.howTitle}
            kind="list"
            items={props.labels.how.map((line, index) => ({
                id: `how-${index}`,
                title: line,
                leading: { position: index + 1 },
            }))}
            empty={null}
        />
        <Divider />
        <Section title={props.labels.ciTitle}>
            <Stack gap="inline">
                <Text size="sm" tone="muted">
                    {props.labels.ciText}
                </Text>
                <Link href={props.labels.ciHref} variant="head">
                    {props.labels.ciLink}
                </Link>
            </Stack>
        </Section>
    </Stack>
)

/** Draws one milestone of a project: band with trail and state, the concept list and the evidence runs, and the aside on how to prove. */
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
                    action={props.props.isLocked ? <Link variant="plain" href={labels.plansHref}>{labels.plans}</Link> : null}
                />
            </Page>
        )
    }
    const isReady = "items" in slot
    const view = isReady ? slot.items : props.props.placeholder
    const loadingCrumb = isReady ? {} : { isLoading: true as const }
    return (
        <Page
            chrome="panes"
            header={{
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
                status: <Badge tone={view.stateTone}>{view.stateLabel}</Badge>,
            }}
            isLoading={!isReady}
        >
            <PaneGrid
                label={labels.conceptsLabel}
                areas={{ base: ["aside", "main"], wide: ["main aside"] }}
                columns={{ base: ["fill"], wide: ["fill", "standard"] }}
            >
                <Pane area="main" scroll label={labels.conceptsLabel}>
                    <PaneSection>
                        <SlotView
                            slot={slot}
                            placeholder={props.props.placeholder}
                            labels={props.props.slotLabels}
                            onRetry={props.on.retry}
                            render={(data, loading) => <Well {...props} view={data} isLoading={loading} />}
                        />
                    </PaneSection>
                </Pane>
                <Pane area="aside" surface scroll label={labels.howTitle}>
                    <PaneSection>
                        <Aside labels={labels} />
                    </PaneSection>
                </Pane>
            </PaneGrid>
        </Page>
    )
}
