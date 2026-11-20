"use client"

import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { failureCodeOf, useExperienceListView, type ExperienceDrafts } from "@/hooks/experience"
import { useOrigin } from "@/hooks/profile"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import {
    useMutateClaimPracticeExperienceSwr,
    useMutateShowExperienceSwr,
    useMutateSubmitExperienceSwr,
    useQueryLearnerProgressSwr,
    useQueryMyExperienceSwr,
} from "@/hooks/swr"
import { APP_ROUTES } from "@/modules/routes"
import { EXPERIENCE_PLACEHOLDER, ExperienceListBase, type ExperienceListLabels } from "./component"

/** The refusal codes a learner's write is worded with; any other refusal reads as a failed send. */
const LEARNER_REFUSALS: ReadonlySet<string> = new Set([
    "CAREER_PREMIUM_REQUIRED",
    "CAREER_LINE_SLOT_CHANGED",
    "CAREER_RESUBMIT_UNCHANGED",
    "CAREER_STATE_CONFLICT",
    "CAREER_NOT_VERIFIED",
])

/** The fixed words of the page. */
const labelsOf = (t: ReturnType<typeof useTranslations>): ExperienceListLabels => ({
    title: t("pageTitle"),
    loading: t("loading"),
    crumbLabel: t("crumb.label"),
    crumbProfile: t("crumb.profile"),
    crumbHref: APP_ROUTES.profile,
    tabsLabel: t("tabsLabel"),
    sourcesLabel: t("sourcesLabel"),
    firstTitle: t("first.title"),
    firstText: t("first.text"),
    waysLabel: t("first.waysLabel"),
    emptyTabTitle: t("emptyTabTitle"),
    emptyTabText: t("emptyTabText"),
    showAll: t("showAll"),
    returnedNote: t("returnedNote"),
    sendHint: t("sendHint"),
    editVi: t("editVi"),
    editEn: t("editEn"),
    reopen: t("resend"),
    shown: t("shown"),
    hidden: t("hidden"),
    copyLink: t("copyLink"),
    copiedLink: t("copiedLink"),
    confirmTitle: t("confirm.title"),
    confirmText: t("confirm.text"),
    confirmAction: t("send"),
    confirmCancel: t("confirm.cancel"),
    claimsTitle: t("claims.title"),
    claimAction: t("claims.action"),
})

/** The learner's Experience: reads their items, sends one for review with an edited line, shows a verified one on the profile, claims a practice pattern. */
export const ExperienceList = () => {
    const t = useTranslations("app.experience")
    const locale = useLocale()
    const viewOf = useExperienceListView()
    const read = useQueryMyExperienceSwr(undefined, locale === "en" ? "en" : "vi")
    const progress = useQueryLearnerProgressSwr(locale)
    const submit = useMutateSubmitExperienceSwr()
    const show = useMutateShowExperienceSwr()
    const claimer = useMutateClaimPracticeExperienceSwr()
    const origin = useOrigin()
    const [tab, setTab] = useState<string>("all")
    const [source, setSource] = useState<string>("all")
    const [drafts, setDrafts] = useState<ExperienceDrafts>({})
    const [editing, setEditing] = useState<ReadonlySet<string>>(new Set())
    const [busy, setBusy] = useState<string>()
    const [claimBusy, setClaimBusy] = useState<string>()
    const [confirmId, setConfirmId] = useState<string>()
    const [copiedId, setCopiedId] = useState<string>()
    const [failures, setFailures] = useState<Readonly<Record<string, string>>>({})
    const failed = (itemId: string, error: unknown): void => {
        const code = failureCodeOf(error)
        setFailures((all) => ({ ...all, [itemId]: t(`failure.${LEARNER_REFUSALS.has(code) ? code : "other"}`) }))
    }
    const run = async (itemId: string, write: () => Promise<unknown>): Promise<void> => {
        setBusy(itemId)
        setFailures((all) => ({ ...all, [itemId]: "" }))
        try {
            await write()
            await read.mutate()
        } catch (error: unknown) {
            failed(itemId, error)
        } finally {
            setBusy(undefined)
        }
    }
    const itemOf = (itemId: string) => read.data?.items.find((item) => item.itemId === itemId)
    const lineOf = (itemId: string) => drafts[itemId] ?? itemOf(itemId)?.line ?? itemOf(itemId)?.draftLine
    const state = {
        drafts,
        busy,
        failures: Object.fromEntries(Object.entries(failures).filter(([, text]) => text !== "")),
        editing,
        copiedId,
        origin,
        confirmId,
        claimBusy,
    }
    const settled =
        read.data === undefined ? undefined : viewOf(read.data, { tab, source }, progress.data?.practice ?? null, state)
    return (
        <ExperienceListBase
            props={{
                slot: mapSlot(slotOfSwr(read), (data) =>
                    viewOf(data, { tab, source }, progress.data?.practice ?? null, state),
                ),
                meta: settled === undefined ? (read.isLoading ? t("loading") : undefined) : settled.meta,
                tabs:
                    settled === undefined || settled.ways !== undefined
                        ? undefined
                        : settled.tabs.map((each) => ({ id: each.id, label: each.label, count: each.count })),
                confirmLine: settled?.confirmLine,
                placeholder: EXPERIENCE_PLACEHOLDER,
                slotLabels: useSlotLabels()(t("empty"), { title: t("errorTitle"), text: t("errorText") }),
                labels: labelsOf(t),
                tab,
                source,
                isConfirmOpen: confirmId !== undefined,
            }}
            on={{
                retry: () => void read.mutate(),
                selectTab: setTab,
                selectSource: setSource,
                editLine: (itemId, locale, text) => {
                    const base = lineOf(itemId) ?? { vi: "", en: "" }
                    setDrafts((all) => ({ ...all, [itemId]: { vi: base.vi, en: base.en, [locale]: text } }))
                },
                startEdit: (itemId) => setEditing((all) => new Set([...all, itemId])),
                askSend: setConfirmId,
                cancelSend: () => setConfirmId(undefined),
                confirmSend: () => {
                    const itemId = confirmId
                    setConfirmId(undefined)
                    const line = itemId === undefined ? undefined : lineOf(itemId)
                    if (itemId === undefined || line === undefined || line === null) return
                    void run(itemId, () => submit.trigger({ itemId, line: { vi: line.vi, en: line.en } }))
                },
                toggleShown: (itemId) => {
                    const item = itemOf(itemId)
                    if (item === undefined) return
                    void run(itemId, () => show.trigger({ itemId, shownPublicly: !item.shownPublicly }))
                },
                copyLink: (itemId, url) => {
                    void navigator.clipboard.writeText(url).then(() => setCopiedId(itemId))
                },
                claim: (patternId) => {
                    setClaimBusy(patternId)
                    void claimer
                        .trigger({ patternId })
                        .then(() => Promise.all([read.mutate(), progress.mutate()]))
                        .catch((error: unknown) => failed(patternId, error))
                        .finally(() => setClaimBusy(undefined))
                },
            }}
        />
    )
}
