import { sql } from "@modules/platform/database"
import { mcpTokenDigest, mcpTokenSecret } from "@modules/domain/mcp/mcp-token.policy"
import { persistDemoTopic } from "../../fixtures/builders/lesson.builder"
import { useTestWorld } from "../../world/use-test-world"

const LESSON = "outbox-demo"
/** The content commit the lesson version is stored at: the pin every source file is read at. */
const COMMIT = "abc1234def5678abc1234def5678abc1234def56"
const FREE = "5c1a0000-0000-4000-8000-0000000000b1"
const PREMIUM = "5c1a0000-0000-4000-8000-0000000000b2"

const INSERT_LESSON = sql`INSERT INTO lesson_versions (
    lesson_id, version, content_hash, status, category, difficulty, minutes_read, implementation, sort_index,
    titles, descriptions, source_hashes, content, imported_at, lesson_group, topic, source_key
) VALUES ($1, $2, $3, 'published', 'backend', 'intermediate', 30, 'typescript', 2,
    '{"vi":"Outbox","en":"Outbox"}'::jsonb, '{"vi":"d","en":"d"}'::jsonb, '{}'::jsonb, $4::jsonb, now(), 'backend', 'demo-topic', NULL)
ON CONFLICT DO NOTHING`
const INSERT_TOKEN = sql`INSERT INTO mcp_access_tokens (learner_id, name, token_digest, hint, created_at)
VALUES ($1::uuid, 'e2e', $2::text, $3::text, now())`
const INSERT_PREMIUM = sql`INSERT INTO entitlements (learner_id, premium_until, updated_at) VALUES ($1::uuid, '2099-01-01T00:00:00Z', now())`
const INSERT_ANSWER = sql`INSERT INTO lesson_attempts (
    learner_id, lesson_id, lesson_version, activity_id, revision, kind, phase, locale, is_diagnostic, answer, status, result,
    submitted_at, graded_at, updated_at
) VALUES ($1::uuid, $2, $3, 'opener.q1', 1, 'choice', 'explain', 'vi', false, '{}'::jsonb, 'graded', '{"correct": true}'::jsonb, now(), now(), now())`

const section = (id: string, title: string, phase: string, sortIndex: number, body: string) => ({
    id,
    title,
    phase,
    sortIndex,
    body,
})

const document = (locale: "vi" | "en") => ({
    title: "Outbox",
    description: "d",
    body: "overview",
    learningOutcomes: [],
    prerequisites: [],
    references: [],
    retrieval: [],
    sections: [
        section(
            "1-essential",
            "Essence",
            "explain",
            1,
            "# Essence\n\nSend once FREETEXT\n\n## Why\n\nBecause the ACK can be lost",
        ),
        section("2-source", "Source", "explore", 2, "# Source\n\nPREMIUMSOURCE the relay claims rows"),
        section("3-scenarios", "Scenarios", "apply", 3, "# Scenarios\n\nPREMIUMSCENARIOS"),
        section("4-apply", "Apply", "reflect", 4, "# Apply\n\nPREMIUMAPPLY"),
    ],
    essential: {
        opener: [
            {
                id: "q1",
                prompt: `Why a key? ${locale}`,
                choices: ["Speed", "One effect"],
                correctIndex: 1,
                explanation: "ANSWERKEY one effect",
                choiceExplanations: ["ANSWERKEY wrong", "ANSWERKEY right"],
            },
            {
                id: "q2",
                prompt: "What does the outbox hold?",
                choices: ["A cache", "A row in the same transaction"],
                correctIndex: 1,
                explanation: "UNANSWEREDKEY",
                choiceExplanations: ["UNANSWEREDKEY a", "UNANSWEREDKEY b"],
            },
        ],
        source: { langs: ["typescript"] },
        invariants: [{ id: "one-effect", text: "One effect" }],
        architecture: null,
        codeWalk: [],
        scenarios: [
            {
                id: "dup",
                title: "Duplicate",
                fault: "send twice",
                brief: "send twice",
                command: "npm test -- --scenario dup",
                expected: "one credit EXPECTEDTEXT",
                invariant: "one-effect",
                concepts: [],
                guards: [{ name: "key", env: "GUARD_KEY", off: "off" }],
                hint: "HINTTEXT",
            },
        ],
        challenges: [
            {
                id: "easy",
                level: "easy",
                title: "Easy",
                brief: "BRIEFTEXT",
                rubric: [{ id: "r1", criterion: "Keys the retry", points: 100 }],
                hidden: [
                    {
                        id: "easy-hidden",
                        title: "HIDDENSCENARIO",
                        brief: "HIDDENSCENARIO",
                        concepts: [],
                        command: "npm test",
                        files: [{ path: "t.ts", from: "hidden/t.ts", content: "HIDDENTEST SOLUTIONTEXT" }],
                    },
                ],
                questions: [
                    { id: "e1", prompt: "Essence?", choices: ["x", "y"], correctIndex: 1, explanation: "ESSENCEKEY" },
                ],
            },
        ],
    },
})

