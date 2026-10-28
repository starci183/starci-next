import { Module } from "@nestjs/common"
import type { DynamicModule } from "@nestjs/common"
import type { ModuleRegistration, SandboxSpec } from "@starci/test-world"
import { AiPoolModule, LESSON_AI } from "@modules/integrations/ai-pool"
import type { AiPoolOptions, LessonAi, LessonAiInput } from "@modules/integrations/ai-pool"
import { LoggingModule } from "@modules/platform/logging"
import { appliedMigrations, PRIMARY_APPLIED_MIGRATIONS } from "../../fixtures/persistence/migrations.sql"
import { useSandbox, useTestWorld } from "../../world/use-test-world"

/**
 * integration.lessons.ai-router, opt-in: the real AiPoolModule, the pool declared by `ai-pool.data.json` bound by name
 * to the custody keys of the environment and the real DeepSeek endpoint, exercised only when `ai-router-live verify`
 * runs this suite with the keys declared. The composed core app proves the options reach the module the way
 * `core.env.ts` gives them; the live calls themselves boot through the sandbox of the test world, which reads the
 * named keys itself — no key value is read or printed here, only routing metadata (provider, key alias, model id,
 * attempt count, latency). A run without the keys is red naming the missing ones, never a fake-provider pass.
 */

const CUSTODY_KEYS: ReadonlyArray<string> = ["LESSON_AI_PRIMARY", "LESSON_AI_FALLBACK_1"]
const REFUSED_PRIMARY_KEY = "starci-live-invalid-primary-key"

/** A key resolver over the sandbox values: it returns the named value or nothing, it never exposes it. */
type KeyResolverFn = () => string | undefined

/**
 * The pool `ai-pool.data.json` declares, rebuilt as typed options with the named custody keys bound through the
 * sandbox's `values`, the way `parseAiPoolConfig` binds them for `core.env.ts`; the primary resolver is the tamper
 * point of the refused-key flow.
 */
const livePool = (values: Readonly<Record<string, string>>, primary: KeyResolverFn): AiPoolOptions => ({
    pool: {
        providers: [
            {
                id: "deepseek",
                baseUrl: "https://api.deepseek.com",
                maxConcurrency: 8,
                keys: [
                    { alias: "lesson-primary", resolve: primary, maxConcurrency: 4 },
                    { alias: "lesson-fallback-1", resolve: () => values["LESSON_AI_FALLBACK_1"], maxConcurrency: 4 },
                ],
                models: [
                    { id: "deepseek-flash", aliases: ["deepseek-4.1-flash"], contextWindow: 1_000_000 },
                    { id: "deepseek-v4-pro", contextWindow: 1_000_000 },
                ],
            },
        ],
        defaults: { maxAttempts: 4, timeoutMs: 30_000, deadlineMs: 60_000 },
        profiles: {
            lesson: {
                model: "deepseek-4.1-flash",
                fallbacks: ["deepseek-v4-pro"],
                allowFallback: true,
                maxAttempts: 4,
                timeoutMs: 30_000,
                deadlineMs: 60_000,
            },
        },
        resilience: { keyBreaker: { failureThreshold: 3 }, providerBreaker: { failureThreshold: 8 } },
        telemetry: { includeContent: false },
    },
    limits: { maxOutputTokens: 1024, reservedPromptTokens: 2048 },
})

@Module({})
class LivePoolRoot {}

/** The module the sandbox composes: the platform logger plus the real pool module registered as the app root does. */
const liveModule = (options: (values: Readonly<Record<string, string>>) => AiPoolOptions): SandboxSpec<LessonAi>["module"] =>
    (values: Readonly<Record<string, string>>, registration: ModuleRegistration): DynamicModule => ({
        module: LivePoolRoot,
        ...registration,
        imports: [
            LoggingModule.register({ ...registration }),
            AiPoolModule.register({ ...registration, ...options(values) }),
        ],
    })

const healthyPool = (values: Readonly<Record<string, string>>): AiPoolOptions =>
    livePool(values, () => values["LESSON_AI_PRIMARY"])

const refusedPool = (values: Readonly<Record<string, string>>): AiPoolOptions =>
    livePool(values, () => REFUSED_PRIMARY_KEY)

const healthy = useSandbox<LessonAi>({
    provider: "deepseek",
    keys: CUSTODY_KEYS,
    module: liveModule(healthyPool),
    client: LESSON_AI,
})

const refused = useSandbox<LessonAi>({
    provider: "deepseek",
    keys: CUSTODY_KEYS,
    module: liveModule(refusedPool),
    client: LESSON_AI,
})

jest.setTimeout(120_000)

const input = (): LessonAiInput => ({
    messages: [{ role: "user", content: "In one sentence, what does a REST GET verb promise?" }],
    grounding: "A REST GET is safe and idempotent: it reads a representation and never changes the resource.",
})

describe("lesson AI pool: the composed app receives the pool's typed options (e2e)", () => {
    const world = useTestWorld({ apps: ["core"] })

    it("serves the app whose pool is composed from named custody references over the migrated store", async () => {
        const live = await world.apps.core.api.get("/health/live")
        const ready = await world.apps.core.api.get("/health/ready")
        const applied = await appliedMigrations(world.db.primary, PRIMARY_APPLIED_MIGRATIONS)

        expect(live.status).toBe(200)
        expect(ready.status).toBe(200)
        expect(ready.body).toEqual({ ok: true })
        expect(applied.length).toBeGreaterThan(0)
        expect(JSON.stringify(live.body)).not.toContain("Bearer")
        expect(JSON.stringify(ready.body)).not.toContain("Bearer")
    })
})

healthy.describe("lesson AI pool against the live provider, healthy custody (opt-in)", () => {
    it("answers a grounded completion through the preferred model and the primary key", async () => {
        const reply = await healthy.client().complete(input())

        expect((reply.choices[0]?.message.content ?? "").length).toBeGreaterThan(0)
        expect(reply.routing).toMatchObject({ provider: "deepseek", key: "lesson-primary", model: "deepseek-flash" })
        expect(reply.routing.attempts).toBeGreaterThanOrEqual(1)
        expect(reply.routing.latencyMs).toBeGreaterThan(0)
        expect(JSON.stringify(reply.routing)).not.toContain("Bearer")
        expect(reply.usage?.total_tokens).toBeGreaterThan(0)
    })

    it("streams the grounded answer token by token through the preferred model", async () => {
        let text = ""
        let requestId: string | undefined
        for await (const chunk of healthy.client().stream(input())) {
            text += chunk.choices[0]?.delta?.content ?? ""
            requestId = requestId ?? chunk.id
        }

        expect(text.length).toBeGreaterThan(0)
        expect(requestId?.length).toBeGreaterThan(0)
    })
})

refused.describe("lesson AI pool against the live provider, refused primary key (opt-in)", () => {
    it("fails over to the fallback key when the provider refuses the primary", async () => {
        const reply = await refused.client().complete(input())

        expect((reply.choices[0]?.message.content ?? "").length).toBeGreaterThan(0)
        expect(reply.routing).toMatchObject({ provider: "deepseek", key: "lesson-fallback-1" })
        expect(reply.routing.attempts).toBeGreaterThanOrEqual(2)
        expect(JSON.stringify(reply.routing)).not.toContain("Bearer")
    })
})
