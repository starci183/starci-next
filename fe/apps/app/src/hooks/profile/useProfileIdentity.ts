"use client"

import { useState } from "react"
import {
    usePutAvatarSwr,
    useMutateConfirmAvatarUploadSwr,
    useMutateRemoveAvatarSwr,
    useMutateRequestAvatarUploadSwr,
    useMutateSetProfileNameSwr,
    useQueryMyProfileSwr,
    type MyProfile,
} from "@/hooks/swr"
import type { ProfileIssue } from "@/hooks/profileWords"
import { avatarIssueOf, profileIssueOf, typeOfFile } from "./profile.shared"

/** What the identity part of the profile holds and does. */
export type ProfileIdentity = {
    /** The profile read; the name draft is not part of it. */
    readonly read: ReturnType<typeof useQueryMyProfileSwr>
    /** The name being typed, or undefined while the learner has not touched the field (the saved name shows). */
    readonly draft: string | undefined
    readonly setDraft: (value: string) => void
    readonly saveName: () => void
    readonly isSaving: boolean
    readonly isSaved: boolean
    readonly uploadAvatar: (file: File) => void
    readonly removeAvatar: () => void
    readonly isUploading: boolean
    readonly isRemoving: boolean
    readonly issue: ProfileIssue
}

/**
 * The name and the avatar of the signed-in learner. An avatar goes browser to object store on a signed address that fixes its type and
 * size: the file is checked against the limits first, the server signs, the browser sends the bytes, the server confirms what the
 * store holds. Each write answers the whole profile, which replaces the cached read without another round trip.
 */
export const useProfileIdentity = (locale: string): ProfileIdentity => {
    const read = useQueryMyProfileSwr(locale)
    const [draft, setDraft] = useState<string | undefined>(undefined)
    const [isSaved, setIsSaved] = useState(false)
    const [issue, setIssue] = useState<ProfileIssue>("none")
    const [isUploading, setIsUploading] = useState(false)
    const namer = useMutateSetProfileNameSwr()
    const requester = useMutateRequestAvatarUploadSwr()
    const confirmer = useMutateConfirmAvatarUploadSwr()
    const remover = useMutateRemoveAvatarSwr()
    const putter = usePutAvatarSwr()
    const keep = async (profile: MyProfile): Promise<void> => {
        await read.mutate(profile, { revalidate: false })
    }
    const saveName = async (): Promise<void> => {
        if (draft === undefined) return
        setIssue("none")
        setIsSaved(false)
        try {
            await keep(await namer.trigger({ displayName: draft.trim() === "" ? null : draft, locale }))
            setDraft(undefined)
            setIsSaved(true)
        } catch (error) {
            setIssue(profileIssueOf(error))
        }
    }
    const sendAvatar = async (file: File): Promise<void> => {
        const contentType = typeOfFile(file)
        try {
            const upload = await requester.trigger({ contentType, size: file.size })
            if (await putter.trigger({ target: upload, file })) {
                await keep(await confirmer.trigger({ key: upload.key, contentType, size: file.size, locale }))
            } else {
                setIssue("failed")
            }
        } catch (error) {
            setIssue(profileIssueOf(error))
        }
    }
    const uploadAvatar = async (file: File): Promise<void> => {
        const limits = read.data?.limits
        if (limits === undefined) return
        const refused = avatarIssueOf(file, limits)
        setIssue(refused)
        if (refused !== "none") return
        setIsUploading(true)
        await sendAvatar(file)
        setIsUploading(false)
    }
    const removeAvatar = async (): Promise<void> => {
        setIssue("none")
        try {
            await keep(await remover.trigger({ locale }))
        } catch (error) {
            setIssue(profileIssueOf(error))
        }
    }
    return {
        read,
        draft,
        setDraft: (value) => {
            setIsSaved(false)
            setDraft(value)
        },
        saveName: () => void saveName(),
        isSaving: namer.isMutating,
        isSaved,
        uploadAvatar: (file) => void uploadAvatar(file),
        removeAvatar: () => void removeAvatar(),
        isUploading,
        isRemoving: remover.isMutating,
        issue,
    }
}
