"use client"

import { navigation } from "@starci-next/i18n/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { useSession } from "@/hooks/auth"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import {
    useMutateChooseOutcomePathSwr,
    useMutateSetCvVisibilitySwr,
    useQueryMyCvLinkSwr,
    useQueryOutcomePathsSwr,
} from "@/hooks/swr"
import { cvLinkOf } from "@/hooks/profileViews"
import { labelsOf, profileIssueWordsOf } from "@/hooks/profileWords"
import { APP_ROUTES } from "@/modules/routes"
import type { DataSlot, ProfileCvLinkView, ProfileHubLabels, ProfileIdentityView } from "@/modules/types"
import { PROFILE_SAVED_KEY } from "./profile.shared"
import { useOrigin } from "./useOrigin"
import { useProfileIdentity } from "./useProfileIdentity"

/** The goal path field: its words, the paths to pick from and the one chosen now. */
export type ProfileEditGoal = {
    readonly label: string
    readonly hint: string
    readonly placeholder: string
    readonly options: ReadonlyArray<{ readonly id: string; readonly label: string }>
    readonly value: string | null
    readonly isLoading: boolean
}

/** What the editor is drawn from and the commands it sends. */
export type ProfileEditState = {
    readonly pageTitle: string
    readonly labels: ProfileHubLabels
    readonly accept: string
    readonly identity: DataSlot<ProfileIdentityView>
    readonly cvLink: DataSlot<ProfileCvLinkView>
    /** The identity again for the name section; hidden when the identity failed, so the page draws one failure notice. */
    readonly nameIdentity: DataSlot<ProfileIdentityView>
    readonly goal: ProfileEditGoal
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
        readonly changeGoal: (value: string | null) => void
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
    const paths = useQueryOutcomePathsSwr(locale)
    const chooseGoal = useMutateChooseOutcomePathSwr()
    const [goalDraft, setGoalDraft] = useState<string | null | undefined>(undefined)
    const activeGoal = paths.data?.activePathId ?? null
    const goalValue = goalDraft === undefined ? activeGoal : goalDraft
    const [isRemoveOpen, setIsRemoveOpen] = useState(false)
    const limits = identity.read.data?.limits ?? {
        maxBytes: 2 * 1024 * 1024,
        contentTypes: ["image/png", "image/jpeg", "image/webp"],
        nameMax: 60,
    }
    const identitySlot = mapSlot(slotOfSwr(identity.read), (data) => {
        const name = identity.draft ?? data.displayName ?? ""
        return {
            shownName: data.displayName ?? "",
            nameValue: name,
            email: session.session?.email ?? "",
            avatarUrl: data.avatarUrl,
            avatarName: session.session?.email ?? "",
            goalTitle: data.goal?.title ?? null,
            canSaveName: identity.draft !== undefined && identity.draft !== (data.displayName ?? ""),
            isNew: false,
            nameCount: `${name.length}/${limits.nameMax}`,
        }
    })
    // One failure notice per page: when the identity failed, the name and the CV link are not drawn.
    const isIdentityFailed = "isError" in identitySlot
    const back = (): void => router.push(APP_ROUTES.profile)
    return {
        pageTitle: t("edit.title"),
        labels: {
            ...labelsOf(t, profileIssueWordsOf(t, identity.issue, limits), limits.maxBytes),
            editMeta: identity.draft !== undefined || goalDraft !== undefined ? t("edit.unsaved") : t("edit.clean"),
        },
        accept: limits.contentTypes.join(","),
        slotLabels: useSlotLabels()(t("cv.emptyWays"), { title: t("edit.errorTitle"), text: t("edit.errorText") }),
        identity: identitySlot,
        nameIdentity: isIdentityFailed ? { isForbidden: true } : identitySlot,
        cvLink: isIdentityFailed ? { isForbidden: true } : mapSlot(slotOfSwr(cvLink), (data) => cvLinkOf(origin, data)),
        goal: {
            label: t("edit.goal.label"),
            hint: t("edit.goal.goalHint"),
            placeholder: t("edit.goal.placeholder"),
            options: (paths.data?.paths ?? []).map((path) => ({ id: path.pathId, label: path.title })),
            value: goalValue,
            isLoading: paths.data === undefined && paths.error === undefined,
        },
        state: {
            isSaving: identity.isSaving,
            isUploading: identity.isUploading,
            isRemoving: identity.isRemoving,
            canSave: !identity.isUploading,
            isRemoveOpen,
        },
        on: {
            changeName: identity.setDraft,
            changeGoal: setGoalDraft,
            save: () => {
                void identity.saveName().then(async (isSaved) => {
                    if (!isSaved) return
                    if (goalDraft !== undefined && goalDraft !== null && goalDraft !== activeGoal) {
                        try {
                            await chooseGoal.trigger({ pathId: goalDraft })
                            await paths.mutate()
                        } catch {
                            return
                        }
                    }
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
