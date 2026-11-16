"use client"

import { useTranslations } from "next-intl"
import { projectsEvidenceFixtures } from "@/modules/config"
import type { CodeReadRubricRow, CvPreviewView } from "@/modules/types"

/** What the evidence door adds to a concept beyond the milestone read: the rubric of the AI code read and the CV line the concept earns. */
export type ConceptEvidenceExtras = {
    readonly rubric: ReadonlyArray<CodeReadRubricRow>
    readonly cv: CvPreviewView | undefined
}

/** What the page shows while the evidence door gives nothing: no rubric and no CV line. */
const NONE: ConceptEvidenceExtras = { rubric: [], cv: undefined }

/** What the fixture is built for: the concept, the project and the run the evidence line cites. */
type FixtureFor = { readonly concept: string; readonly project: string }

/**
 * The extras of one concept. The back end's evidence door (lane projects-10) owns the rubric and the CV line and has not published
 * them yet, so this is the one seam: it answers the typed fixture when the build asks for fixtures and nothing otherwise. When the
 * door exists, only this hook changes.
 */
export const useConceptEvidenceExtras = (target: FixtureFor): ConceptEvidenceExtras => {
    const t = useTranslations("app.projects.concept.fixture")
    if (!projectsEvidenceFixtures()) return NONE
    return {
        rubric: [
            { id: "database", text: t("rubric.database"), verdict: "pass" },
            { id: "replay", text: t("rubric.replay"), verdict: "pass" },
            { id: "expiry", text: t("rubric.expiry"), verdict: "partial" },
        ],
        cv: {
            role: t("cv.role"),
            text: t("cv.text", { concept: target.concept, project: target.project }),
            evidence: t("cv.evidence"),
        },
    }
}
