import { createHmac } from "node:crypto"
import type { CliIo } from "./relay-client.contracts"
import { isRecord, jsonOf } from "./json.mapper"

/** One result of a CI document, as the project-ci webhook reads it. */
export interface CiResultLine {
    /** The concept id. */
    readonly concept: string
    /** `test`, `e2e` or `probe`. */
    readonly slot: string
    /** The test name, e2e file or probe id. */
    readonly ref: string
    /** Whether it passed. */
    readonly passed: boolean
}

/** One harness line of a CI document: a build stage's e2e id and whether it passed. */
export interface CiHarnessLine {
    /** The build id. */
    readonly build: string
    /** The stage id. */
    readonly stage: string
    /** The e2e id. */
    readonly e2e: string
    /** Whether it passed. */
    readonly passed: boolean
}

/** The unsigned part of a CI delivery: what a run found. The run id and the commit come from the CI environment, never from the caller. */
export interface CiFindings {
    /** Whether the whole run passed. */
    readonly passed: boolean
    /** The concept results of a project run. */
    readonly results: ReadonlyArray<CiResultLine>
    /** The harness build lines, absent for a project run. */
    readonly harness?: ReadonlyArray<CiHarnessLine>
}

/** The environment names a CI report reads, and only these. Their values are used in the one request and never printed. */
const CI_ENV = {
    apiUrl: "STARCI_API_URL",
    project: "STARCI_PROJECT_ID",
    secret: "STARCI_CI_SECRET",
    runId: "GITHUB_RUN_ID",
    attempt: "GITHUB_RUN_ATTEMPT",
    sha: "GITHUB_SHA",
    oidcUrl: "ACTIONS_ID_TOKEN_REQUEST_URL",
    oidcToken: "ACTIONS_ID_TOKEN_REQUEST_TOKEN",
} as const

const COMMIT = /^[0-9a-f]{7,64}$/iu
const RUN_ID = /^[\w.:-]{1,100}$/u
const PROJECT_ID = /^[A-Za-z0-9._-]{1,100}$/u

/** The signature of the signed webhook: HMAC-SHA256 over `<timestamp>.<body>` with the project secret, as `sha256=<hex>`. */
export const ciSignature = (secret: string, timestamp: string, body: string): string =>
    `sha256=${createHmac("sha256", secret).update(timestamp).update(".").update(body).digest("hex")}`

/** Asks GitHub for the run's OIDC token (audience = the StarCi URL); undefined when the workflow has no `id-token: write` or GitHub did not answer. */
const oidcTokenOf = async (io: CliIo, audience: string): Promise<string | undefined> => {
    const url = io.ciEnv?.(CI_ENV.oidcUrl)
    const bearer = io.ciEnv?.(CI_ENV.oidcToken)
    if (url === undefined || url === "" || bearer === undefined || bearer === "") return undefined
    const separator = url.includes("?") ? "&" : "?"
    const answer = await io.download(`${url}${separator}audience=${encodeURIComponent(audience)}`, bearer)
    if (answer.status !== 200) return undefined
    const read = jsonOf(answer.bytes.toString("utf8"))
    const value = read.kind === "read" && isRecord(read.value) ? read.value.value : undefined
    return typeof value === "string" && value !== "" ? value : undefined
}

/**
 * The one CI report of the learner CLI, shared by every proof that rides the signed `POST /webhooks/project-ci` door (the Projects
 * milestones, the harness builds): it signs the document with the project's own secret exactly as the kit's `starci/report.mjs`
 * does, adds the GitHub Actions OIDC token as `x-starci-oidc` so StarCi can attest the run, and posts it. The run id and the commit
 * are the CI's own (`GITHUB_RUN_ID`-`GITHUB_RUN_ATTEMPT`, `GITHUB_SHA`). It prints counts, never a secret or a token.
 * Answers 0 when StarCi accepted the delivery.
 */
export const postCiReport = async (io: CliIo, findings: CiFindings): Promise<number> => {
    const read = (name: string): string | undefined => {
        const value = io.ciEnv?.(name)
        return value === undefined || value === "" ? undefined : value
    }
    const missing = [CI_ENV.apiUrl, CI_ENV.project, CI_ENV.secret, CI_ENV.runId, CI_ENV.sha].filter(
        (name) => read(name) === undefined,
    )
    if (missing.length > 0) {
        io.err(`ci-report needs these environment variables (names only): ${missing.join(", ")}.`)
        return 1
    }
    const apiUrl = (read(CI_ENV.apiUrl) ?? "").replace(/\/$/u, "")
    const project = read(CI_ENV.project) ?? ""
    const runId = `${read(CI_ENV.runId) ?? ""}-${read(CI_ENV.attempt) ?? "1"}`
    const commit = (read(CI_ENV.sha) ?? "").toLowerCase()
    if (!apiUrl.startsWith("https://") && !/^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/u.test(apiUrl)) {
        io.err("STARCI_API_URL must be an https:// URL.")
        return 1
    }
    if (!PROJECT_ID.test(project) || !RUN_ID.test(runId) || !COMMIT.test(commit)) {
        io.err("The CI project id, run id or commit is not well formed; nothing was sent.")
        return 1
    }
    const body = JSON.stringify({
        runId,
        commit,
        passed: findings.passed,
        results: findings.results,
        ...(findings.harness === undefined ? {} : { harness: findings.harness }),
    })
    const timestamp = String(io.now())
    const oidc = await oidcTokenOf(io, apiUrl)
    const answer = await io.fetch(`${apiUrl}/webhooks/project-ci`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "x-starci-project": project,
            "x-starci-timestamp": timestamp,
            "x-starci-signature": ciSignature(read(CI_ENV.secret) ?? "", timestamp, body),
            ...(oidc === undefined ? {} : { "x-starci-oidc": oidc }),
        },
        body,
    })
    const counted = findings.harness?.length ?? findings.results.length
    io.out(
        answer.status === 200
            ? `StarCi CI: ${counted} result(s) sent for run ${runId}, ${oidc === undefined ? "signed only (no OIDC token: add permissions id-token: write)" : "signed and attested by GitHub OIDC"}.`
            : `StarCi CI: the delivery was refused (HTTP ${answer.status}).`,
    )
    return answer.status === 200 ? 0 : 1
}
