import { Test } from "@nestjs/testing"
import { SystemIdsService } from "./system-ids.service"

const build = async () => {
    const moduleRef = await Test.createTestingModule({ providers: [SystemIdsService] }).compile()
    return { service: moduleRef.get(SystemIdsService) }
}

describe("SystemIdsService", () => {
    describe("next", () => {
        it("answers a UUID, and a different one each time", async () => {
            const { service } = await build()

            const first = service.next()
            const second = service.next()

            expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u)
            expect(second).not.toBe(first)
        })
    })
})
