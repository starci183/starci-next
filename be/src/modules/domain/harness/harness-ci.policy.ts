import { isRecord } from "@modules/platform/primitives"
import { HarnessError, HarnessErrorCode } from "./errors/harness.error"

const RUN_ID = /^[\w.:-]{1,100}$/u
const COMMIT = /^[0-9a-f]{7,64}$/iu
const SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/u
const OWNER = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/u
const NAME = /^[A-Za-z0-9._-]{1,100}$/u
const RESULTS_MAX = 500

/** One e2e result a CI run reports for a build stage. */
export interface HarnessCiResult {
    /** The build id. */
    readonly build: string
    /** The stage id. */
    readonly stage: string
    /** The e2e test id. */
    readonly e2e: string
    /** Whether it passed. */
    readonly passed: boolean
}

/** The document the learner CLI posts from GitHub Actions to the harness door. */
export interface HarnessCiDocument {
    /** The CI run id, `<GITHUB_RUN_ID>` or `<GITHUB_RUN_ID>-<attempt>`. */
    readonly runId: string
    /** The commit it tested, lowercase. */
    readonly commit: string
    /** The e2e results. */
    readonly results: ReadonlyArray<HarnessCiResult>
}

/** What a CI delivery to the harness door carries. */
export interface HarnessCiDelivery {
    /** The binding id the workflow sends. */
    readonly bindingId: string | undefined
    /** The raw body, read as the result document. */
    readonly rawBody: Buffer | undefined
    /** The GitHub Actions OIDC token, or undefined. */
    readonly oidcToken: string | undefined
}

const invalid = (cause?: unknown): HarnessError => new HarnessError({ code: HarnessErrorCode.CiPayloadInvalid, cause })

const resultOf = (raw: unknown): HarnessCiResult => {
    if (!isRecord(raw)) throw invalid()
    const { build, stage, e2e, passed } = raw
    if (
        typeof build !== "string" ||
        !SLUG.test(build) ||
        typeof stage !== "string" ||
        !SLUG.test(stage) ||
        typeof e2e !== "string" ||
        !SLUG.test(e2e) ||
        typeof passed !== "boolean"
    ) {
        throw invalid()
    }
    return { build, stage, e2e, passed }
}

/** Reads the raw body of a delivery into the result document; anything else is HARNESS_CI_PAYLOAD_INVALID. */
export const harnessRunOf = (rawBody: Buffer | undefined): HarnessCiDocument => {
    let body: unknown
    try {
        body = JSON.parse(rawBody?.toString("utf8") ?? "")
    } catch (cause) {
        throw invalid(cause)
    }
    if (!isRecord(body)) throw invalid()
    const { runId, commit, harness } = body
    if (
        typeof runId !== "string" ||
        !RUN_ID.test(runId) ||
        typeof commit !== "string" ||
        !COMMIT.test(commit) ||
        !Array.isArray(harness) ||
        harness.length === 0 ||
        harness.length > RESULTS_MAX
    ) {
        throw invalid()
    }
    return { runId, commit: commit.toLowerCase(), results: harness.map((result: unknown) => resultOf(result)) }
}

/** The `owner/name` of a GitHub repository given as that or as a github.com address, or null when it is neither. */
export const repositoryOf = (text: string): string | null => {
    const trimmed = text
        .trim()
        .replace(/^https:\/\/github\.com\//iu, "")
        .replace(/\.git$/iu, "")
        .replace(/\/$/u, "")
    const [owner, name, ...rest] = trimmed.split("/")
    if (rest.length > 0 || owner === undefined || name === undefined) return null
    return OWNER.test(owner) && NAME.test(name) && name !== "." && name !== ".." ? `${owner}/${name}` : null
}
