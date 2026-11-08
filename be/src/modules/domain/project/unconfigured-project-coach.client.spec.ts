import { Test } from "@nestjs/testing"
import { UnconfiguredProjectCoach } from "./unconfigured-project-coach.client"

const build = async (): Promise<UnconfiguredProjectCoach> => {
    const moduleRef = await Test.createTestingModule({ providers: [UnconfiguredProjectCoach] }).compile()
    return moduleRef.get(UnconfiguredProjectCoach)
}

describe("UnconfiguredProjectCoach", () => {
    it("refuses with the stable code of an unconfigured teacher", async () => {
        const coach = await build()

        await expect(coach.read()).rejects.toMatchObject({ code: "PROJECT_COACH_UNCONFIGURED" })
    })
})
