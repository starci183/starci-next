import { Test } from "@nestjs/testing"
import {
    payosCheckoutPayable,
    payosPaymentAnswerOf,
    payosPaymentLinkOf,
    payosPaymentRequest,
} from "./payos-checkout.policy"
import { payosDataSignature } from "./payos-confirmation.policy"
import type { PayosCheckoutInput } from "../payos.contracts"

const POLICY: unique symbol = Symbol("payos.checkout-policy")

const input: PayosCheckoutInput = {
    orderCode: 7,
    amount: 1000,
    description: "Premium",
    returnUrl: "https://app.example/return",
    cancelUrl: "https://app.example/cancel",
    correlationId: "c",
}

const subject = async (): Promise<{
    readonly payable: typeof payosCheckoutPayable
    readonly request: typeof payosPaymentRequest
    readonly answerOf: typeof payosPaymentAnswerOf
    readonly linkOf: typeof payosPaymentLinkOf
}> => {
    const moduleRef = await Test.createTestingModule({
        providers: [
            {
                provide: POLICY,
                useFactory: () => ({
                    payable: payosCheckoutPayable,
                    request: payosPaymentRequest,
                    answerOf: payosPaymentAnswerOf,
                    linkOf: payosPaymentLinkOf,
                }),
            },
        ],
    }).compile()
    return moduleRef.get(POLICY)
}

describe("payosCheckoutPayable", () => {
    it("accepts a positive whole order code and amount, a description and two http(s) addresses", async () => {
        const { payable } = await subject()

        expect(payable(input)).toBe(true)
        expect(payable({ ...input, returnUrl: "http://localhost:3000/r" })).toBe(true)
    })

    it.each([
        ["orderCode", 0],
        ["orderCode", 1.5],
        ["amount", 0],
        ["amount", 0.5],
        ["description", ""],
        ["returnUrl", "nope"],
        ["cancelUrl", "ftp://app.example/c"],
    ] as const)("rejects %s %s", async (field, value) => {
        const { payable } = await subject()

        expect(payable({ ...input, [field]: value })).toBe(false)
    })
})

describe("payosPaymentRequest", () => {
    it("signs the sorted amount, cancelUrl, description, orderCode and returnUrl fields", async () => {
        const { request } = await subject()
        const { signature, ...fields } = request(input, "k")

        expect(fields).toEqual({
            orderCode: 7,
            amount: 1000,
            description: "Premium",
            returnUrl: input.returnUrl,
            cancelUrl: input.cancelUrl,
        })
        expect(signature).toBe(
            payosDataSignature(
                {
                    amount: 1000,
                    cancelUrl: input.cancelUrl,
                    description: "Premium",
                    orderCode: 7,
                    returnUrl: input.returnUrl,
                },
                "k",
            ),
        )
    })
})

describe("payosPaymentAnswerOf", () => {
    it("is null unless the body is a record with a string code", async () => {
        const { answerOf } = await subject()

        expect(answerOf(undefined)).toBeNull()
        expect(answerOf([])).toBeNull()
        expect(answerOf({ code: 0 })).toBeNull()
    })

    it("reads the data object and signature when present and nulls them when not", async () => {
        const { answerOf } = await subject()

        expect(answerOf({ code: "00", data: { a: 1 }, signature: "s" })).toEqual({
            code: "00",
            data: { a: 1 },
            signature: "s",
        })
        expect(answerOf({ code: "20", data: "x", signature: 1 })).toEqual({ code: "20", data: null, signature: null })
    })
})

describe("payosPaymentLinkOf", () => {
    const data = { paymentLinkId: "pl", checkoutUrl: "https://pay.payos.vn/web/pl", orderCode: 7, amount: 1000 }

    it("reads the link of the order asked for", async () => {
        const { linkOf } = await subject()

        expect(linkOf(data, input)).toEqual({ paymentLinkId: "pl", checkoutUrl: "https://pay.payos.vn/web/pl" })
    })

    it.each([
        ["paymentLinkId", ""],
        ["paymentLinkId", 1],
        ["checkoutUrl", "nope"],
        ["checkoutUrl", 1],
        ["orderCode", 8],
        ["amount", 999],
    ] as const)("is null when %s is %s", async (field, value) => {
        const { linkOf } = await subject()

        expect(linkOf({ ...data, [field]: value }, input)).toBeNull()
    })
})
