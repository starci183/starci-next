import { createHmac } from "node:crypto"
import { Test } from "@nestjs/testing"
import { mock } from "@starci/jest-preset"
import { LOGGER } from "@modules/platform/logging"
import type { Logger } from "@modules/platform/logging"
import { Secret } from "@modules/platform/config"
import { SepayClient } from "./sepay.client"
import { SepayError, SepayErrorCode } from "./errors/sepay.error"
import { SepayLogEvent } from "./sepay.log-events"
import { InjectSepayClient, SEPAY_CLIENT, SEPAY_OPTIONS } from "./sepay.decorators"
import type { SepayCheckoutInput, SepayConfirmationHeaders, SepayConfirmationInput } from "./sepay.contracts"
import type { SepayOptions } from "./sepay.options"

const SECRET_KEY = "spec-ipn-secret-key"

const ipn = {
    timestamp: 1_757_058_220,
    notification_type: "ORDER_PAID",
    order: {
        id: "e2c195be-c721-47eb-b323-99ab24e52d85",
        order_id: "NPSETVI00101000042R",
        order_status: "CAPTURED",
        order_currency: "VND",
        order_amount: "229000.00",
        order_invoice_number: "SUB_202509_001",
    },
    transaction: {
        id: "384c66dd-41e6-4316-a544-b4141682595c",
        transaction_id: "68ba94ac80123",
        transaction_status: "APPROVED",
        transaction_amount: "229000",
        transaction_currency: "VND",
    },
    customer: { id: "bae12d2f-0580-4669-8841-cc35cf671613", customer_id: "CUST_001" },
}

const delivery = (body: unknown = ipn, headers: SepayConfirmationHeaders = {}): SepayConfirmationInput => ({
    body,
    headers: { "x-secret-key": SECRET_KEY, ...headers },
})

const confirmation = {
    rail: "sepay",
    providerRef: "68ba94ac80123",
    orderCode: "SUB_202509_001",
    amount: 229000,
}

const build = async (channel: SepayOptions | null): Promise<{ client: SepayClient; logger: Logger }> => {
    const logger = mock<Logger>()
    const moduleRef = await Test.createTestingModule({
        providers: [
            SepayClient,
            { provide: SEPAY_OPTIONS, useValue: { channel } },
            { provide: LOGGER, useValue: logger },
        ],
    }).compile()
    return { client: moduleRef.get(SepayClient), logger }
}

const SIGNING_KEY = "spec-signing-secret-key"
const CHECKOUT_URL = "https://pay-sandbox.sepay.vn/v1/checkout/init"

const channel = (): SepayOptions => ({
    secretKey: new Secret(SECRET_KEY),
    merchantId: "SP-TEST-1",
    signingKey: new Secret(SIGNING_KEY),
    checkoutUrl: CHECKOUT_URL,
})

const checkoutInput: SepayCheckoutInput = {
    orderCode: "SUB_1",
    amount: 229000,
    description: "Premium",
    successUrl: "https://app.example/ok",
    errorUrl: "https://app.example/error",
    cancelUrl: "https://app.example/cancel",
}

