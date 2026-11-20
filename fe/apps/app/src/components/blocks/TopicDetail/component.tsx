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
    title: "…",
    trail: [],
    description: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    facts: "xxxxxxxxxxxxxxxxxxxxxxxx",
    primary: { label: "xxxxxxxxxxxxxxxxxxxx", href: "/" },
    progress: { label: "…", percent: 0 },
    notice: undefined,
    rows: [1, 2, 3, 4].map((index) => ({
        id: `placeholder-${index}`,
        title: "xxxxxxxxxxxxxxxx",
        problem: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        href: "/",
        minutes: "xxxxxxx",
        doneParts: 0,
        partsLabel: "xxxxxx",
        state: "todo",
        badge: { label: "xxxxxxxx", tone: "neutral" },
        isCurrent: false,
        opener: "xxxxxxxx",
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
                            <PaneSection gap="section" isLoading={isLoading}>
                                <Moved props={own} />
                                {body}
                            </PaneSection>
                        </Pane>
                        <Pane area="aside" surface>
                            {aside}
                        </Pane>
                    </PaneGrid>
                </Page>
            )}
            render={(each, isLoading) => <TopicMain view={each} props={own} isLoading={isLoading} />}
        />
    )
}
