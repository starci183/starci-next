import { Button, Cluster, EmptyNotice, Page, Section, Stack, Text, type ListRowData } from "@starci/grammar/common"
import { RowProgress, SlotView } from "@starci-next/ui"
import type { DataSlot, SlotLabels } from "@/modules/types"
import { SkeletonBlock } from "@/components/loading/SkeletonBlock"

/** Blank text of the width the skeleton needs: non-breaking spaces carry no readable word into the page or the accessibility tree. */
const blank = (width: number): string => " ".repeat(width)

/** One project as the table draws it, already in words. */
export type ProjectRowView = {
    readonly id: string
    readonly name: string
    readonly repo: string
    readonly kindLabel: string
    readonly isAgent: boolean
    readonly milestone: string
    readonly percent: number
    readonly progress: string
    readonly ci: string
    readonly ciTone: "success" | "warning" | "muted"
    readonly isProved: boolean
    readonly href: string
}

/** The four figures of the ribbon, as numbers. */
export type ProjectsFiguresView = {
    readonly proved: number
    readonly practising: number
    readonly milestonesDone: number
    readonly milestonesTotal: number
    readonly cvLines: number
}

/** The projects as they are drawn: the ribbon figures and the table rows, already in words. */
export type ProjectsListView = {
    readonly figures: ProjectsFiguresView
    readonly rows: ReadonlyArray<ProjectRowView>
}

/** The fake list with the geometry of a settled one, drawn as a skeleton while the first read runs. */
export const PROJECTS_LIST_PLACEHOLDER: ProjectsListView = {
    figures: { proved: 0, practising: 0, milestonesDone: 0, milestonesTotal: 0, cvLines: 0 },
    rows: [1, 2, 3].map((index) => ({
        id: `placeholder-${index}`,
        name: blank(10),
        repo: blank(16),
        kindLabel: "xxx",
        isAgent: false,
        milestone: blank(10),
        percent: 0,
        progress: "x/x",
        ci: blank(6),
        ciTone: "muted",
        isProved: false,
        href: "",
    })),
}

/** The fixed words of the projects list. */
export type ProjectsListLabels = {
    readonly pageTitle: string
    readonly pageDescription: string
    readonly create: string
    readonly createHref: string
    readonly ribbonLabel: string
    readonly figures: {
        readonly proved: string
        readonly practising: string
        readonly milestones: string
        readonly cv: string
    }
    readonly listLabel: string
    readonly columns: {
        readonly project: string
        readonly kind: string
        readonly milestone: string
        readonly progress: string
        readonly ci: string
    }
    readonly progressLabel: string
    readonly emptyTitle: string
    readonly emptyText: string
    readonly note: string
}

/** Props for {@link ProjectsListBase}. */
export type ProjectsListBaseProps = {
    readonly props: {
        readonly slot: DataSlot<ProjectsListView>
        readonly placeholder: ProjectsListView
        readonly slotLabels: SlotLabels
        readonly labels: ProjectsListLabels
    }
    readonly on: { readonly retry: () => void }
}

/** What the body needs: the page props, the list and whether it is the skeleton. */
type BodyProps = {
    readonly props: ProjectsListBaseProps["props"]
    readonly view: ProjectsListView
    readonly isLoading: boolean
}

/** The ribbon over the list: the four figures of the learner, in one band between two hairlines. */
const Ribbon = (props: BodyProps) => {
    const { figures } = props.view
    const { labels } = props.props
    return (
        <Section
            kind="figures"
            ariaLabel={labels.ribbonLabel}
            isLoading={props.isLoading}
            items={[
                { id: "proved", term: labels.figures.proved, value: figures.proved },
                { id: "practising", term: labels.figures.practising, value: figures.practising },
                {
                    id: "milestones",
                    term: labels.figures.milestones,
                    value: figures.milestonesDone,
                    unit: `/ ${figures.milestonesTotal}`,
                },
                { id: "cv", term: labels.figures.cv, value: figures.cvLines },
            ]}
        />
    )
}

/** One project as a list row: name, repo and current milestone, the kind and the deployment as chips, the progress as the row's control; the whole row is the link. */
const rowOf = (row: ProjectRowView, progressLabel: string): ListRowData => ({
    id: row.id,
    title: row.name,
    description: [row.repo, row.milestone].filter((part) => part !== "").join(" · "),
    href: row.href,
    badges: [
        { label: row.kindLabel, tone: "neutral" },
        { label: row.ci, tone: row.ciTone },
    ],
    control: (
        <Cluster gap="inline" align="center">
            <RowProgress label={progressLabel} value={row.percent} tone={row.isProved ? "success" : "accent"} />
            <Text tone="muted" tabular>
                {row.progress}
            </Text>
        </Cluster>
    ),
})

/** The learner's projects as one flat list under its head; the empty list is drawn in its place. */
const ListTable = (props: BodyProps) => {
    const { labels } = props.props
    return (
        <Section
            kind="list"
            title={labels.listLabel}
            headingLevel={2}
            count={props.view.rows.length}
            caption={labels.note}
            isLoading={props.isLoading}
            items={props.view.rows.map((row) => rowOf(row, labels.progressLabel))}
            empty={
                <EmptyNotice
                    message={labels.emptyTitle}
                    description={labels.emptyText}
                    actionLabel={labels.create}
                    actionHref={labels.createHref}
                    frame="frameless"
                />
            }
        />
    )
}

/**
 * Draws the projects page of a subscriber: the one primary (create a project), the ribbon of figures between two hairlines, and the
 * flat table of projects. Nothing sits in a card; the read's state is drawn inside the table's section.
 */
export const ProjectsListBase = (props: ProjectsListBaseProps) => (
    <Page
        header={{
            breadcrumbs: "root",
            title: props.props.labels.pageTitle,
            description: props.props.labels.pageDescription,
            actions: (
                <Button intent="commit" startGlyph="plus" href={props.props.labels.createHref}>
                    {props.props.labels.create}
                </Button>
            ),
        }}
    >
        <SlotView
            slot={props.props.slot}
            placeholder={props.props.placeholder}
            labels={props.props.slotLabels}
            onRetry={props.on.retry}
            render={(view, isLoading) =>
                isLoading ? (
                    <Stack gap="region">
                        <SkeletonBlock lines={2} />
                        <SkeletonBlock lines={7} />
                    </Stack>
                ) : (
                    <Stack gap="region">
                        <Ribbon props={props.props} view={view} isLoading={isLoading} />
                        <ListTable props={props.props} view={view} isLoading={isLoading} />
                    </Stack>
                )
            }
        />
    </Page>
)
