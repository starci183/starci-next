"use client"

import { navigation } from "@starci-next/i18n/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { useSession } from "@/hooks/auth"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useMutateSetCvVisibilitySwr, useQueryMyCvLinkSwr } from "@/hooks/swr"
import { cvLinkOf } from "@/hooks/profileViews"
import { labelsOf, profileIssueWordsOf } from "@/hooks/profileWords"
import { APP_ROUTES } from "@/modules/routes"
import type { DataSlot, ProfileCvLinkView, ProfileHubLabels, ProfileIdentityView } from "@/modules/types"
import { PROFILE_SAVED_KEY } from "./profile.shared"
import { useOrigin } from "./useOrigin"
import { useProfileIdentity } from "./useProfileIdentity"

/** What the editor is drawn from and the commands it sends. */
export type ProfileEditState = {
    readonly pageTitle: string
    readonly labels: ProfileHubLabels
    readonly accept: string
    readonly identity: DataSlot<ProfileIdentityView>
    readonly cvLink: DataSlot<ProfileCvLinkView>
    readonly slotLabels: ReturnType<ReturnType<typeof useSlotLabels>>
    readonly state: {
        readonly isSaving: boolean
        readonly isUploading: boolean
        readonly isRemoving: boolean
        readonly canSave: boolean
        readonly isRemoveOpen: boolean
    }
    readonly on: {
        readonly changeName: (value: string) => void
        readonly save: () => void
        readonly cancel: () => void
        readonly uploadAvatar: (file: File) => void
        readonly askRemove: () => void
        readonly cancelRemove: () => void
        readonly confirmRemove: () => void
        readonly setPublic: (isPublic: boolean) => void
        readonly retry: () => void
    }
}

/** The editor of the profile: the avatar goes to the store on its own, the name waits for Save, which returns to the profile. */
export const useProfileEdit = (): ProfileEditState => {
    const t = useTranslations("app.profile")
    const locale = useLocale()
    const session = useSession()
    const router = navigation.useRouter()
    const origin = useOrigin()
    const identity = useProfileIdentity(locale)
    const cvLink = useQueryMyCvLinkSwr()
    const visibility = useMutateSetCvVisibilitySwr()
    const [isRemoveOpen, setIsRemoveOpen] = useState(false)
    const limits = identity.read.data?.limits ?? {
        maxBytes: 2 * 1024 * 1024,
        contentTypes: ["image/png", "image/jpeg", "image/webp"],
        nameMax: 60,
    }
    const accountName = session.session?.displayName ?? session.session?.email ?? ""
    const back = (): void => router.push(APP_ROUTES.profile)
    return {
        pageTitle: t("edit.title"),
        labels: labelsOf(t, profileIssueWordsOf(t, identity.issue, limits), limits.maxBytes),
        accept: limits.contentTypes.join(","),
        slotLabels: useSlotLabels()(t("cv.empty")),
        identity: mapSlot(slotOfSwr(identity.read), (data) => {
            const name = identity.draft ?? data.displayName ?? ""
            return {
                shownName: data.displayName ?? accountName,
                nameValue: name,
                email: session.session?.email ?? "",
                avatarUrl: data.avatarUrl,
                goalTitle: data.goal?.title ?? null,
                canSaveName: identity.draft !== undefined && identity.draft !== (data.displayName ?? ""),
                isNew: false,
                nameCount: `${name.length}/${limits.nameMax}`,
            }
        }),
        cvLink: mapSlot(slotOfSwr(cvLink), (data) => cvLinkOf(origin, data)),
        state: {
            isSaving: identity.isSaving,
            isUploading: identity.isUploading,
            isRemoving: identity.isRemoving,
            canSave: !identity.isUploading,
            isRemoveOpen,
        },
        on: {
            changeName: identity.setDraft,
            save: () => {
                void identity.saveName().then((isSaved) => {
                    if (!isSaved) return
                    try {
                        window.sessionStorage.setItem(PROFILE_SAVED_KEY, "1")
                    } catch {
                        // Without session storage the profile just shows no notice.
                    }
                    back()
                })
            },
            cancel: back,
            uploadAvatar: identity.uploadAvatar,
            askRemove: () => setIsRemoveOpen(true),
            cancelRemove: () => setIsRemoveOpen(false),
            confirmRemove: () => {
                setIsRemoveOpen(false)
                identity.removeAvatar()
            },
            setPublic: (isPublic) => {
                void visibility.trigger({ isPublic }).then((next) => cvLink.mutate(next, { revalidate: false }))
            },
            retry: () => {
                void identity.read.mutate()
                void cvLink.mutate()
            },
        },
    }
}
