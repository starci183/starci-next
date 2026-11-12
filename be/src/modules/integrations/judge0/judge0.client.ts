import { Injectable } from "@nestjs/common"
import { eachInOrder } from "@modules/platform/primitives"
import { InjectClock, type Clock } from "@modules/platform/clock"
import type { HttpClient } from "@modules/platform/http"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { InjectTimer, type Timer } from "@modules/platform/retry"
import { Judge0Error, Judge0ErrorCode } from "./errors/judge0.error"
import type { Judge0Case, Judge0CaseResult, Judge0RunRequest } from "./judge0.contracts"
import { InjectJudge0Http, InjectJudge0Options } from "./judge0.decorators"
import { Judge0LogEvent } from "./judge0.log-events"
import type { Judge0ModuleOptions, Judge0Options } from "./judge0.options"
import type { Judge0Gateway } from "./judge0.port"
import {
    JUDGE0_BATCH_LIMIT,
    JUDGE0_LANGUAGE_IDS,
    JUDGE0_READ_FIELDS,
    judge0BatchBody,
    judge0EntriesOf,
    judge0IsPending,
    judge0ResultsOf,
    judge0StatusIdOf,
    judge0TokensOf,
} from "./policies/judge0-wire.policy"

/** One call to the Judge0 API. */
interface Judge0Call {
    readonly method: "GET" | "POST"
    readonly path: string
    readonly body?: unknown
}

const isSuccess = (status: number): boolean => status >= 200 && status < 300

const chunksOf = <T>(items: ReadonlyArray<T>, size: number): Array<ReadonlyArray<T>> =>
    Array.from({ length: Math.ceil(items.length / size) }, (_unused, index) =>
        items.slice(index * size, (index + 1) * size),
    )

@Injectable()
/** The only speaker of the Judge0 protocol: creates a batch of submissions for the tests of a run and reads the batch until it is judged. */
export class Judge0Client implements Judge0Gateway {
    constructor(
        @InjectJudge0Options() private readonly options: Judge0ModuleOptions,
        @InjectJudge0Http() private readonly http: HttpClient,
        @InjectClock() private readonly clock: Clock,
        @InjectTimer() private readonly timer: Timer,
        @InjectLogger() private readonly logger: Logger,
    ) {}

    /**
     * Judges every test of the request: tests go to Judge0 in batches of at most 20 and each batch is read back until no
     * submission is pending or the deadline passes. A refusal or an unreadable answer is JUDGE0_REJECTED, a lost connection
     * or a deadline is JUDGE0_UNAVAILABLE.
     */
    async run(request: Judge0RunRequest): Promise<ReadonlyArray<Judge0CaseResult>> {
        const endpoint = this.options.judge0
        if (endpoint === null) throw new Judge0Error({ code: Judge0ErrorCode.NotConfigured })
        const languageId = JUDGE0_LANGUAGE_IDS[request.language]
        const startedAt = this.clock.now().getTime()
        const batches: Array<ReadonlyArray<Judge0CaseResult>> = []
        await eachInOrder(chunksOf(request.cases, JUDGE0_BATCH_LIMIT), async (chunk) => {
            batches.push(await this.judge(endpoint, request, chunk, languageId, startedAt))
        })
        const results = batches.flat()
        this.logger.info(Judge0LogEvent.BatchJudged, { cases: results.length, language: request.language })
        return results
    }

    private async judge(
        endpoint: Judge0Options,
        request: Judge0RunRequest,
        cases: ReadonlyArray<Judge0Case>,
        languageId: number,
        startedAt: number,
    ): Promise<ReadonlyArray<Judge0CaseResult>> {
        const created = await this.call(endpoint, request.correlationId, {
            method: "POST",
            path: "/submissions/batch?base64_encoded=true",
            body: judge0BatchBody(request, cases, languageId),
        })
        const tokens = judge0TokensOf(created, cases.length)
        if (tokens === null) throw this.refuse(Judge0ErrorCode.Rejected)
        const query = `base64_encoded=true&fields=${JUDGE0_READ_FIELDS}&tokens=${tokens.join(",")}`
        for (;;) {
            const read = await this.call(endpoint, request.correlationId, {
                method: "GET",
                path: `/submissions/batch?${query}`,
            })
            const entries = judge0EntriesOf(read, tokens.length)
            if (entries === null) throw this.refuse(Judge0ErrorCode.Rejected)
            if (entries.some((entry) => judge0StatusIdOf(entry) === null)) throw this.refuse(Judge0ErrorCode.Rejected)
            if (!entries.some((entry) => judge0IsPending(entry))) return judge0ResultsOf(entries)
            if (this.clock.now().getTime() - startedAt + endpoint.pollIntervalMs > endpoint.deadlineMs)
                throw this.refuse(Judge0ErrorCode.Unavailable)
            await new Promise<void>((resolve) => this.timer.schedule(resolve, endpoint.pollIntervalMs))
        }
    }

    private async call(endpoint: Judge0Options, correlationId: string, call: Judge0Call): Promise<unknown> {
        const answered = await this.http
            .request({
                correlationId,
                method: call.method,
                url: `${endpoint.baseUrl}${call.path}`,
                headers: { "X-Auth-Token": endpoint.authToken.reveal() },
                ...(call.body === undefined ? {} : { body: call.body }),
                timeoutMs: endpoint.timeoutMs,
            })
            .catch((cause: unknown) => {
                this.logger.error(Judge0LogEvent.CallFailed, cause, { code: Judge0ErrorCode.Unavailable })
                throw new Judge0Error({ code: Judge0ErrorCode.Unavailable, cause })
            })
        if (!isSuccess(answered.status)) {
            const code = answered.status >= 500 ? Judge0ErrorCode.Unavailable : Judge0ErrorCode.Rejected
            throw this.refuse(code, answered.status)
        }
        return answered.body
    }

    /** Logs a refused call under its code, never the source or the answer, and builds the error. */
    private refuse(code: Judge0ErrorCode, status?: number): Judge0Error {
        this.logger.warn(Judge0LogEvent.CallFailed, { code, ...(status === undefined ? {} : { status }) })
        return new Judge0Error({ code })
    }
}
