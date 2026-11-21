"use client"

import { useTranslations } from "next-intl"
import { useDocumentTitle } from "@/hooks/title"
import { staticsBase } from "@/modules/config"
import { APP_ROUTES } from "@/modules/routes"
import { ProjectsPitchBase } from "./component"

/** The three steps of the pitch: the keys of the catalogue, in order. */
const STEP_IDS = ["repo", "prove", "cv"] as const
/** What Premium adds to Projects: the keys of the catalogue, in order. */
const INCLUDED_IDS = ["many", "probes", "aiRead", "ci"] as const

/** The connected pitch: words only, with the Subscribe action pointing at the plans. */
export const ProjectsPitch = () => {
    const t = useTranslations("app.projects.pitch")
    useDocumentTitle(t("title"))
    return (
        <ProjectsPitchBase
            props={{
                staticsBaseUrl: staticsBase(),
                labels: {
                    title: t("title"),
                    description: t("description"),
                    subscribe: t("subscribe"),
                    subscribeHref: APP_ROUTES.premium,
                    premiumNote: t("premiumNote"),
                    stepsTitle: t("stepsTitle"),
                    steps: STEP_IDS.map((id) => ({ id, title: t(`steps.${id}.title`), text: t(`steps.${id}.text`) })),
                    includedTitle: t("includedTitle"),
                    included: INCLUDED_IDS.map((id) => ({
                        id,
                        title: t(`included.${id}.title`),
                        text: t(`included.${id}.text`),
                    })),
                },
            }}
        />
    )
}
