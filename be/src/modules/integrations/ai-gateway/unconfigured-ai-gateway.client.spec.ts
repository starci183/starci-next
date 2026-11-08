import { Test } from "@nestjs/testing"
import { AiGatewayErrorCode } from "./errors/ai-gateway.error"
import { UnconfiguredAiGatewayClient } from "./unconfigured-ai-gateway.client"

describe("UnconfiguredAiGatewayClient complete", () => {
    it("refuses with the stable code of an unconfigured gateway", async () => {
        const moduleRef = await Test.createTestingModule({ providers: [UnconfiguredAiGatewayClient] }).compile()

        await expect(moduleRef.get(UnconfiguredAiGatewayClient).complete()).rejects.toMatchObject({
            code: AiGatewayErrorCode.NotConfigured,
        })
    })
})
