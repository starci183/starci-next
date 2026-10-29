import { createHmac } from "node:crypto"
import { Test } from "@nestjs/testing"
import { mock } from "@starci/jest-preset"
import { LOGGER } from "@modules/platform/logging"
import type { Logger } from "@modules/platform/logging"
import { Secret } from "@modules/platform/config"
import { HTTP_CLIENT } from "@modules/platform/http"
import type { HttpClient, HttpResponse } from "@modules/platform/http"
import { PayosClient } from "./payos.client"
import { PayosError, PayosErrorCode } from "./errors/payos.error"
import { PayosLogEvent } from "./payos.log-events"
import { InjectPayosClient, PAYOS_CLIENT, PAYOS_OPTIONS } from "./payos.decorators"
import type { PayosCheckoutInput, PayosConfirmationInput } from "./payos.contracts"
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

const build = async (
    channel: PayosOptions | null,
): Promise<{ client: PayosClient; logger: Logger; http: jest.Mocked<HttpClient> }> => {
    const logger = mock<Logger>()
    const http = mock<HttpClient>()
    const moduleRef = await Test.createTestingModule({
        providers: [
            PayosClient,
            { provide: PAYOS_OPTIONS, useValue: { channel } },
            { provide: LOGGER, useValue: logger },
            { provide: HTTP_CLIENT, useValue: http },
        ],
    }).compile()
    return { client: moduleRef.get(PayosClient), logger, http }
}

const API_KEY = "spec-api-key"

const channel = (): PayosOptions => ({
    checksumKey: new Secret(CHECKSUM),
    clientId: "spec-client-id",
    apiKey: new Secret(API_KEY),
    apiBase: "https://payos.example",
    timeoutMs: 5000,
})

const checkoutInput: PayosCheckoutInput = {
    orderCode: 424242,
    amount: 99000,
    description: "Premium",
    returnUrl: "https://app.example/return",
    cancelUrl: "https://app.example/cancel",
    correlationId: "corr-1",
}

const linkData = {
    orderCode: 424242,
    amount: 99000,
    paymentLinkId: "pl-1",
    checkoutUrl: "https://pay.payos.vn/web/pl-1",
    status: "PENDING",
}

const answer = (data: Record<string, unknown> = linkData, envelope: Record<string, unknown> = {}): HttpResponse => ({
    status: 200,
    body: { code: "00", desc: "success", data, signature: payosDataSignature(data, CHECKSUM), ...envelope },
})

describe("PayosClient.createCheckout", () => {
    it("refuses every checkout when the environment declares no payOS channel", async () => {
        const { client, http, logger } = await build(null)

        await expect(client.createCheckout(checkoutInput)).resolves.toBeRefused(PayosErrorCode.RailNotConfigured)
        expect(http.request).not.toHaveBeenCalled()
        expect(logger.warn).toHaveBeenCalledWith(PayosLogEvent.CheckoutRefused, {
            code: PayosErrorCode.RailNotConfigured,
        })
    })

    it("refuses an order it cannot sign without calling payOS", async () => {
        const { client, http } = await build(channel())

        await expect(client.createCheckout({ ...checkoutInput, orderCode: 0 })).resolves.toBeRefused(
            PayosErrorCode.CheckoutInvalid,
        )
        expect(http.request).not.toHaveBeenCalled()
    })

    it("posts the signed payment request with the channel credentials and the caller correlation id", async () => {
        const { client, http } = await build(channel())
        http.request.mockResolvedValue(answer())
        const signed =
            "amount=99000&cancelUrl=https://app.example/cancel&description=Premium&orderCode=424242" +
            "&returnUrl=https://app.example/return"

        await client.createCheckout(checkoutInput)

        expect(http.request).toHaveBeenCalledWith({
            correlationId: "corr-1",
            method: "POST",
            url: "https://payos.example/v2/payment-requests",
            headers: { "x-client-id": "spec-client-id", "x-api-key": API_KEY },
            body: {
                orderCode: 424242,
                amount: 99000,
                description: "Premium",
                returnUrl: "https://app.example/return",
                cancelUrl: "https://app.example/cancel",
                signature: createHmac("sha256", CHECKSUM).update(signed, "utf8").digest("hex"),
            },
            timeoutMs: 5000,
        })
    })

    it("answers unavailable when payOS cannot be reached and proves no request exists for the order", async () => {
        const { client, http, logger } = await build(channel())
        const cause = new Error("down")
        http.request
            .mockRejectedValueOnce(cause)
            .mockResolvedValueOnce({ status: 404, body: { code: "101", desc: "none" } })

        await expect(client.createCheckout(checkoutInput)).resolves.toBeRefused(PayosErrorCode.Unavailable)
        expect(logger.error).toHaveBeenCalledWith(PayosLogEvent.CheckoutRefused, cause, {
            code: PayosErrorCode.Unavailable,
        })
    })
})

