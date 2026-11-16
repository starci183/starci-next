"use client"

import { useTranslations } from "next-intl"
import { APP_ROUTES, projectMilestonePath, projectPath } from "@/modules/routes"
import type { ProjectConceptLabels } from "@/modules/types"

/** The fixed words of the concept evidence page, from the catalogue of the active language. */
export const useProjectConceptLabels = (projectId: string, milestoneId: string): ProjectConceptLabels => {
    const t = useTranslations("app.projects")
    const c = useTranslations("app.projects.concept")
    return {
        crumbTrail: t("milestone.crumbTrail"),
        crumbRoot: t("milestone.crumbRoot"),
        crumbRootHref: APP_ROUTES.projects,
        projectHref: projectPath(projectId),
        milestoneHref: projectMilestonePath(projectId, milestoneId),
        notFound: c("notFound"),
        notFoundText: c("notFoundText"),
        back: c("back"),
        slotsTitle: c("slotsTitle"),
        probeTitle: c("probeTitle"),
        probeOn: c("probeOn"),
        probeEmpty: c("probeEmpty"),
        probeRun: c("probeRun"),
        probeRunning: c("probeRunning"),
        probeNoDeploy: c("probeNoDeploy"),
        ciTitle: c("ciTitle"),
        ciEmpty: c("ciEmpty"),
        ciRun: c("ciRun"),
        ciCommit: c("ciCommit"),
        ciVerdict: c("ciVerdict"),
        ciWhen: c("ciWhen"),
        codeTitle: c("codeTitle"),
        codeEmpty: c("codeEmpty"),
        rubricTitle: c("rubricTitle"),
        rubricEmpty: c("rubricEmpty"),
        verdict: { pass: c("verdict.pass"), partial: c("verdict.partial"), fail: c("verdict.fail") },
        cvTitle: c("cvTitle"),
        cvEmpty: c("cvEmpty"),
        cvVerified: c("cvVerified"),
        cvNote: c("cvNote"),
        askClaude: c("askClaude"),
        askClaudeHref: APP_ROUTES.connect,
        lesson: c("lesson"),
        questionLabel: t("milestone.questionLabel"),
        pointerTitle: t("milestone.pointerTitle"),
        location: t("milestone.location"),
        endpoint: t("milestone.endpoint"),
        sampleBody: t("milestone.sampleBody", { placeholder: "{{message}}" }),
        savePointer: t("milestone.savePointer"),
        savingPointer: t("milestone.savingPointer"),
        explainTitle: t("milestone.explainTitle"),
        explainText: t("milestone.explainText"),
        excerpt: t("milestone.excerpt"),
        explanation: t("milestone.explanation"),
        explain: t("milestone.explain"),
        explaining: t("milestone.explaining"),
        comingSoon: t("milestone.comingSoon"),
    }
}
