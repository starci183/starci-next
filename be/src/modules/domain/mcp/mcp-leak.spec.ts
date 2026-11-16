import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import {
    lessonSourceTreeOf,
    type LessonReadService,
    type LessonSourceTree,
    type LessonView,
} from "@modules/domain/lesson"
import type { LearnerRunEvent, RelayDeviceService, RelayFeedService } from "@modules/domain/relay"
import { McpErrorCode } from "./errors/mcp.error"
import { FakeClock } from "@starci/jest-preset"
import type { McpEmbedder } from "./mcp-embedder.port"
import type { McpHarnessFile } from "./mcp-harness.policy"
import { McpHarnessService } from "./mcp-harness.service"
import { McpMemoryVectorStore } from "./mcp-memory.vector-store"
import { McpServerFactory } from "./mcp-server.factory"
import type { McpSourceTree } from "./mcp-source-tree.port"
import { McpSourceService } from "./mcp-source.service"
import { McpTutorService } from "./mcp-tutor.service"
import { McpVectorIndex } from "./mcp-vector.index"
import type { McpOptions } from "./mcp.options"

/** Markers planted in everything a learner AI must never get; none may ever appear in any answer. */
const SECRETS = [
    "HIDDENTESTSECRET",
    "SUBMISSIONSECRET",
    "RUBRICSECRET",
    "ANSWERKEYSECRET",
    "MUTANTSECRET",
    "ENVSECRET",
    "TEACHERONLYSECRET",
    "OUTSIDESECRET",
    "DEPENDENCYSECRET",
    "HINTSECRET",
    "EXPECTEDEVIDENCESECRET",
    "HIDDENSCENARIOSECRET",
    "LOCKEDSECTIONSECRET",
    "HARNESSBUILDSECRET",
    "HARNESSTRAPSECRET",
    "HARNESSDOCTORSECRET",
]

/** The harness content checkout: the free guides and docs among the parts that must never be indexed. */
const HARNESS_FILES: ReadonlyArray<McpHarnessFile> = [
    { path: "raw/harness/guides/claude/hooks/vi.md", text: "Hook chay truoc moi tool HARNESSFREETEXT guide" },
    { path: "raw/harness/docs/overview/vi.md", text: "Tong quan harness HARNESSFREETEXT doc" },
    { path: "raw/harness/build/agent-cli/hidden/e2e.md", text: "HARNESSBUILDSECRET HARNESSFREETEXT" },
    { path: "raw/harness/build/agent-cli/source/README.md", text: "HARNESSBUILDSECRET HARNESSFREETEXT" },
    { path: "raw/harness/trials/trap-1/repo/vi.md", text: "HARNESSTRAPSECRET HARNESSFREETEXT" },
    { path: "raw/harness/doctor/claude/probe.md", text: "HARNESSDOCTORSECRET HARNESSFREETEXT" },
    { path: "raw/harness/guides/claude/hooks/answers/vi.md", text: "ANSWERKEYSECRET HARNESSFREETEXT" },
    { path: "raw/harness/guides/claude/hidden/vi.md", text: "HIDDENTESTSECRET HARNESSFREETEXT" },
]

const LEARNER = "11111111-1111-4111-8111-111111111111"
const LESSON = "bank-transfer"

/** The content commit the lesson version was imported at: the pin every file is read at. */
const COMMIT = "abc1234def5678abc1234def5678abc1234def56"

/**
 * The stored content of one lesson version as the importer leaves it: the files of source/ (a few of them dirty on purpose, as a
 * seed repository could hold them by mistake), the scenarios, invariants and code walk, and the challenge whose hidden scenario,
 * hidden test source and rubric must never reach a reader.
 */
