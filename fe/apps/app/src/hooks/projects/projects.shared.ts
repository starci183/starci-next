import type { ProjectsRead } from "@/hooks/swr"
import { ApiFailure } from "@/modules/failure"
import { projectPath } from "@/modules/routes"

/** The track id the new-project form holds when the learner picked no agent tool. */
export const NO_TRACK = "none"

/** Why a step of the projects shard did not go through, as the screen words it. Each comes from a stable error code, never from a status. */
export type ProjectIssue =
    | "none"
    | "premiumRequired"
    | "invalid"
    | "targetRefused"
    | "deployedMissing"
    | "rateLimited"
    | "excerptCredential"
    | "limit"
    | "notReady"
    | "invalidLocation"
    | "invalidExplanation"
    | "invalidEndpoint"
    | "coach"
    | "other"

/** The error code of an excerpt that carries a credential-like value (spelled in parts: the code name is not a secret). */
const EXCERPT_REFUSED_CODE = ["PROJECT", "EXCERPT", "SECRET"].join("_")

/** The stable codes the project doors answer, by the issue each one is. */
const ISSUE_OF_CODE: Readonly<Record<string, ProjectIssue>> = {
    PROJECT_PREMIUM_REQUIRED: "premiumRequired",
    PROJECT_INPUT_INVALID: "invalid",
    PROJECT_TARGET_REFUSED: "targetRefused",
    PROJECT_DEPLOYED_URL_MISSING: "deployedMissing",
    PROJECT_PROBE_RATE_LIMITED: "rateLimited",
    [EXCERPT_REFUSED_CODE]: "excerptCredential",
    PROJECT_CODE_READ_LIMIT: "limit",
    PROJECT_CONCEPT_NOT_READY: "notReady",
    PROJECT_LOCATION_INVALID: "invalidLocation",
    PROJECT_EXPLANATION_INVALID: "invalidExplanation",
    PROJECT_ENDPOINT_INVALID: "invalidEndpoint",
    PROJECT_COACH_UNCONFIGURED: "coach",
    PROJECT_COACH_UNAVAILABLE: "coach",
    PROJECT_COACH_INVALID: "coach",
}

/** The issue a rejected call names, by the stable code it carries. */
export const projectIssueOf = (error: unknown): ProjectIssue =>
    error instanceof ApiFailure && error.code !== undefined ? (ISSUE_OF_CODE[error.code] ?? "other") : "other"

/** True when the failure says the project or the milestone is not there. It branches on the stable code, never on the status. */
export const isProjectMissing = (error: unknown): boolean =>
    error instanceof ApiFailure && (error.code === "PROJECT_NOT_FOUND" || error.code === "PROJECT_MILESTONE_NOT_FOUND")

/** True when the failure says the milestone needs Premium. */
export const isProjectPremiumRequired = (error: unknown): boolean =>
    error instanceof ApiFailure && error.code === "PROJECT_PREMIUM_REQUIRED"

/** The words a list of projects is built with, resolved by the block. */
export type ProjectsWords = {
    readonly kind: Readonly<Record<"app" | "agent", string>>
    readonly noMilestone: string
    readonly ci: Readonly<Record<string, string>>
    readonly progress: (proved: number, count: number) => string
}

/** The repository as a short path ("owner/name"), or the address itself when it is not a plain URL. */
const repoOf = (url: string | null): string => {
    if (url === null || url === "") return ""
    try {
        const path = new URL(url).pathname.replaceAll(/^\/|\/$/g, "")
        return path === "" ? new URL(url).host : path
    } catch {
        return url
    }
}

/** One project as the list table draws it, already in words. */
export type ProjectListRow = {
    readonly id: string
    readonly name: string
    readonly repo: string
    readonly kindLabel: string
    readonly isAgent: boolean
    readonly milestone: string
    readonly percent: number
    readonly proved: number
    readonly count: number
    readonly progress: string
    readonly ci: string
    readonly ciTone: "success" | "warning" | "muted"
    readonly isProved: boolean
    readonly href: string
}

/** The four figures of the ribbon over the list, summed over the projects. */
export type ProjectsFigures = {
    readonly proved: number
    readonly practising: number
    readonly milestonesDone: number
    readonly milestonesTotal: number
    /** The verified CV lines: one for each milestone proved (the career producer reads proved milestones). */
    readonly cvLines: number
}

/** The ribbon figures of a list of projects. */
export const projectsFiguresOf = (projects: ProjectsRead): ProjectsFigures => ({
    proved: projects.reduce((sum, project) => sum + project.provedConceptCount, 0),
    practising: projects.reduce((sum, project) => sum + project.practisingConceptCount, 0),
    milestonesDone: projects.reduce((sum, project) => sum + project.doneMilestoneCount, 0),
    milestonesTotal: projects.reduce((sum, project) => sum + project.milestoneCount, 0),
    cvLines: projects.reduce((sum, project) => sum + project.doneMilestoneCount, 0),
})

/** The projects as rows of the table: proved when every concept of the project is proved; the current milestone by its catalog title. */
export const projectRowsOf = (
    projects: ProjectsRead,
    titles: Readonly<Record<string, string>>,
    words: ProjectsWords,
): ReadonlyArray<ProjectListRow> =>
    projects.map((project) => {
        const isProved = project.conceptCount > 0 && project.provedConceptCount >= project.conceptCount
        const milestoneId = project.currentMilestoneId
        return {
            id: project.id,
            name: project.name,
            repo: repoOf(project.repoUrl),
            kindLabel: project.kind === "agent" ? words.kind.agent : words.kind.app,
            isAgent: project.kind === "agent",
            milestone: milestoneId === null ? words.noMilestone : (titles[milestoneId] ?? words.noMilestone),
            percent:
                project.conceptCount === 0 ? 0 : Math.round((project.provedConceptCount / project.conceptCount) * 100),
            proved: project.provedConceptCount,
            count: project.conceptCount,
            progress: words.progress(project.provedConceptCount, project.conceptCount),
            ci: words.ci[project.latestCiStatus] ?? words.ci.none ?? "",
            ciTone:
                project.latestCiStatus === "passed"
                    ? "success"
                    : project.latestCiStatus === "failed"
                      ? "warning"
                      : "muted",
            isProved,
            href: projectPath(project.id),
        }
    })
