import { Button, Page, Progress, Skeleton, Stack, type PageHeaderContent } from "@starci/grammar/common"
import { ReviewItemCard, ReviewSummaryCard, SlotView } from "@starci-next/ui"
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
    sourceLine: "",
    kindLine: "",
    lessonLine: undefined,
    question: "",
    level: "",
    tags: [],
    cloze: [],
    note: "",
    isFlipping: false,
    issue: "none",
    back: undefined,
    isGrading: false,
    isGradeFailed: false,
    isConflict: false,
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
    }
    readonly on: ReviewItemCommands
}

/** What the body needs: the base props, the screen it draws and whether it is a skeleton. */
type BodyProps = ReviewSessionBaseProps & { readonly screen: ReviewSessionScreen; readonly isLoading: boolean }

/** The body by what the session shows: the item, the locked notice or the summary. */
const Body = (props: BodyProps) => {
    if (props.screen.kind === "summary") {
        return (
            <ReviewSummaryCard summary={props.screen} labels={props.props.labels} todayHref={props.props.todayHref} />
        )
    }
    return <ReviewItemCard item={props.screen} labels={props.props.labels} isLoading={props.isLoading} on={props.on} />
}

/** The header of the session: the title, the progress words and the way back to Ôn tập. */
const headerOf = (props: ReviewSessionBaseProps): PageHeaderContent => ({
    title: props.props.labels.pageTitle,
    titleScale: "standard",
    meta: props.props.labels.progressText,
    breadcrumbs: {
        label: props.props.labels.root,
        items: [
            { id: "review", label: props.props.labels.root, href: props.props.todayHref },
            { id: "session", label: props.props.labels.pageTitle },
        ],
    },
})

/** The way back to Ôn tập under a question, until the summary offers its own. */
const Exit = (props: BodyProps) =>
    props.screen.kind === "summary" ? null : (
        <Button intent="neutral" href={props.props.todayHref}>
            {props.props.labels.emptyBack}
        </Button>
    )

/** The review session: progress, then one item at a time, or the summary. */
export const ReviewSessionBase = (props: ReviewSessionBaseProps) => (
    <SlotView<ReviewSessionScreen, PageHeaderContent>
        slot={props.props.slot}
        placeholder={props.props.placeholder}
        labels={props.props.slotLabels}
        errorDescription={props.props.labels.saveFailedBody}
        emptyDescription={props.props.labels.emptyText}
        onRetry={props.on.retry}
        header={() => headerOf(props)}
        headerFallback={{
            ...headerOf(props),
            actions: (
                <Button intent="commit" href={props.props.labels.decksHref}>
                    {props.props.labels.emptyDecks}
                </Button>
            ),
        }}
        render={(screen, isLoading) =>
            isLoading ? (
                <Stack gap="region">
                    <Skeleton shape="text" lines={1} />
                    <Skeleton shape="rect" ratio="landscape" />
                    <Skeleton shape="text" lines={1} />
                </Stack>
            ) : (
                <Stack gap="region">
                    <Progress label={props.props.labels.progressLabel} value={props.props.percent} />
                    <Body {...props} screen={screen} isLoading={isLoading} />
                    <Exit {...props} screen={screen} isLoading={isLoading} />
                </Stack>
            )
        }
        frame={(parts) => (
            <Page header={parts.header} isLoading={parts.isLoading} measure="reading">
                {parts.body}
            </Page>
        )}
    />
)
