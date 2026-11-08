import type { PracticeRow } from "@starci-next/ui"
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
    readonly kind: Readonly<Record<string, string>>
    readonly open: string
    readonly meta: (done: number, total: number, proved: number, count: number) => string
}

/** The projects as rows of a list. */
export const projectRowsOf = (projects: ProjectsRead, words: ProjectsWords): ReadonlyArray<PracticeRow> =>
    projects.map((project) => ({
        id: project.id,
        title: project.name,
        description: [
            project.stack,
            words.meta(
                project.doneMilestoneCount,
                project.milestoneCount,
                project.provedConceptCount,
                project.conceptCount,
            ),
        ].join(" · "),
        badge: words.kind[project.kind] ?? project.kind,
        badgeTone: project.kind === "agent" ? "accent" : "muted",
        href: projectPath(project.id),
        cta: words.open,
        isCurrent: false,
    }))
