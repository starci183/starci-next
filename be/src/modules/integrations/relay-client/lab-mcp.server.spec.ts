import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import type { CaseEvent } from "@modules/platform/relay-protocol"
import { conceptGraphOf } from "./concept-graph.policy"
import { caseStatusOf, type HintLedger } from "./lab-case.policy"
import { labManifestOf, type LabManifest } from "./lab-manifest.policy"
import { CONCEPTS_YAML, LEAK_MARKER, manifestYaml, reportXml, WALLET_FAILURE } from "./lab-manifest.testing"
import { labMcpServerOf, type LabMcpDeps } from "./lab-mcp.server"
import { scenarioCasesOf } from "./scenario-report.policy"

const MANIFEST = ((): LabManifest => {
    const read = labManifestOf(manifestYaml())
    if (read.kind !== "read") throw new Error(read.problems.join("\n"))
    return read.manifest
})()

const REPORT = reportXml([
    { name: "[case:checkout-in-stock] confirms the order" },
    { name: "[case:checkout-slow-net] confirms the order on a slow network" },
    { name: "[case:out-of-stock] [invariant:money-back] gives the money back", failure: WALLET_FAILURE },
])

/** A lab MCP over fakes: the report above, an in-memory hint record, recorded events and GETs. */
const harnessOf = (
    concepts: LabMcpDeps["concepts"] = conceptGraphOf(CONCEPTS_YAML),
): {
    readonly deps: LabMcpDeps
    readonly events: Array<CaseEvent>
    readonly gets: Array<string>
    readonly ran: Array<string>
} => {
    const events: Array<CaseEvent> = []
    const gets: Array<string> = []
    const ran: Array<string> = []
    let hints: HintLedger = {}
    const deps: LabMcpDeps = {
        manifest: MANIFEST,
        concepts,
        runCase: (item) => {
            ran.push(item.id)
            const tests = scenarioCasesOf(REPORT)
            return Promise.resolve({
                exitCode: 1,
                ranAt: "2026-11-25T08:00:00.000Z",
                durationMs: 10,
                learnerCommit: null,
                statuses: ["checkout-in-stock", "checkout-slow-net", "out-of-stock"].map((id) =>
                    caseStatusOf(tests, id),
                ),
                upload: "sent" as const,
            })
        },
        sendEvent: (event) => {
            events.push(event)
            return Promise.resolve("sent")
        },
        now: () => "2026-11-25T08:00:00.000Z",
        readReport: () => ({ xml: REPORT, writtenAt: "2026-11-25T07:59:00.000Z" }),
        readHints: () => hints,
        writeHints: (ledger) => {
            hints = ledger
        },
        get: (url) => {
            gets.push(url)
            return Promise.resolve({ status: 200, text: '{"balance":3800000}' })
        },
        version: "0.0.0-spec",
    }
    return { deps, events, gets, ran }
}

const connect = async (deps: LabMcpDeps): Promise<Client> => {
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair()
    await labMcpServerOf(deps).connect(serverSide)
    const client = new Client({ name: "spec", version: "1.0.0" })
    await client.connect(clientSide)
    return client
}

/** The text of a tool answer. */
const call = async (
    client: Client,
    name: string,
    args: Record<string, unknown> = {},
): Promise<{ text: string; isError: boolean }> => {
    const result = await client.callTool({ name, arguments: args })
    const content = result.content as ReadonlyArray<{ type: string; text?: string }>
    return { text: content.map((item) => item.text ?? "").join(""), isError: result.isError === true }
}

