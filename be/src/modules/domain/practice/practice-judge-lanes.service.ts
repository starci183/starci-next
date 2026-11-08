import { Injectable } from "@nestjs/common"
import { DEFAULT_CONCURRENCY } from "./practice.config"
import { InjectPracticeOptions } from "./practice.decorators"
import type { PracticeOptions } from "./practice.options"

/** One lane of the queue: the jobs chained on it run one after another. */
interface Lane {
    /** Settles when the last job given to the lane settles; it never rejects. */
    tail: Promise<void>
    /** The jobs given to the lane that have not settled: the running one and the ones behind it. */
    pending: number
}

@Injectable()
/**
 * The lanes in front of the judge: `concurrency` lanes, so at most that many jobs run at once on this instance. A job joins the
 * lane with the fewest unsettled jobs, and the jobs of a lane run in arrival order.
 */
export class PracticeJudgeLanesService {
    private readonly lanes: ReadonlyArray<Lane>

    constructor(@InjectPracticeOptions() options: PracticeOptions) {
        const count = Math.max(1, options.concurrency ?? DEFAULT_CONCURRENCY)
        this.lanes = Array.from({ length: count }, () => ({ tail: Promise.resolve(), pending: 0 }))
    }

    /** Runs the job when its lane is free and answers its result; a failing job frees its lane like any other. */
    run<T>(job: () => Promise<T>): Promise<T> {
        const lane = this.lanes.reduce((best, candidate) => (candidate.pending < best.pending ? candidate : best))
        lane.pending += 1
        const result = lane.tail.then(job)
        lane.tail = result.then(
            () => this.settle(lane),
            () => this.settle(lane),
        )
        return result
    }

    /** How many jobs run now. */
    get running(): number {
        return this.lanes.filter((lane) => lane.pending > 0).length
    }

    /** How many jobs wait for a lane. */
    get queued(): number {
        return this.lanes.reduce((total, lane) => total + Math.max(0, lane.pending - 1), 0)
    }

    private settle(lane: Lane): void {
        lane.pending -= 1
    }
}
