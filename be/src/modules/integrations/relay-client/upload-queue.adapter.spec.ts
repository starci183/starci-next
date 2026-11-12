import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Test } from "@nestjs/testing"
import type { PendingUpload } from "./relay-client.contracts"
import { readQueue, writeQueue } from "./upload-queue.adapter"

const ADAPTER: unique symbol = Symbol("relay-client.upload-queue-adapter")
const adapter = { readQueue, writeQueue }

const build = async (): Promise<typeof adapter> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: ADAPTER, useFactory: () => adapter }],
    }).compile()
    return moduleRef.get<typeof adapter>(ADAPTER)
}

const PENDING: PendingUpload = { mutation: "relayLog", input: { eventId: "e1" } }

describe("upload queue", () => {
    let home: string

    beforeEach(() => {
        home = mkdtempSync(join(tmpdir(), "starci-queue-"))
    })

    afterEach(() => {
        rmSync(home, { recursive: true, force: true })
    })

    it("is empty before anything was queued", async () => {
        const queue = await build()

        expect(queue.readQueue({ STARCI_NEXT_HOME: home })).toEqual([])
    })

    it("reads back what it wrote and drops the items that are not uploads", async () => {
        const queue = await build()
        const env = { STARCI_NEXT_HOME: home }
        queue.writeQueue(env, [PENDING])
        expect(queue.readQueue(env)).toEqual([PENDING])

        writeFileSync(join(home, "queue.json"), JSON.stringify([PENDING, { mutation: "other", input: {} }, "x"]))
        expect(queue.readQueue(env)).toEqual([PENDING])
    })

    it.each([
        ["not JSON", "oops"],
        ["not a list", "{}"],
    ])("is empty when the file is %s", async (_name, text) => {
        const queue = await build()
        writeFileSync(join(home, "queue.json"), text)

        expect(queue.readQueue({ STARCI_NEXT_HOME: home })).toEqual([])
    })
})
