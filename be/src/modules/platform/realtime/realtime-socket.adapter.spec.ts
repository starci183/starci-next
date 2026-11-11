import { Test } from "@nestjs/testing"
import { mock } from "@starci/jest-preset"
import type { INestApplication } from "@nestjs/common"
import { IoAdapter } from "@nestjs/platform-socket.io"
import { applyRealtime } from "./realtime-socket.adapter"

const APPLY: unique symbol = Symbol("spec.realtime-apply")

describe("applyRealtime", () => {
    it("serves the app's gateways with the socket.io adapter on the app's own server", async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: APPLY, useFactory: () => applyRealtime }],
        }).compile()
        const apply = moduleRef.get<typeof applyRealtime>(APPLY)
        const app = mock<INestApplication>()

        const adapter = apply(app)

        expect(adapter).toBeInstanceOf(IoAdapter)
        expect(app.useWebSocketAdapter).toHaveBeenCalledWith(adapter)
    })
})
