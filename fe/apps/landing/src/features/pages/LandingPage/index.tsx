import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { appUrl } from "@/modules/config"
import { LandingPageBase } from "./component"
import type { ReactElement } from "react"

/** The areas the landing names, in order; their words come from the catalog. */
const AREA_IDS = ["essentials", "projects", "harness"] as const

/** Where each area opens in the product app. */
const AREA_PATHS: Readonly<Record<(typeof AREA_IDS)[number], string>> = {
    essentials: "/essentials",
    projects: "/projects",
    harness: "/harness",
}

/** The document title of the landing page, from the catalog of the requested locale. */
export const landingMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("landing")
    return { title: t("title") }
}

/** The landing page, resolved on the server: its copy from the catalog and the origin of the product app from the config module. */
export const LandingPage = async (): Promise<ReactElement> => {
    const t = await getTranslations("landing.home")
    return (
        <LandingPageBase
            props={{
                title: t("title"),
                lede: t("lede"),
                openApp: t("openApp"),
                areasTitle: t("areasTitle"),
                areas: AREA_IDS.map((id) => ({
                    id,
                    title: t(`areas.${id}.title`),
                    description: t(`areas.${id}.description`),
                    href: `${appUrl()}${AREA_PATHS[id]}`,
                })),
                appHref: appUrl(),
            }}
        />
    )
}
