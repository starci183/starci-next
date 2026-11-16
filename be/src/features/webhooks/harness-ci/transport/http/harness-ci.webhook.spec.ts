import { mock } from "@starci/jest-preset"
import type { RawBodyRequest } from "@nestjs/common"
import type { Request } from "express"
import { HarnessCiService } from "@modules/domain/harness"
import { RateBucket, RateTier } from "@modules/platform/http-security"
import { HarnessCiWebhook } from "./harness-ci.webhook"

const REQUEST = mock<RawBodyRequest<Request>>({ rawBody: Buffer.from("{}") })

describe("HarnessCiWebhook", () => {
    it("hands the binding, the raw body and the OIDC token to the one domain intake and acknowledges", async () => {
        const runs = mock<HarnessCiService>()
        runs.recordRun.mockResolvedValue({ recorded: 2 })
        const door = new HarnessCiWebhook(runs)

        await expect(door.receive(REQUEST, "binding-1", "oidc.jwt")).resolves.toEqual({ received: true })

        expect(runs.recordRun).toHaveBeenCalledWith({
            bindingId: "binding-1",
            rawBody: REQUEST.rawBody,
            oidcToken: "oidc.jwt",
        })
    })

    it("answers 200 in the webhook window of the strict tier", () => {
        expect(Reflect.getMetadata("__httpCode__", HarnessCiWebhook.prototype.receive)).toBe(200)
        expect(Reflect.getMetadata("platform.http-security.rate-tier", HarnessCiWebhook.prototype.receive)).toBe(
            RateTier.Strict,
        )
        expect(Reflect.getMetadata("platform.http-security.rate-bucket", HarnessCiWebhook.prototype.receive)).toBe(
            RateBucket.Webhook,
        )
    })

    it("propagates the refusal of the intake without acknowledging", async () => {
        const runs = mock<HarnessCiService>()
        runs.recordRun.mockRejectedValue(new Error("HARNESS_CI_NOT_ATTESTED"))
        const door = new HarnessCiWebhook(runs)

        await expect(door.receive(REQUEST, "binding-1", undefined)).rejects.toThrow("HARNESS_CI_NOT_ATTESTED")
    })
})
