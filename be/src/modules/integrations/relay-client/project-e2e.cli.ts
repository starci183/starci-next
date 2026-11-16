import { existsSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { parse } from "yaml"
import {
    CheckFlowRunner,
    FetchFlowTransport,
    flowOfMarkdown,
    LocalFlowSink,
    systemFlowClock,
    type FlowVerdict,
} from "@modules/platform/check-flow"
import { eachInOrder, isRecord } from "@modules/platform/primitives"
import type { CliIo } from "./relay-client.contracts"
import { readProjectFile } from "./project-kit.adapter"

/** The folder of the StarCi e2e flows in a learner's project. */
export const E2E_FOLDER = "starci/e2e"

/** What `starci/project.yaml` declares for the e2e flows: the base address and each concept's endpoint and sample body. */
export interface KitDeclarations {
    /** `start.baseUrl`, or null. */
    readonly baseUrl: string | null
    /** concept id → `{ endpoint, body }`. */
    readonly endpoints: Readonly<Record<string, { readonly endpoint: string | null; readonly body: string | null }>>
}

/** One e2e flow run: the concept, the file and the verdict. */
export interface E2eRun {
    /** The concept. */
    readonly conceptId: string
    /** The flow file, relative to the project. */
    readonly file: string
    /** What the flow concluded. */
    readonly verdict: FlowVerdict
}

const textOrNull = (value: unknown): string | null => (typeof value === "string" && value !== "" ? value : null)

/** Reads the e2e declarations of `starci/project.yaml`; an unreadable file declares nothing. */
export const kitDeclarationsOf = (text: string): KitDeclarations => {
    let document: unknown
    try {
        document = parse(text) as unknown
    } catch {
        return { baseUrl: null, endpoints: {} }
    }
    if (!isRecord(document)) return { baseUrl: null, endpoints: {} }
    const start = document["start"]
    const endpoints = document["endpoints"]
    return {
        baseUrl: isRecord(start) ? (textOrNull(start["baseUrl"])?.replace(/\/$/u, "") ?? null) : null,
        endpoints: isRecord(endpoints)
            ? Object.fromEntries(
                  Object.entries(endpoints).map(([concept, entry]) => [
                      concept,
                      isRecord(entry)
                          ? { endpoint: textOrNull(entry["endpoint"]), body: textOrNull(entry["body"]) }
                          : { endpoint: null, body: null },
                  ]),
              )
            : {},
    }
}

/** The concepts that have an e2e flow file in the project, among the ones asked for (all of them when none is named). */
const flowConceptsOf = (cwd: string, concepts: ReadonlyArray<string> | null): ReadonlyArray<string> => {
    const folder = join(cwd, E2E_FOLDER)
    if (!existsSync(folder)) return []
    const present = readdirSync(folder)
        .filter((name) => name.endsWith(".md"))
        .map((name) => name.slice(0, -3))
        .sort((a, b) => a.localeCompare(b))
    return concepts === null ? present : present.filter((id) => concepts.includes(id))
}

/**
 * Runs the StarCi e2e flows of the project (`starci/e2e/<concept>.md`, the same check-flow language and interpreter as the server
 * probes) against `start.baseUrl`, with each concept's declared endpoint and body. Every request stays on that address; an outbox flow
 * gets a sink on 127.0.0.1. A file that does not parse is reported as skipped, never run.
 */
export const runE2eFlows = async (
    io: CliIo,
    cwd: string,
    concepts: ReadonlyArray<string> | null,
): Promise<ReadonlyArray<E2eRun>> => {
    const declarations = kitDeclarationsOf(readProjectFile(cwd, "starci/project.yaml") ?? "")
    const ids = flowConceptsOf(cwd, concepts)
    if (ids.length === 0) return []
    if (declarations.baseUrl === null || !/^https?:\/\//u.test(declarations.baseUrl)) {
        io.err("starci/project.yaml has no start.baseUrl (http or https): the e2e flows were not run.")
        return []
    }
    const base = declarations.baseUrl
    const sink = new LocalFlowSink()
    const runner = new CheckFlowRunner({
        transport: new FetchFlowTransport({ timeoutMs: 10_000, maxBytes: 262_144 }),
        sink,
        clock: systemFlowClock,
    })
    const runs: Array<E2eRun> = []
    try {
        await eachInOrder(ids, async (conceptId) => {
            const file = `${E2E_FOLDER}/${conceptId}.md`
            const parsed = flowOfMarkdown(readProjectFile(cwd, file) ?? "")
            const declared = declarations.endpoints[conceptId]
            const verdict: FlowVerdict = parsed.ok
                ? await runner.run(parsed.flow, {
                      base,
                      endpoint: declared?.endpoint ?? null,
                      sample: declared?.body ?? null,
                      runId: `e2e-${io.ids()}`,
                  })
                : { status: "skipped", reason: "flow-invalid", facts: { issues: parsed.issues.length } }
            runs.push({ conceptId, file, verdict })
        })
    } finally {
        await sink.stop()
    }
    return runs
}

/** The line a run prints for one e2e flow. */
export const e2eLineOf = (run: E2eRun): string =>
    `  ${run.conceptId} (e2e): ${run.verdict.status} ${run.verdict.reason}`
