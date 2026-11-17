"use client"

import { useProfileEdit } from "@/hooks/profile"
import { useDocumentTitle } from "@/hooks/title"
import { ProfileEditBase } from "./component"

/** The connected profile editor: avatar, display name and CV link, saved back to the profile. */
export const ProfileEdit = () => {
    const edit = useProfileEdit()
    useDocumentTitle(edit.pageTitle)
    return (
        <ProfileEditBase
            props={{
                labels: edit.labels,
                slotLabels: edit.slotLabels,
                identity: edit.identity,
                cvLink: edit.cvLink,
                accept: edit.accept,
                ...edit.state,
            }}
            on={edit.on}
        />
    )
}
