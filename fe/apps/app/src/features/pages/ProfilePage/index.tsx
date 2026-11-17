import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { ProfileExperience } from "@/components/blocks/ProfileExperience"
import type { ReactElement } from "react"

/** The document title of the page, from the catalog of the requested locale. */
export const profileMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.experience.profile")
    return { title: t("pageTitle") }
}

/** The profile page (Profile): a server owner that mounts the verified experience list. */
export const ProfilePage = (): ReactElement => <ProfileExperience />