describe("the lab MCP", () => {
    it("offers exactly the seven lab tools", async () => {
        const client = await connect(harnessOf().deps)

        expect((await client.listTools()).tools.map((tool) => tool.name).sort()).toEqual([
            "case_list",
            "case_run",
            "case_status",
            "explain",
            "hint",
            "inspect",
            "lesson_context",
        ])
    })

    it("never reveals a ladder ref, the grader or the framework map in any answer, its tool list or its instructions", async () => {
        const client = await connect(harnessOf().deps)
        const answers = await Promise.all([
            call(client, "lesson_context"),
            call(client, "case_list"),
            call(client, "case_run", { id: "out-of-stock" }),
            call(client, "case_status", { id: "out-of-stock" }),
            call(client, "inspect", { id: "wallet", params: { customerId: "c-minh" } }),
            call(client, "hint", { caseId: "out-of-stock", level: 1 }),
            call(client, "explain", { term: "saga" }),
        ])

        expect(answers.every((answer) => !answer.isError)).toBe(true)
        expect(JSON.stringify(answers)).not.toContain(LEAK_MARKER)
        expect(JSON.stringify((await client.listTools()).tools)).not.toContain(LEAK_MARKER)
        expect(client.getInstructions() ?? "").not.toContain(LEAK_MARKER)
    })

    it("hands the allowed concept set to the assistant and tells it, in its instructions, to name nothing else", async () => {
        const client = await connect(harnessOf().deps)
        const context = JSON.parse((await call(client, "lesson_context")).text) as {
            allowedConcepts: ReadonlyArray<{ id: string }>
        }

        expect(context.allowedConcepts.map((concept) => concept.id)).toEqual([
            "request-lifecycle",
            "data-modeling",
            "transaction-acid",
            "timeout",
            "retry",
            "idempotency-key",
            "service-boundary",
            "saga",
        ])
        const instructions = client.getInstructions() ?? ""
        expect(instructions).toContain("REF RULE")
        expect(instructions).toContain("compensating transaction")
        expect(instructions).not.toContain("Race condition")
        expect(instructions).not.toContain("outbox")
    })

    it("explains an allowed term and answers 'chưa học tới' for a later one", async () => {
        const client = await connect(harnessOf().deps)

        expect(JSON.parse((await call(client, "explain", { term: "idempotent" })).text)).toMatchObject({
            kind: "explained",
            id: "idempotency-key",
        })
        expect(JSON.parse((await call(client, "explain", { term: "race condition" })).text)).toEqual({
            term: "race condition",
            answer: "chưa học tới",
        })
    })

    it("refuses explain when the lab has no concept graph, rather than explaining anything", async () => {
        const client = await connect(harnessOf(null).deps)
        const answer = await call(client, "explain", { term: "saga" })

        expect(answer.isError).toBe(true)
        expect(answer.text).toContain("concept graph of this lab is missing")
    })

    it("opens hints in order, records each opening once and reports it as a case.hint", async () => {
        const harness = harnessOf()
        const client = await connect(harness.deps)

        expect((await call(client, "hint", { caseId: "out-of-stock", level: 2 })).text).toBe("Open level 1 first.")
        expect(JSON.parse((await call(client, "hint", { caseId: "out-of-stock", level: 1 })).text)).toMatchObject({
            hint: "Gợi ý 1 của out-of-stock",
            hintsOpened: 1,
        })
        await call(client, "hint", { caseId: "out-of-stock", level: 1 })
        await call(client, "hint", { caseId: "out-of-stock", level: 2 })

        expect(harness.events).toEqual([
            {
                type: "case.hint",
                lessonId: "saga-compensation",
                caseId: "out-of-stock",
                level: 1,
                at: "2026-11-25T08:00:00.000Z",
            },
            {
                type: "case.hint",
                lessonId: "saga-compensation",
                caseId: "out-of-stock",
                level: 2,
                at: "2026-11-25T08:00:00.000Z",
            },
        ])
        expect((await call(client, "hint", { caseId: "checkout-in-stock", level: 1 })).isError).toBe(true)
    })

    it("calls only a declared inspect view with id-shaped values, and reads case_status from the last report", async () => {
        const harness = harnessOf()
        const client = await connect(harness.deps)

        expect((await call(client, "inspect", { id: "admin", params: {} })).isError).toBe(true)
        expect((await call(client, "inspect", { id: "wallet", params: { customerId: "x/../../y" } })).isError).toBe(
            true,
        )
        await call(client, "inspect", { id: "emails", params: { orderId: "o-1" } })
        expect(harness.gets).toEqual(["http://localhost:4004/emails?orderId=o-1"])

        expect(JSON.parse((await call(client, "case_status", { id: "out-of-stock" })).text)).toMatchObject({
            state: "red",
            invariant: "money-back",
            expected: "5000000",
            actual: "3800000",
        })
        expect((await call(client, "case_run", { id: "nope" })).isError).toBe(true)
        expect(harness.ran).toEqual([])
    })
})