describe("PayosClient.createCheckout reconciliation", () => {
    const stateData = { id: "pl-1", orderCode: 424242, amount: 99000, status: "PENDING" }
    const unknown = { kind: "refused", code: PayosErrorCode.CheckoutOutcomeUnknown, params: { orderCode: 424242 } }
    const found = {
        rail: "payos",
        providerRef: "pl-1",
        orderCode: 424242,
        amount: 99000,
        redirect: { method: "GET", url: "https://pay.payos.vn/web/pl-1" },
    }

    it("reads the request back by order code with the same credentials, correlation id and timeout", async () => {
        const { client, http } = await build(channel())
        http.request.mockRejectedValueOnce(new Error("timeout")).mockResolvedValueOnce(answer(stateData))

        await client.createCheckout(checkoutInput)

        expect(http.request).toHaveBeenCalledTimes(2)
        expect(http.request).toHaveBeenLastCalledWith({
            correlationId: "corr-1",
            method: "GET",
            url: "https://payos.example/v2/payment-requests/424242",
            headers: { "x-client-id": "spec-client-id", "x-api-key": API_KEY },
            timeoutMs: 5000,
        })
    })

    it("answers the checkout of a payable request found after a lost create answer", async () => {
        const { client, http } = await build(channel())
        http.request.mockRejectedValueOnce(new Error("timeout")).mockResolvedValueOnce(answer(stateData))

        await expect(client.createCheckout(checkoutInput)).resolves.toSucceedWith(found)
    })

    it("answers the checkout of the existing request when payOS says the order code already has one", async () => {
        const { client, http } = await build(channel())
        http.request
            .mockResolvedValueOnce({ status: 400, body: { code: "231", desc: "exists" } })
            .mockResolvedValueOnce(answer(stateData))

        await expect(client.createCheckout(checkoutInput)).resolves.toSucceedWith(found)
    })

    it("keeps the refusal when the order code is reported existing but the read proves it absent", async () => {
        const { client, http } = await build(channel())
        http.request
            .mockResolvedValueOnce({ status: 400, body: { code: "231", desc: "exists" } })
            .mockResolvedValueOnce({ status: 404, body: { code: "101", desc: "none" } })

        await expect(client.createCheckout(checkoutInput)).resolves.toBeRefused(PayosErrorCode.CheckoutRefused)
    })

    it("reconciles a create whose answer body is JSON null", async () => {
        const { client, http } = await build(channel())
        http.request.mockResolvedValueOnce({ status: 200, body: null }).mockResolvedValueOnce(answer(stateData))

        await expect(client.createCheckout(checkoutInput)).resolves.toSucceedWith(found)
    })

    it("refuses with the unknown outcome and the order code when the read itself fails", async () => {
        const { client, http, logger } = await build(channel())
        const cause = new Error("down")
        http.request.mockRejectedValue(cause)

        await expect(client.createCheckout(checkoutInput)).resolves.toEqual(unknown)
        expect(logger.error).toHaveBeenCalledWith(PayosLogEvent.CheckoutRefused, cause, {
            code: PayosErrorCode.CheckoutOutcomeUnknown,
        })
        expect(logger.warn).toHaveBeenCalledWith(PayosLogEvent.CheckoutRefused, {
            code: PayosErrorCode.CheckoutOutcomeUnknown,
        })
    })
})

