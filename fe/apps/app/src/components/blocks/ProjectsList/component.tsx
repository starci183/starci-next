import {
    Button,
    EmptyNotice,
    Page,
    Pane,
    PaneGrid,
    PaneSection,
    SurfaceCard,
    Text,
    type ListRowData,
} from "@starci/grammar/common"
import { ProjectsGlyph, RowProgress, SlotView } from "@starci-next/ui"
import type { DataSlot, SlotLabels } from "@/modules/types"
import { ProjectsAside, type ProjectsAsideLabels } from "./aside"

/** One project as the list draws it: every field already in words, numbers or booleans. */
export type ProjectRowView = {
    readonly id: string
    readonly name: string
    readonly sub: string
    readonly concepts: string
    readonly percent: number
    readonly stateLabel: string
    readonly isProved: boolean
    readonly href: string
}

/** The projects as they are drawn: the rows of the list, already in words, and whether the read failed (drawn inside the card). */
export type ProjectsListView = { readonly outcome: "ready" | "failed"; readonly rows: ReadonlyArray<ProjectRowView> }

/** The fake list with the geometry of a settled one, drawn as a skeleton while the first read runs. */
export const PROJECTS_LIST_PLACEHOLDER: ProjectsListView = {
    outcome: "ready",
    rows: [1, 2, 3].map((index) => ({
        id: `placeholder-${index}`,
        name: "xxxxxxxxxx",
        sub: "xxxxxxxxxxxxxxxx",
        concepts: "xxxxxxxxxxxxxxxx",
        percent: 0,
        stateLabel: "xxxxxx",
        isProved: false,
        href: "",
    })),
}

/** The three views of the list, in the order the toolbar shows them. */
export type ProjectsTab = "all" | "practicing" | "proved"

/** The fixed words of the projects list. */
export type ProjectsListLabels = {
    readonly pageTitle: string
    readonly pageDescription: string
    readonly create: string
    readonly createHref: string
    readonly listLabel: string
    readonly tabsLabel: string
    readonly tabs: Readonly<Record<ProjectsTab, string>>
    readonly searchLabel: string
    readonly searchPlaceholder: string
    readonly searchClear: string
    readonly emptyTitle: string
    readonly emptyText: string
    readonly emptyFilteredTitle: string
    readonly errorTitle: string
    readonly progressLabel: string
    readonly device: ProjectsAsideLabels["device"]
    readonly levels: ProjectsAsideLabels["levels"]
    readonly asideLabel: string
}

/** Props for {@link ProjectsListBase}. */
export type ProjectsListBaseProps = {
    readonly props: {
        readonly slot: DataSlot<ProjectsListView>
        readonly placeholder: ProjectsListView
        readonly slotLabels: SlotLabels
        readonly labels: ProjectsListLabels
        readonly tab: ProjectsTab
        readonly query: string
    }
    readonly on: {
        readonly retry: () => void
        readonly tabChange: (tab: ProjectsTab) => void
        readonly queryChange: (query: string) => void
    }
}

/** The tab a toolbar key names. */
const tabOf = (key: string): ProjectsTab => (key === "practicing" || key === "proved" ? key : "all")

/** The notice inside the card when no row is shown: nothing yet, or nothing under the tab and the search. */
type EmptyOfProps = { readonly labels: ProjectsListLabels; readonly isFiltered: boolean }

const EmptyOf = (props: EmptyOfProps) =>
    props.isFiltered ? (
        <EmptyNotice message={props.labels.emptyFilteredTitle} frame="frameless" />
    ) : (
        <EmptyNotice
            message={props.labels.emptyTitle}
            description={props.labels.emptyText}
            actionLabel={props.labels.create}
            actionHref={props.labels.createHref}
            frame="frameless"
        />
    )

