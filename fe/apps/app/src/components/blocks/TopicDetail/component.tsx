import { Alert, Button, Grid, Page, Stack } from "@starci/grammar/common"
import { ArtImage, groupArtOf, SlotView, TopicAside, TopicIntro, TopicPath } from "@starci-next/ui"
import { topicHeaderOf, type DataSlot, type SlotLabels, type TopicLabels, type TopicScreenView } from "@/modules/types"

/** The fake topic with the geometry of a settled one, drawn as a skeleton while the first read runs. */
export const TOPIC_PLACEHOLDER: TopicScreenView = {
    title: "xxxxxxxxxx",
    group: "xxxxxxxx",
    groupId: "placeholder",
    description: "xxxxxxxxxxxxxxxx",
    facts: ["xxxxxx", "xxxxxxxx"],
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
        /** The destination of the plans page. */
        readonly plansHref: string
        /** The destination of the catalog. */
        readonly catalogHref: string
        /** The new address of the lesson when the segment was an old lesson link; empty otherwise. */
        readonly movedTo: string
    }
    readonly on: { readonly retry: () => void }
}

/** The topic with the words and the link it is drawn with. */
type TopicBodyProps = {
    readonly view: TopicScreenView
    readonly labels: TopicLabels
    readonly plansHref: string
}

/** The primary column: the topic card, then its path in the teacher's order. */
const TopicMain = (props: TopicBodyProps) => (
    <Stack gap="region">
        <TopicIntro
            title={props.view.title}
            description={props.view.description}
            facts={props.view.facts}
            art={<ArtImage asset={groupArtOf(props.view.groupId)} />}
            upsell={props.labels.upsell === undefined ? undefined : { ...props.labels.upsell, href: props.plansHref }}
            progress={props.view.progress}
        />
        <TopicPath label={props.labels.path} emptyLabel={props.labels.pathEmpty} rows={props.view.rows} />
    </Stack>
)

/** The aside: what to know first and the related topics, each shown only when the data carries it. */
const TopicSide = (props: Pick<TopicBodyProps, "view" | "labels">) => (
    <TopicAside
        prerequisitesLabel={props.labels.prerequisites}
        prerequisites={props.view.prerequisites}
        relatedLabel={props.labels.related}
        related={props.view.related}
        emptyLabel={props.labels.asideEmpty}
    />
)

/** Draws a topic the way the canvas does: the topic card and its path in the middle, what to know first and related topics beside. */
export const TopicDetailBase = (props: TopicDetailBaseProps) => (
    <Page
        isLoading={"isLoading" in props.props.slot}
        {...topicHeaderOf(props.props.slot, props.props.placeholder, props.props.labels, props.props.catalogHref)}
    >
        {props.props.movedTo === "" ? null : (
            <Stack gap="row">
                <Alert tone="informative" title={props.props.labels.moved} />
                <Button intent="commit" href={props.props.movedTo}>
                    {props.props.labels.movedOpen}
                </Button>
            </Stack>
        )}
        <SlotView
            slot={props.props.slot}
            placeholder={props.props.placeholder}
            labels={props.props.slotLabels}
            onRetry={props.on.retry}
            render={(view) => (
                <Grid
                    kind="main-rail"
                    railPosition="trailing"
                    primary={<TopicMain view={view} labels={props.props.labels} plansHref={props.props.plansHref} />}
                    rail={<TopicSide view={view} labels={props.props.labels} />}
                />
            )}
        />
    </Page>
)
