import { Test } from "@nestjs/testing"
import { MemoryRealtimeHub } from "./memory-realtime.adapter"
import { REPLAY_FRAMES_MAX, type RealtimeTopic } from "./realtime.contracts"

type Frame = { readonly id: string; readonly n: number }
const topic: RealtimeTopic<Frame> = { name: "relay:learner-1:device-1" }
const other: RealtimeTopic<Frame> = { name: "relay:learner-2:device-9" }

const build = async (): Promise<MemoryRealtimeHub> => {
    const moduleRef = await Test.createTestingModule({ providers: [MemoryRealtimeHub] }).compile()
    return moduleRef.get(MemoryRealtimeHub)
}

/** Takes `count` frames from an iterator. */
const take = async (iterator: AsyncIterator<Frame>, count: number): Promise<Array<Frame>> => {
    const frames: Array<Frame> = []
    while (frames.length < count) {
        const next = await iterator.next()
        if (next.done) break
        frames.push(next.value)
    }
    return frames
}

describe("MemoryRealtimeHub", () => {
    it("delivers live frames of a topic to its subscription and none of another topic", async () => {
        const hub = await build()
        const iterator = hub.subscribe(topic)[Symbol.asyncIterator]()

        await hub.publish(other, { id: "x", n: 0 })
        await hub.publish(topic, { id: "1", n: 1 })
        await hub.publish(topic, { id: "2", n: 2 })

        await expect(take(iterator, 2)).resolves.toEqual([
            { id: "1", n: 1 },
            { id: "2", n: 2 },
        ])
    })

    it("resumes after the last frame id the client took, or replays what it retains when that id is gone", async () => {
        const hub = await build()
        await hub.publish(topic, { id: "1", n: 1 })
        await hub.publish(topic, { id: "2", n: 2 })
        await hub.publish(topic, { id: "3", n: 3 })

        await expect(take(hub.subscribe(topic, { after: "1" })[Symbol.asyncIterator](), 2)).resolves.toEqual([
            { id: "2", n: 2 },
            { id: "3", n: 3 },
        ])
        await expect(take(hub.subscribe(topic, { after: "gone" })[Symbol.asyncIterator](), 1)).resolves.toEqual([
            { id: "1", n: 1 },
        ])
    })

    it("retains a bounded replay per topic", async () => {
        const hub = await build()
        for (let n = 0; n <= REPLAY_FRAMES_MAX; n += 1) await hub.publish(topic, { id: String(n), n })

        const replay = await take(hub.subscribe(topic, { after: "gone" })[Symbol.asyncIterator](), 1)

        expect(replay).toEqual([{ id: "1", n: 1 }])
    })

    it("releases a subscription when its iterator is returned, ending a pending take", async () => {
        const hub = await build()
        const iterator = hub.subscribe(topic)[Symbol.asyncIterator]()
        const pending = iterator.next()

        expect(hub.listenerCount(topic.name)).toBe(1)
        await iterator.return?.()

        await expect(pending).resolves.toEqual({ done: true, value: undefined })
        await expect(iterator.next()).resolves.toEqual({ done: true, value: undefined })
        expect(hub.listenerCount(topic.name)).toBe(0)
        expect(hub.listenerCount("never")).toBe(0)
    })
})
