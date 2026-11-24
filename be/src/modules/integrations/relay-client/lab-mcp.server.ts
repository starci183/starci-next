import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js"
import { z } from "zod"
import {
    allowedConceptsOf,
    allowedSetOf,
    explainOf,
    NOT_YET,
    type ConceptGraphRead,
    type ConceptNode,
} from "./concept-graph.policy"
import type { CaseEvent } from "@modules/platform/relay-protocol"
import type { CasesRun } from "./lab-case.cli"
import type { CaseEventSent } from "./lab-case-upload.cli"
import {
    caseStatusesOf,
    caseStatusOf,
    hintOf,
    hintsOpenedOf,
    HINT_LEVELS,
    inspectUrlOf,
    type HintLedger,
} from "./lab-case.policy"
import { caseOf, casesOf, type LabCase, type LabManifest } from "./lab-manifest.policy"
import { scenarioCasesOf } from "./scenario-report.policy"

/**
 * The lab MCP: a stdio MCP server (`starci-relay mcp`) the learner adds to their editor's assistant (Claude Code, Cursor, Codex) for
 * the lab they stand in. It is generic: every lesson-specific word comes from the lab's `starci-lab.yaml` and the concept graph.
 *
 * What it must never do, and how each is held:
 * - Never reveal the ladder (the reference fix of each case), `main` or the grader: the tools answer from `caseViewOf` and the stack
 *   fields only, which pick fields one by one; `ref`, `ladder`, `grader` and `framework` are never read here. A spec plants markers in
 *   those fields and checks no tool answer carries one.
 * - Never give a hint early: `hint` opens levels strictly in order and records each opening (the count goes with a submission).
 * - Never call anything but the lab's own read-only views: `inspect` calls only a url `mcp.inspect` declares, on a loopback host,
 *   with id-shaped values, and follows no redirect.
 * - Never name a concept the lesson has not reached (the REF RULE): `explain` answers only the allowed set, and the server's
 *   instructions and `lesson_context` tell the assistant to keep to it.
 */

/** What the server needs from the machine; injected so a spec runs no tests, no network and no file writes. */
export interface LabMcpDeps {
    /** The lab's parsed manifest. */
    readonly manifest: LabManifest
    /** The concept graph read for this lab, or null when the lab has none. */
    readonly concepts: ConceptGraphRead | null
    /** Runs a case and every case before it, quietly, and uploads its `case.result`. */
    readonly runCase: (item: LabCase) => Promise<CasesRun & { readonly upload: CaseEventSent }>
    /** Uploads a case event (a hint opened) through the offline queue. */
    readonly sendEvent: (event: CaseEvent) => Promise<CaseEventSent>
    /** The lab's last JUnit report and when it was written, or null. */
    readonly readReport: () => { readonly xml: string; readonly writtenAt: string } | null
    /** The hint levels opened so far. */
    readonly readHints: () => HintLedger
    /** Records the hint levels opened. */
    readonly writeHints: (ledger: HintLedger) => void
    /** GETs a loopback url: its status and text. Status 0 means no answer. */
    readonly get: (url: string) => Promise<{ readonly status: number; readonly text: string }>
    /** The current instant (ISO), stamped on the events. */
    readonly now: () => string
    /** The relay version, the server's version. */
    readonly version: string
}

/** The most text an inspect answer carries; a view is a small JSON document, and a huge one would flood the assistant's context. */
export const INSPECT_TEXT_MAX = 20_000

const json = (value: unknown): CallToolResult => ({ content: [{ type: "text", text: JSON.stringify(value, null, 2) }] })
const refused = (text: string): CallToolResult => ({ isError: true, content: [{ type: "text", text }] })

const readOnly = { readOnlyHint: true, openWorldHint: false } as const

/**
 * The assistant's view of a case: an explicit pick of the fields a learner may see. Built field by field (never by spreading the
 * case and deleting) so a field added to the manifest later stays out until it is added here on purpose.
 */
const caseViewOf = (item: LabCase): Record<string, unknown> => ({
    id: item.id,
    kind: item.kind,
    title: item.title,
    chaos: item.chaos ?? null,
    invariants: item.invariants,
    ...(item.kind === "unhappy"
        ? {
              teaches: item.teaches,
              hintLevels: item.hints.length,
              explain: item.mcp.explain,
              inspect: item.mcp.inspect,
          }
        : {}),
})

/** The allowed concepts of the lab, or null when the graph is missing or unreadable (said so by `allowedNoteOf`). */
const allowedOf = (deps: LabMcpDeps): ReadonlyArray<ConceptNode> | null =>
    deps.concepts?.kind === "read" ? allowedConceptsOf(deps.concepts.graph, deps.manifest.concept) : null