/** One project as a row: name, repo and stack, the proved concepts as its meta and their Progress as its control, the state chip and the link's chevron. */
const rowOf = (row: ProjectRowView, progressLabel: string): ListRowData => ({
    id: row.id,
    title: row.name,
    ...(row.sub === ""
        ? {}
        : {
              description: (
                  <Text size="xs" tone="muted">
                      {row.sub}
                  </Text>
              ),
          }),
    leading: { icon: ProjectsGlyph },
    badges: [{ label: row.stateLabel, tone: row.isProved ? "success" : "muted" }],
    meta: { text: row.concepts },
    control: <RowProgress label={progressLabel} value={row.percent} tone={row.isProved ? "success" : "accent"} />,
    href: row.href,
})

/** What the list card is given: the read, whether it is the loading drawing, and the shared props and commands. */
type ListCardProps = ProjectsListBaseProps & { readonly view: ProjectsListView; readonly isLoading: boolean }

/** The one list card of the page: its toolbar (tabs and search), the rows, and the loading, error and empty states inside it. */
const ListCard = (props: ListCardProps) => {
    const { labels, tab, query } = props.props
    const { isLoading } = props
    const isFailed = props.view.outcome === "failed"
    const proved = props.view.rows.filter((row) => row.isProved).length
    const counts = { all: props.view.rows.length, practicing: props.view.rows.length - proved, proved }
    const needle = query.trim().toLowerCase()
    const shown = props.view.rows.filter(
        (row) =>
            (tab === "all" || (tab === "proved") === row.isProved) &&
            (needle === "" || `${row.name} ${row.sub}`.toLowerCase().includes(needle)),
    )
    return (
        <SurfaceCard
            kind="list"
            label={labels.listLabel}
            headingLevel={2}
            {...(isFailed ? {} : { count: counts.all })}
            isLoading={isLoading}
            {...(isFailed
                ? {
                      error: {
                          message: labels.errorTitle,
                          description: props.props.slotLabels.error,
                          actionLabel: props.props.slotLabels.retry,
                          onAction: props.on.retry,
                      },
                  }
                : {})}
            headers={[
                {
                    kind: "toolbar",
                    filter: {
                        label: labels.tabsLabel,
                        items: [
                            { id: "all", label: labels.tabs.all, count: counts.all },
                            { id: "practicing", label: labels.tabs.practicing, count: counts.practicing },
                            { id: "proved", label: labels.tabs.proved, count: counts.proved },
                        ],
                        selectedKey: tab,
                        onSelect: (key) => props.on.tabChange(tabOf(key)),
                    },
                    search: {
                        label: labels.searchLabel,
                        value: query,
                        onChange: props.on.queryChange,
                        placeholder: labels.searchPlaceholder,
                        clearLabel: labels.searchClear,
                    },
                },
            ]}
            items={shown.map((row) => rowOf(row, labels.progressLabel))}
            empty={<EmptyOf labels={labels} isFiltered={tab !== "all" || needle !== ""} />}
        />
    )
}

/**
 * Draws the projects page: the band with its one primary, the well with ONE list card (tabs and search in its toolbar, the
 * state of the read inside it), and the aside pane with the machine and the levels of proof.
 */
export const ProjectsListBase = (props: ProjectsListBaseProps) => (
    <Page
        chrome="panes"
        layout="workspace"
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
        <PaneGrid
            label={props.props.labels.pageTitle}
            areas={{ base: ["aside", "main"], wide: ["main aside"] }}
            columns={{ base: ["fill"], wide: ["fill", "standard"] }}
            rows={{ base: ["auto", "fill"], wide: ["fill"] }}
        >
            <Pane area="main" scroll label={props.props.labels.listLabel} content="cards">
                <PaneSection>
                    <SlotView
                        slot={props.props.slot}
                        placeholder={props.props.placeholder}
                        labels={props.props.slotLabels}
                        onRetry={props.on.retry}
                        render={(view, isLoading) => <ListCard {...props} view={view} isLoading={isLoading} />}
                    />
                </PaneSection>
            </Pane>
            <Pane area="aside" surface scroll label={props.props.labels.asideLabel}>
                <PaneSection>
                    <ProjectsAside labels={props.props.labels} />
                </PaneSection>
            </Pane>
        </PaneGrid>
    </Page>
)
