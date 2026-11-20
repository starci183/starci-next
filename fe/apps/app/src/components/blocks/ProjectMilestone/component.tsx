import type { ReactNode } from "react"
import {
    Badge,
    type PageHeaderContent,
    Cluster,
    DataTable,
    EmptyNotice,
    Grid,
    Link,
    Page,
    Section,
    Stack,
    Text,
} from "@starci/grammar/common"
import { MissingNotice, SlotView } from "@starci-next/ui"
import type {
    ConceptCardView,
    DataSlot,
    EvidenceChipView,
    EvidenceRunView,
    ProjectMilestoneLabels,
    ProjectMilestoneView,
    SlotLabels,
} from "@/modules/types"

/** The fake milestone with the geometry of a settled one, drawn as a skeleton while the first read runs. */
export const PROJECT_MILESTONE_PLACEHOLDER: ProjectMilestoneView = {
    title: "xxxxxxxxxx",
    projectName: "xxxxxx",
    intro: "xxxxxxxxxxxxxxxxxxxx",
    stateLabel: "xxxxxx",
    stateTone: "muted",
    runs: [],
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
    }
    readonly on: { readonly retry: () => void }
}

/** What the body needs: the page props, the milestone and whether it is the skeleton. */
type BodyProps = {
    readonly props: ProjectMilestoneBaseProps["props"]
    readonly view: ProjectMilestoneView
    readonly isLoading: boolean
}

/** One evidence slot of a concept as a small chip: its words, with the state in its tone. */
type SlotChipProps = { readonly chip: EvidenceChipView }

/** One evidence slot of a concept as a small chip, as {@link SlotChipProps} says. */
const SlotChip = (props: SlotChipProps) => (
    <Badge tone={props.chip.tone}>
        {props.chip.mark === "" ? props.chip.label : `${props.chip.label} · ${props.chip.mark}`}
    </Badge>
)

/** One cell of the concept table: the concept with its kind, the evidence slots it needs, its state and the lesson that teaches it. */
const cellOf = (concept: ConceptCardView, columnId: string, props: BodyProps) => {
    switch (columnId) {
        case "concept":
            return (
                <Stack gap="identity">
                    <Text isStrong>{concept.label}</Text>
                    <Text size="xs" tone="muted">
                        {concept.comingSoon ? props.props.labels.comingSoon : concept.kindLabel}
                    </Text>
                </Stack>
            )
        case "evidence":
            return (
                <Cluster gap="inline" wrap>
                    {concept.chips.map((chip) => (
                        <SlotChip key={chip.id} chip={chip} />
                    ))}
                </Cluster>
            )
        case "state":
            return <Badge tone={concept.stateTone}>{concept.stateLabel}</Badge>
        default:
            return concept.lessonHref === "" ? (
                <Text tone="muted">{props.props.table.noLesson}</Text>
            ) : (
                <Link variant="plain" href={concept.lessonHref}>
                    {concept.lessonTitle}
                </Link>
            )
    }
}

/** The table of the concepts of the milestone: a row per concept, each opening its evidence page; the legend of the two levels under it. */
const ConceptsTable = (props: BodyProps) => {
    const { labels, table } = props.props
    return (
        <Section
            title={labels.conceptsLabel}
            headingLevel={2}
            count={props.view.concepts.length}
            isLoading={props.isLoading}
            caption={table.legend}
        >
            <DataTable
                label={labels.conceptsLabel}
                isLoading={props.isLoading}
                columns={[
                    { id: "concept", label: labels.columns.concept },
                    { id: "evidence", label: labels.columns.evidence, hideBelow: "tablet" },
                    { id: "state", label: table.columns.state, width: "fit" },
                    { id: "lesson", label: table.columns.lesson, hideBelow: "desktop" },
                ]}
                rows={props.view.concepts.map((concept) => ({
                    ...concept,
                    href: props.props.conceptHrefs[concept.id] ?? "",
                }))}
                renderCell={(row, columnId) => cellOf(row, columnId, props)}
                emptyContent={<EmptyNotice message={labels.runsEmpty} mark="none" frame="frameless" />}
            />
        </Section>
    )
}

/** A table row: its id and the cell of each column by column id. */
type CellsRow = { readonly id: string; readonly cells: Readonly<Record<string, ReactNode>> }

/** The row of one evidence run in the runs table. */
const runRowOf = (run: EvidenceRunView): CellsRow => ({
    id: run.id,
    cells: {
        concept: <Text isStrong>{run.concept}</Text>,
        evidence: run.evidence,
        result: <Badge tone={run.resultTone}>{run.resultLabel}</Badge>,
        level: run.levelLabel,
        when: run.when,
    },
})

/** The recent evidence runs of the milestone, one row per slot that has a result. */
const RunsTable = (props: BodyProps) => {
    const { labels } = props.props
    return (
        <Section title={labels.runsLabel} headingLevel={2} count={props.view.runs.length} isLoading={props.isLoading}>
            <DataTable
                label={labels.runsLabel}
                isLoading={props.isLoading}
                columns={[
                    { id: "concept", label: labels.columns.concept },
                    { id: "evidence", label: labels.columns.evidence, hideBelow: "tablet" },
                    { id: "result", label: labels.columns.result, width: "fit" },
                    { id: "level", label: labels.columns.level, hideBelow: "tablet" },
                    { id: "when", label: labels.columns.when, width: "fit" },
                ]}
                rows={props.view.runs.map((run) => runRowOf(run))}
                renderCell={(row, columnId) => row.cells[columnId]}
                emptyContent={
                    <EmptyNotice
                        message={labels.runsEmpty}
                        description={labels.runsEmptyText}
                        mark="none"
                        frame="frameless"
                    />
                }
            />
        </Section>
    )
}

/** How to prove (numbered rows) and the signed CI attestation, side by side under the table. */
type HowToProveProps = { readonly labels: ProjectMilestoneLabels }

/** How to prove, as {@link HowToProveProps} says. */
const HowToProve = (props: HowToProveProps) => (
    <Grid
        kind="pair"
        leading={
            <Section
                title={props.labels.howTitle}
                headingLevel={2}
                kind="list"
                items={props.labels.how.map((line, index) => ({
                    id: `how-${index}`,
                    title: line,
                    leading: { position: index + 1 },
                }))}
                empty={null}
            />
        }
        trailing={
            <Section title={props.labels.ciTitle} headingLevel={2}>
                <Stack gap="inline">
                    <Text tone="muted">{props.labels.ciText}</Text>
                    <Link href={props.labels.ciHref} variant="head">
                        {props.labels.ciLink}
                    </Link>
                </Stack>
            </Section>
        }
    />
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
                    status: <Badge tone={view.stateTone}>{view.stateLabel}</Badge>,
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
            render={(data, loading) => (
                <Stack gap="region">
                    <ConceptsTable props={props.props} view={data} isLoading={loading} />
                    <RunsTable props={props.props} view={data} isLoading={loading} />
                    <HowToProve labels={labels} />
                </Stack>
            )}
        />
    )
}
