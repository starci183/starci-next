import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { ProfileHub } from "@/components/blocks/ProfileHub"
import type { ReactElement } from "react"

/** The document title of the page, from the catalog of the requested locale. */
export const profileMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.profile")
    return { title: t("pageTitle") }
}

/** The profile page (Profile): a server owner that mounts the identity, CV lines, verify links and account panels. */
export const ProfilePage = (): ReactElement => <ProfileHub />
