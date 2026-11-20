"use client"

import { useTranslations } from "next-intl"
import type { LearnerProgress, MyExperienceView } from "@/hooks/swr"
import { APP_ROUTES, verifyPath } from "@/modules/routes"
import type {
    ExperienceCardView,
    ExperienceChip,
    ExperienceClaimView,
    ExperienceListView,
    ExperienceWayView,
} from "@/modules/types"
import {
    EXPERIENCE_SOURCES,
    EXPERIENCE_TABS,
    isSendable,
    plainLineOf,
    sourceOfPart,
    stateToneOf,
} from "./experience.shared"
import { useExperienceWords, type ExperienceWords } from "./useExperienceWords"

/** The words of the list, resolved once by the hook. */
type ListCopy = {
    readonly send: string
    readonly tabAll: string
    readonly sourceAll: string
    readonly noteVerified: (date: string, code: string) => string
    readonly noteSent: (date: string, due: string) => string
    readonly noteGraded: (date: string) => string
    readonly noteReturned: (date: string) => string
    readonly noteRevoked: (date: string) => string
    readonly noteNone: string
    readonly pendingNote: string
    readonly practisingNote: string
    readonly gradeChip: (result: string, passed: number, total: number) => string
    readonly defenseChip: (count: number) => string
    readonly signerChip: (role: string) => string
    readonly verifiedCount: (count: number) => string
    readonly pendingCount: (count: number) => string
    readonly hiringGate: (count: number) => string
    readonly ways: ReadonlyArray<{ readonly id: string; readonly title: string; readonly text: string }>
    readonly claimText: (accepted: number) => string
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
    readonly editing: ReadonlySet<string>
    readonly copiedId: string | undefined
    readonly origin: string
    readonly confirmId: string | undefined
    readonly claimBusy: string | undefined
}

/** The date at the head's end of a card: who signed it when, or when it was sent, graded, returned or revoked. */
const dateTextOf = (item: ItemRead, context: ExperienceCardContext): string => {
    const { copy, words } = context
    if (item.state === "verified" && item.signature) {
        return copy.noteVerified(words.date(item.signature.signedAt), item.verificationCode)
    }
    if (item.state === "pending-review" && item.dueAt)
        return copy.noteSent(words.date(item.updatedAt), words.date(item.dueAt))
    if (item.state === "ai-graded") return copy.noteGraded(words.date(item.updatedAt))
    if (item.state === "returned") return copy.noteReturned(words.date(item.updatedAt))
    if (item.state === "revoked") return copy.noteRevoked(words.date(item.revokedAt ?? item.updatedAt))
    return copy.noteNone
}

/** The chips under a title: the proofs it rests on, then who signs a verified item. */
const tagsOf = (item: ItemRead, context: ExperienceCardContext): ReadonlyArray<ExperienceChip> => [
    ...item.evidence.map((evidence, index) => ({
        id: `${evidence.kind}-${index}`,
        label: context.words.evidence(evidence.kind),
    })),
    ...(item.state === "verified" && item.signature
        ? [{ id: "signer", label: context.copy.signerChip(context.words.role(item.signature.role)) }]
        : []),
]

/** The chips of the AI's grade and of the defense questions of a graded item. */
const gradeChipsOf = (item: ItemRead, copy: ListCopy): ReadonlyArray<ExperienceChip> => {
    const chips: Array<ExperienceChip> = []
    if (item.grade !== null) {
        const total = item.grade.criteria.length
        const passed = item.grade.criteria.filter((criterion) => criterion.level > 0).length
        chips.push({ id: "grade", label: copy.gradeChip(item.grade.result, passed, total) })
    }
    if (item.defenseQuestions.length > 0) {
        chips.push({ id: "defense", label: copy.defenseChip(item.defenseQuestions.length) })
    }
    return chips
}

/** The line that tells a pending or practising item what comes next. */
const noteOf = (item: ItemRead, copy: ListCopy): string | undefined => {
    if (item.state === "pending-review") return copy.pendingNote
    return item.state === "practising" ? copy.practisingNote : undefined
}