/** Why there is no allowed set, in words an assistant can pass on. */
const allowedNoteOf = (deps: LabMcpDeps): string =>
    deps.concepts === null
        ? "The concept graph of this lab is missing (.starci/concepts.yaml, or --concepts <file>). Name only the lesson's own concept."
        : deps.concepts.kind === "invalid"
          ? `The concept graph of this lab is unreadable: ${deps.concepts.problem}. Name only the lesson's own concept.`
          : ""

/**
 * The server's instructions: how to help with this lab, and the REF RULE in words the model keeps to. The allowed terms are listed
 * in the instructions themselves, not only in a tool answer, because a client loads instructions before the first tool call.
 */
export const labMcpInstructionsOf = (manifest: LabManifest, allowed: ReadonlyArray<ConceptNode> | null): string => {
    const words =
        allowed === null || allowed.length === 0
            ? manifest.concept
            : allowed.map((node) => [node.term, ...node.keywords].join(", ")).join("; ")
    return [
        `StarCi lab ${manifest.lab}, lesson ${manifest.lessonId} (concept: ${manifest.concept}).`,
        `The learner edits one file: ${manifest.learnerFile}. Help them reason about it; do not write the whole fix for them.`,
        "Start with lesson_context, then case_list. case_run runs a case and every case before it; case_status says which invariant failed, with expected and actual.",
        "inspect reads the running stack's own views (only the ones the lab declares). hint opens hint levels one at a time, in order; ask the learner before opening one, because every level opened is recorded.",
        `REF RULE: name only these concepts and their words: ${words}. Never name, suggest or tease any other concept (a pattern, a tool or a technique the lesson has not reached), even when it would fix the case faster. explain answers "${NOT_YET}" for any other term; when it does, do not explain the term yourself.`,
    ].join("\n")
}