describe("SepayClient.createCheckout", () => {
    it("refuses every checkout when the environment declares no SePay channel", async () => {
        const { client, logger } = await build(null)

        expect(client.createCheckout(checkoutInput)).toBeRefused(SepayErrorCode.RailNotConfigured)
        expect(logger.warn).toHaveBeenCalledWith(SepayLogEvent.CheckoutRefused, {
            code: SepayErrorCode.RailNotConfigured,
        })
    })

    it("refuses an order it cannot sign", async () => {
        const { client } = await build(channel())

        expect(client.createCheckout({ ...checkoutInput, amount: 0 })).toBeRefused(SepayErrorCode.CheckoutInvalid)
    })

    it("returns the signed one-time-payment form without exposing the signing secret", async () => {
        const { client } = await build(channel())
        const signed =
            "merchant=SP-TEST-1,operation=PURCHASE,order_invoice_number=SUB_1,order_amount=229000,currency=VND," +
            "order_description=Premium,success_url=https://app.example/ok,error_url=https://app.example/error," +
            "cancel_url=https://app.example/cancel"

        const outcome = client.createCheckout(checkoutInput)

        expect(outcome).toSucceedWith({
            rail: "sepay",
            orderCode: "SUB_1",
            amount: 229000,
            redirect: {
                method: "POST",
                url: CHECKOUT_URL,
                fields: {
                    merchant: "SP-TEST-1",
                    operation: "PURCHASE",
                    order_invoice_number: "SUB_1",
                    order_amount: "229000",
                    currency: "VND",
                    order_description: "Premium",
                    success_url: "https://app.example/ok",
                    error_url: "https://app.example/error",
                    cancel_url: "https://app.example/cancel",
                    signature: createHmac("sha256", SIGNING_KEY).update(signed, "utf8").digest("base64"),
                },
            },
        })
        expect(JSON.stringify(outcome)).not.toContain(SIGNING_KEY)
    })
})

describe("SepayClient", () => {
    it("refuses every delivery when the environment declares no SePay channel", async () => {
        const { client, logger } = await build(null)

        expect(client.verifyConfirmation(delivery())).toBeRefused(SepayErrorCode.RailNotConfigured)
        expect(logger.warn).toHaveBeenCalledWith(SepayLogEvent.ConfirmationRefused, {
            code: SepayErrorCode.RailNotConfigured,
        })
    })

    it("refuses a delivery whose secret key is absent or wrong, before any body field is trusted", async () => {
        const { client } = await build(channel())

        expect(client.verifyConfirmation({ body: ipn, headers: {} })).toBeRefused(SepayErrorCode.SecretInvalid)
        expect(
            client.verifyConfirmation({ body: ipn, headers: { "x-secret-key": `${SECRET_KEY}-wrong` } }),
        ).toBeRefused(SepayErrorCode.SecretInvalid)
    })

    it("refuses a body that is not a readable SePay IPN notification", async () => {
        const { client } = await build(channel())

        expect(client.verifyConfirmation(delivery("x"))).toBeRefused(SepayErrorCode.PayloadMalformed)
        expect(client.verifyConfirmation(delivery({ ...ipn, timestamp: "soon" }))).toBeRefused(
            SepayErrorCode.PayloadMalformed,
        )
        expect(client.verifyConfirmation(delivery({ ...ipn, order: [ipn.order] }))).toBeRefused(
            SepayErrorCode.PayloadMalformed,
        )
    })

    it("confirms no payment when the notification is not an ORDER_PAID", async () => {
        const { client } = await build(channel())

        expect(client.verifyConfirmation(delivery({ ...ipn, notification_type: "TRANSACTION_VOID" }))).toBeRefused(
            SepayErrorCode.PaymentNotConfirmed,
        )
    })

    it("refuses a verified notification whose order names no readable paid order", async () => {
        const { client } = await build(channel())

        expect(
            client.verifyConfirmation(delivery({ ...ipn, order: { ...ipn.order, order_invoice_number: "" } })),
        ).toBeRefused(SepayErrorCode.PayloadMalformed)
    })

    it("returns the proved confirmation of an authenticated ORDER_PAID notification", async () => {
        const { client } = await build(channel())

        expect(client.verifyConfirmation(delivery())).toSucceedWith(confirmation)
    })
})

describe("SEPAY_CLIENT", () => {
    it("is the token the injector resolves the client under", async () => {
        const client = mock<SepayClient>()
        class Probe {
            constructor(@InjectSepayClient() readonly dep: SepayClient) {}
        }
        const moduleRef = await Test.createTestingModule({
            providers: [Probe, { provide: SEPAY_CLIENT, useValue: client }],
        }).compile()

        expect(moduleRef.get(Probe).dep).toBe(client)
    })
})

describe("SepayError", () => {
    it("carries its code and no prose", () => {
        expect(new SepayError({ code: SepayErrorCode.SecretInvalid }).code).toBe(SepayErrorCode.SecretInvalid)
    })
})
