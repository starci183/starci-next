import { Test } from "@nestjs/testing"
import { Judge0Error, Judge0ErrorCode } from "./errors/judge0.error"
import { UnconfiguredJudge0Client } from "./unconfigured-judge0.client"

describe("UnconfiguredJudge0Client", () => {
    it("runs nothing and refuses with JUDGE0_NOT_CONFIGURED", async () => {
        const moduleRef = await Test.createTestingModule({ providers: [UnconfiguredJudge0Client] }).compile()

        const rejection = moduleRef.get(UnconfiguredJudge0Client).run()

        await expect(rejection).rejects.toBeInstanceOf(Judge0Error)
        await expect(rejection).rejects.toMatchObject({ code: Judge0ErrorCode.NotConfigured })
    })
})
