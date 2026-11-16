import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import type { CliIo } from "./relay-client.contracts"
import { postCiReport, type CiResultLine } from "./ci-report.cli"
import { junitCasesOf } from "./junit.policy"
import { e2eLineOf, kitDeclarationsOf, runE2eFlows } from "./project-e2e.cli"
import { readProjectFile } from "./project-kit.adapter"

const TAG = /\[([a-z0-9-]+)\]/gu
const REF_MAX = 300
const RESULTS_MAX = 500

/** What the project `ci-report` is told by its flags. */
export interface CiReportOptions {
    /** The folder of the JUnit XML reports. */
    readonly reports: string
    /** Whether the StarCi e2e flows run against `start.baseUrl`. */
    readonly e2e: boolean
    /** Seconds to wait for `start.baseUrl` to answer before the flows run. */
    readonly waitS: number
}

const xmlFilesUnder = (folder: string): ReadonlyArray<string> =>
    readdirSync(folder).flatMap((name) => {
        const full = join(folder, name)
        if (statSync(full).isDirectory()) return xmlFilesUnder(full)
        return name.endsWith(".xml") ? [full] : []
    })

/** One result per tagged test name and concept: a test counts once, failed if any of its runs failed; skipped tests do not count. */
export const testResultsOf = (xmls: ReadonlyArray<string>): ReadonlyArray<CiResultLine> => {
    const byKey = new Map<string, CiResultLine>()
    xmls.flatMap((xml) => junitCasesOf(xml))
        .filter((test) => !test.skipped)
        .forEach((test) => {
            ;[...test.name.matchAll(TAG)].forEach((tag) => {
                const concept = String(tag[1])
                const key = `${concept}\u0000${test.name}`
                const known = byKey.get(key)
                byKey.set(key, {
                    concept,
                    slot: "test",
                    ref: test.name.slice(0, REF_MAX),
                    passed: (known?.passed ?? true) && test.passed,
                })
            })
        })
    return [...byKey.values()]
}

/** Waits until the base address answers anything, up to the given seconds. */
const waitForBase = async (io: CliIo, base: string, waitS: number): Promise<boolean> => {
    const deadline = io.now() + waitS * 1000
    let answered = false
    while (!answered && io.now() < deadline) {
        answered = (await io.download(base, undefined)).status > 0
        if (!answered) await io.sleep(1000)
    }
    return answered
}

/**
 * `npx @starci/next ci-report [--reports <dir>] [--e2e] [--wait <s>]` in a project's GitHub Actions run: reads the JUnit XML (tests
 * tagged `[concept]`), runs the StarCi e2e flows against the service the workflow started when `--e2e` is given, and sends them
 * through the one signed CI report (`postCiReport`) with the run's GitHub OIDC token. StarCi verifies the token against GitHub's
 * keys; only an attested run is proof, a signed-only one is practice. Only test and e2e results are sent: probe proof is the server's.
 */
export const projectCiReport = async (io: CliIo, options: CiReportOptions, cwd: string): Promise<number> => {
    const folder = join(cwd, options.reports)
    const xmls = existsSync(folder) ? xmlFilesUnder(folder).map((file) => readFileSync(file, "utf8")) : []
    if (xmls.length === 0) io.err(`ci-report: no JUnit XML under ${options.reports}; the test step must write it.`)
    const results: Array<CiResultLine> = [...testResultsOf(xmls)]
    if (options.e2e) {
        const base = kitDeclarationsOf(readProjectFile(cwd, "starci/project.yaml") ?? "").baseUrl
        if (base !== null && (await waitForBase(io, base, options.waitS))) {
            const flows = await runE2eFlows(io, cwd, null)
            flows.forEach((flow) => io.out(e2eLineOf(flow)))
            flows
                .filter((flow) => flow.verdict.status === "passed" || flow.verdict.status === "failed")
                .forEach((flow) =>
                    results.push({
                        concept: flow.conceptId,
                        slot: "e2e",
                        ref: flow.file,
                        passed: flow.verdict.status === "passed",
                    }),
                )
        } else io.err("ci-report: the service at start.baseUrl did not answer; the e2e flows were not run.")
    }
    const sent = results.slice(0, RESULTS_MAX)
    return postCiReport(io, { passed: sent.length > 0 && sent.every((result) => result.passed), results: sent })
}
