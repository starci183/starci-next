import { Controller, HttpCode, HttpException, HttpStatus, Param, Post, Req, type RawBodyRequest } from "@nestjs/common"
import type { Request } from "express"
import { Public, PublicReason } from "@modules/domain/identity"
import { ProjectProbeSinkService } from "@modules/domain/project"
import { RateBucket, RateLimit, RateTier } from "@modules/platform/http-security"

const headersOf = (request: Request): Record<string, string> =>
    Object.fromEntries(
        Object.entries(request.headers).flatMap(([name, value]) => (typeof value === "string" ? [[name, value]] : [])),
    )

@Controller("probe-sink")
/**
 * POST /probe-sink/:id, where a learner's app delivers the event of a write a server probe made (the outbox concept). The id is the
 * capability: random per flow run, open only while that run waits, and closed afterwards. An unknown, closed or full sink, or an
 * oversized body, is 404; an event kept is 202. Nothing but the body and a few headers is stored, in memory, for the run.
 */
export class ProbeSinkWebhook {
    constructor(private readonly sinks: ProjectProbeSinkService) {}

    /** Keeps the event for the waiting probe. */
    @Post(":id")
    @HttpCode(HttpStatus.ACCEPTED)
    @Public({ reason: PublicReason.ProbeSink })
    @RateLimit(RateTier.Strict, RateBucket.Webhook)
    receive(@Param("id") id: string, @Req() request: RawBodyRequest<Request>): { readonly received: true } {
        const body = request.rawBody?.toString("utf8") ?? ""
        if (!this.sinks.deliver(id, headersOf(request), body)) throw new HttpException("", HttpStatus.NOT_FOUND)
        return { received: true }
    }
}
