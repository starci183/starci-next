import { Skeleton } from "@heroui/react"
import { Button, Page, Stack } from "@starci/grammar/common"
import { ReviewPanel, SlotView, type ReviewPanelActions, type ReviewPanelDecision } from "@starci-next/ui"
import type { DataSlot, ReviewPanelLabels, ReviewPreviewView, SlotLabels } from "@/modules/types"

/** The item SlotView hands the render while the first read loads; the render draws {@link ReviewPanelSkeleton} instead, so it holds no words. */
export const REVIEW_ITEM_PLACEHOLDER: ReviewPreviewView = {
    itemId: "placeholder",
    part: "",
    who: "",
    state: "",
    stateTone: "neutral",
    line: "",
    lineEn: "",
    due: undefined,
    evidence: [],
    criteria: [],
    defense: [],
    isOpen: false,
    canRevoke: false,
    history: [],
}

/** Props for {@link ReviewItemBase}. */
export type ReviewItemBaseProps = {
    readonly props: {
        readonly slot: DataSlot<ReviewPreviewView>
        readonly placeholder: ReviewPreviewView
        readonly slotLabels: SlotLabels
        readonly exitLabel: string
        readonly exitHref: string
        readonly panelLabels: ReviewPanelLabels
        /** The item's short name once read, else the generic heading. */
        readonly title: string
        /** The last crumb: the short name cut to fit a phone, else the generic heading. */
        readonly crumb: string
        /** The part, learner and state under the heading once read. */
        readonly meta: string | undefined
        /** Names the breadcrumb landmark. */
        readonly crumbLabel: string
        /** The first crumb, back to the profile. */
        readonly profileLabel: string
        readonly profileHref: string
        readonly backLabel: string
        readonly backHref: string
        readonly decision: ReviewPanelDecision
    }
    readonly on: ReviewPanelActions & { readonly retry: () => void }
}

/**
 * Draws one item under review on /review-queue/{itemId}: the trail through the profile and the queue, the item's name and facts, then the review panel with the item's history,
 * and Revoke for the teacher on a verified item. A reader with no signer role gets the forbidden slot.
 */
export const ReviewItemBase = (props: ReviewItemBaseProps) => (
    <SlotView
        slot={props.props.slot}
        forbiddenAction={
            <Stack gap="row" align="center">
                <Button variant="border" href={props.props.exitHref}>
                    {props.props.exitLabel}
                </Button>
            </Stack>
        }
        placeholder={props.props.placeholder}
        labels={props.props.slotLabels}
        onRetry={props.on.retry}
        render={(item, isLoading) =>
            // While the first read loads the panel is a skeleton of its geometry: no heading, label, button word or tone.
            isLoading ? (
                <ReviewPanelSkeleton />
            ) : (
                <ReviewPanel
                    item={item}
                    labels={props.props.panelLabels}
                    decision={props.props.decision}
                    on={props.on}
                />
            )
        }
        frame={({ body, isLoading }) => (
            <Page
                header={{
                    title: isLoading ? <Skeleton className="h-6 w-64 rounded-md" /> : props.props.title,
                    titleScale: "standard",
                    breadcrumbs: {
                        label: props.props.crumbLabel,
                        items: [
                            { id: "profile", label: props.props.profileLabel, href: props.props.profileHref },
                            { id: "queue", label: props.props.backLabel, href: props.props.backHref },
                            {
                                id: "item",
                                label: props.props.crumb,
                                ...(isLoading ? { isLoading: true as const } : {}),
                            },
                        ],
                    },
                    // While loading the meta line is a bone, so the band does not grow when the item arrives.
                    ...(isLoading
                        ? { meta: <Skeleton className="h-3 w-56 rounded-md" /> }
                        : props.props.meta === undefined
                          ? {}
                          : { meta: props.props.meta }),
                }}
            >
                {body}
            </Page>
        )}
    />
)

/** A heading bar over the given number of lines: one titled part of the panel while it loads. */
const SkeletonBlock = (props: { readonly lines: number }) => (
    <Stack gap="row">
        <Skeleton className="h-5 w-40 rounded-md" />
        {Array.from({ length: props.lines }, (_, index) => (
            <Skeleton key={index} className="h-4 w-2/3 rounded-md" />
        ))}
    </Stack>
)

/**
 * The review panel while its first read loads: no heading, label, button word or tone, only the geometry of the ready panel as
 * Skeleton bars (the item card with its line in both locales, the evidence, the AI grade, the note with its commands, the history).
 */
export const ReviewPanelSkeleton = () => (
    <Stack gap="region">
        <Stack gap="row">
            <Skeleton className="h-5 w-40 rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-2/3 rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-2/3 rounded-md" />
            <Skeleton className="h-3 w-32 rounded-md" />
        </Stack>
        <SkeletonBlock lines={1} />
        <SkeletonBlock lines={1} />
        <SkeletonBlock lines={4} />
        <Skeleton className="h-10 w-28 rounded-full" />
        <SkeletonBlock lines={2} />
    </Stack>
)
