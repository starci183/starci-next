"use client"

import { useLocale, useTranslations } from "next-intl"
import { isProjectMissing, useProjectActions, type ProjectIssue } from "@/hooks/projects"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryProjectSwr, type ProjectRead } from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import { APP_ROUTES, projectMilestonePath } from "@/modules/routes"
import { PROJECT_DETAIL_PLACEHOLDER, ProjectDetailBase } from "./component"
import type { ProjectDetailView } from "./types"

type Translate = ReturnType<typeof useTranslations>

/** The words of the refusal of the last command; empty for none. */
const issueWordsOf = (t: Translate, issue: ProjectIssue): string => {
    switch (issue) {
        case "none":
            return ""
        case "targetRefused":
            return t("detail.error.targetRefused")
        case "deployedMissing":
            return t("detail.error.deployedMissing")
        case "rateLimited":
            return t("detail.error.rateLimited")
        case "premiumRequired":
        case "invalid":
        case "excerptCredential":
        case "limit":
        case "notReady":
        case "invalidLocation":
        case "invalidExplanation":
        case "invalidEndpoint":
        case "coach":
        case "other":
            return t("detail.error.other")
    }
}

/** The tone of the badge of a milestone by its state. */
const toneOf = (state: string): "success" | "accent" | "muted" => {
    if (state === "done") return "success"
    return state === "in-progress" ? "accent" : "muted"
}

/** The words of a probe result: its name, the reason code in words and the facts the reason names. */
const probeWordsOf = (t: Translate, probe: ProjectRead["lastProbeRun"]): ProjectDetailView["probes"] =>
    (probe?.results ?? []).map((result) => {
        const reason = t(`reason.${result.reason}`, {
            ...Object.fromEntries(result.facts.map((fact) => [fact.key, fact.value])),
            placeholder: "{{message}}",
        })
        return {
            id: `${result.conceptId ?? "deployment"}:${result.probeId}`,
            isPassed: result.passed,
            text: `${result.probeId}: ${reason}`,
        }
    })

/** The project as it is drawn, from the read. */
const viewOf = (t: Translate, project: ProjectRead): ProjectDetailView => {
    const { lastCiRun: ci, lastProbeRun: probe } = project
    return {
        eyebrow: t(`kind.${project.kind}`),
        title: project.name,
        description: project.topic,
        facts: [project.stack, project.language],
        repo: project.repoUrl ?? "",
        milestones: project.milestones.map((milestone) => ({
            id: milestone.id,
            title: milestone.title,
            description: t("detail.milestoneMeta", { proved: milestone.provedCount, count: milestone.conceptCount }),
            badge: milestone.locked ? t("detail.locked") : t(`detail.milestoneState.${milestone.state}`),
            badgeTone: milestone.locked ? "neutral" : toneOf(milestone.state),
            href: projectMilestonePath(project.id, milestone.id),
            cta: t("list.open"),
            isCurrent: milestone.id === project.currentMilestoneId,
        })),
        progress: t("detail.progress", { proved: project.provedConceptCount, count: project.conceptCount }),
        practising:
            project.practisingConceptCount === 0
                ? ""
                : t("detail.practising", { count: project.practisingConceptCount }),
        ciLine: ci === null ? t("detail.ciNone") : t("detail.ciRun", { runId: ci.runId, commit: ci.commit }),
        ciPassed: ci?.passed,
        deployedUrl: project.deployedUrl ?? "",
        probeLine: probe === null ? t("detail.probeNone") : probe.url,
        probePassed: probe?.passed,
        probes: probeWordsOf(t, probe),
    }
}

/** What the route hands the project block: the segment of the address. */
type ProjectDetailProps = { readonly projectId: string }

/** The connected project screen: reads the project and its proof, and runs the commands of practice, proof and the CI secret. */
export const ProjectDetail = (props: ProjectDetailProps) => {
    const t = useTranslations("app.projects")
    const read = useQueryProjectSwr({ projectId: props.projectId, locale: useLocale() })
    const actions = useProjectActions(props.projectId, () => void read.mutate())
    useDocumentTitle(read.data === undefined ? undefined : `${read.data.name} · ${t("pageTitle")}`)
    return (
        <ProjectDetailBase
            props={{
                slot: mapSlot(slotOfSwr(read), (project) => viewOf(t, project)),
                placeholder: PROJECT_DETAIL_PLACEHOLDER,
                slotLabels: useSlotLabels()(t("empty")),
                isNotFound: isProjectMissing(read.error),
                fields: {
                    deployed: actions.deployedDraft ?? read.data?.deployedUrl ?? "",
                    secret: actions.secret,
                    issueWords: issueWordsOf(t, actions.issue),
                },
                busy: {
                    isSaving: actions.isSaving,
                    isProbing: actions.isProbing,
                    isSyncing: actions.isSyncing,
                    isRotating: actions.isRotating,
                },
                labels: {
                    back: t("detail.back"),
                    backHref: APP_ROUTES.projects,
                    notFound: t("detail.notFound"),
                    notFoundText: t("detail.notFoundText"),
                    repo: t("detail.repo"),
                    milestones: t("detail.milestones"),
                    milestoneIntro: t("detail.milestoneIntro"),
                    syncTitle: t("detail.syncTitle"),
                    syncText: t("detail.syncText"),
                    sync: t("detail.sync"),
                    syncing: t("detail.syncing"),
                    ciTitle: t("detail.ciTitle"),
                    probeTitle: t("detail.probeTitle"),
                    probeText: t("detail.probeText"),
                    deployedLabel: t("detail.deployedLabel"),
                    saveDeployed: t("detail.saveDeployed"),
                    runProbes: t("detail.runProbes"),
                    runningProbes: t("detail.runningProbes"),
                    secretTitle: t("detail.secretTitle"),
                    secretText: t("detail.secretText"),
                    rotate: t("detail.rotate"),
                    rotating: t("detail.rotating"),
                    newSecret: t("detail.newSecret"),
                    copy: t("new.copy"),
                    copied: t("new.copied"),
                    layoutTitle: t("detail.layoutTitle"),
                    layoutTree: t("detail.layoutTree"),
                    layoutTests: t("detail.layoutTests"),
                    layoutTestsText: t("detail.layoutTestsText"),
                    layoutFlow: t("detail.layoutFlow"),
                    passed: t("detail.ciPassed"),
                    failed: t("detail.ciFailed"),
                },
            }}
            on={{
                retry: () => void read.mutate(),
                deployed: actions.setDeployedDraft,
                saveDeployed: actions.saveDeployed,
                runProbes: actions.runProbes,
                sync: actions.sync,
                rotate: actions.rotate,
            }}
        />
    )
}