/** Builds the lab MCP server over its dependencies. */
export const labMcpServerOf = (deps: LabMcpDeps): McpServer => {
    const { manifest } = deps
    const allowed = allowedOf(deps)
    const server = new McpServer(
        { name: `starci-lab-${manifest.lab}`, version: deps.version },
        { instructions: labMcpInstructionsOf(manifest, allowed) },
    )
    const caseIds = casesOf(manifest).map((item) => item.id)
    const CASE_ID = z
        .string()
        .min(1)
        .max(64)
        .describe(`A case id of this lab: ${caseIds.join(", ")}`)
    const unknown = (id: string): CallToolResult => refused(`No case ${id}. Cases: ${caseIds.join(", ")}`)

    server.registerTool(
        "lesson_context",
        {
            title: "Lesson context",
            description:
                "The lab the learner works in: its lesson and concept, the services and dependencies of the stack, the one file the learner edits, every case in teaching order, the read-only views inspect may call, and the concepts you may name (the REF RULE).",
            inputSchema: {},
            annotations: readOnly,
        },
        () =>
            json({
                lab: manifest.lab,
                lessonId: manifest.lessonId,
                concept: manifest.concept,
                learnerFile: manifest.learnerFile,
                stack: {
                    language: manifest.stack.language,
                    runtime: manifest.stack.runtime,
                    test: manifest.stack.test,
                    services: manifest.stack.services,
                    deps: manifest.stack.deps,
                },
                cases: casesOf(manifest).map((item) => caseViewOf(item)),
                inspect: manifest.mcp.inspect.map((view) => ({ id: view.id, url: view.url })),
                allowedConcepts: allowed === null ? [] : allowedSetOf(allowed),
                rule:
                    allowed === null
                        ? allowedNoteOf(deps)
                        : "Name only the allowedConcepts and their keywords. Any other concept is not taught yet: do not name it.",
            }),
    )

    server.registerTool(
        "case_list",
        {
            title: "Cases",
            description:
                "Every case in teaching order (happy first, then unhappy), with its state in the last test run (green, red, not-run) and the hint levels opened.",
            inputSchema: {},
            annotations: readOnly,
        },
        () => {
            const report = deps.readReport()
            const hints = deps.readHints()
            const statuses = caseStatusesOf(casesOf(manifest), report?.xml ?? null)
            return json({
                reportWrittenAt: report?.writtenAt ?? null,
                cases: casesOf(manifest).map((item, index) => ({
                    id: item.id,
                    kind: item.kind,
                    title: item.title,
                    state: statuses[index]?.state ?? "not-run",
                    hintsOpened: hints[item.id] ?? 0,
                })),
            })
        },
    )

    server.registerTool(
        "case_run",
        {
            title: "Run a case",
            description:
                "Runs the lab's tests for this case and every case before it (a fix must not break an earlier case), then answers each one's state, failing invariant and expected/actual.",
            inputSchema: { id: CASE_ID },
            annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        },
        async ({ id }) => {
            const item = caseOf(manifest, id)
            if (item === undefined) return unknown(id)
            const run = await deps.runCase(item)
            return json({
                id,
                exitCode: run.exitCode,
                durationMs: run.durationMs,
                cases: run.statuses,
                reported: run.upload,
            })
        },
    )

    server.registerTool(
        "case_status",
        {
            title: "Case status",
            description:
                "What the last test run says about one case: green, red or not-run, the failing tests, the invariant that broke, and expected/actual from the failing assertion. Runs nothing.",
            inputSchema: { id: CASE_ID },
            annotations: readOnly,
        },
        ({ id }) => {
            if (caseOf(manifest, id) === undefined) return unknown(id)
            const report = deps.readReport()
            return json({
                reportWrittenAt: report?.writtenAt ?? null,
                ...caseStatusOf(report === null ? [] : scenarioCasesOf(report.xml), id),
            })
        },
    )

    server.registerTool(
        "inspect",
        {
            title: "Inspect the running stack",
            description: `Reads one read-only view of the learner's running stack. Views: ${
                manifest.mcp.inspect.map((view) => `${view.id} (${view.url})`).join("; ") || "none"
            }. Fill each {placeholder} through params, e.g. {"orderId": "o-1"}.`,
            inputSchema: {
                id: z.string().min(1).max(64).describe("The view id"),
                params: z.record(z.string(), z.string()).default({}).describe("The values of the url's placeholders"),
            },
            annotations: { readOnlyHint: true, openWorldHint: false },
        },
        async ({ id, params }) => {
            const filled = inspectUrlOf(manifest, id, params)
            if (filled.kind === "unknown-view")
                return refused(`No view ${id}. Views: ${manifest.mcp.inspect.map((view) => view.id).join(", ")}`)
            if (filled.kind === "bad-params")
                return refused(
                    `Params: missing ${filled.missing.join(", ") || "none"}; not id-shaped ${filled.invalid.join(", ") || "none"}.`,
                )
            const answer = await deps.get(filled.url)
            if (answer.status === 0) return refused(`${filled.url} did not answer. Is the lab's stack up?`)
            return json({ url: filled.url, status: answer.status, body: answer.text.slice(0, INSPECT_TEXT_MAX) })
        },
    )

    server.registerTool(
        "hint",
        {
            title: "Hint",
            description: `Opens hint level 1 to ${HINT_LEVELS} of an unhappy case, strictly in order; an open level is shown again for free. Every level opened is recorded and reported with the learner's submission, so ask the learner first.`,
            inputSchema: { caseId: CASE_ID, level: z.number().int().min(1).max(HINT_LEVELS) },
            annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        },
        async ({ caseId, level }) => {
            const item = caseOf(manifest, caseId)
            if (item === undefined) return unknown(caseId)
            const answer = hintOf(item, level, deps.readHints())
            if (answer.kind === "no-hints") return refused(`${caseId} is a happy case; it has no hints.`)
            if (answer.kind === "out-of-range") return refused(`Levels are 1 to ${HINT_LEVELS}.`)
            if (answer.kind === "locked") return refused(`Open level ${answer.next} first.`)
            if (answer.kind === "unlocked") {
                // Recorded here first, then reported: the local record is what keeps levels in order even while offline.
                deps.writeHints(answer.ledger)
                await deps.sendEvent({
                    type: "case.hint",
                    lessonId: manifest.lessonId,
                    caseId,
                    level: answer.level as 1 | 2 | 3,
                    at: deps.now(),
                })
            }
            const opened = answer.kind === "unlocked" ? answer.ledger : deps.readHints()
            return json({ caseId, level: answer.level, hint: answer.text, hintsOpened: hintsOpenedOf(opened) })
        },
    )

    server.registerTool(
        "explain",
        {
            title: "Explain a term",
            description: `Explains a concept or keyword from the concept graph, only within what this lesson has reached; any other term answers "${NOT_YET}".`,
            inputSchema: { term: z.string().min(1).max(100) },
            annotations: readOnly,
        },
        ({ term }) => {
            if (allowed === null) return refused(allowedNoteOf(deps))
            const answer = explainOf(allowed, term)
            return answer.kind === "explained" ? json(answer) : json({ term, answer: NOT_YET })
        },
    )

    return server
}
