"use client"

import { useTranslations } from "next-intl"
import { useDocumentTitle } from "@/hooks/title"
import { APP_ROUTES } from "@/modules/routes"
import { ProjectsPitchBase, type PitchSampleRow } from "./component"

/** The three steps of the pitch: the keys of the catalogue, in order. */
const STEP_IDS = ["repo", "prove", "cv"] as const
/** What Premium adds to Projects: the keys of the catalogue, in order. */
const INCLUDED_IDS = ["many", "probes", "aiRead", "ci"] as const
/** The rows of the sample concept table: the keys of the catalogue, in order. */
const SAMPLE_IDS = ["lifecycle", "idempotency", "outbox"] as const

/** The tone of a sample row by its key. */
const SAMPLE_TONE: Readonly<Record<(typeof SAMPLE_IDS)[number], PitchSampleRow["stateTone"]>> = {
    lifecycle: "success",
    idempotency: "warning",
    outbox: "muted",
}

/** The connected pitch: words only, with the Subscribe action pointing at the plans. */
export const ProjectsPitch = () => {
    const t = useTranslations("app.projects.pitch")
    useDocumentTitle(t("title"))
    return (
        <ProjectsPitchBase
            props={{
                labels: {
                    title: t("title"),
                    description: t("description"),
                    subscribe: t("subscribe"),
                    subscribeHref: APP_ROUTES.premium,
                    stepsTitle: t("stepsTitle"),
                    steps: STEP_IDS.map((id) => ({ id, title: t(`steps.${id}.title`), text: t(`steps.${id}.text`) })),
                    sampleNote: t("sampleNote"),
                    conceptsTitle: t("conceptsTitle"),
                    columns: {
                        concept: t("columns.concept"),
                        evidence: t("columns.evidence"),
                        state: t("columns.state"),
                    },
                    cvTitle: t("cvTitle"),
                    includedTitle: t("includedTitle"),
                    included: INCLUDED_IDS.map((id) => ({
                        id,
                        title: t(`included.${id}.title`),
                        text: t(`included.${id}.text`),
                    })),
                    noTable: t("noTable"),
                },
                sample: SAMPLE_IDS.map((id) => ({
                    id,
                    concept: t(`sample.${id}.concept`),
                    slots: t(`sample.${id}.slots`),
                    state: t(`sample.${id}.state`),
                    stateTone: SAMPLE_TONE[id],
                })),
                cv: { role: t("cv.role"), badge: t("cv.badge"), text: t("cv.text"), evidence: t("cv.evidence") },
            }}
        />
    )
}
