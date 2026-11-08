"use client"

import { useTranslations } from "next-intl"
import { useSession } from "@/hooks/auth"
import {
    SIGNER_ROLES,
    signerRoleOf,
    useReviewDecision,
    useReviewPanelLabels,
    useReviewQueueViews,
} from "@/hooks/experience"
import { loadingSlot, mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryReviewItemSwr } from "@/hooks/swr"
import { APP_ROUTES } from "@/modules/routes"
import type { DataSlot, ReviewPreviewView } from "@/modules/types"
import { REVIEW_ITEM_PLACEHOLDER, ReviewItemBase } from "./component"

/** What the route hands the block: the item of /review-queue/{itemId}. */
type ReviewItemProps = { readonly itemId: string }

/** One item under review with its history; the teacher can also revoke a verified item here. */
export const ReviewItem = (props: ReviewItemProps) => {
    const t = useTranslations("app.experience.queue")
    const session = useSession()
    const role = signerRoleOf(session.session?.roles)
    const views = useReviewQueueViews(role === SIGNER_ROLES.teacher)
    const read = useQueryReviewItemSwr(props.itemId, role !== undefined)
    const decision = useReviewDecision(props.itemId, () => read.mutate())
    const slotOf = (): DataSlot<ReviewPreviewView> => {
        if (session.status !== "signed-in") return loadingSlot<ReviewPreviewView>()
        if (role === undefined) return { isForbidden: true }
        return mapSlot(slotOfSwr(read), (item) => views.preview(item.item, item.history))
    }
    return (
        <ReviewItemBase
            props={{
                slot: slotOf(),
                placeholder: REVIEW_ITEM_PLACEHOLDER,
                slotLabels: { ...useSlotLabels()(t("empty")), forbidden: t("forbiddenTitle") },
                panelLabels: useReviewPanelLabels(),
                backLabel: t("back"),
                backHref: APP_ROUTES.reviewQueue,
                decision,
            }}
            on={{
                retry: () => void read.mutate(),
                editNote: decision.editNote,
                approve: decision.approve,
                giveBack: decision.giveBack,
                revoke: decision.revoke,
            }}
        />
    )
}
