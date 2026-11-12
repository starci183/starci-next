import { Alert, Button, Page, type PageHeaderContent, Pane, PaneGrid, PaneSection, Stack } from "@starci/grammar/common"
import type { ReactNode } from "react"
import { SlotView, TopicAside, TopicHero, TopicPath } from "@starci-next/ui"
import type { DataSlot, SlotLabels, TopicLabels, TopicScreenView } from "@/modules/types"

/** The fake topic with the geometry of a settled one, drawn as a skeleton while the first read runs. */
export const TOPIC_PLACEHOLDER: TopicScreenView = {
    title: "xxxxxxxxxx",
    group: "xxxxxxxx",
    groupId: "placeholder",
    description: "xxxxxxxxxxxxxxxx",
    facts: ["xxxxxx", "xxxxxxxx"],
    cover: "",
    next: undefined,
    note: "xxxxxxxx",
    progress: "xxxxxxxxxx",
    rows: [1, 2, 3, 4].map((index) => ({
        id: `placeholder-${index}`,
        title: "xxxxxxxxxx",
        meta: "xxxxxxxx",
        status: "xxxxxx",
        href: "",
        cta: "",
        isOpen: false,
    })),
    prerequisites: [],
    related: [],
}

/** Props for {@link TopicDetailBase}. */
export type TopicDetailBaseProps = {
    readonly props: {
        readonly slot: DataSlot<TopicScreenView>
        readonly placeholder: TopicScreenView
        readonly slotLabels: SlotLabels
        readonly labels: TopicLabels
        /** The title of the progress block of the aside. */
        readonly progressTitle: string
        /** The destination of the plans page. */
        readonly plansHref: string
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
}

/** The page band: trail "catalog / topic", title and the muted facts (lessons, minutes, languages); the one command lives in the hero. */
const headerOf = (props: TopicDetailBaseProps["props"], view: TopicScreenView): PageHeaderContent => ({
    title: view.title,
    titleScale: "standard",
    breadcrumbs: {
        label: props.labels.breadcrumbs,
        items: [
            { id: "essentials", label: props.labels.pageTitle, href: props.catalogHref },
            { id: "topic", label: view.title },
        ],
    },
    meta: view.facts.join(" · "),
})

/** The cover's intrinsic size: every cover is 1200 by 800. */
const COVER = { width: 1200, height: 800 } as const

/** The well: the hero with the cover and the one command, then the lessons of the chapter as one list card. */
const TopicMain = (props: TopicBodyProps) => (
    <>
        {props.view.cover === "" ? null : (
            <TopicHero
                title={props.view.title}
                cover={{ src: props.view.cover, ...COVER }}
                pitch={props.view.description}
                note={props.view.note}
                action={props.view.next}
            />
        )}
        <TopicPath
            label={props.props.labels.path}
            emptyLabel={props.props.labels.pathEmpty}
            ringsLabel={props.props.labels.ringsLabel}
            doneLabel={props.props.labels.doneLabel}
            rows={props.view.rows}
        />
    </>
)

/** The aside pane: progress, what to know first and the related topics, each shown only when the data carries it. */
const TopicSide = (props: TopicBodyProps) => {
    const open = props.view.rows.filter((row) => row.isOpen).length
    return (
        <TopicAside
            progressLabel={props.props.progressTitle}
            progress={{
                label: props.view.facts[0] ?? "",
                value: open,
                max: props.view.rows.length,
                note: props.view.progress,
            }}
            prerequisitesLabel={props.props.labels.prerequisites}
            prerequisites={props.view.prerequisites}
            relatedLabel={props.props.labels.related}
            related={props.view.related}
            upsell={
                props.props.labels.upsell === undefined
                    ? undefined
                    : {
                          note: props.props.labels.upsell.note,
                          label: props.props.labels.upsell.label,
                          href: props.props.plansHref,
                      }
            }
        />
    )
}

/** What the notice needs: the shared words and links. */
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

/** What the aside needs besides the slot: the progress title and the plans link are in the shared props. */
type AsideOfProps = { readonly slot: DataSlot<TopicScreenView>; readonly props: TopicDetailBaseProps["props"] }

/** The aside pane's content: the settled topic's blocks; one empty loading section while the read has not settled (a pane always holds a section). */
const asideOf = (input: AsideOfProps): ReactNode =>
    "items" in input.slot ? (
        <TopicSide view={input.slot.items} props={input.props} />
    ) : (
        <PaneSection isLoading>{null}</PaneSection>
    )

/** The topic the band shows: the settled one, or the placeholder's geometry while it is not. */
const bandViewOf = (input: AsideOfProps): TopicScreenView =>
    "items" in input.slot ? input.slot.items : input.props.placeholder

/** Draws a topic as the approved model: the band, the well with the lessons as one list card, and the aside pane with progress and neighbours. */
export const TopicDetailBase = (props: TopicDetailBaseProps) => {
    const own = props.props
    return (
        <Page
            chrome="panes"
            layout="workspace"
            isLoading={"isLoading" in own.slot}
            header={headerOf(own, bandViewOf({ slot: own.slot, props: own }))}
        >
            <PaneGrid
                label={own.labels.pageTitle}
                areas={{ base: ["aside", "main"], medium: ["main aside"] }}
                columns={{ base: ["fill"], medium: ["fill", "standard"] }}
                rows={{ base: ["auto", "fill"], medium: ["fill"] }}
            >
                <Pane area="main">
                    <PaneSection gap="section">
                        <Moved props={own} />
                        <SlotView
                            slot={own.slot}
                            placeholder={own.placeholder}
                            labels={own.slotLabels}
                            onRetry={props.on.retry}
                            render={(each) => <TopicMain view={each} props={own} />}
                        />
                    </PaneSection>
                </Pane>
                <Pane area="aside" surface>
                    {asideOf({ slot: own.slot, props: own })}
                </Pane>
            </PaneGrid>
        </Page>
    )
}
