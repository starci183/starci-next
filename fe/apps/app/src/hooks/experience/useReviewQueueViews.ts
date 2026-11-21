"use client"

import { useTranslations } from "next-intl"
import type { ExperienceReviewersView, ReviewItemView, ReviewQueueView } from "@/hooks/swr"
import { reviewItemPath } from "@/modules/routes"
import type { ReviewPreviewView, ReviewQueueScreenView } from "@/modules/types"
import { plainLineOf, slaToneOf, stateToneOf } from "./experience.shared"
import { daysUntil, itemNameOf, useReviewWords, type ReviewWords } from "./reviewWords"

/** The translator of the queue's namespace. */
type QueueTranslator = ReturnType<typeof useTranslations<"app.experience.queue">>

/** One queue row of the read. */
type QueueItem = ReviewQueueView["items"][number]

/** The heading of one item's page. */
export type ReviewItemHeaderView = { readonly title: string; readonly meta: string }

/** What the mapping of the read needs. */
type ReviewQueueContext = {
    readonly t: QueueTranslator
    readonly words: ReviewWords
    readonly isTeacher: boolean
}

/** The preview of one item, with its history when the item page read it. */
const previewOf = (
    item: QueueItem,
    history: ReviewItemView["history"],
    context: ReviewQueueContext,
): ReviewPreviewView => {
    const { t, words } = context
    const line = item.line ?? item.draftLine
    return {
        itemId: item.itemId,
        part: words.part(item.part),
        who: item.learnerHandle,
        state: words.state(item.state),
        stateTone: stateToneOf(item.state),
        line: line ? plainLineOf(line.vi) : "",
        lineEn: line ? plainLineOf(line.en) : "",
        due: item.dueAt ? t("dueAt", { date: words.date(item.dueAt) }) : undefined,
        evidence: item.evidence.map((evidence, index) => ({
            id: `${evidence.ref}-${index}`,
            label: words.evidence(evidence.kind),
            ref: evidence.ref,
        })),
        criteria: (item.grade?.criteria ?? []).map((criterion, index) => ({
            id: `${index}`,
            criterion: criterion.criterion,
            level: `${criterion.level}/2`,
            tone: criterion.level >= 2 ? ("success" as const) : ("warning" as const),
        })),
        defense: item.defenseQuestions,
        isOpen: item.state === "pending-review",
        canRevoke: context.isTeacher && item.state === "verified",
        history: history.map((row, index) => ({
            id: `${row.at}-${index}`,
            text: t("historyRow", {
                action: t(`action.${row.action}`),
                role: t(`actor.${row.actorRole}`),
                date: words.moment(row.at),
            }),
            note: row.note ?? undefined,
        })),
    }
}

/** The words of the SLA badge: the days left or overdue when the item has a deadline, else the SLA bucket. */
const slaLabelOf = (item: QueueItem, context: ReviewQueueContext): string => {
    if (!item.dueAt || item.state !== "pending-review") return context.t(`sla.${item.sla}`)
    const days = daysUntil(item.dueAt, Date.now())
    return days < 0 ? context.t("overdueBy", { days: -days }) : context.t("dueIn", { days })
}

/** The heading of one item's page: its name, and the part, learner and state under it. */
const itemHeaderOf = (item: QueueItem, context: ReviewQueueContext): ReviewItemHeaderView => ({
    title: itemNameOf(item),
    meta: context.t("itemMeta", {
        part: context.words.part(item.part),
        who: item.learnerHandle,
        state: context.words.state(item.state),
    }),
})

/** The queue as it is drawn: the tabs with their counts, the rows and the preview of the chosen row. */
const queueViewOf = (
    read: ReviewQueueView,
    selected: string | undefined,
    context: ReviewQueueContext,
): ReviewQueueScreenView => {
    const { t, words } = context
    const tabs = [
        { id: "pending", label: t("tabPending"), count: read.counts.pending },
        ...(context.isTeacher
            ? [
                  {
                      id: "overdue",
                      label: t("tabOverdue"),
                      count: read.counts.overdue,
                      isAttention: read.counts.overdue > 0,
                  },
                  { id: "unassigned", label: t("tabUnassigned"), count: read.counts.unassigned },
                  { id: "reviewers", label: t("tabReviewers") },
              ]
            : []),
    ]
    const current = read.items.find((item) => item.itemId === selected) ?? read.items[0]
    return {
        count: t("count", { count: read.items.length }),
        tabs,
        rows: read.items.map((item) => ({
            itemId: item.itemId,
            title: itemNameOf(item),
            meta: [
                item.learnerHandle,
                words.part(item.part),
                item.grade?.result === "pass" ? t("aiPass") : t("aiFail"),
                ...(item.teacherOnly ? [t("teacherOnly")] : []),
            ].join(", "),
            sla: slaLabelOf(item, context),
            slaTone: slaToneOf(item.sla),
            href: reviewItemPath(item.itemId),
            isSelected: item.itemId === current?.itemId,
        })),
        preview: current === undefined ? undefined : previewOf(current, [], context),
        reviewers: undefined,
    }
}

/** The Reviewers tab: each appointment with its parts and load. */
const reviewersViewOf = (
    rows: ExperienceReviewersView,
    context: ReviewQueueContext,
    tabs: ReviewQueueScreenView["tabs"],
): ReviewQueueScreenView => ({
    count: "",
    tabs,
    rows: [],
    preview: undefined,
    reviewers: rows.map((row) => ({
        id: row.reviewerId,
        title: context.t("reviewerTitle", { handle: row.reviewerId.slice(-6).toUpperCase() }),
        meta: context.t("reviewerLine", {
            parts: row.parts.map((part) => context.words.part(part)).join(", "),
            open: row.openItems,
            capacity: row.capacity,
        }),
    })),
})

/** The mappings of the review reads to what the queue and the item page draw, bound to the reader's words and role. */
export interface ReviewQueueViews {
    /** One item with its history. */
    readonly preview: (item: QueueItem, history: ReviewItemView["history"]) => ReviewPreviewView
    /** The queue with the preview of the chosen row. */
    readonly queue: (read: ReviewQueueView, selected: string | undefined) => ReviewQueueScreenView
    /** The heading of one item's page. */
    readonly itemHeader: (item: QueueItem) => ReviewItemHeaderView
    /** The summary line under the queue heading: how many wait and how many are overdue. */
    readonly pageMeta: (read: ReviewQueueView) => string
    /** The reviewer appointments under the queue tabs. */
    readonly reviewers: (rows: ExperienceReviewersView, tabs: ReviewQueueScreenView["tabs"]) => ReviewQueueScreenView
}

/** Binds the review mappings to the queue words and to whether the reader is the teacher. */
export const useReviewQueueViews = (isTeacher: boolean): ReviewQueueViews => {
    const t = useTranslations("app.experience.queue")
    const words = useReviewWords()
    const context: ReviewQueueContext = { t, words, isTeacher }
    return {
        preview: (item, history) => previewOf(item, history, context),
        queue: (read, selected) => queueViewOf(read, selected, context),
        itemHeader: (item) => itemHeaderOf(item, context),
        pageMeta: (read) => t("pageMeta", { pending: read.counts.pending, overdue: read.counts.overdue }),
        reviewers: (rows, tabs) => reviewersViewOf(rows, context, tabs),
    }
}
