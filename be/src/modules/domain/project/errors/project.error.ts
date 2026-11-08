import { DomainError, type ErrorKind } from "@modules/platform/errors"

/** Codes of the project capability (the Projects shard). */
export enum ProjectErrorCode {
    /** The learner owns no project with this id. */
    NotFound = "PROJECT_NOT_FOUND",
    /** No milestone of the catalog has this id. */
    MilestoneNotFound = "PROJECT_MILESTONE_NOT_FOUND",
    /** The concept is not in the catalog of milestones. */
    ConceptNotFound = "PROJECT_CONCEPT_NOT_FOUND",
    /** The concept has no Essentials lesson yet (being written by the teacher), so it cannot be graded or proved. */
    ConceptNotReady = "PROJECT_CONCEPT_NOT_READY",
    /** A second project, a milestone past the free ones or an AI code read needs Premium. */
    PremiumRequired = "PROJECT_PREMIUM_REQUIRED",
    /** A field of the project is missing, too long or not one of the allowed values. */
    InputInvalid = "PROJECT_INPUT_INVALID",
    /** The code location is not a relative path inside the repo, or points at a secret-like file. */
    LocationInvalid = "PROJECT_LOCATION_INVALID",
    /** The explanation is not 2 to 3 sentences of the allowed length. */
    ExplanationInvalid = "PROJECT_EXPLANATION_INVALID",
    /** The endpoint of a concept is not `METHOD /path`, or its sample body is not JSON of the allowed size. */
    EndpointInvalid = "PROJECT_ENDPOINT_INVALID",
    /** The URL is not a public http or https address a probe may call (no private, loopback or link-local range). */
    TargetRefused = "PROJECT_TARGET_REFUSED",
    /** The project declares no deployed URL to probe. */
    DeployedUrlMissing = "PROJECT_DEPLOYED_URL_MISSING",
    /** The excerpt holds a secret-like value; it is not sent to the AI and must be rotated. */
    ExcerptSecret = "PROJECT_EXCERPT_SECRET",
    /** The learner used every AI code read of the day. */
    CodeReadLimit = "PROJECT_CODE_READ_LIMIT",
    /** The project was probed too often in the last hour. */
    ProbeRateLimited = "PROJECT_PROBE_RATE_LIMITED",
    /** The signature or the project of a CI delivery does not match. */
    CiSignatureInvalid = "PROJECT_CI_SIGNATURE_INVALID",
    /** The CI delivery is older or newer than the replay window. */
    CiStale = "PROJECT_CI_STALE",
    /** The GitHub repository is not `owner/name` as GitHub spells one. */
    RepositoryInvalid = "PROJECT_REPOSITORY_INVALID",
    /** The CI delivery is not the signed result document. */
    CiPayloadInvalid = "PROJECT_CI_PAYLOAD_INVALID",
    /** The AI pool is not declared, so a code read is not graded. */
    CoachUnconfigured = "PROJECT_COACH_UNCONFIGURED",
    /** The AI pool did not answer. */
    CoachUnavailable = "PROJECT_COACH_UNAVAILABLE",
    /** The AI answered something that is not a grade. */
    CoachInvalid = "PROJECT_COACH_INVALID",
}

/** How each project code travels. */
export const PROJECT_ERROR_KINDS: Record<ProjectErrorCode, ErrorKind> = {
    [ProjectErrorCode.NotFound]: "not-found",
    [ProjectErrorCode.MilestoneNotFound]: "not-found",
    [ProjectErrorCode.ConceptNotFound]: "not-found",
    [ProjectErrorCode.ConceptNotReady]: "conflict",
    [ProjectErrorCode.PremiumRequired]: "forbidden",
    [ProjectErrorCode.InputInvalid]: "invalid",
    [ProjectErrorCode.LocationInvalid]: "invalid",
    [ProjectErrorCode.ExplanationInvalid]: "invalid",
    [ProjectErrorCode.EndpointInvalid]: "invalid",
    [ProjectErrorCode.TargetRefused]: "invalid",
    [ProjectErrorCode.DeployedUrlMissing]: "invalid",
    [ProjectErrorCode.ExcerptSecret]: "invalid",
    [ProjectErrorCode.CodeReadLimit]: "rate-limited",
    [ProjectErrorCode.ProbeRateLimited]: "rate-limited",
    [ProjectErrorCode.CiSignatureInvalid]: "unauthenticated",
    [ProjectErrorCode.RepositoryInvalid]: "invalid",
    [ProjectErrorCode.CiStale]: "unauthenticated",
    [ProjectErrorCode.CiPayloadInvalid]: "invalid",
    [ProjectErrorCode.CoachUnconfigured]: "unavailable",
    [ProjectErrorCode.CoachUnavailable]: "unavailable",
    [ProjectErrorCode.CoachInvalid]: "internal",
}

/** The one error class of the project capability. */
export class ProjectError extends DomainError<ProjectErrorCode> {}