const CONTENT = {
    locales: { vi: document("vi"), en: document("en") },
    workspace: null,
    files: [],
    sourceCode: [
        { path: "src/claim.ts", content: "export const claim = () => 'claims rows with a lease'\n" },
        { path: "src/partner.ts", content: "// the idempotency key is the event id\nexport const key = 1\n" },
        { path: "hidden/solution.ts", content: "SOLUTIONTEXT" },
        { path: "package-lock.json", content: `{ "lock": "${"x".repeat(300)}" }\n` },
    ],
}

/** Every word that must never reach a learner's AI. */
const NEVER = ["HIDDENSCENARIO", "HIDDENTEST", "SOLUTIONTEXT", "ESSENCEKEY", "UNANSWEREDKEY"]

interface ToolAnswer {
    readonly status: number
    readonly isError: boolean
    readonly text: string
}

/**
 * The learner's MCP over HTTP (e2e): the real core app and its database. It proves the bearer token proves the learner (an unknown
 * well-formed token is refused, a revoked one too), a free learner reads Bản chất only, a Premium learner reads every part, the
 * source files and the scenarios, and nothing hidden or still unreleased (an unanswered opener key, a hint before a red run, a
 * hidden test or solution) is in any answer.
 */
describe("the learner MCP (e2e)", () => {
    const world = useTestWorld({ apps: ["core"] })
    const free = mcpTokenSecret()
    const premium = mcpTokenSecret()
    const revoked = mcpTokenSecret()

    beforeAll(async () => {
        const db = world.db.primary
        await persistDemoTopic(db)
        await db?.query(INSERT_LESSON, [LESSON, COMMIT, "0".repeat(64), JSON.stringify(CONTENT)])
        await db?.query(INSERT_PREMIUM, [PREMIUM])
        for (const [learner, secret] of [
            [FREE, free],
            [PREMIUM, premium],
        ] as const)
            await db?.query(INSERT_TOKEN, [learner, mcpTokenDigest(secret), secret.slice(-4)])
        await db?.query(
            `INSERT INTO mcp_access_tokens (learner_id, name, token_digest, hint, created_at, revoked_at) VALUES ($1::uuid, 'old', $2, 'xxxx', now(), now())`,
            [FREE, mcpTokenDigest(revoked)],
        )
        await db?.query(INSERT_ANSWER, [PREMIUM, LESSON, COMMIT])
    })

    const ask = async (token: string, name: string, args: Record<string, unknown>): Promise<ToolAnswer> => {
        const response = await world.apps.core?.api.post(
            "/mcp",
            { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } },
            { headers: { authorization: `Bearer ${token}`, accept: "application/json, text/event-stream" } },
        )
        const body = response?.body as
            { result?: { isError?: boolean; content?: Array<{ text?: string }> } } | undefined
        return {
            status: response?.status ?? 0,
            isError: body?.result?.isError === true,
            text: body?.result?.content?.[0]?.text ?? "",
        }
    }
    const clean = (answer: ToolAnswer): void => {
        for (const word of NEVER) expect(answer.text).not.toContain(word)
    }

    it("refuses a token that is well formed but unknown or revoked, and answers a stored one as its own learner", async () => {
        expect((await ask(mcpTokenSecret(), "lesson_outline", { id: LESSON })).status).toBe(401)
        expect((await ask(revoked, "lesson_outline", { id: LESSON })).status).toBe(401)
        const outline = await ask(free, "lesson_outline", { id: LESSON })
        expect(outline.status).toBe(200)
        expect(JSON.parse(outline.text).isPremium).toBe(false)
        expect(JSON.parse((await ask(premium, "lesson_outline", { id: LESSON })).text).isPremium).toBe(true)
    })

    it("gives a free learner Bản chất in full, the opener without its key, and nothing of the Premium parts", async () => {
        const answer = await ask(free, "lesson", { id: LESSON })
        const lesson = JSON.parse(answer.text)
        expect(lesson.lockedParts).toEqual(["2-source", "3-scenarios", "4-apply"])
        expect(lesson.sections[0].body).toContain("FREETEXT")
        expect(lesson.sections[1].body).toBeNull()
        expect(lesson.opener.map((question: { answered: boolean }) => question.answered)).toEqual([false, false])
        for (const word of [
            "PREMIUMSOURCE",
            "PREMIUMSCENARIOS",
            "PREMIUMAPPLY",
            "EXPECTEDTEXT",
            "BRIEFTEXT",
            "HINTTEXT",
            "ANSWERKEY",
        ])
            expect(answer.text).not.toContain(word)
        clean(answer)
        for (const call of [
            ["read_file", { id: LESSON, path: "src/claim.ts" }],
            ["list_files", { id: LESSON }],
            ["list_scenarios", { id: LESSON }],
        ] as const) {
            const refused = await ask(free, call[0], call[1])
            expect(refused).toMatchObject({ isError: true, text: "MCP_PREMIUM_REQUIRED" })
        }
    })

    it("gives a Premium learner every part, every readable source file, a search over both, and the key of the opener question they answered", async () => {
        const answer = await ask(premium, "lesson", { id: LESSON, locale: "vi" })
        const lesson = JSON.parse(answer.text)
        expect(lesson.lockedParts).toEqual([])
        expect(lesson.sections.map((each: { body: string }) => each.body).join("\n")).toContain("PREMIUMSOURCE")
        expect(lesson.scenarios[0]).toMatchObject({ id: "dup", guards: ["key"], hint: null })
        expect(lesson.scenarios[0].expected).toContain("EXPECTEDTEXT")
        expect(lesson.challenges[0]).toMatchObject({ id: "easy", hiddenScenarios: 1 })
        const [answered, open] = lesson.opener
        expect(answered).toMatchObject({ id: "q1", answered: true, answer: { correctChoiceId: "c1" } })
        expect(JSON.stringify(answered)).toContain("ANSWERKEY")
        expect(open).toMatchObject({ id: "q2", answered: false, answer: null })
        clean(answer)

        const files = JSON.parse((await ask(premium, "list_files", { id: LESSON })).text)
        expect(files.commit).toBe(COMMIT)
        expect(files.files.map((file: { path: string }) => file.path)).toEqual([
            "package-lock.json",
            "src/claim.ts",
            "src/partner.ts",
        ])
        expect(files.files[0].searchable).toBe(false)
        const read = JSON.parse((await ask(premium, "read_file", { id: LESSON, path: "src/claim.ts" })).text)
        expect(read).toMatchObject({ path: "src/claim.ts", from: 1, truncated: false, nextFrom: null })
        expect(read.text).toContain("claims rows with a lease")
        expect((await ask(premium, "read_file", { id: LESSON, path: "hidden/solution.ts" })).text).toBe(
            "MCP_PATH_FORBIDDEN",
        )

        const code = await ask(premium, "search_code", { id: LESSON, query: "idempotency key", mode: "keyword" })
        expect(JSON.parse(code.text).hits.map((hit: { path: string }) => hit.path)).toEqual(["src/partner.ts"])
        const text = await ask(premium, "search_lesson", { id: LESSON, query: "ACK", mode: "keyword", locale: "vi" })
        expect(JSON.parse(text.text).hits.map((hit: { path: string }) => hit.path)).toContain("section/1")
        clean(code)
        clean(text)
    })
})
