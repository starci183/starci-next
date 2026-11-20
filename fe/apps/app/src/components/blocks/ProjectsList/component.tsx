import { Badge, Button, Cluster, DataTable, EmptyNotice, Page, Section, Stack, Text } from "@starci/grammar/common"
import { RowProgress, SlotView } from "@starci-next/ui"
import type { DataSlot, SlotLabels } from "@/modules/types"
import type { ReactElement } from "react"

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
        name: "xxxxxxxxxx",
        repo: "xxxxxxxxxxxxxxxx",
        kindLabel: "xxx",
        isAgent: false,
        milestone: "xxxxxxxxxx",
        percent: 0,
        progress: "x/x",
        ci: "xxxxxx",
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

/** One cell of the table: the project with its repo, its kind, its milestone, its progress and its deployment. */
const cellOf = (row: ProjectRowView, columnId: string, progressLabel: string): ReactElement => {
    switch (columnId) {
        case "project":
            return (
                <Stack gap="identity">
                    <Text isStrong>{row.name}</Text>
                    {row.repo === "" ? null : (
                        <Text size="xs" tone="muted">
                            {row.repo}
                        </Text>
                    )}
                </Stack>
            )
        case "kind":
            return <Badge tone="neutral">{row.kindLabel}</Badge>
        case "milestone":
            return <Text>{row.milestone}</Text>
        case "progress":
            return (
                <Cluster gap="inline" align="center">
                    <RowProgress label={progressLabel} value={row.percent} tone={row.isProved ? "success" : "accent"} />
                    <Text tone="muted" tabular>
                        {row.progress}
                    </Text>
                </Cluster>
            )
        default:
            return <Badge tone={row.ciTone}>{row.ci}</Badge>
    }
}

/** The flat table of the learner's projects under its head; the read's failure and the empty list are drawn in its place. */
const ListTable = (props: BodyProps) => {
    const { labels } = props.props
    return (
        <Section
            title={labels.listLabel}
            headingLevel={2}
            count={props.view.rows.length}
            caption={labels.note}
            isLoading={props.isLoading}
        >
            <DataTable
                label={labels.listLabel}
                isLoading={props.isLoading}
                columns={[
                    { id: "project", label: labels.columns.project },
                    { id: "kind", label: labels.columns.kind, width: "fit", hideBelow: "tablet" },
                    { id: "milestone", label: labels.columns.milestone, hideBelow: "tablet" },
                    { id: "progress", label: labels.columns.progress, width: "fit" },
                    { id: "ci", label: labels.columns.ci, width: "fit", hideBelow: "tablet" },
                ]}
                rows={props.view.rows.map((row) => ({ ...row }))}
                renderCell={(row, columnId) => cellOf(row, columnId, labels.progressLabel)}
                emptyContent={
                    <EmptyNotice
                        message={labels.emptyTitle}
                        description={labels.emptyText}
                        actionLabel={labels.create}
                        actionHref={labels.createHref}
                        frame="frameless"
                    />
                }
            />
        </Section>
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
            render={(view, isLoading) => (
                <Stack gap="region">
                    <Ribbon props={props.props} view={view} isLoading={isLoading} />
                    <ListTable props={props.props} view={view} isLoading={isLoading} />
                </Stack>
            )}
        />
    </Page>
)
