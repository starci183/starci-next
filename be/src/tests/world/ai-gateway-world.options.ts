import { Injectable, Module } from "@nestjs/common"
import type { ModuleFactory, WorldWiring } from "@starci/test-world"
import type { OpenrouterFakeClient } from "./fakes/openrouter/openrouter.client"
import { AiGatewayModule, InjectAiGateway, type AiGateway } from "@modules/integrations/ai-gateway"

/** The model the world's pool routes to. */
export const AI_GATEWAY_WORLD_MODEL = "world/model-a"

/**
 * The options of the AI gateway module of the AI worlds (registered through `AiGatewayModule.register`): the real `@starci/ai-router` pool pointed at
 * the world's OpenRouter fake, the only double at the network edge. Retries wait 1 ms and no breaker opens, so an outage ends fast and
 * one case does not poison the next.
 */
export const aiGatewayOptionsOf = (w: WorldWiring): Parameters<typeof AiGatewayModule.register>[0] => ({
    isGlobal: true,
    gateway: {
        maxOutputTokens: 512,
        pool: {
            providers: [
                {
                    id: "openrouter",
                    kind: "openrouter",
                    baseUrl: w.fake.openrouter?.url ?? "",
                    keys: [{ alias: "world-key", resolve: () => "world-placeholder-key" }],
                    models: [{ id: AI_GATEWAY_WORLD_MODEL }],
                },
            ],
            profiles: {
                coach: { model: AI_GATEWAY_WORLD_MODEL, maxAttempts: 2, deadlineMs: 10_000 },
                interview: { model: AI_GATEWAY_WORLD_MODEL, maxAttempts: 2, deadlineMs: 10_000 },
            },
            resilience: {
                backoff: { baseMs: 1, factor: 1, maxMs: 1 },
                keyBreaker: { failureThreshold: 1000 },
                providerBreaker: { failureThreshold: 1000 },
                authDisableMs: 1,
            },
        },
    },
})

@Injectable()
/** Hands a spec the gateway the way a consumer receives it: by its injection decorator. */
export class AiGatewayHolder {
    constructor(@InjectAiGateway() readonly gateway: AiGateway) {}
}

@Module({ providers: [AiGatewayHolder], exports: [AiGatewayHolder] })
class AiGatewayHolderModule {}

/** The modules of the AI gateway world: the gateway over the OpenRouter fake and the holder a spec resolves it through. */
export const aiGatewayModules: ReadonlyArray<ModuleFactory> = [
    (w) => AiGatewayModule.register(aiGatewayOptionsOf(w)),
    () => ({ module: AiGatewayHolderModule }),
]

/** What a booted AI gateway world gives a spec: its fakes. */
interface AiGatewayWorld {
    readonly fake: AiGatewayWorldFakes
}

/** The fakes of a booted AI gateway world. */
interface AiGatewayWorldFakes {
    /** The OpenRouter fake. */
    readonly openrouter?: OpenrouterFakeClient | undefined
}

/** The OpenRouter fake behind the pool of a booted world, typed with its scripting calls. */
export const openrouterOf = (world: AiGatewayWorld): OpenrouterFakeClient | undefined => world.fake.openrouter
