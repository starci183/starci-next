import { Skeleton as HeroSkeleton } from "@heroui/react"
import {
    Alert,
    Button,
    EmptyNotice,
    Meter,
    Page,
    Pane,
    PaneGrid,
    PaneSection,
    Stack,
    type PageHeaderContent,
} from "@starci/grammar/common"
import type { ReactNode } from "react"
import { LessonList, SlotView, TopicAside } from "@starci-next/ui"
import type { DataSlot, SlotLabels, TopicLabels, TopicScreenView } from "@/modules/types"

/** The fake topic with the geometry of a settled one, drawn as a skeleton while the first read runs. */
export const TOPIC_PLACEHOLDER: TopicScreenView = {
    title: "",
    trail: [],
    description: "",
    facts: "",
    primary: { label: "", href: "/" },
    progress: { label: "", percent: 0 },
    notice: undefined,
    rows: [1, 2, 3, 4].map((index) => ({
        id: `placeholder-${index}`,
        title: "",
        problem: "",
        href: "/",
        minutes: "",
        doneParts: 0,
        partsLabel: "",
        state: "todo",
        badge: { label: "", tone: "neutral" },
        isCurrent: false,
        opener: "",
    })),
    parts: [],
    prerequisites: [],
    related: [],
}

/** Props for {@link TopicDetailBase}. */
export type TopicDetailBaseProps = {
    readonly props: {
        readonly slot: DataSlot<TopicScreenView>
        readonly placeholder: TopicScreenView
        readonly slotLabels: SlotLabels
        readonly errorText: string
        readonly labels: TopicLabels
        /** The destination of the catalog. */
        readonly catalogHref: string
        /** The new address of the lesson when the segment was an old lesson link; empty otherwise. */
        readonly movedTo: string
    }
    readonly on: { readonly retry: () => void }
}

/** The topic with the words and the links it is drawn with. */
type TopicBodyProps = {
    readonly view: TopicScreenView
    readonly props: TopicDetailBaseProps["props"]
    readonly isLoading: boolean
}

/** The page band: the trail, the title, what the topic is about, its facts and the one primary. */
const headerOf = (props: TopicDetailBaseProps["props"], view: TopicScreenView): PageHeaderContent => ({
    title: view.title,
    titleScale: "standard",
    breadcrumbs: {
        label: props.labels.breadcrumbs,
        items: [{ id: "essentials", label: props.labels.pageTitle, href: props.catalogHref }, ...view.trail],
    },
    ...(view.description === "" ? {} : { description: view.description }),
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

/** The well: the bar of lessons done, the notice of a reader without Premium and the lessons of the topic. */
const TopicMain = (props: TopicBodyProps) => (
    <Stack gap="region">
        <Meter
            label={props.view.progress.label}
            value={props.view.progress.percent}
            tone="foreground"
            size="sm"
            isLoading={props.isLoading}
        />
        {props.view.notice === undefined ? null : (
            <Alert tone="accent" title={props.view.notice.title} description={props.view.notice.text} />
        )}
        <LessonList
            ariaLabel={props.props.labels.list}
            rows={props.view.rows}
            isNumbered
            isLoading={props.isLoading}
            empty={<EmptyNotice message={props.props.labels.empty} frame="frameless" />}
        />
    </Stack>
)

/** What the notice of an old lesson link needs. */
type MovedProps = { readonly props: TopicDetailBaseProps["props"] }

/** The notice of an old lesson link, with the way to the lesson. */
const Moved = (props: MovedProps) =>
    props.props.movedTo === "" ? null : (
        <Stack gap="row">
            <Alert tone="informative" title={props.props.labels.moved} />
            <Button intent="commit" href={props.props.movedTo}>
                {props.props.labels.movedOpen}
            </Button>
        </Stack>
    )

/** n text bars, the last one shorter, like a paragraph. */
const Lines = (props: { readonly count: number }) => (
    <Stack gap="row">
        {Array.from({ length: props.count }, (_, index) => (
            <HeroSkeleton
                key={index}
                className={
                    index === props.count - 1 && props.count > 1 ? "h-4 w-2/3 rounded-lg" : "h-4 w-full rounded-lg"
                }
            />
        ))}
    </Stack>
)

/** The well while the first read runs: the bar of lessons, then the lesson rows, all bars. */
const TopicSkeleton = () => (
    <Stack gap="region">
        <HeroSkeleton className="h-4 w-full rounded-full" />
        {[1, 2, 3, 4].map((row) => (
            <Lines key={row} count={3} />
        ))}
    </Stack>
)

/** The aside while the first read runs: the blocks of the topic as bars. */
const TopicAsideSkeleton = () => (
    <Stack gap="region">
        {[3, 2, 2].map((count, index) => (
            <Stack key={index} gap="row">
                <HeroSkeleton className="h-5 w-40 rounded-lg" />
                <Lines count={count} />
            </Stack>
        ))}
    </Stack>
)

/** The aside pane's content: the topic's blocks; they draw as skeletons while the first read runs. */
const asideOf = (view: TopicScreenView, labels: TopicLabels, isLoading: boolean): ReactNode => (
    <TopicAside
        partsTitle={labels.partsTitle}
        partsNote={labels.partsNote}
        parts={view.parts}
        prerequisitesTitle={labels.prerequisites}
        prerequisites={view.prerequisites}
        relatedTitle={labels.related}
        related={view.related}
        isLoading={isLoading}
    />
)

/** Draws a topic as the approved page: the band, the well with the bar and the lessons, and (wide screens) the aside pane; every status comes from the slot. */
export const TopicDetailBase = (props: TopicDetailBaseProps) => {
    const own = props.props
    return (
        <SlotView<TopicScreenView, PageHeaderContent>
            slot={own.slot}
            placeholder={own.placeholder}
            labels={own.slotLabels}
            errorDescription={own.errorText}
            onRetry={props.on.retry}
            header={(view) => headerOf(own, view)}
            headerFallback={{
                title: own.labels.pageTitle,
                breadcrumbs: {
                    label: own.labels.breadcrumbs,
                    items: [{ id: "essentials", label: own.labels.pageTitle }],
                },
            }}
            aside={(view, isLoading) => asideOf(view, own.labels, isLoading)}
            asideFallback={<PaneSection isLoading>{null}</PaneSection>}
            frame={({ header, aside, body, isLoading }) => (
                <Page chrome="panes" layout="workspace" isLoading={isLoading} header={header}>
                    <PaneGrid
                        label={own.labels.pageTitle}
                        areas={{ base: ["main"], wide: ["main aside"] }}
                        columns={{ base: ["fill"], wide: ["fill", "standard"] }}
                        rows={{ base: ["fill"], wide: ["fill"] }}
                    >
                        <Pane area="main">
                            <PaneSection gap="section">
                                <Moved props={own} />
                                {isLoading ? <TopicSkeleton /> : body}
                            </PaneSection>
                        </Pane>
                        <Pane area="aside" surface>
                            {isLoading ? <TopicAsideSkeleton /> : aside}
                        </Pane>
                    </PaneGrid>
                </Page>
            )}
            render={(each, isLoading) => <TopicMain view={each} props={own} isLoading={isLoading} />}
        />
    )
}
