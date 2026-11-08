import { Test } from "@nestjs/testing"
import * as subject from "./practice-access.policy"

const SUBJECT: unique symbol = Symbol("practice.practice-access.policy")

describe("isBeyondFree", () => {
    let isBeyondFree: typeof subject.isBeyondFree

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: SUBJECT, useFactory: () => subject }],
        }).compile()
        ;({ isBeyondFree } = moduleRef.get<typeof subject>(SUBJECT))
    })

    it("opens the first problem of a pattern when one is free", () => {
        expect(isBeyondFree(0, 1)).toBe(false)
        expect(isBeyondFree(1, 1)).toBe(true)
    })

    it("opens as many problems as the free count names", () => {
        expect([0, 1, 2, 3].map((rank) => isBeyondFree(rank, 3))).toEqual([false, false, false, true])
    })

    it("locks every problem when no problem is free", () => {
        expect(isBeyondFree(0, 0)).toBe(true)
    })
})