/** The card of one item, every word resolved. */
const cardOf = (item: ItemRead, context: ExperienceCardContext): ExperienceCardView => {
    const { copy, words, drafts } = context
    const line = item.line ?? item.draftLine
    const plain = line === null ? "" : plainLineOf(line.vi)
    const draft = drafts[item.itemId] ?? (line === null ? undefined : { vi: line.vi, en: line.en })
    const isReturned = item.state === "returned"
    const isOpen = isReturned ? context.editing.has(item.itemId) : isSendable(item.state)
    return {
        itemId: item.itemId,
        source: words.part(item.part),
        state: words.state(item.state),
        stateTone: stateToneOf(item.state),
        dateText: dateTextOf(item, context),
        title: plain === "" ? item.subject : plain,
        subtitle: plain === "" || plain === item.subject ? undefined : item.subject,
        tags: tagsOf(item, context),
        returnNote: isReturned ? (item.returnNote ?? undefined) : undefined,
        note: noteOf(item, copy),
        edit:
            isOpen && draft !== undefined
                ? {
                      ...draft,
                      sendLabel: copy.send,
                      chips: gradeChipsOf(item, copy),
                  }
                : undefined,
        verified:
            item.state === "verified"
                ? {
                      code: item.verificationCode,
                      url: `${context.origin}${verifyPath(item.verificationCode)}`,
                      isShown: item.shownPublicly,
                      isCopied: context.copiedId === item.itemId,
                  }
                : undefined,
        notice: context.failures[item.itemId],
        isBusy: context.busy === item.itemId,
        isEditing: isOpen,
        isReturned,
    }
}

/** The four ways in, as rows, for a learner with no item yet. */
const waysOf = (copy: ListCopy): ReadonlyArray<ExperienceWayView> =>
    copy.ways.map((way) => ({
        id: way.id,
        title: way.title,
        description: way.text,
        href:
            way.id === "essentials"
                ? APP_ROUTES.essentials
                : way.id === "projects"
                  ? APP_ROUTES.projects
                  : way.id === "harness"
                    ? APP_ROUTES.harness
                    : APP_ROUTES.practice,
    }))

/** Whether an item of the learner already stands for a pattern: its title or line names the pattern. */
const isClaimed = (items: ReadonlyArray<ItemRead>, title: string): boolean =>
    items.some(
        (item) =>
            item.part === "practice" &&
            item.state !== "revoked" &&
            (item.subject.includes(title) || (item.line?.vi ?? item.draftLine?.vi ?? "").includes(title)),
    )

/** The patterns fully Accepted whose experience the learner has not claimed yet. */
const claimsOf = (
    read: MyExperienceView,
    patterns: LearnerProgress["practice"],
    context: ExperienceCardContext,
): ReadonlyArray<ExperienceClaimView> =>
    (patterns?.patterns ?? [])
        .filter((pattern) => pattern.problemCount > 0 && pattern.acceptedCount >= pattern.problemCount)
        .filter((pattern) => !isClaimed(read.items, pattern.title))
        .map((pattern) => ({
            patternId: pattern.patternId,
            title: pattern.title,
            description: context.copy.claimText(pattern.acceptedCount),
            isBusy: context.claimBusy === pattern.patternId,
        }))

