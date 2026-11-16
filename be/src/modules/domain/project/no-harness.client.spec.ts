import { Test } from "@nestjs/testing"
import { NoHarnessClient } from "./no-harness.client"

const build = async (): Promise<NoHarnessClient> => {
    const moduleRef = await Test.createTestingModule({ providers: [NoHarnessClient] }).compile()
    return moduleRef.get(NoHarnessClient)
}

describe("NoHarnessClient", () => {
    it("records nothing while the harness is not composed", async () => {
        const harness = await build()

        await expect(harness.recordRun()).resolves.toBeUndefined()
    })
})
