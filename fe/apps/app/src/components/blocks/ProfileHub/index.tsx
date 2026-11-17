"use client"

import { useTranslations } from "next-intl"
import { useProfileHub } from "@/hooks/profile"
import { useDocumentTitle } from "@/hooks/title"
import { ProfileHubBase } from "./component"

/** The connected profile: identity, CV link, verified CV lines, account rows and the quick progress, worded in the reader language. */
export const ProfileHub = () => {
    const hub = useProfileHub()
    const t = useTranslations("app.profile")
    useDocumentTitle(hub.pageTitle)
    return (
        <ProfileHubBase
            props={{
                labels: hub.labels,
                slotLabels: hub.slotLabels,
                views: hub.views,
                metaLine: hub.metaLine,
                isNew: hub.isNew,
                isSaved: hub.isSaved,
                isCvLinkBusy: hub.isCvLinkBusy,
                devicesCount: (count) => t("account.devices.count", { count }),
            }}
            on={hub.on}
        />
    )
}