const content = {
    sourceCode: [
        {
            path: "src/ledger.ts",
            content: "export const ledger = 1 // idempotency key keeps a transfer applied once\n",
        },
        { path: "hidden/transfer.test.ts", content: "HIDDENTESTSECRET idempotency" },
        { path: "submissions/0/solution.ts", content: "SUBMISSIONSECRET idempotency" },
        { path: "rubric.json", content: "RUBRICSECRET idempotency" },
        { path: "src/answers.ts", content: "ANSWERKEYSECRET idempotency" },
        { path: "mutants/m1.ts", content: "MUTANTSECRET idempotency" },
        { path: ".env", content: "ENVSECRET idempotency" },
        { path: "src/transfer.hidden.test.ts", content: "HIDDENTESTSECRET idempotency" },
        { path: "node_modules/dep/index.ts", content: "DEPENDENCYSECRET idempotency" },
    ],
    locales: {
        vi: {
            essential: {
                invariants: [
                    { id: "C1", text: "The sum of balances never changes" },
                    { id: "C2", text: "A transfer applies once" },
                    { id: "C3", text: "Concurrent writers serialise" },
                ],
                codeWalk: [
                    { id: "w1", invariant: "C2", file: "src/ledger.ts", line: 9, snippet: "x" },
                    { id: "w2", invariant: "C3", file: "hidden/c3.test.ts", line: 1, snippet: "x" },
                ],
                scenarios: [
                    {
                        id: "double-spend",
                        title: "Double spend",
                        fault: "a retry applies the transfer twice",
                        command: "npm run double-spend",
                        expected: "EXPECTEDEVIDENCESECRET",
                        invariant: "C2",
                        guards: [{ name: "idempotency", env: "IDEMPOTENCY", off: "off" }],
                        hint: "HINTSECRET",
                    },
                    {
                        id: "lost-update",
                        title: "Lost update",
                        fault: "two writers",
                        command: "npm run lost-update",
                        expected: "EXPECTEDEVIDENCESECRET",
                        invariant: "C3",
                        guards: [],
                    },
                ],
                challenges: [
                    {
                        id: "ch-1",
                        level: "insane",
                        title: "Insane",
                        brief: "TEACHERONLYSECRET",
                        rubric: [{ id: "r1", criterion: "RUBRICSECRET", points: 40, isCritical: true }],
                        hidden: [
                            {
                                id: "insane-hidden",
                                title: "HIDDENSCENARIOSECRET",
                                command: "npm run insane",
                                files: [
                                    {
                                        path: "tests/h1.spec.ts",
                                        from: "hidden/h1.spec.ts",
                                        content: "HIDDENTESTSECRET",
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        },
    },
}

const treeOf = (): LessonSourceTree => {
    const tree = lessonSourceTreeOf(COMMIT, content)
    if (tree === null) throw new Error("the fixture ships no source")
    return tree
}

const view = (isPremium: boolean): LessonView =>
    ({
        id: LESSON,
        version: "v1",
        locale: "vi",
        title: "Chuyen tien",
        description: "desc",
        isPremium,
        learningOutcomes: [{ id: "o1", text: "Hieu luat" }],
        sections: [
            {
                id: "s1",
                sortIndex: 1,
                phase: "challenge",
                title: "Mo dau",
                locked: false,
                body: "Chuyen tien phai ap dung mot lan UNLOCKEDTEXT",
                activities: [],
            },
            {
                id: "s2",
                sortIndex: 2,
                phase: "explain",
                title: "Ban chat",
                locked: !isPremium,
                body: isPremium ? "Ban chat day du UNLOCKEDTEXT premium" : null,
                activities: [],
            },
        ],
    }) as unknown as LessonView

const event = (partial: Partial<LearnerRunEvent>): LearnerRunEvent => ({
    runId: "r1",
    kind: "check.result",
    checkId: "double-spend",
    passed: false,
    exitCode: 1,
    commit: "abc1234",
    text: null,
    at: "2026-11-17T01:00:00.000Z",
    ...partial,
})

interface Build {
    readonly embeddedTexts: Array<string>
    readonly tutor: McpTutorService
    readonly factory: McpServerFactory
    readonly feed: { scenarioManifest: jest.Mock; runEvents: jest.Mock }
    readonly devices: { devices: jest.Mock }
    readonly lessons: { find: jest.Mock }
}

const build = (isPremium: boolean, embedder: McpEmbedder, tree: LessonSourceTree | null = treeOf()): Build => {
    const options: McpOptions = { tokenLimit: 5, publicUrl: null, embed: null, harnessDir: null, qdrant: null }
    const trees: McpSourceTree = { tree: () => Promise.resolve(tree) }
    const embeddedTexts: Array<string> = []
    const recording: McpEmbedder = {
        isConfigured: embedder.isConfigured,
        model: embedder.model,
        embed: async (texts) => {
            embeddedTexts.push(...texts)
            return embedder.embed(texts)
        },
    }
    const lessons = { find: jest.fn().mockResolvedValue(view(isPremium)) }
    const devices = { devices: jest.fn().mockResolvedValue([{ id: "d1", name: "laptop", online: true }]) }
    const feed = {
        scenarioManifest: jest
            .fn()
            .mockImplementation((_device: unknown, request: { lessonId: string; scenarioId: string }) =>
                Promise.resolve({
                    body: {
                        manifestId: "m1",
                        checks: [{ command: `starci-next run ${request.lessonId} --scenario ${request.scenarioId}` }],
                    },
                }),
            ),
        runEvents: jest.fn().mockResolvedValue([]),
    }
    const vectors = new McpVectorIndex(recording, new McpMemoryVectorStore())
    const tutor = new McpTutorService(
        lessons as unknown as LessonReadService,
        new McpSourceService(trees),
        vectors,
        new McpHarnessService(
            { files: () => Promise.resolve(HARNESS_FILES) },
            vectors,
            new FakeClock("2026-11-17T00:00:00.000Z"),
        ),
        devices as unknown as RelayDeviceService,
        feed as unknown as RelayFeedService,
        options,
    )
    return { embeddedTexts, tutor, factory: new McpServerFactory(tutor), feed, devices, lessons }
}

const offline: McpEmbedder = { isConfigured: false, model: "off", embed: () => Promise.resolve(null) }
/** A deterministic fake model: one dimension per letter, so texts sharing words are close. */
const letters: McpEmbedder = {
    isConfigured: true,
    model: "letters/1024",
    embed: (texts) =>
        Promise.resolve(
            texts.map((text) => {
                const vector = new Array<number>(4096).fill(0)
                for (const char of text.toLowerCase())
                    vector[char.charCodeAt(0) % 64] = (vector[char.charCodeAt(0) % 64] ?? 0) + 1
                return vector
            }),
        ),
}

const connect = async (factory: McpServerFactory): Promise<Client> => {
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair()
    await factory.create(LEARNER).connect(serverSide)
    const client = new Client({ name: "spec", version: "1.0.0" })
    await client.connect(clientSide)
    return client
}

const assertClean = (value: unknown): void => {
    const text = JSON.stringify(value)
    for (const secret of SECRETS) expect(text).not.toContain(secret)
}

describe("the MCP never leaks what a learner AI may not read", () => {
    const make = (isPremium: boolean, embedder: McpEmbedder): Promise<Build> =>
        Promise.resolve(build(isPremium, embedder))

    it("reads, lists and searches the repository without a hidden test, submission, rubric, key, mutant, env or outside file", async () => {
        const { tutor } = await make(true, offline)
        const forbidden = [
            "hidden/transfer.test.ts",
            "submissions/0/solution.ts",
            "rubric.json",
            "src/answers.ts",
            "mutants/m1.ts",
            ".env",
            "expected-evidence/c2.md",
            "src/transfer.hidden.test.ts",
            "../outside.txt",
        ]
        for (const path of forbidden)
            await expect(tutor.readFile(LEARNER, LESSON, path)).rejects.toMatchObject({
                code: McpErrorCode.PathForbidden,
            })
        const keyword = await tutor.searchCode(LEARNER, LESSON, "idempotency", false)
        expect(keyword.hits.map((hit) => hit.path)).toEqual(["src/ledger.ts"])
        assertClean(keyword)
        assertClean(await tutor.readFile(LEARNER, LESSON, "src/ledger.ts"))
    })

    it("answers source unavailable for a lesson that ships no source tree", async () => {
        const noSource = build(true, offline, null)
        await expect(noSource.tutor.readFile(LEARNER, LESSON, "src/ledger.ts")).rejects.toMatchObject({
            code: McpErrorCode.SourceUnavailable,
        })
        await expect(noSource.tutor.scenarios(LEARNER, LESSON)).rejects.toMatchObject({
            code: McpErrorCode.SourceUnavailable,
        })
    })

    it("never embeds a denied file, a hidden scenario or a locked section, and never returns them semantically", async () => {
        const { tutor, embeddedTexts } = await make(true, letters)
        const code = await tutor.searchCode(LEARNER, LESSON, "idempotency applied once", true)
        expect(code.mode).toBe("semantic")
        expect(code.hits.length).toBeGreaterThan(0)
        assertClean(code)
        assertClean(embeddedTexts)

        const free = await make(false, letters)
        const lesson = await free.tutor.searchLesson(LEARNER, LESSON, "vi", "chuyen tien mot lan", true)
        assertClean(lesson)
        assertClean(free.embeddedTexts)
        expect(free.embeddedTexts.join("\n")).toContain("UNLOCKEDTEXT")
        expect(free.embeddedTexts.join("\n")).not.toContain("premium")
    })

    it("falls back to keywords when the embedder is off or unreachable, and says so", async () => {
        const off = await make(true, offline)
        expect(await off.tutor.searchCode(LEARNER, LESSON, "idempotency", true)).toMatchObject({
            mode: "keyword",
            fellBack: true,
        })
        const down = await make(true, { isConfigured: true, model: "down", embed: () => Promise.resolve(null) })
        expect(await down.tutor.searchLesson(LEARNER, LESSON, "vi", "Chuyen tien", true)).toMatchObject({
            mode: "keyword",
            fellBack: true,
        })
        expect(await off.tutor.searchCode(LEARNER, LESSON, "idempotency", false)).toMatchObject({
            mode: "keyword",
            fellBack: false,
        })
    })

    it("lists no hidden scenario and reveals an invariant only after its scenario ran", async () => {
        const built = await make(true, offline)
        const scenarios = await built.tutor.scenarios(LEARNER, LESSON)
        expect(scenarios.map((scenario) => scenario.id)).toEqual(["double-spend", "lost-update"])
        assertClean(scenarios)

        expect((await built.tutor.invariants(LEARNER, LESSON)).map((invariant) => invariant.id)).toEqual(["C1"])
        built.feed.runEvents.mockResolvedValue([event({}), event({ checkId: "lost-update", runId: "r2" })])
        const revealed = await built.tutor.invariants(LEARNER, LESSON)
        expect(revealed.map((invariant) => invariant.id)).toEqual(["C1", "C2", "C3"])
        // An invariant whose location is a denied path keeps its law but not the location.
        expect(revealed.find((invariant) => invariant.id === "C3")?.where).toBeNull()
        assertClean(revealed)
    })

    it("shows only the learner own runs of public scenarios, never a hidden scenario run", async () => {
        const built = await make(true, offline)
        built.feed.runEvents.mockResolvedValue([
            event({
                kind: "log",
                runId: "r1",
                passed: null,
                exitCode: null,
                commit: null,
                text: "FAIL balance 100 -> 150",
                at: "2026-11-17T01:00:01.000Z",
            }),
            event({}),
            event({ runId: "r9", checkId: "insane-hidden", kind: "log", text: "HIDDENSCENARIOSECRET" }),
            event({ runId: "r9", checkId: "insane-hidden" }),
        ])
        const runs = await built.tutor.myRuns(LEARNER, LESSON)
        expect(runs).toHaveLength(1)
        expect(runs[0]).toMatchObject({
            scenario: "double-spend",
            passed: false,
            exitCode: 1,
            log: "FAIL balance 100 -> 150",
        })
        expect(built.feed.runEvents).toHaveBeenCalledWith(LEARNER, `lesson:${LESSON}`)
        assertClean(runs)
    })

    it("gives the source, scenario and run tools to Premium only, and a locked section never its text", async () => {
        const built = await make(false, offline)
        for (const call of [
            () => built.tutor.readFile(LEARNER, LESSON, "src/ledger.ts"),
            () => built.tutor.searchCode(LEARNER, LESSON, "idempotency", false),
            () => built.tutor.scenarios(LEARNER, LESSON),
            () => built.tutor.invariants(LEARNER, LESSON),
            () => built.tutor.myRuns(LEARNER, LESSON),
            () => built.tutor.requestRun(LEARNER, LESSON, "double-spend", []),
        ])
            await expect(call()).rejects.toMatchObject({ code: McpErrorCode.PremiumRequired })
        await expect(built.tutor.section(LEARNER, LESSON, 2, "vi")).rejects.toMatchObject({
            code: McpErrorCode.PremiumRequired,
        })
        const outline = await built.tutor.outline(LEARNER, LESSON, "vi")
        expect(outline.sections.map((section) => section.locked)).toEqual([false, true])
        expect(JSON.stringify(outline)).not.toContain("UNLOCKEDTEXT")
        expect((await built.tutor.section(LEARNER, LESSON, 1, "vi")).body).toContain("UNLOCKEDTEXT")
        assertClean(outline)
        expect(built.feed.scenarioManifest).not.toHaveBeenCalled()
    })

    it("sends a run only for a public scenario and its own guards, to an online device", async () => {
        const built = await make(true, offline)
        await expect(built.tutor.requestRun(LEARNER, LESSON, "insane-hidden", [])).rejects.toMatchObject({
            code: McpErrorCode.ScenarioUnknown,
        })
        await expect(built.tutor.requestRun(LEARNER, LESSON, "double-spend", ["ledger"])).rejects.toMatchObject({
            code: McpErrorCode.ScenarioUnknown,
        })
        expect(built.feed.scenarioManifest).not.toHaveBeenCalled()

        const sent = await built.tutor.requestRun(LEARNER, LESSON, "double-spend", ["idempotency"])
        expect(sent).toMatchObject({ delivered: true, device: "laptop", manifestId: "m1" })
        expect(built.feed.scenarioManifest).toHaveBeenCalledWith(
            { learnerId: LEARNER, deviceId: "d1" },
            { lessonId: LESSON, scenarioId: "double-spend", guardsOff: ["idempotency"] },
        )

        built.devices.devices.mockResolvedValue([{ id: "d1", name: "laptop", online: false }])
        built.feed.scenarioManifest.mockClear()
        expect(await built.tutor.requestRun(LEARNER, LESSON, "double-spend", ["idempotency"])).toEqual({
            delivered: false,
            device: null,
            command: "starci-next run bank-transfer --scenario double-spend --guard idempotency=off",
            manifestId: null,
        })
        expect(built.feed.scenarioManifest).not.toHaveBeenCalled()
    })

    it("searches the harness guides and docs for any learner, free, and never lists, searches or embeds a build kit, trap, probe, answer or hidden part", async () => {
        const free = await make(false, letters)
        const keyword = await free.tutor.searchHarness("vi", "HARNESSFREETEXT", false)
        expect(keyword.hits.map((hit) => hit.path).sort()).toEqual(["docs/overview", "guides/claude/hooks"])
        assertClean(keyword)
        const semantic = await free.tutor.searchHarness("vi", "hook chay truoc tool", true)
        expect(semantic.mode).toBe("semantic")
        expect(semantic.hits.length).toBeGreaterThan(0)
        assertClean(semantic)
        assertClean(free.embeddedTexts)
        expect(free.embeddedTexts.join("\n")).toContain("HARNESSFREETEXT")
        expect(free.lessons.find).not.toHaveBeenCalled()
        const off = await make(false, offline)
        expect(await off.tutor.searchHarness("vi", "hook", true)).toMatchObject({ mode: "keyword", fellBack: true })
    })

    it("offers exactly the planned tools, resources and prompts over the protocol, and refuses a hidden path through them", async () => {
        const built = await make(true, offline)
        const client = await connect(built.factory)

        const tools = (await client.listTools()).tools.map((tool) => tool.name).sort()
        expect(tools).toEqual(
            [
                "invariants",
                "lesson",
                "lesson_section",
                "list_scenarios",
                "my_runs",
                "read_file",
                "request_run",
                "search_code",
                "search_harness",
                "search_lesson",
            ].sort(),
        )
        const prompts = (await client.listPrompts()).prompts.map((prompt) => prompt.name).sort()
        expect(prompts).toEqual(["explain_invariant", "fix_scenario", "why_scenario_red"])

        const harness = await client.callTool({
            name: "search_harness",
            arguments: { query: "HARNESSFREETEXT", mode: "keyword" },
        })
        expect(harness.isError).toBeFalsy()
        assertClean(harness)
        const hidden = await client.callTool({
            name: "read_file",
            arguments: { id: LESSON, path: "hidden/transfer.test.ts" },
        })
        expect(hidden.isError).toBe(true)
        assertClean(hidden)
        const listed = await client.callTool({ name: "list_scenarios", arguments: { id: LESSON } })
        assertClean(listed)
        const section = await client.readResource({ uri: `lesson://${LESSON}/section/1` })
        expect(JSON.stringify(section)).toContain("UNLOCKEDTEXT")
        await expect(client.readResource({ uri: `repo://${LESSON}/rubric.json` })).rejects.toThrow()
        const file = await client.readResource({ uri: `repo://${LESSON}/src/ledger.ts` })
        expect(JSON.stringify(file)).toContain("idempotency key")
        await client.close()
    })

    it("walks the AI through diagnose, explain, propose and check in fix_scenario without any key", async () => {
        const built = await make(true, offline)
        const client = await connect(built.factory)
        for (const locale of ["vi", "en"] as const) {
            const prompt = await client.getPrompt({
                name: "fix_scenario",
                arguments: { lesson: LESSON, scenario: "double-spend", locale },
            })
            const text = JSON.stringify(prompt.messages)
            for (const tool of ["my_runs", "request_run", "invariants", "read_file", "list_scenarios"])
                expect(text).toContain(tool)
            for (const step of ["1.", "2.", "3.", "4."]) expect(text).toContain(step)
            expect(text).toContain("double-spend")
            assertClean(prompt)
        }
        await client.close()
    })
})
