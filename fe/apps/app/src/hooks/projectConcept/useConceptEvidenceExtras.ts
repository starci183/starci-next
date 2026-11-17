"use client"

import { useLocale, useTranslations } from "next-intl"
import { useQueryProjectCodeReadSwr, useQueryProjectCvPreviewSwr } from "@/hooks/swr"
import type { CodeReadRubricRow, CvPreviewView } from "@/modules/types"

/** What the evidence door adds to a concept beyond the milestone read: the rubric of the AI code read and the CV line the concept earns. */
export type ConceptEvidenceExtras = {
    readonly rubric: ReadonlyArray<CodeReadRubricRow>
    readonly cv: CvPreviewView | undefined
}

/** The concept of one project the extras are read for. */
type ExtrasTarget = { readonly projectId: string; readonly conceptId: string }

/** The verdicts the back end names a criterion with. */
const VERDICTS = new Set<string>(["met", "partial", "missing"])

/** The rubric of the latest AI code read of the concept and the CV line it earns, read from the back end's `projectCodeRead` and `projectCvPreview`. */
export const useConceptEvidenceExtras = (target: ExtrasTarget): ConceptEvidenceExtras => {
    const t = useTranslations("app.projects.concept")
    const locale = useLocale()
    const codeRead = useQueryProjectCodeReadSwr({ ...target, locale })
    const cv = useQueryProjectCvPreviewSwr({
        projectId: target.projectId,
        conceptId: target.conceptId,
        milestoneId: null,
        locale,
    })
    const preview = cv.data
    return {
        rubric: (codeRead.data?.criteria ?? []).map((criterion) => ({
            id: criterion.criterionId,
            text: criterion.criterion,
            verdict: VERDICTS.has(criterion.verdict) ? (criterion.verdict as CodeReadRubricRow["verdict"]) : "missing",
        })),
        cv:
            preview === undefined || preview.text === null
                ? undefined
                : {
                      text: preview.text,
                      isProved: preview.proved,
                      evidence: t("cvEvidence", {
                          items: preview.evidence.map((link) => `${link.kind} · ${link.ref}`).join("; "),
                      }),
                  },
    }
}
