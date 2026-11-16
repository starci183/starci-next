import { Test } from "@nestjs/testing"
import { ProgressHarnessFixtureClient } from "./progress-harness-fixture.client"

const build = async () => {
    const moduleRef = await Test.createTestingModule({ providers: [ProgressHarnessFixtureClient] }).compile()
    return moduleRef.get(ProgressHarnessFixtureClient)
}

describe("ProgressHarnessFixtureClient read", () => {
    it("answers the builds of the harness contract, marked as a fixture", async () => {
        const client = await build()

        const source = await client.read()

        expect(source.origin).toBe("fixture")
        expect(source.builds.map((item) => item.id)).toEqual(["agent-cli", "mcp-server", "chatbot-cskh", "lead-agent"])
        expect(source.builds[0]?.title).toBe("A terminal agent")
    })

    it("holds the doctor of both tools and a trap never tried", async () => {
        const client = await build()

        const source = await client.read()

        expect(source.doctor.map((item) => item.tool)).toEqual(["claude", "codex"])
        expect(source.trials.some((trial) => trial.last === null)).toBe(true)
    })
})