describe("PayosClient.createCheckout unprovable reconciliation", () => {
    const stateData = { id: "pl-1", orderCode: 424242, amount: 99000, status: "PENDING" }
    const unknown = { kind: "refused", code: PayosErrorCode.CheckoutOutcomeUnknown, params: { orderCode: 424242 } }

    it.each([
        ["a read answer that is not a payOS envelope", { status: 200, body: "x" }],
        ["a provider refusal other than not found", { status: 400, body: { code: "20", desc: "bad" } }],
        ["an answer without signed data", { status: 200, body: { code: "00", signature: "x" } }],
        ["an answer without a signature", { status: 200, body: { code: "00", data: stateData } }],
        ["a signature that does not prove the checksum key", answer(stateData, { signature: "deadbeef" })],
        ["a request of another order", answer({ ...stateData, orderCode: 1 })],
        ["a request of another amount", answer({ ...stateData, amount: 1 })],
        ["a request without a payment link id", answer({ ...stateData, id: "" })],
        ["a cancelled request", answer({ ...stateData, status: "CANCELLED" })],
        ["an expired request", answer({ ...stateData, status: "EXPIRED" })],
        ["a paid request", answer({ ...stateData, status: "PAID" })],
    ])("refuses with the unknown outcome on %s", async (_name, response) => {
        const { client, http } = await build(channel())
        http.request.mockRejectedValueOnce(new Error("timeout")).mockResolvedValueOnce(response)

        await expect(client.createCheckout(checkoutInput)).resolves.toEqual(unknown)
    })
})

describe("PayosClient.createCheckout answers", () => {
    it("refuses an answer that is not a readable payOS envelope or lacks its signed data", async () => {
        const { client, http } = await build(channel())

        http.request.mockResolvedValue({ status: 200, body: undefined })
        await expect(client.createCheckout(checkoutInput)).resolves.toBeRefused(PayosErrorCode.PayloadMalformed)
        http.request.mockResolvedValue({ status: 200, body: { code: "00", data: linkData } })
        await expect(client.createCheckout(checkoutInput)).resolves.toBeRefused(PayosErrorCode.PayloadMalformed)
        http.request.mockResolvedValue({ status: 200, body: { code: "00", signature: "x" } })
        await expect(client.createCheckout(checkoutInput)).resolves.toBeRefused(PayosErrorCode.PayloadMalformed)
    })

    it("answers a provider refusal as a typed code", async () => {
        const { client, http } = await build(channel())
        http.request.mockResolvedValue({ status: 400, body: { code: "20", desc: "Invalid params" } })

        await expect(client.createCheckout(checkoutInput)).resolves.toBeRefused(PayosErrorCode.CheckoutRefused)
    })

    it("refuses an answer whose signature does not prove the checksum key", async () => {
        const { client, http } = await build(channel())
        http.request.mockResolvedValue(answer(linkData, { signature: "deadbeef" }))

        await expect(client.createCheckout(checkoutInput)).resolves.toBeRefused(PayosErrorCode.SignatureInvalid)
    })

    it("refuses a signed answer that is not the payment link of the order asked for", async () => {
        const { client, http } = await build(channel())
        http.request.mockResolvedValue(answer({ ...linkData, orderCode: 1 }))

        await expect(client.createCheckout(checkoutInput)).resolves.toBeRefused(PayosErrorCode.PayloadMalformed)
    })

    it("returns the checkout URL with the payment link id as provider reference", async () => {
        const { client, http } = await build(channel())
        http.request.mockResolvedValue(answer())

        await expect(client.createCheckout(checkoutInput)).resolves.toSucceedWith({
            rail: "payos",
            providerRef: "pl-1",
            orderCode: 424242,
            amount: 99000,
            redirect: { method: "GET", url: "https://pay.payos.vn/web/pl-1" },
        })
    })
})

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
