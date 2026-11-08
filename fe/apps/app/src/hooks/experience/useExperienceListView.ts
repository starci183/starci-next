"use client"

import { useTranslations } from "next-intl"
import type { MyExperienceView } from "@/hooks/swr"
import { verifyPath } from "@/modules/routes"
import type { ExperienceCardView, ExperienceListView } from "@/modules/types"
import { EXPERIENCE_TABS, isSendable, plainLineOf, stateToneOf } from "./experience.shared"
import { useExperienceWords, type ExperienceWords } from "./useExperienceWords"

/** The words of the list, resolved once by the hook. */
type ListCopy = {
    readonly lineCaption: string
    readonly readinessLine: string
    readonly send: string
    readonly resend: string
    readonly showPublicly: string
    readonly hidePublicly: string
    readonly tabAll: string
    readonly metaPractising: string
    readonly metaVerified: (role: string, date: string) => string
    readonly metaPending: (date: string) => string
    readonly metaRevoked: (date: string) => string
    readonly metaReturned: (count: number) => string
    readonly metaGraded: (count: number) => string
    readonly verifiedCount: (count: number) => string
    readonly pendingCount: (count: number) => string
    readonly hiringGate: (count: number) => string
}

/** One item of the read. */
type ItemRead = MyExperienceView["items"][number]

/** A line the learner is editing, per item. */
export type ExperienceDrafts = Readonly<Record<string, { readonly vi: string; readonly en: string }>>

/** What the cards of the list need beyond the item: the words, the drafts, the item being written and the failures. */
type ExperienceCardContext = {
    readonly copy: ListCopy
    readonly words: ExperienceWords
    readonly drafts: ExperienceDrafts
    readonly busy: string | undefined
    readonly failures: Readonly<Record<string, string>>
}

/** The meta line of an item: who signed it and when, its deadline, its returns or why it still practises. */
const metaOf = (item: ItemRead, context: ExperienceCardContext): string => {
    const { copy, words } = context
    if (item.state === "verified" && item.signature) {
        return copy.metaVerified(words.role(item.signature.role), words.date(item.signature.signedAt))
    }
    if (item.state === "pending-review" && item.dueAt) return copy.metaPending(words.date(item.dueAt))
    if (item.state === "revoked" && item.revokedAt) return copy.metaRevoked(words.date(item.revokedAt))
    if (item.state === "returned") return copy.metaReturned(item.returnCount)
    if (item.state === "ai-graded") return copy.metaGraded(item.defenseQuestions.length)
    return copy.metaPractising
}

/** The card of one item, every word resolved. */
const cardOf = (item: ItemRead, context: ExperienceCardContext): ExperienceCardView => {
    const { copy, words, drafts } = context
    const line = item.line ?? item.draftLine
    const draft = drafts[item.itemId] ?? (line === null ? undefined : { vi: line.vi, en: line.en })
    return {
        itemId: item.itemId,
        part: words.part(item.part),
        state: words.state(item.state),
        stateTone: stateToneOf(item.state),
        lineCaption: item.output === "readiness" ? copy.readinessLine : copy.lineCaption,
        line: line ? plainLineOf(line.vi) : "",
        evidence: item.evidence.map((evidence, index) => ({
            id: `${evidence.kind}-${index}`,
            label: words.evidence(evidence.kind),
        })),
        returnNote: item.state === "returned" ? (item.returnNote ?? undefined) : undefined,
        meta: metaOf(item, context),
        edit:
            isSendable(item.state) && draft !== undefined
                ? { ...draft, sendLabel: item.state === "returned" ? copy.resend : copy.send }
                : undefined,
        verified:
            item.state === "verified"
                ? {
                      href: verifyPath(item.verificationCode),
                      code: item.verificationCode,
                      toggleLabel: item.shownPublicly ? copy.hidePublicly : copy.showPublicly,
                  }
                : undefined,
        notice: context.failures[item.itemId],
        isBusy: context.busy === item.itemId,
    }
}

/** The list as it is drawn: the counts, the four steps, the tabs with their counts and the cards of the chosen tab. */
const experienceListViewOf = (
    read: MyExperienceView,
    tab: string,
    context: ExperienceCardContext,
): ExperienceListView => {
    const { copy, words } = context
    const countOf = (id: string): number =>
        id === "all" ? read.items.length : read.items.filter((i) => i.state === id).length
    const pending = read.items.filter((item) => item.state === "pending-review" || item.state === "ai-graded").length
    return {
        facts: [
            copy.verifiedCount(countOf("verified")),
            copy.pendingCount(pending),
            copy.hiringGate(read.hiringMinVerified),
        ],
        flow: ["practising", "ai-graded", "pending-review", "verified"].map((state) => words.state(state)),
        tabs: EXPERIENCE_TABS.map((id) => ({
            id,
            label: id === "all" ? copy.tabAll : words.state(id),
            count: countOf(id),
        })),
        cards: read.items.filter((item) => tab === "all" || item.state === tab).map((item) => cardOf(item, context)),
    }
}

/** What the list draws besides the read: the drafts, the item being written and the refusals in words. */
export type ExperienceCardState = Pick<ExperienceCardContext, "drafts" | "busy" | "failures">

/** The mapping of the learner's read to the list as it is drawn, in the reader's words. */
export const useExperienceListView = (): ((
    read: MyExperienceView,
    tab: string,
    state: ExperienceCardState,
) => ExperienceListView) => {
    const t = useTranslations("app.experience")
    const words = useExperienceWords()
    const copy: ListCopy = {
        lineCaption: t("lineCaption"),
        readinessLine: t("readinessLine"),
        send: t("send"),
        resend: t("resend"),
        showPublicly: t("showPublicly"),
        hidePublicly: t("hidePublicly"),
        tabAll: t("tabAll"),
        metaPractising: t("metaPractising"),
        metaVerified: (role, date) => t("metaVerified", { role, date }),
        metaPending: (date) => t("metaPending", { date }),
        metaRevoked: (date) => t("metaRevoked", { date }),
        metaReturned: (count) => t("metaReturned", { count }),
        metaGraded: (count) => t("metaGraded", { count }),
        verifiedCount: (count) => t("verifiedCount", { count }),
        pendingCount: (count) => t("pendingCount", { count }),
        hiringGate: (count) => t("hiringGate", { count }),
    }
    return (read, tab, state) => experienceListViewOf(read, tab, { copy, words, ...state })
}
