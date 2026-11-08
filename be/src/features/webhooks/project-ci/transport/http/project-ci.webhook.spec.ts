import { mock } from "@starci/jest-preset"
import type { RawBodyRequest } from "@nestjs/common"
import type { Request } from "express"
import { ProjectCiService } from "@modules/domain/project"
import { RateBucket, RateTier } from "@modules/platform/http-security"
import { ProjectCiWebhook } from "./project-ci.webhook"

const REQUEST = mock<RawBodyRequest<Request>>({ rawBody: Buffer.from("{}") })

describe("ProjectCiWebhook", () => {
    describe("receive", () => {
        it("hands the raw body, the three proof headers and the OIDC token to the one domain intake", async () => {
            const runs = mock<ProjectCiService>()
            const door = new ProjectCiWebhook(runs)

            await expect(
                door.receive(REQUEST, "project-1", "1790000000000", "sha256=abc", "oidc.jwt"),
            ).resolves.toEqual({
                received: true,
            })

            expect(runs.recordRun).toHaveBeenCalledTimes(1)
            expect(runs.recordRun).toHaveBeenCalledWith({
                rawBody: REQUEST.rawBody,
                projectId: "project-1",
                timestamp: "1790000000000",
                signature: "sha256=abc",
                oidcToken: "oidc.jwt",
            })
        })

        it("answers 200 in the webhook window of the strict tier", () => {
            expect(Reflect.getMetadata("__httpCode__", ProjectCiWebhook.prototype.receive)).toBe(200)
            expect(Reflect.getMetadata("platform.http-security.rate-tier", ProjectCiWebhook.prototype.receive)).toBe(
                RateTier.Strict,
            )
            expect(Reflect.getMetadata("platform.http-security.rate-bucket", ProjectCiWebhook.prototype.receive)).toBe(
                RateBucket.Webhook,
            )
        })

        it("propagates the intake's refusal without an acknowledgement of its own", async () => {
            const runs = mock<ProjectCiService>()
            runs.recordRun.mockRejectedValue(new Error("refused"))
            const door = new ProjectCiWebhook(runs)

            await expect(door.receive(REQUEST, undefined, undefined, undefined, undefined)).rejects.toThrow("refused")
        })
    })
})
