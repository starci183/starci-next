"use client"

import { useProfileHub } from "@/hooks/profile"
import { useDocumentTitle } from "@/hooks/title"
import { ProfileHubBase } from "./component"

/** The connected profile: identity, verified CV lines, public verify links and the account panels. */
export const ProfileHub = () => {
    const hub = useProfileHub()
    useDocumentTitle(hub.pageTitle)
    return (
        <ProfileHubBase
            props={{
                labels: hub.labels,
                slotLabels: hub.slotLabels,
                views: hub.views,
                accept: hub.accept,
                isSaving: hub.state.isSaving,
                isSaved: hub.state.isSaved,
                isUploading: hub.state.isUploading,
                isRemoving: hub.state.isRemoving,
            }}
            on={hub.on}
        />
    )
}
