"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"
import { useSession, useViewerRoles } from "@/hooks/auth"
import {
    SIGNER_ROLES,
    signerRoleOf,
    useReviewDecision,
    useReviewPanelLabels,
    useReviewQueueViews,
    useReviewerAdmin,
} from "@/hooks/experience"
import { loadingSlot, mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryReviewQueueSwr } from "@/hooks/swr"
import { APP_ROUTES } from "@/modules/routes"
import type { DataSlot, ReviewQueueScreenView } from "@/modules/types"
import { QUEUE_VIEW, REVIEW_QUEUE_PLACEHOLDER, REVIEWERS_VIEW, ReviewQueueBase } from "./component"

/** The tab of the reviewer appointments, which reads them instead of the queue. */
const REVIEWERS_TAB = REVIEWERS_VIEW

/** The filter the queue opens at. */
const FIRST_FILTER = "pending"

/**
 * Experience review for the teacher and appointed reviewers. The role comes from the verified session and only chooses what to
 * draw; every door checks it again. A reader with no signer role gets the forbidden slot.
 */
export const ReviewQueue = () => {
    const t = useTranslations("app.experience.queue")
    const crumb = useTranslations("app.experience.crumb")
    const session = useSession()
    const role = signerRoleOf(useViewerRoles())
    const isTeacher = role === SIGNER_ROLES.teacher
    const [tab, setTab] = useState(FIRST_FILTER)
    const [selected, setSelected] = useState<string>()
    const queue = useQueryReviewQueueSwr(tab === REVIEWERS_TAB ? FIRST_FILTER : tab, role !== undefined)
    const views = useReviewQueueViews(isTeacher)
    const currentId = selected ?? queue.data?.items[0]?.itemId
    const decision = useReviewDecision(currentId, () => queue.mutate())
    const admin = useReviewerAdmin(isTeacher, currentId, () => queue.mutate())
    const slotOf = (): DataSlot<ReviewQueueScreenView> => {
        if (session.status !== "signed-in") return loadingSlot<ReviewQueueScreenView>()
        if (role === undefined) return { isForbidden: true }
        const tabs = queue.data === undefined ? [] : views.queue(queue.data, selected).tabs
        if (tab === REVIEWERS_TAB) return mapSlot(slotOfSwr(queue), () => views.reviewers(admin.reviewers ?? [], tabs))
        return mapSlot(slotOfSwr(queue), (read) => views.queue(read, selected))
    }
    return (
        <ReviewQueueBase
            props={{
                slot: slotOf(),
                placeholder: REVIEW_QUEUE_PLACEHOLDER,
                slotLabels: {
                    ...useSlotLabels()(t("empty"), { title: t("queueErrorTitle"), text: t("queueErrorText") }),
                    forbidden: t("forbiddenTitle"),
                },
                exitLabel: t("backToProfile"),
                exitHref: APP_ROUTES.profile,
                meta: role === undefined || queue.data === undefined ? undefined : views.pageMeta(queue.data),
                labels: {
                    title: t("title"),
                    crumbLabel: crumb("label"),
                    crumbProfile: crumb("profile"),
                    listLabel: t("listLabel"),
                    tabsLabel: t("tabsLabel"),
                    viewsLabel: t("reviewViewsLabel"),
                    queueView: t("queueViewTab"),
                    reviewersLabel: t("tabReviewers"),
                    empty: t("empty"),
                    emptyTitle: t("queueEmptyTitle"),
                    emptyText: t("queueEmptyText"),
                    toReviewers: t("queueEmptyToReviewers"),
                    reviewersEmpty: t("reviewersEmpty"),
                    preview: t("preview"),
                    open: t("open"),
                    endReviewer: t("endReviewer"),
                },
                panelLabels: useReviewPanelLabels(),
                tab,
                isTeacher,
                decision,
                appoint: isTeacher ? admin.appointCard : undefined,
                assign:
                    isTeacher && queue.data?.items.some((item) => item.itemId === currentId)
                        ? admin.assignCard
                        : undefined,
            }}
            on={{
                retry: () => void queue.mutate(),
                selectTab: (next) => {
                    setTab(next === QUEUE_VIEW ? FIRST_FILTER : next)
                    setSelected(undefined)
                    decision.clear()
                },
                preview: (itemId) => {
                    setSelected(itemId)
                    decision.clear()
                },
                editNote: decision.editNote,
                approve: decision.approve,
                giveBack: decision.giveBack,
                revoke: decision.revoke,
                endReviewer: admin.end,
            }}
        />
    )
}
