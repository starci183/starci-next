import {
    Badge,
    type PageHeaderContent,
    type ListRowData,
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
    }
    readonly on: { readonly retry: () => void }
}

/** What the body needs: the page props, the milestone and whether it is the skeleton. */
type BodyProps = {
    readonly props: ProjectMilestoneBaseProps["props"]
    readonly view: ProjectMilestoneView
    readonly isLoading: boolean
}

/** The evidence slots of a concept in words: each slot with its state ("test · đạt"). */
const slotsOf = (concept: ConceptCardView): string =>
    concept.chips.map((chip) => (chip.mark === "" ? chip.label : `${chip.label} · ${chip.mark}`)).join(", ")

/** One concept as a row that opens its evidence page: its name, its kind, its evidence slots and the lesson that teaches it; its state is the chip. */
const conceptRowOf = (concept: ConceptCardView, props: BodyProps, isAllSoon: boolean): ListRowData => ({
    id: concept.id,
    title: concept.label,
    description: [
        isAllSoon || !concept.comingSoon ? concept.kindLabel : props.props.labels.comingSoon,
        slotsOf(concept),
        concept.lessonHref === "" ? "" : `${props.props.table.columns.lesson}: ${concept.lessonTitle}`,
    ]
        .filter((part) => part !== "")
        .join(" · "),
    href: props.props.conceptHrefs[concept.id] ?? "",
    badges: [{ label: concept.stateLabel, tone: concept.stateTone }],
})

/** The concepts of the milestone as one list: a row per concept, each opening its evidence page; the legend of the two levels under the head. */
const ConceptsTable = (props: BodyProps) => {
    const { labels, table } = props.props
    const isAllSoon = props.view.concepts.length > 0 && props.view.concepts.every((concept) => concept.comingSoon)
    return (
        <Section
            kind="list"
            title={labels.conceptsLabel}
            headingLevel={2}
            count={props.view.concepts.length}
            isLoading={props.isLoading}
            caption={isAllSoon ? `${table.legend} ${labels.comingSoon}` : table.legend}
            items={props.view.concepts.map((concept) => conceptRowOf(concept, props, isAllSoon))}
            empty={<EmptyNotice message={labels.runsEmpty} mark="none" frame="frameless" />}
        />
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
                        <ConceptsTable props={props.props} view={data} isLoading={loading} />
                        <RunsTable props={props.props} view={data} isLoading={loading} />
                        <HowToProve labels={labels} />
                    </Stack>
                )
            }
        />
    )
}
