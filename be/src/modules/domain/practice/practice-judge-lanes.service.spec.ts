import { Test } from "@nestjs/testing"
import { PracticeJudgeLanesService } from "./practice-judge-lanes.service"
import { PRACTICE_OPTIONS } from "./practice.decorators"
import type { PracticeOptions } from "./practice.options"

interface Gate {
    readonly promise: Promise<void>
    readonly open: () => void
    readonly fail: (cause: Error) => void
}

const gate = (): Gate => {
    let open: () => void = () => undefined
    let fail: (cause: Error) => void = () => undefined
    const promise = new Promise<void>((resolve, reject) => {
        open = resolve
        fail = reject
    })
    return { promise, open, fail }
}

const settle = (): Promise<void> => new Promise((resolve) => setImmediate(resolve))

const build = async (options: PracticeOptions): Promise<PracticeJudgeLanesService> => {
    const practiceOptions: PracticeOptions = { ...options }
    const moduleRef = await Test.createTestingModule({
        providers: [PracticeJudgeLanesService, { provide: PRACTICE_OPTIONS, useValue: practiceOptions }],
    }).compile()
    return moduleRef.get(PracticeJudgeLanesService)
}

describe("PracticeJudgeLanesService run", () => {
    it("runs a job at once when a slot is free and answers its result", async () => {
        const queue = await build({ concurrency: 2 })

        await expect(queue.run(() => Promise.resolve("done"))).resolves.toBe("done")

        expect(queue.running).toBe(0)
        expect(queue.queued).toBe(0)
    })

    it("holds a job back while every slot is busy and starts it in arrival order when one frees", async () => {
        const queue = await build({ concurrency: 1 })
        const first = gate()
        const order: Array<string> = []
        const a = queue.run(() => first.promise.then(() => order.push("a")))
        const b = queue.run(() => Promise.resolve(order.push("b")))
        const c = queue.run(() => Promise.resolve(order.push("c")))
        await settle()

        expect(queue.running).toBe(1)
        expect(queue.queued).toBe(2)
        expect(order).toEqual([])

        first.open()
        await Promise.all([a, b, c])

        expect(order).toEqual(["a", "b", "c"])
        expect(queue.running).toBe(0)
        expect(queue.queued).toBe(0)
    })

    it("never runs more jobs at once than the concurrency names", async () => {
        const queue = await build({ concurrency: 2 })
        const gates = [gate(), gate(), gate(), gate()]
        let peak = 0
        const jobs = gates.map((entry) =>
            queue.run(async () => {
                peak = Math.max(peak, queue.running)
                await entry.promise
            }),
        )
        await settle()

        expect(queue.running).toBe(2)
        expect(queue.queued).toBe(2)

        gates.forEach((entry) => entry.open())
        await Promise.all(jobs)

        expect(peak).toBe(2)
    })

    it("frees the slot of a failing job and rejects with its error", async () => {
        const queue = await build({ concurrency: 1 })
        const failing = gate()
        const bad = queue.run(() => failing.promise)
        const next = queue.run(() => Promise.resolve("after"))
        failing.fail(new Error("boom"))

        await expect(bad).rejects.toThrow("boom")
        await expect(next).resolves.toBe("after")
        expect(queue.running).toBe(0)
    })

    it("runs four at once when the app named no concurrency", async () => {
        const queue = await build({})
        const gates = Array.from({ length: 5 }, () => gate())
        const jobs = gates.map((entry) => queue.run(() => entry.promise))
        await settle()

        expect(queue.running).toBe(4)
        expect(queue.queued).toBe(1)

        gates.forEach((entry) => entry.open())
        await Promise.all(jobs)
    })
})
