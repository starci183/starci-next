import { mock } from "@starci/jest-preset"
import { HttpStatus, type RawBodyRequest } from "@nestjs/common"
import type { Request } from "express"
import { ProjectProbeSinkService } from "@modules/domain/project"
import { RateBucket, RateTier } from "@modules/platform/http-security"
import { ProbeSinkWebhook } from "./probe-sink.webhook"

const requestOf = (rawBody: Buffer | undefined, headers: Request["headers"] = {}) =>
    mock<RawBodyRequest<Request>>({ ...(rawBody === undefined ? {} : { rawBody }), headers })

describe("ProbeSinkWebhook", () => {
    describe("receive", () => {
        it("hands the body and the string headers of the delivery to the sink and acknowledges", () => {
            const sinks = mock<ProjectProbeSinkService>()
            sinks.deliver.mockReturnValue(true)
            const door = new ProbeSinkWebhook(sinks)

            expect(
                door.receive(
                    "sink-1",
                    requestOf(Buffer.from('{"event":1}'), { "content-type": "application/json", "x-list": ["a", "b"] }),
                ),
            ).toEqual({ received: true })

            expect(sinks.deliver).toHaveBeenCalledWith("sink-1", { "content-type": "application/json" }, '{"event":1}')
        })

        it("delivers an empty body when the request carries no raw body", () => {
            const sinks = mock<ProjectProbeSinkService>()
            sinks.deliver.mockReturnValue(true)
            const door = new ProbeSinkWebhook(sinks)

            door.receive("sink-1", requestOf(undefined))

            expect(sinks.deliver).toHaveBeenCalledWith("sink-1", {}, "")
        })

        it("answers 404 for an unknown, closed or full sink, or an oversized body", () => {
            const sinks = mock<ProjectProbeSinkService>()
            sinks.deliver.mockReturnValue(false)
            const door = new ProbeSinkWebhook(sinks)

            expect(() => door.receive("gone", requestOf(Buffer.from("{}")))).toThrow(
                expect.objectContaining({ status: HttpStatus.NOT_FOUND }),
            )
        })

        it("answers 202 in the webhook window of the strict tier", () => {
            expect(Reflect.getMetadata("__httpCode__", ProbeSinkWebhook.prototype.receive)).toBe(HttpStatus.ACCEPTED)
            expect(Reflect.getMetadata("platform.http-security.rate-tier", ProbeSinkWebhook.prototype.receive)).toBe(
                RateTier.Strict,
            )
            expect(Reflect.getMetadata("platform.http-security.rate-bucket", ProbeSinkWebhook.prototype.receive)).toBe(
                RateBucket.Webhook,
            )
        })
    })
})
