import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { conceptGraphOf } from "./concept-graph.policy"
import { runCaseAndReport } from "./lab-case.cli"
import { sendCaseEvent } from "./lab-case-upload.cli"
import { isLoopbackUrl } from "./lab-manifest.schema"
import { labMcpServerOf, type LabMcpDeps } from "./lab-mcp.server"
import {
    conceptGraphPathOf,
    labWorkspaceOf,
    readHintLedger,
    readLabReport,
    readTextFile,
    writeHintLedger,
} from "./lab-workspace.adapter"
import type { CliIo } from "./relay-client.contracts"

/** What `starci-relay mcp` is given. */
export interface LabMcpOptions {
    /** A concept graph file to read instead of the lab's `.starci/concepts.yaml`. */
    readonly concepts?: string | undefined
}

/** How long an inspect view may take to answer; it reads a local service, so a slow one is a stuck one. */
const INSPECT_TIMEOUT_MS = 5_000

/**
 * GETs a loopback url and never follows a redirect: a view that redirects could otherwise send the assistant's request to another
 * host. The loopback check is repeated here, on the filled url, so this function is safe on its own and not only behind the schema.
 */
export const loopbackGet = async (url: string): Promise<{ readonly status: number; readonly text: string }> => {
    if (!isLoopbackUrl(url)) return { status: 0, text: "" }
    try {
        const answer = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(INSPECT_TIMEOUT_MS) })
        return { status: answer.status, text: await answer.text() }
    } catch {
        return { status: 0, text: "" }
    }
}

/**
 * `starci-relay mcp`: serves the lab MCP over stdio for the lab of the current folder until the client closes the stream.
 *
 * stdout carries the JSON-RPC stream and nothing else, so every word to the learner goes to stderr (`io.err`) and the tests run
 * quiet. A folder without a valid lab refuses before the server starts: an editor shows the stderr line, and a server that started
 * anyway would only answer errors.
 */
export const mcpCommand = async (
    io: CliIo,
    cwd: string,
    options: LabMcpOptions,
    version: string,
): Promise<number> => {
    const workspace = labWorkspaceOf(cwd)
    if (workspace.kind === "no-lab") {
        io.err(`starci-relay mcp: no starci-lab.yaml in ${cwd} or a parent; start the MCP from the lab folder.`)
        return 2
    }
    if (workspace.kind === "invalid") {
        io.err(`starci-relay mcp: ${workspace.root}/starci-lab.yaml is not valid:`)
        workspace.problems.forEach((problem) => io.err(`  - ${problem}`))
        return 2
    }
    const { root, manifest } = workspace
    const graphPath = conceptGraphPathOf(root, options.concepts, cwd)
    const graphText = graphPath === null ? null : readTextFile(graphPath)
    const deps: LabMcpDeps = {
        manifest,
        concepts: graphText === null ? null : conceptGraphOf(graphText),
        runCase: (item) => runCaseAndReport(io, root, manifest, item, true),
        sendEvent: (event) => sendCaseEvent(io, manifest, event),
        now: () => new Date(io.now()).toISOString(),
        readReport: () => readLabReport(root, manifest),
        readHints: () => readHintLedger(io.env, manifest),
        writeHints: (ledger) => writeHintLedger(io.env, manifest, ledger, new Date(io.now()).toISOString()),
        get: loopbackGet,
        version,
    }
    const server = labMcpServerOf(deps)
    const transport = new StdioServerTransport()
    // The protocol layer reports a closed transport through `onclose`; the end of stdin is watched too, since a client that just
    // exits ends the stream without a close message, and the command must then end instead of keeping the process alive.
    const closed = new Promise<void>((resolve) => {
        server.server.onclose = () => resolve()
        process.stdin.once("end", () => resolve())
    })
    await server.connect(transport)
    io.err(`starci-relay mcp: lab ${manifest.lab} / ${manifest.lessonId} at ${root}`)
    await closed
    await server.close()
    return 0
}
