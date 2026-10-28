import { Module } from "@nestjs/common"
import type { DynamicModule } from "@nestjs/common"
import type { KeyConfig, PoolConfig } from "@starci/ai-router"
import { AiPoolModule, LESSON_AI, parseAiPoolConfig } from "@modules/integrations/ai-pool"
import type { LessonAi, LessonAiInput } from "@modules/integrations/ai-pool"
import { ClockModule } from "@modules/platform/clock"
import { EnvSource } from "@modules/platform/config"
import { LoggingModule } from "@modules/platform/logging"
import { useSandbox } from "../../../world/use-test-world"

/**
 * integration.lessons.ai-router, opt-in: the real AiPoolModule, the real pool configuration of `ai-pool.data.json` and
 * the real DeepSeek endpoint, run only by `ai-router-live verify` with the named custody keys declared in the
 * environment. Key values stay inside the library's `values` and the resolvers of the parsed config; the spec records
 * only routing metadata — provider, key alias, model id, attempt count and latency — never a key value, a prompt or a
 * completion text beyond presence. A run without the keys is red with the missing names, never a fake-provider pass.
 */

const CUSTODY_KEYS = ["LESSON_AI_PRIMARY", "LESSON_AI_FALLBACK_1"] as const

@Module({})
class LivePoolRoot {}

const livePoolModule =
    (tamper: (pool: PoolConfig<"lesson">) => PoolConfig<"lesson">) =>
    (values: Readonly<Record<string, string>>, registration: { readonly isGlobal: true }): DynamicModule => {
        const options = parseAiPoolConfig(new EnvSource(values))
        return {
            module: LivePoolRoot,
            ...registration,
            imports: [
                ClockModule.register({ isGlobal: true }),
                LoggingModule.register({ isGlobal: true }),
                AiPoolModule.register({ isGlobal: true, limits: options.limits, pool: tamper(options.pool) }),
            ],
        }
    }

const lessonAi = useSandbox<LessonAi>({
    provider: "deepseek",
    keys: CUSTODY_KEYS,
    module: livePoolModule((pool) => pool),
    client: LESSON_AI,
})

const keyFailover = useSandbox<LessonAi>({
    provider: "deepseek",
    keys: CUSTODY_KEYS,
    module: livePoolModule((pool) => ({
        ...pool,
        providers: pool.providers.map((provider) => ({
            ...provider,
            keys: provider.keys.map((key): KeyConfig =>
                key.alias === "lesson-primary"
                    ? { alias: key.alias, resolve: () => "starci-live-invalid-primary-key" }
                    : key,
            ),
        })),
    })),
    client: LESSON_AI,
})

jest.setTimeout(120_000)

const input = (): LessonAiInput => ({
    messages: [{ role: "user", content: "In one sentence, what does a REST GET verb promise?" }],
    grounding: "A REST GET is safe and idempotent: it reads a representation and never changes the resource.",
})

lessonAi.describe("lesson AI pool against the live provider, healthy custody (opt-in)", () => {
    it("answers a grounded completion through the preferred model and the primary key", async () => {
        const reply = await lessonAi.client().complete(input())

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
        for await (const chunk of lessonAi.client().stream(input())) {
            text += chunk.choices[0]?.delta?.content ?? ""
            requestId = requestId ?? chunk.id
        }

        expect(text.length).toBeGreaterThan(0)
        expect(requestId?.length).toBeGreaterThan(0)
    })
})

keyFailover.describe("lesson AI pool against the live provider, refused primary key (opt-in)", () => {
    it("fails over to the fallback key when the provider refuses the primary", async () => {
        const reply = await keyFailover.client().complete(input())

        expect((reply.choices[0]?.message.content ?? "").length).toBeGreaterThan(0)
        expect(reply.routing).toMatchObject({ provider: "deepseek", key: "lesson-fallback-1" })
        expect(reply.routing.attempts).toBeGreaterThanOrEqual(2)
        expect(JSON.stringify(reply.routing)).not.toContain("Bearer")
    })
})
