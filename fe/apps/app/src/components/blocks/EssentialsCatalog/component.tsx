import { Button, Cluster, EmptyNotice, Page, type PageHeaderContent, Skeleton, Stack } from "@starci/grammar/common"
import { CatalogGroup, CatalogToolbar, SlotView } from "@starci-next/ui"
import type {
    CatalogFilters,
    CatalogLabels,
    CatalogStatusFilter,
    CatalogView,
    DataSlot,
    SlotLabels,
} from "@/modules/types"

/** What the reader does on the catalog; every argument is an atom. */
type EssentialsCatalogActions = {
    readonly retry: () => void
    readonly choose: (change: Partial<CatalogFilters>) => void
    readonly clear: () => void
}

/** Props for {@link EssentialsCatalogBase}. */
export type EssentialsCatalogBaseProps = {
    readonly props: {
        readonly slot: DataSlot<CatalogView>
        readonly placeholder: CatalogView
        readonly slotLabels: SlotLabels
        readonly errorText: string
        readonly labels: CatalogLabels
        readonly filters: CatalogFilters
    }
    readonly on: EssentialsCatalogActions
}

/** What the well is drawn from. */
type WellProps = {
    readonly view: CatalogView
    readonly isLoading: boolean
    readonly labels: CatalogLabels
    readonly filters: CatalogFilters
    readonly on: EssentialsCatalogActions
}

/** The notice that says nothing matches the toolbar, with the way to clear it. */
const NoResult = (props: Pick<WellProps, "labels" | "filters" | "on">) => (
    <EmptyNotice
        message={props.labels.noResult.title(props.filters.query)}
        description={props.labels.noResult.text}
        actionIntent="neutral"
        actionLabel={props.labels.noResult.clear}
        onAction={props.on.clear}
        frame="frameless"
        mark="none"
    />
)

/** The toolbar of the catalog: the status tabs with their counts, the search and the two selects. */
const Toolbar = (props: WellProps) => (
    <CatalogToolbar
        labels={props.labels}
        isLoading={props.isLoading}
        statuses={props.labels.statuses.map((each) => ({
            ...each,
            count: props.view.counts[each.id as CatalogStatusFilter],
        }))}
        status={props.filters.status}
        query={props.filters.query}
        topics={[{ id: "all", label: props.labels.allTopics }, ...props.view.topics]}
        topic={props.filters.topic}
        plans={props.labels.plans}
        plan={props.filters.plan}
        onStatus={(status) => props.on.choose({ status: status as CatalogStatusFilter })}
        onQuery={(query) => props.on.choose({ query })}
        onTopic={(topic) => props.on.choose({ topic })}
        onPlan={(plan) => props.on.choose({ plan: plan as CatalogFilters["plan"] })}
    />
)

/** The well: the toolbar, then one group per topic with a lesson that passes it, or the notice when none does. */
const CatalogWell = (props: WellProps) => (
    <Stack gap="region">
        <Toolbar {...props} />
        {props.view.groups.length === 0 ? <NoResult {...props} /> : null}
        {props.view.groups.map((group) => (
            <CatalogGroup
                key={group.id}
                group={{ ...group, percent: group.total === 0 ? 0 : Math.round((group.done / group.total) * 100) }}
                viewTopic={props.labels.viewTopic}
                isLoading={props.isLoading}
            />
        ))}
    </Stack>
)

/** One group of the loading page: a bar for its title, then the rows it will hold, each a title bar and a line. */
const SkeletonGroup = () => (
    <Stack gap="row">
        <Skeleton shape="text" lines={1} />
        {[1, 2, 3].map((row) => (
            <Stack key={row} gap="row">
                <Skeleton shape="text" lines={2} />
            </Stack>
        ))}
    </Stack>
)

/** The catalog while its first read loads: the toolbar (tabs, search, selects) and two groups, all bars, no word. */
const CatalogSkeleton = () => (
    <Stack gap="region">
        <Cluster gap="inline" align="center">
            <Skeleton shape="text" lines={1} />
            <Skeleton shape="text" lines={1} />
            <Skeleton shape="text" lines={1} />
        </Cluster>
        <SkeletonGroup />
        <SkeletonGroup />
    </Stack>
)

/** The page band of the catalog: the title, the fact line and the one primary. */
const headerOf = (labels: CatalogLabels, view: CatalogView): PageHeaderContent => ({
    title: labels.title,
    breadcrumbs: "root",
    meta: view.facts,
    ...(view.primary === undefined
        ? {}
        : {
              actions: (
                  <Button intent="commit" width="wrap" href={view.primary.href}>
                      {view.primary.label}
                  </Button>
              ),
          }),
})

/**
 * Draws the Essentials catalog the way the approved page is drawn: the band (title, the fact line, the one primary), the flat toolbar
 * (status tabs with counts, search, topic and plan selects) and one flat group per topic with its bar and its lesson rows.
 * The slot owns every status: the band, the well and the page's loading flag all come from `SlotView`.
 */
export const EssentialsCatalogBase = (props: EssentialsCatalogBaseProps) => {
    const { slot, placeholder, labels, filters } = props.props
    return (
        <SlotView<CatalogView, PageHeaderContent>
            slot={slot}
            placeholder={placeholder}
            labels={props.props.slotLabels}
            errorDescription={props.props.errorText}
            onRetry={props.on.retry}
            header={(view) => headerOf(labels, view)}
            headerFallback={{ title: labels.title, breadcrumbs: "root" }}
            frame={({ header, isLoading, body }) => (
                <Page isLoading={isLoading} header={header}>
                    {body}
                </Page>
            )}
            render={(view, isLoading) =>
                isLoading ? (
                    <CatalogSkeleton />
                ) : (
                    <CatalogWell view={view} isLoading={isLoading} labels={labels} filters={filters} on={props.on} />
                )
            }
        />
    )
}
