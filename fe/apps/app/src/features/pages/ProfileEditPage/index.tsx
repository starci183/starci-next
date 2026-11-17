import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { ProfileEdit } from "@/components/blocks/ProfileEdit"
import type { ReactElement } from "react"

/** The document title of the page, from the catalog of the requested locale. */
export const profileEditMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.profile")
    return { title: t("edit.title") }
}

/** The profile editor page: a server owner that mounts the editor block. */
export const ProfileEditPage = (): ReactElement => <ProfileEdit />