/** The list as it is drawn: the event line, the tabs with their counts, the source chips and the cards of the chosen tab and source. */
const experienceListViewOf = (
    read: MyExperienceView,
    choice: { readonly tab: string; readonly source: string },
    patterns: LearnerProgress["practice"],
    context: ExperienceCardContext,
): ExperienceListView => {
    const { copy, words } = context
    const inSource = (item: ItemRead): boolean => choice.source === "all" || sourceOfPart(item.part) === choice.source
    const inTab = (item: ItemRead): boolean => choice.tab === "all" || item.state === choice.tab
    const countOf = (id: string): number =>
        read.items.filter((item) => inSource(item) && (id === "all" || item.state === id)).length
    const sourceCountOf = (id: string): number =>
        read.items.filter((item) => id === "all" || sourceOfPart(item.part) === id).length
    const pending = read.items.filter((item) => item.state === "pending-review" || item.state === "ai-graded").length
    const verified = read.items.filter((item) => item.state === "verified").length
    return {
        meta: [
            copy.verifiedCount(verified),
            ...(pending > 0 ? [copy.pendingCount(pending)] : []),
            ...(verified < read.hiringMinVerified ? [copy.hiringGate(read.hiringMinVerified)] : []),
        ].join(" · "),
        tabs: EXPERIENCE_TABS.map((id) => ({
            id,
            label: id === "all" ? copy.tabAll : words.state(id),
            count: countOf(id),
        })),
        sources: EXPERIENCE_SOURCES.map((id) => ({
            id,
            label: id === "all" ? copy.sourceAll : words.part(id),
            count: sourceCountOf(id),
        })),
        cards: read.items.filter((item) => inSource(item) && inTab(item)).map((item) => cardOf(item, context)),
        ways: read.items.length === 0 ? waysOf(copy) : undefined,
        claims: claimsOf(read, patterns, context),
        confirmLine:
            context.confirmId === undefined
                ? undefined
                : (() => {
                      const item = read.items.find((each) => each.itemId === context.confirmId)
                      const draft = context.drafts[context.confirmId] ?? item?.line ?? item?.draftLine ?? undefined
                      return draft === undefined ? undefined : plainLineOf(draft.vi)
                  })(),
    }
}

/** What the list draws besides the read: the drafts, the editors open, the item being written, the refusals in words and the copy marks. */
export type ExperienceCardState = Pick<
    ExperienceCardContext,
    "drafts" | "busy" | "failures" | "editing" | "copiedId" | "origin" | "confirmId" | "claimBusy"
>

/** The mapping of the learner's read to the list as it is drawn, in the reader's words. */
export const useExperienceListView = (): ((
    read: MyExperienceView,
    choice: { readonly tab: string; readonly source: string },
    patterns: LearnerProgress["practice"],
    state: ExperienceCardState,
) => ExperienceListView) => {
    const t = useTranslations("app.experience")
    const words = useExperienceWords()
    const copy: ListCopy = {
        send: t("send"),
        tabAll: t("tabAll"),
        sourceAll: t("sourceAll"),
        noteVerified: (date, code) => t("noteVerified", { date, code }),
        noteSent: (date, due) => t("noteSent", { date, due }),
        noteGraded: (date) => t("noteGraded", { date }),
        noteReturned: (date) => t("noteReturned", { date }),
        noteRevoked: (date) => t("noteRevoked", { date }),
        noteNone: t("noteNone"),
        pendingNote: t("pendingNote"),
        practisingNote: t("practisingNote"),
        gradeChip: (result, passed, total) =>
            t("gradeChip", { result: result === "pass" ? t("gradePass") : t("gradeFail"), passed, total }),
        defenseChip: (count) => t("defenseChip", { count }),
        signerChip: (role) => t("signerChip", { role }),
        verifiedCount: (count) => t("verifiedCount", { count }),
        pendingCount: (count) => t("pendingCount", { count }),
        hiringGate: (count) => t("hiringGate", { count }),
        ways: [
            { id: "essentials", title: t("ways.essentials.title"), text: t("ways.essentials.text") },
            { id: "projects", title: t("ways.projects.title"), text: t("ways.projects.text") },
            { id: "harness", title: t("ways.harness.title"), text: t("ways.harness.text") },
            { id: "practice", title: t("ways.practice.title"), text: t("ways.practice.text") },
        ],
        claimText: (accepted) => t("claimText", { accepted }),
    }
    return (read, choice, patterns, state) => experienceListViewOf(read, choice, patterns, { copy, words, ...state })
}
