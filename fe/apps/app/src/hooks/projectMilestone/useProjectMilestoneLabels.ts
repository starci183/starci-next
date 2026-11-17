"use client"

import { useTranslations } from "next-intl"
import { APP_ROUTES, projectPath } from "@/modules/routes"
import type { ProjectMilestoneLabels } from "@/modules/types"

type Translate = ReturnType<typeof useTranslations>

/** The ordered how-to-prove lines of the aside: only strings of the catalogue list are kept. */
const howOf = (t: Translate): ReadonlyArray<string> => {
    const raw: unknown = t.raw("milestone.how")
    return Array.isArray(raw) ? raw.filter((line): line is string => typeof line === "string") : []
}

/** The fixed words of the milestone page, from the catalogue of the active language. */
export const useProjectMilestoneLabels = (projectId: string): ProjectMilestoneLabels => {
    const t = useTranslations("app.projects")
    return {
        back: t("milestone.back"),
        eyebrow: t("pageTitle"),
        notFound: t("milestone.notFound"),
        notFoundText: t("milestone.notFoundText"),
        lockedTitle: t("milestone.locked"),
        lockedText: t("milestone.lockedText"),
        plans: t("milestone.plans"),
        conceptsLabel: t("milestone.conceptsLabel"),
        crumbRoot: t("milestone.crumbRoot"),
        crumbTrail: t("milestone.crumbTrail"),
        editTitle: t("milestone.editTitle"),
        lessonLink: t("milestone.lessonLink"),
        runsLabel: t("milestone.runsLabel"),
        runsEmpty: t("milestone.runsEmpty"),
        runsEmptyText: t("milestone.runsEmptyText"),
        howTitle: t("milestone.howTitle"),
        ciTitle: t("milestone.ciTitle"),
        ciText: t("milestone.ciText"),
        ciLink: t("milestone.ciLink"),
        closeLabel: t("milestone.closeLabel"),
        comingSoon: t("milestone.comingSoon"),
        questionLabel: t("milestone.questionLabel"),
        pointerTitle: t("milestone.pointerTitle"),
        location: t("milestone.location"),
        endpoint: t("milestone.endpoint"),
        savePointer: t("milestone.savePointer"),
        savingPointer: t("milestone.savingPointer"),
        explainTitle: t("milestone.explainTitle"),
        explainText: t("milestone.explainText"),
        excerpt: t("milestone.excerpt"),
        explanation: t("milestone.explanation"),
        explain: t("milestone.explain"),
        explaining: t("milestone.explaining"),
        backHref: projectPath(projectId),
        plansHref: APP_ROUTES.premium,
        crumbRootHref: APP_ROUTES.projects,
        columns: {
            concept: t("milestone.col.concept"),
            evidence: t("milestone.col.evidence"),
            result: t("milestone.col.result"),
            level: t("milestone.col.level"),
            when: t("milestone.col.when"),
        },
        how: howOf(t),
        ciHref: projectPath(projectId),
        sampleBody: t("milestone.sampleBody", { placeholder: "{{message}}" }),
    }
}
