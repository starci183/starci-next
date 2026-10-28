import { Test } from "@nestjs/testing"
import { mock } from "@starci/jest-preset"
import { LOGGER } from "@modules/platform/logging"
import type { Logger } from "@modules/platform/logging"
import { Secret } from "@modules/platform/config"
import { PayosClient } from "./payos.client"
import { PayosError, PayosErrorCode } from "./errors/payos.error"
import { PayosLogEvent } from "./payos.log-events"
import { InjectPayosClient, PAYOS_CLIENT } from "./payos.decorators"
import type { PayosConfirmationInput } from "./payos.contracts"
import { PAYOS_OPTIONS } from "./payos.options-token"
import type { PayosOptions } from "./payos.options"
import { payosDataSignature } from "./policies/payos-confirmation.policy"

const CHECKSUM = "spec-checksum-key"

const webhookData = {
    orderCode: 424242,
    amount: 99000,
    reference: "FT00424242",
    description: "Premium",
    paymentLinkId: "pl-1",
}

const posted = (
    data: Record<string, unknown> = webhookData,
    envelope: Record<string, unknown> = {},
): PayosConfirmationInput => ({
    body: {
        code: "00",
        desc: "success",
        success: true,
        data,
        signature: payosDataSignature(data, CHECKSUM),
        ...envelope,
    },
})

const build = async (channel: PayosOptions | null): Promise<{ client: PayosClient; logger: Logger }> => {
    const logger = mock<Logger>()
    const moduleRef = await Test.createTestingModule({
        providers: [
            PayosClient,
            { provide: PAYOS_OPTIONS, useValue: { channel } },
            { provide: LOGGER, useValue: logger },
        ],
    }).compile()
    return { client: moduleRef.get(PayosClient), logger }
}

const channel = (): PayosOptions => ({ checksumKey: new Secret(CHECKSUM) })

describe("PayosClient", () => {
    it("refuses every delivery when the environment declares no payOS channel", async () => {
        const { client, logger } = await build(null)

        expect(client.verifyConfirmation(posted())).toBeRefused(PayosErrorCode.RailNotConfigured)
        expect(logger.warn).toHaveBeenCalledWith(PayosLogEvent.ConfirmationRefused, {
            code: PayosErrorCode.RailNotConfigured,
        })
    })

    it("refuses a body that is not a readable payOS webhook envelope", async () => {
        const { client } = await build(channel())

        expect(client.verifyConfirmation({ body: "x" })).toBeRefused(PayosErrorCode.PayloadMalformed)
        expect(client.verifyConfirmation({ body: { code: "00", success: true, data: webhookData } })).toBeRefused(
            PayosErrorCode.PayloadMalformed,
        )
    })

    it("refuses a signature that does not prove the checksum key over the data object", async () => {
        const { client } = await build(channel())

        expect(
            client.verifyConfirmation({
                body: { code: "00", desc: "success", success: true, data: webhookData, signature: "deadbeef" },
            }),
        ).toBeRefused(PayosErrorCode.SignatureInvalid)
    })

    it("confirms no payment when the provider code is not the paid code or the envelope reports failure", async () => {
        const { client } = await build(channel())

        expect(client.verifyConfirmation(posted(webhookData, { code: "01" }))).toBeRefused(
            PayosErrorCode.PaymentNotConfirmed,
        )
        expect(client.verifyConfirmation(posted(webhookData, { success: false }))).toBeRefused(
            PayosErrorCode.PaymentNotConfirmed,
        )
    })

    it("refuses a verified envelope whose data names no readable transfer", async () => {
        const { client } = await build(channel())

        expect(client.verifyConfirmation(posted({ ...webhookData, orderCode: "x" }))).toBeRefused(
            PayosErrorCode.PayloadMalformed,
        )
    })

    it("returns the proved confirmation of a signed paid webhook", async () => {
        const { client } = await build(channel())

        expect(client.verifyConfirmation(posted())).toSucceedWith({
            rail: "payos",
            providerRef: "FT00424242",
            orderCode: 424242,
            amount: 99000,
        })
    })
})

describe("PAYOS_CLIENT", () => {
    it("is the token the injector resolves the client under", async () => {
        const client = mock<PayosClient>()
        class Probe {
            constructor(@InjectPayosClient() readonly dep: PayosClient) {}
        }
        const moduleRef = await Test.createTestingModule({
            providers: [Probe, { provide: PAYOS_CLIENT, useValue: client }],
        }).compile()

        expect(moduleRef.get(Probe).dep).toBe(client)
    })
})

describe("PayosError", () => {
    it("carries its code and no prose", () => {
        expect(new PayosError({ code: PayosErrorCode.SignatureInvalid }).code).toBe(PayosErrorCode.SignatureInvalid)
    })
})
