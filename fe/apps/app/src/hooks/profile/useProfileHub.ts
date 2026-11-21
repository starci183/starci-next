"use client"

import { useFormatter, useLocale, useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { useSession } from "@/hooks/auth"
import { useExperienceWords } from "@/hooks/experience"
import { mapSlot, settledListSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import {
    useMutateSetCvVisibilitySwr,
    useMutateShowExperienceSwr,
    useQueryLearnerProgressSwr,
    useQueryMyCvLinkSwr,
    useQueryMyExperienceSwr,
    useQueryMyPremiumSwr,
    useQueryMyProfileSwr,
    useQueryRelayDevicesSwr,
} from "@/hooks/swr"
import type { DataSlot, ProfileHubLabels, ProfileHubViews } from "@/modules/types"
import { asideOf, cvLinkOf, cvOf, devicesOf, planOf } from "@/hooks/profileViews"
import { labelsOf } from "@/hooks/profileWords"
import { PROFILE_SAVED_KEY } from "./profile.shared"
import { useOrigin } from "./useOrigin"

/** What the profile page is drawn from and the commands it sends. */
export type ProfileHubState = {
    readonly pageTitle: string
    readonly labels: ProfileHubLabels
    readonly views: ProfileHubViews
    /** The line under the title once the reads settle: the kind of account, the plan and the verified count. */
    readonly metaLine: string | undefined
    /** Whether the learner has neither a name nor an avatar yet. */
    readonly isNew: boolean
    /** Whether the last edit just saved. */
    readonly isSaved: boolean
    readonly slotLabels: ReturnType<ReturnType<typeof useSlotLabels>>
    readonly isCvLinkBusy: boolean
    readonly on: {
        readonly setPublic: (isPublic: boolean) => void
        readonly toggleLine: (itemId: string) => void
        readonly copyLine: (itemId: string, url: string) => void
        readonly retry: () => void
    }
}

/** What one slot is read from: the answer of a read that may still be loading or failed. */
type SlotSource<T> = { readonly data: T | undefined; readonly error: unknown; readonly isLoading: boolean }

/** The slot of one read, worded by `map` once it settles. */
const slotOf = <T, U>(read: SlotSource<T>, map: (data: T) => U): DataSlot<U> => mapSlot(slotOfSwr(read), map)

/** Whether the editor just saved: read once from the session store the editor wrote, then forgotten. */
const useJustSaved = (): boolean => {
    const [isSaved, setIsSaved] = useState(false)
    useEffect(() => {
        try {
            if (window.sessionStorage.getItem(PROFILE_SAVED_KEY) === null) return
            window.sessionStorage.removeItem(PROFILE_SAVED_KEY)
            setIsSaved(true)
        } catch {
            // A browser without session storage simply shows no notice.
        }
    }, [])
    return isSaved
}

/** The connected profile: identity, CV link, verified CV lines and the account panels, worded in the reader language. */
export const useProfileHub = (): ProfileHubState => {
    const t = useTranslations("app.profile")
    const format = useFormatter()
    const locale = useLocale()
    const words = useExperienceWords()
    const session = useSession()
    const isSignedIn = session.status === "signed-in"
    const origin = useOrigin()
    const [copiedId, setCopiedId] = useState<string | undefined>(undefined)
    const profile = useQueryMyProfileSwr(locale)
    const cvLink = useQueryMyCvLinkSwr()
    const visibility = useMutateSetCvVisibilitySwr()
    const show = useMutateShowExperienceSwr()
    const experience = useQueryMyExperienceSwr(undefined)
    const progress = useQueryLearnerProgressSwr(locale)
    const devices = useQueryRelayDevicesSwr(isSignedIn)
    const premium = useQueryMyPremiumSwr(isSignedIn)
    const limits = profile.data?.limits ?? { maxBytes: 2 * 1024 * 1024, nameMax: 60 }
    const verified = (experience.data?.items ?? []).filter((item) => item.state === "verified").length
    const isNew = profile.data !== undefined && profile.data.displayName === null && profile.data.avatarUrl === null
    const metaLine =
        profile.data === undefined || experience.data === undefined
            ? undefined
            : [
                  isNew && verified === 0 ? t("meta.learnerNew") : t("meta.learner"),
                  premium.data?.isPremium === true ? t("meta.premium") : t("meta.free"),
                  t("meta.verified", { verified, min: experience.data.hiringMinVerified }),
              ].join(" · ")
    return {
        pageTitle: t("pageTitle"),
        labels: labelsOf(t, "", limits.maxBytes),
        slotLabels: useSlotLabels()(t("cv.empty")),
        metaLine,
        isNew,
        isSaved: useJustSaved(),
        isCvLinkBusy: visibility.isMutating,
        views: {
            identity: slotOf(profile, (data) => ({
                shownName: data.displayName ?? t("identity.unnamed"),
                nameValue: data.displayName ?? "",
                email: session.session?.email ?? "",
                avatarUrl: data.avatarUrl,
                avatarName: session.session?.email ?? "",
                goalTitle: data.goal?.title ?? null,
                canSaveName: false,
                isNew: data.displayName === null && data.avatarUrl === null,
                nameCount: `${(data.displayName ?? "").length}/${limits.nameMax}`,
            })),
            cvLink: slotOf(cvLink, (data) => cvLinkOf(origin, data)),
            cv: slotOf(experience, (data) => cvOf({ t, words, locale, origin, copiedId, data })),
            devices: settledListSlot(slotOf(devices, (list) => devicesOf(t, format, list))),
            plan: slotOf(premium, (data) => planOf(t, words, data)),
            aside: slotOf(progress, (data) => asideOf(t, data, experience.data)),
        },
        on: {
            setPublic: (isPublic) => {
                void visibility.trigger({ isPublic }).then((next) => cvLink.mutate(next, { revalidate: false }))
            },
            toggleLine: (itemId) => {
                const item = experience.data?.items.find((each) => each.itemId === itemId)
                if (item === undefined) return
                void show.trigger({ itemId, shownPublicly: !item.shownPublicly }).then(() => experience.mutate())
            },
            copyLine: (itemId, url) => {
                void navigator.clipboard.writeText(url).then(() => setCopiedId(itemId))
            },
            retry: () => {
                void profile.mutate()
                void cvLink.mutate()
                void experience.mutate()
                void progress.mutate()
            },
        },
    }
}
