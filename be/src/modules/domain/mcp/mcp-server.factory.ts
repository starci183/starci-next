import { Injectable } from "@nestjs/common"
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js"
import { z } from "zod"
import { DomainError } from "@modules/platform/errors"
import { McpTutorService } from "./mcp-tutor.service"
import { explainInvariantPrompt, fixScenarioPrompt, whyScenarioRedPrompt } from "./mcp-prompts.policy"

const LESSON_ID = z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]{0,99}$/u)
    .describe("The lesson id, a slug such as request-response-lifecycle")
const LOCALE = z.enum(["vi", "en"]).default("vi").describe("The language of the lesson text")
const SLUG = z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/u)

const one = (value: string | ReadonlyArray<string> | undefined): string =>
    Array.isArray(value) ? (value[0] ?? "") : String(value ?? "")

const json = (value: unknown): CallToolResult => ({ content: [{ type: "text", text: JSON.stringify(value, null, 2) }] })

/** A refusal the learner's AI can read: the domain code, never a stack. Anything else is rethrown as an internal error. */
const refusal = (error: unknown): CallToolResult => {
    if (error instanceof DomainError)
        return { isError: true, content: [{ type: "text", text: `${String((error as { code?: unknown }).code)}` }] }
    throw error
}

const act = async (run: () => Promise<unknown>): Promise<CallToolResult> => {
    try {
        return json(await run())
    } catch (error) {
        return refusal(error)
    }
}

@Injectable()
/**
 * Builds one MCP server for one learner: the resources, tools and prompts of the StarCi Next lesson companion, every handler
 * closed over that learner's id, so a call can only ever act for the signed-in owner of the access token. The server is cheap
 * and made per request (stateless Streamable HTTP).
 */
export class McpServerFactory {
    constructor(private readonly tutor: McpTutorService) {}

    /** The server for a learner. */
    create(learnerId: string): McpServer {
        const server = new McpServer({ name: "starci-next", version: "1.0.0" })
        this.resources(server, learnerId)
        this.tools(server, learnerId)
        this.prompts(server)
        return server
    }

    private resources(server: McpServer, learnerId: string): void {
        server.registerResource(
            "lesson-outline",
            new ResourceTemplate("lesson://{id}/outline", { list: undefined }),
            {
                title: "Lesson outline",
                description: "Title, outcomes and the sections of a lesson; locked ones have no text.",
                mimeType: "application/json",
            },
            async (uri, variables) => ({
                contents: [
                    {
                        uri: uri.href,
                        mimeType: "application/json",
                        text: JSON.stringify(await this.tutor.outline(learnerId, one(variables.id), "vi"), null, 2),
                    },
                ],
            }),
        )
        server.registerResource(
            "lesson-section",
            new ResourceTemplate("lesson://{id}/section/{n}", { list: undefined }),
            {
                title: "Lesson section",
                description: "One unlocked section of the lesson, in Vietnamese.",
                mimeType: "text/markdown",
            },
            async (uri, variables) => ({
                contents: [
                    {
                        uri: uri.href,
                        mimeType: "text/markdown",
                        text: (await this.tutor.section(learnerId, one(variables.id), Number(one(variables.n)), "vi"))
                            .body,
                    },
                ],
            }),
        )
        server.registerResource(
            "lesson-repo-file",
            new ResourceTemplate("repo://{id}/{+path}", { list: undefined }),
            {
                title: "Lesson source file",
                description: "A file of the lesson's repository at its pinned commit (first 400 lines).",
                mimeType: "text/plain",
            },
            async (uri, variables) => ({
                contents: [
                    {
                        uri: uri.href,
                        mimeType: "text/plain",
                        text: (await this.tutor.readFile(learnerId, one(variables.id), one(variables.path))).text,
                    },
                ],
            }),
        )
    }

