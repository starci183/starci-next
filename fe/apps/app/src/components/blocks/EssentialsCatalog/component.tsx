import { Skeleton as HeroSkeleton } from "@heroui/react"
import {
    Button,
    Cluster,
    EmptyNotice,
    Grid,
    Page,
    type PageHeaderContent,
    Section,
    Stack,
    SurfaceCard,
    Text,
} from "@starci/grammar/common"
import { CatalogToolbar, ResumeCard, SlotView, TopicCard, lessonArt, topicArt } from "@starci-next/ui"
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
        /** The public base of the statics, where the 3D pictures are served. */
        readonly artBase: string
    }
    readonly on: EssentialsCatalogActions
}

/** What the well is drawn from. */
type WellProps = {
    readonly view: CatalogView
    readonly isLoading: boolean
    readonly labels: CatalogLabels
    readonly filters: CatalogFilters
    readonly artBase: string
    readonly on: EssentialsCatalogActions
}

/** The notice that says nothing matches the toolbar, with the way to clear it. */
const NoResult = (props: Pick<WellProps, "labels" | "filters" | "on">) => (
    <EmptyNotice
        message={props.labels.noResult.title(props.filters.query)}
        description={props.labels.noResult.text}
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

/** How many parts a lesson has, the segments of the cover card. */
const PART_COUNT = 4

/** The strip of key figures: lessons done, under way, not started and the time left. */
const Figures = (props: WellProps) => (
    <Section
        kind="figures"
        ariaLabel={props.labels.figuresLabel}
        items={props.view.figures}
        isLoading={props.isLoading}
    />
)

/** The cover card of the lesson under way beside the card that says what the five parts of a lesson are. */
const Cover = (props: WellProps) => (
    <Grid kind="cards" columns={2}>
        {props.view.resume === undefined ? null : (
            <ResumeCard
                resume={props.view.resume}
                art={lessonArt(props.view.resume.lessonId)}
                artBase={props.artBase}
                partCount={PART_COUNT}
                isLoading={props.isLoading}
            />
        )}
        <SurfaceCard label={props.labels.fivePartsTitle} isLoading={props.isLoading}>
            <Stack gap="row">
                {props.labels.fiveParts.map((part, index) => (
                    <Text key={part.id} as="p">
                        {`${index + 1} · ${part.title}`}
                    </Text>
                ))}
            </Stack>
        </SurfaceCard>
    </Grid>
)

/** The well: the figures, the cover, the toolbar, then one card per topic with a lesson that passes it, or the notice when none does. */
const CatalogWell = (props: WellProps) => (
    <Stack gap="region">
        <Figures {...props} />
        <Cover {...props} />
        <Toolbar {...props} />
        {props.view.groups.length === 0 ? <NoResult {...props} /> : null}
        <Grid kind="cards" columns="balanced">
            {props.view.groups.map((group) => (
                <TopicCard
                    key={group.id}
                    topic={group}
                    art={topicArt(group.id)}
                    artBase={props.artBase}
                    openLabel={props.labels.viewTopic}
                    ringLabel={props.labels.topicRing(group.done, group.total)}
                    isLoading={props.isLoading}
                />
            ))}
        </Grid>
    </Stack>
)

/** One topic card of the loading page: the picture, the name and two lines. */
const SkeletonCard = () => (
    <Stack gap="row">
        <HeroSkeleton className="h-36 w-full rounded-xl" />
        <HeroSkeleton className="h-5 w-40 rounded-lg" />
        <HeroSkeleton className="h-4 w-full rounded-lg" />
        <HeroSkeleton className="h-4 w-2/3 rounded-lg" />
    </Stack>
)

/** The catalog while its first read loads: the figures, the toolbar (tabs, search, selects) and the topic cards, all bars, no word. */
const CatalogSkeleton = () => (
    <Stack gap="region">
        <Grid kind="cards" columns={4} gap="inline">
            {[1, 2, 3, 4].map((figure) => (
                <HeroSkeleton key={figure} className="h-16 w-full rounded-xl" />
            ))}
        </Grid>
        <Cluster gap="inline" align="center">
            <HeroSkeleton className="h-10 w-28 rounded-full" />
            <HeroSkeleton className="h-10 w-64 rounded-xl" />
            <HeroSkeleton className="h-10 w-40 rounded-xl" />
        </Cluster>
        <Grid kind="cards" columns={3}>
            {[1, 2, 3].map((card) => (
                <SkeletonCard key={card} />
            ))}
        </Grid>
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
                  <Button variant="primary" width="wrap" href={view.primary.href}>
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
                    <CatalogWell
                        view={view}
                        isLoading={isLoading}
                        labels={labels}
                        filters={filters}
                        artBase={props.props.artBase}
                        on={props.on}
                    />
                )
            }
        />
    )
}
