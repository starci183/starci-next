import { Link, Page, Stack } from "@starci/grammar/common"
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
        readonly panelLabels: ReviewPanelLabels
        readonly backLabel: string
        readonly backHref: string
        readonly decision: ReviewPanelDecision
    }
    readonly on: ReviewPanelActions & { readonly retry: () => void }
}

/**
 * Draws one item under review on /review-queue/{itemId}: the way back to the queue, then the review panel with the item's history,
 * and Revoke for the teacher on a verified item. A reader with no signer role gets the forbidden slot.
 */
export const ReviewItemBase = (props: ReviewItemBaseProps) => (
    <Page>
        <Stack gap="region">
            <Link variant="plain" href={props.props.backHref}>
                {props.props.backLabel}
            </Link>
            <SlotView
                slot={props.props.slot}
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
        </Stack>
    </Page>
)
