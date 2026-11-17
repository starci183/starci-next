"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"
import { failureCodeOf, useExperienceListView, type ExperienceDrafts } from "@/hooks/experience"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useMutateShowExperienceSwr, useMutateSubmitExperienceSwr, useQueryMyExperienceSwr } from "@/hooks/swr"
import { EXPERIENCE_PLACEHOLDER, ExperienceListBase } from "./component"

/** The refusal codes a learner's write is worded with; any other refusal reads as a failed send. */
const LEARNER_REFUSALS: ReadonlySet<string> = new Set([
    "CAREER_PREMIUM_REQUIRED",
    "CAREER_LINE_SLOT_CHANGED",
    "CAREER_RESUBMIT_UNCHANGED",
    "CAREER_STATE_CONFLICT",
    "CAREER_NOT_VERIFIED",
])

/** The learner's Experience: reads their items, sends one for review with an edited line, shows a verified one on the profile. */
export const ExperienceList = () => {
    const t = useTranslations("app.experience")
    const viewOf = useExperienceListView()
    const read = useQueryMyExperienceSwr(undefined)
    const submit = useMutateSubmitExperienceSwr()
    const show = useMutateShowExperienceSwr()
    const [tab, setTab] = useState<string>("all")
    const [drafts, setDrafts] = useState<ExperienceDrafts>({})
    const [busy, setBusy] = useState<string>()
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
    const state = {
        drafts,
        busy,
        failures: Object.fromEntries(Object.entries(failures).filter(([, text]) => text !== "")),
    }
    return (
        <ExperienceListBase
            props={{
                slot: mapSlot(slotOfSwr(read), (data) => viewOf(data, tab, state)),
                placeholder: EXPERIENCE_PLACEHOLDER,
                slotLabels: useSlotLabels()(t("empty")),
                labels: {
                    eyebrow: t("eyebrow"),
                    title: t("title"),
                    description: t("description"),
                    flowLabel: t("flowLabel"),
                    tabsLabel: t("tabsLabel"),
                    emptyTab: t("emptyTab"),
                    returnedNote: t("returnedNote"),
                    sendHint: t("sendHint"),
                    editVi: t("editVi"),
                    editEn: t("editEn"),
                    verifyLink: t("verifyLink"),
                },
                tab,
            }}
            on={{
                retry: () => void read.mutate(),
                selectTab: setTab,
                editLine: (itemId, locale, text) => {
                    const item = itemOf(itemId)
                    const base = drafts[itemId] ?? item?.line ?? item?.draftLine ?? { vi: "", en: "" }
                    setDrafts((all) => ({ ...all, [itemId]: { vi: base.vi, en: base.en, [locale]: text } }))
                },
                send: (itemId) => {
                    const item = itemOf(itemId)
                    const line = drafts[itemId] ?? item?.line ?? item?.draftLine
                    if (line === undefined || line === null) return
                    void run(itemId, () => submit.trigger({ itemId, line: { vi: line.vi, en: line.en } }))
                },
                toggleShown: (itemId) => {
                    const item = itemOf(itemId)
                    if (item === undefined) return
                    void run(itemId, () => show.trigger({ itemId, shownPublicly: !item.shownPublicly }))
                },
            }}
        />
    )
}
