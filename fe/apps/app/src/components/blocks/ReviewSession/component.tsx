import { Alert, Button, Page, Progress, Stack } from "@starci/grammar/common"
import { ReviewItemCard, ReviewSummaryCard, SlotView, UpsellRow } from "@starci-next/ui"
import type {
    DataSlot,
    ReviewItemCommands,
    ReviewSessionLabels,
    ReviewSessionScreen,
    SlotLabels,
} from "@/modules/types"

/** The fake item with the geometry of a settled one, drawn as a skeleton while the first read runs. */
export const REVIEW_SESSION_PLACEHOLDER: ReviewSessionScreen = {
    kind: "item",
    isRetrieval: false,
    sourceLine: "xxxxxxxx",
    lessonLine: undefined,
    question: "xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    level: "xxxxxx",
    tags: ["xxxxxx", "xxxxxx"],
    cloze: [],
    note: "",
    isFlipping: false,
    issue: "none",
    back: undefined,
    isGrading: false,
    isGradeFailed: false,
}

/** Props for {@link ReviewSessionBase}. */
export type ReviewSessionBaseProps = {
    readonly props: {
        readonly slot: DataSlot<ReviewSessionScreen>
        readonly placeholder: ReviewSessionScreen
        readonly slotLabels: SlotLabels
        /** 0 to 100, the share of the session done. */
        readonly percent: number
        readonly labels: ReviewSessionLabels
        readonly todayHref: string
        readonly hubHref: string
        readonly plansHref: string
    }
    readonly on: ReviewItemCommands
}

/** The notice of an item behind Premium, with the way to the plans and a way past it. */
const Locked = (props: ReviewSessionBaseProps) => (
    <Stack gap="row">
        <Alert tone="informative" title={props.props.labels.lockedTitle} description={props.props.labels.lockedBody} />
        <UpsellRow
            label={props.props.labels.upsell}
            note={props.props.labels.lockedBody}
            href={props.props.plansHref}
        />
        <Button intent="alternative" onPress={props.on.skip}>
            {props.props.labels.skip}
        </Button>
    </Stack>
)

/** What the body needs: the base props, the screen it draws and whether it is a skeleton. */
type BodyProps = ReviewSessionBaseProps & { readonly screen: ReviewSessionScreen; readonly isLoading: boolean }

/** The body by what the session shows: the item, the locked notice or the summary. */
const Body = (props: BodyProps) => {
    if (props.screen.kind === "locked") return <Locked props={props.props} on={props.on} />
    if (props.screen.kind === "summary") {
        return (
            <ReviewSummaryCard
                summary={props.screen}
                labels={props.props.labels}
                todayHref={props.props.todayHref}
                hubHref={props.props.hubHref}
            />
        )
    }
    return <ReviewItemCard item={props.screen} labels={props.props.labels} isLoading={props.isLoading} on={props.on} />
}

/** The review session: progress, then one item at a time, or the summary. */
export const ReviewSessionBase = (props: ReviewSessionBaseProps) => (
    <Page
        header={{
            title: props.props.labels.pageTitle,
            titleScale: "standard",
            meta: props.props.labels.progressText,
            breadcrumbs: {
                label: props.props.labels.summaryBack,
                items: [
                    { id: "review", label: props.props.labels.summaryBack, href: props.props.todayHref },
                    { id: "session", label: props.props.labels.pageTitle },
                ],
            },
        }}
        measure="reading"
    >
        <Stack gap="region">
            <Progress label={props.props.labels.progressLabel} value={props.props.percent} />
            <SlotView
                slot={props.props.slot}
                placeholder={props.props.placeholder}
                labels={props.props.slotLabels}
                onRetry={props.on.retry}
                render={(screen, isLoading) => <Body {...props} screen={screen} isLoading={isLoading} />}
            />
            <Button intent="neutral" href={props.props.todayHref}>
                {props.props.labels.emptyBack}
            </Button>
        </Stack>
    </Page>
)