    private tools(server: McpServer, learnerId: string): void {
        const readOnly = { readOnlyHint: true, openWorldHint: false }
        server.registerTool(
            "lesson",
            {
                title: "Lesson outline",
                description:
                    "The outline of a lesson: sections (locked ones listed without text) and learning outcomes.",
                inputSchema: { id: LESSON_ID, locale: LOCALE },
                annotations: readOnly,
            },
            ({ id, locale }) => act(() => this.tutor.outline(learnerId, id, locale)),
        )
        server.registerTool(
            "lesson_section",
            {
                title: "Lesson section",
                description: "The text of one unlocked section by its 1-based number from the outline.",
                inputSchema: { id: LESSON_ID, n: z.number().int().min(1).max(200), locale: LOCALE },
                annotations: readOnly,
            },
            ({ id, n, locale }) => act(() => this.tutor.section(learnerId, id, n, locale)),
        )
        server.registerTool(
            "search_lesson",
            {
                title: "Search the lesson",
                description:
                    "Search the sections of the lesson the learner may read. Semantic by default when available, keywords otherwise.",
                inputSchema: {
                    id: LESSON_ID,
                    query: z.string().min(1).max(300),
                    mode: z.enum(["semantic", "keyword"]).default("semantic"),
                    locale: LOCALE,
                },
                annotations: readOnly,
            },
            ({ id, query, mode, locale }) =>
                act(() => this.tutor.searchLesson(learnerId, id, locale, query, mode === "semantic")),
        )
        server.registerTool(
            "search_harness",
            {
                title: "Search the StarCi harness",
                description:
                    "Search the StarCi harness guides (Claude Code, Codex) and docs. Free for every learner. Semantic by default when available, keywords otherwise.",
                inputSchema: {
                    query: z.string().min(1).max(300),
                    mode: z.enum(["semantic", "keyword"]).default("semantic"),
                    locale: LOCALE,
                },
                annotations: readOnly,
            },
            ({ query, mode, locale }) => act(() => this.tutor.searchHarness(locale, query, mode === "semantic")),
        )
        server.registerTool(
            "read_file",
            {
                title: "Read a source file",
                description:
                    "Lines of a file of the lesson repository at its pinned commit (at most 400 lines per call).",
                inputSchema: {
                    id: LESSON_ID,
                    path: z.string().min(1).max(300),
                    from: z.number().int().min(1).optional(),
                    to: z.number().int().min(1).optional(),
                },
                annotations: readOnly,
            },
            ({ id, path, from, to }) => act(() => this.tutor.readFile(learnerId, id, path, from, to)),
        )
        server.registerTool(
            "search_code",
            {
                title: "Search the source",
                description:
                    "Search the lesson repository at its pinned commit. Semantic by default when available, keywords otherwise.",
                inputSchema: {
                    id: LESSON_ID,
                    query: z.string().min(1).max(300),
                    mode: z.enum(["semantic", "keyword"]).default("semantic"),
                },
                annotations: readOnly,
            },
            ({ id, query, mode }) => act(() => this.tutor.searchCode(learnerId, id, query, mode === "semantic")),
        )
        server.registerTool(
            "list_scenarios",
            {
                title: "List scenarios",
                description:
                    "The scenarios of the lesson: the injected fault, the guards that can be switched off and the command to run.",
                inputSchema: { id: LESSON_ID },
                annotations: readOnly,
            },
            ({ id }) => act(() => this.tutor.scenarios(learnerId, id)),
        )
        server.registerTool(
            "my_runs",
            {
                title: "My runs",
                description:
                    "The learner's own recent scenario runs of the lesson with the result and the log tail, to explain why one is red.",
                inputSchema: { id: LESSON_ID },
                annotations: readOnly,
            },
            ({ id }) => act(() => this.tutor.myRuns(learnerId, id)),
        )
        server.registerTool(
            "invariants",
            {
                title: "Invariants",
                description: "The invariants the learner has revealed so far, with where the code keeps each.",
                inputSchema: { id: LESSON_ID },
                annotations: readOnly,
            },
            ({ id }) => act(() => this.tutor.invariants(learnerId, id)),
        )
        server.registerTool(
            "request_run",
            {
                title: "Request a scenario run",
                description:
                    "Ask the learner's own machine to run one scenario. The StarCi CLI shows the exact command and asks the learner to confirm; read the result with my_runs. If delivered is false, no device is listening: tell the learner to run the returned command in their terminal.",
                inputSchema: {
                    id: LESSON_ID,
                    scenario: SLUG,
                    guards_off: z.array(SLUG).max(8).default([]).describe("Guard ids to switch off for this run"),
                },
                annotations: {
                    readOnlyHint: false,
                    destructiveHint: false,
                    idempotentHint: false,
                    openWorldHint: false,
                },
            },
            ({ id, scenario, guards_off }) => act(() => this.tutor.requestRun(learnerId, id, scenario, guards_off)),
        )
    }

    private prompts(server: McpServer): void {
        const lesson = { lesson: LESSON_ID, locale: z.enum(["vi", "en"]).optional() }
        const message = (text: string) => ({
            messages: [{ role: "user" as const, content: { type: "text" as const, text } }],
        })
        server.registerPrompt(
            "fix_scenario",
            {
                title: "Fix a red scenario",
                description: "Diagnose, explain the invariant, propose a change, then check with request_run.",
                argsSchema: { ...lesson, scenario: SLUG },
            },
            ({ lesson: id, scenario, locale }) => message(fixScenarioPrompt(locale ?? "vi", id, scenario)),
        )
        server.registerPrompt(
            "explain_invariant",
            {
                title: "Where does this law live",
                description: "Explain where an invariant lives in the code.",
                argsSchema: { ...lesson, invariant: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,31}$/u) },
            },
            ({ lesson: id, invariant, locale }) => message(explainInvariantPrompt(locale ?? "vi", id, invariant)),
        )
        server.registerPrompt(
            "why_scenario_red",
            {
                title: "Why is it red",
                description: "Explain why a scenario is red on the learner's machine.",
                argsSchema: { ...lesson, scenario: SLUG },
            },
            ({ lesson: id, scenario, locale }) => message(whyScenarioRedPrompt(locale ?? "vi", id, scenario)),
        )
    }
}
