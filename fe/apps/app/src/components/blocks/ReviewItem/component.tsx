import { Button, Page, Stack } from "@starci/grammar/common"
import { ReviewPanel, SlotView, type ReviewPanelActions, type ReviewPanelDecision } from "@starci-next/ui"
import type { DataSlot, ReviewPanelLabels, ReviewPreviewView, SlotLabels } from "@/modules/types"

/** The fake item with the geometry of a settled one. */
export const REVIEW_ITEM_PLACEHOLDER: ReviewPreviewView = {
    itemId: "placeholder",
    part: "xxxxxx",
    who: "xxxxxx",
    state: "xxxxxx",
    stateTone: "neutral",
    line: "xxxxxxxxxxxxxxxxxxxxxxxx",
    lineEn: "xxxxxxxxxxxxxxxxxxxxxxxx",
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
    <Page
        header={{
            title: props.props.title,
            titleScale: "standard",
            breadcrumbs: {
                label: props.props.crumbLabel,
                items: [
                    { id: "profile", label: props.props.profileLabel, href: props.props.profileHref },
                    { id: "queue", label: props.props.backLabel, href: props.props.backHref },
                    { id: "item", label: props.props.crumb },
                ],
            },
            ...(props.props.meta === undefined ? {} : { meta: props.props.meta }),
        }}
    >
        <SlotView
            slot={props.props.slot}
            forbiddenAction={
                <Stack gap="row" align="center">
                    <Button intent="neutral" href={props.props.exitHref}>
                        {props.props.exitLabel}
                    </Button>
                </Stack>
            }
            placeholder={props.props.placeholder}
            labels={props.props.slotLabels}
            onRetry={props.on.retry}
            render={(item) => (
                <ReviewPanel
                    item={item}
                    labels={props.props.panelLabels}
                    decision={props.props.decision}
                    on={props.on}
                />
            )}
        />
    </Page>
)
