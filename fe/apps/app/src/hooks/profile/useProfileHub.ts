"use client"

import { useFormatter, useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { useSession } from "@/hooks/auth"
import { useExperienceWords } from "@/hooks/experience"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import {
    useQueryMcpTokensSwr,
    useQueryMyExperienceSwr,
    useQueryMyPremiumSwr,
    useQueryRelayDevicesSwr,
} from "@/hooks/swr"
import type { DataSlot, ProfileHubLabels, ProfileHubViews } from "@/modules/types"
import { cvOf, devicesOf, planOf, tokensOf, verifyLinksOf } from "@/hooks/profileViews"
import { labelsOf, profileIssueWordsOf } from "@/hooks/profileWords"
import { useOrigin } from "./useOrigin"
import { useProfileIdentity } from "./useProfileIdentity"

/** What the profile page is drawn from and the commands it sends. */
export type ProfileHubState = {
    readonly pageTitle: string
    readonly labels: ProfileHubLabels
    readonly accept: string
    readonly views: ProfileHubViews
    readonly state: {
        readonly isSaving: boolean
        readonly isSaved: boolean
        readonly isUploading: boolean
        readonly isRemoving: boolean
    }
    readonly slotLabels: ReturnType<ReturnType<typeof useSlotLabels>>
    readonly on: {
        readonly changeName: (value: string) => void
        readonly saveName: () => void
        readonly uploadAvatar: (file: File) => void
        readonly removeAvatar: () => void
        readonly copyLink: (itemId: string, url: string) => void
        readonly retry: () => void
    }
}

/** What one slot is read from: the answer of a read that may still be loading or failed. */
type SlotSource<T> = { readonly data: T | undefined; readonly error: unknown; readonly isLoading: boolean }

/** The slot of one read, worded by `map` once it settles. */
const slotOf = <T, U>(read: SlotSource<T>, map: (data: T) => U): DataSlot<U> => mapSlot(slotOfSwr(read), map)

/** The connected profile: identity, verified CV lines, public verify links and the account panels, worded in the reader language. */
export const useProfileHub = (): ProfileHubState => {
    const t = useTranslations("app.profile")
    const format = useFormatter()
    const locale = useLocale()
    const words = useExperienceWords()
    const session = useSession()
    const isSignedIn = session.status === "signed-in"
    const origin = useOrigin()
    const [copiedId, setCopiedId] = useState<string | undefined>(undefined)
    const identity = useProfileIdentity(locale)
    const experience = useQueryMyExperienceSwr(undefined)
    const devices = useQueryRelayDevicesSwr(isSignedIn)
    const tokens = useQueryMcpTokensSwr(isSignedIn)
    const premium = useQueryMyPremiumSwr(isSignedIn)
    const limits = identity.read.data?.limits ?? {
        maxBytes: 2 * 1024 * 1024,
        contentTypes: ["image/png", "image/jpeg", "image/webp"],
        nameMax: 60,
    }
    const accountName = session.session?.displayName ?? session.session?.email ?? ""
    return {
        pageTitle: t("pageTitle"),
        labels: labelsOf(t, profileIssueWordsOf(t, identity.issue, limits), limits.maxBytes),
        accept: limits.contentTypes.join(","),
        slotLabels: useSlotLabels()(t("cv.empty")),
        views: {
            identity: slotOf(identity.read, (data) => ({
                shownName: data.displayName ?? (accountName === "" ? t("identity.nameLabel") : accountName),
                nameValue: identity.draft ?? data.displayName ?? "",
                avatarUrl: data.avatarUrl,
                goalTitle: data.goal?.title ?? null,
                canSaveName: identity.draft !== undefined && identity.draft !== (data.displayName ?? ""),
            })),
            cv: slotOf(experience, (data) => cvOf(t, words, locale, data)),
            verify: slotOf(experience, (data) => verifyLinksOf({ data, locale, origin, copiedId })),
            devices: slotOf(devices, (list) => devicesOf(t, format, list)),
            tokens: slotOf(tokens, (connection) => tokensOf(t, format, connection)),
            plan: slotOf(premium, (data) => planOf(t, words, data)),
        },
        state: {
            isSaving: identity.isSaving,
            isSaved: identity.isSaved,
            isUploading: identity.isUploading,
            isRemoving: identity.isRemoving,
        },
        on: {
            changeName: identity.setDraft,
            saveName: identity.saveName,
            uploadAvatar: identity.uploadAvatar,
            removeAvatar: identity.removeAvatar,
            copyLink: (itemId, url) => {
                void navigator.clipboard.writeText(url).then(() => setCopiedId(itemId))
            },
            retry: () => {
                void identity.read.mutate()
                void experience.mutate()
            },
        },
    }
}
