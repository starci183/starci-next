import { AiGatewayErrorCode, type AiGatewayReply } from "@modules/integrations/ai-gateway"
import {
    AI_GATEWAY_WORLD_MODEL,
    AiGatewayHolder,
    aiGatewayModules,
    openrouterOf,
} from "../../world/ai-gateway-world.options"
import { useTestWorld } from "../../world/use-test-world"

const requestOf = (requestId: string) => ({
    requestId,
    system: "Answer with a JSON object.",
    user: "the quoted data",
    timeoutMs: 5000,
})

/**
 * ai-gateway (integration): the gateway through the real `@starci/ai-router` pool against the world's OpenRouter fake. It proves a
 * completion is sent over the wire with the key and the request id and answers the model's text, an answer without text is refused as
 * AI_GATEWAY_REPLY_EMPTY, and a provider outage or a refused key refuses as the coded AiGatewayErrorCode.Unavailable.
 */
describe("ai-gateway (integration)", () => {
    const world = useTestWorld({ modules: aiGatewayModules })
    const openrouter = () => openrouterOf(world)
    const complete = (requestId: string): Promise<AiGatewayReply> =>
        world.resolve(AiGatewayHolder).gateway.complete(requestOf(requestId))

    beforeEach(async () => {
        await openrouter()?.reset()
    })

    it("sends the completion with the key and answers the text of the model", async () => {
        await openrouter()?.reply('{"ok":true}')

        const reply = await complete("req-gateway-1")

        const recorded = (await openrouter()?.requests()) ?? []
        expect(reply).toEqual({ text: '{"ok":true}', model: AI_GATEWAY_WORLD_MODEL, usedFallback: false })
        expect(recorded).toHaveLength(1)
        expect(recorded[0]?.method).toBe("POST")
        expect(JSON.stringify(recorded[0]?.headers)).toContain("world-placeholder-key")
        expect(recorded[0]?.body).toContain("the quoted data")
    })

    it("refuses with AI_GATEWAY_REPLY_EMPTY when the model answers no text", async () => {
        await openrouter()?.reply("  ")

        await expect(complete("req-gateway-2")).rejects.toMatchObject({ code: AiGatewayErrorCode.ReplyEmpty })
    })

    it("refuses with AI_GATEWAY_UNAVAILABLE while the provider is down", async () => {
        await world.fake.openrouter?.failNext({ status: 503, times: 10 })

        await expect(complete("req-gateway-3")).rejects.toMatchObject({ code: AiGatewayErrorCode.Unavailable })
    })

    it("refuses with AI_GATEWAY_UNAVAILABLE when the provider refuses the key", async () => {
        await world.fake.openrouter?.failNext({ status: 401, times: 10 })

        await expect(complete("req-gateway-4")).rejects.toMatchObject({ code: AiGatewayErrorCode.Unavailable })
    })
})
