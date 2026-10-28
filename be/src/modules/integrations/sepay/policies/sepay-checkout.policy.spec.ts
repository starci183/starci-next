import { createHmac } from "node:crypto"
import { Test } from "@nestjs/testing"
import { sepayCheckoutFields, sepayCheckoutPayable, sepayCheckoutSignature } from "./sepay-checkout.policy"
import type { SepayCheckoutInput } from "../sepay.contracts"

const POLICY: unique symbol = Symbol("sepay.checkout-policy")

const input: SepayCheckoutInput = {
    orderCode: "SUB_1",
    amount: 1000,
    successUrl: "https://app.example/ok",
    errorUrl: "https://app.example/error",
    cancelUrl: "https://app.example/cancel",
}

const subject = async (): Promise<{
    readonly payable: typeof sepayCheckoutPayable
    readonly fields: typeof sepayCheckoutFields
    readonly signature: typeof sepayCheckoutSignature
}> => {
    const moduleRef = await Test.createTestingModule({
        providers: [
            {
                provide: POLICY,
                useFactory: () => ({
                    payable: sepayCheckoutPayable,
                    fields: sepayCheckoutFields,
                    signature: sepayCheckoutSignature,
                }),
            },
        ],
    }).compile()
    return moduleRef.get(POLICY)
}

describe("sepayCheckoutPayable", () => {
    it("accepts a named order with a positive whole amount and three http(s) return addresses", async () => {
        const { payable } = await subject()

        expect(payable(input)).toBe(true)
        expect(payable({ ...input, successUrl: "http://localhost:3000/ok" })).toBe(true)
    })

    it.each([
        ["orderCode", ""],
        ["amount", 0],
        ["amount", -5],
        ["amount", 1.5],
        ["amount", Number.NaN],
        ["successUrl", "not a url"],
        ["errorUrl", "ftp://app.example/error"],
        ["cancelUrl", ""],
    ] as const)("rejects %s %s", async (field, value) => {
        const { payable } = await subject()

        expect(payable({ ...input, [field]: value })).toBe(false)
    })
})

describe("sepayCheckoutFields", () => {
    it("orders the fields as the specification signs them and omits an absent description", async () => {
        const { fields } = await subject()

        expect(Object.keys(fields(input, "M1"))).toEqual([
            "merchant",
            "operation",
            "order_invoice_number",
            "order_amount",
            "currency",
            "success_url",
            "error_url",
            "cancel_url",
        ])
        expect(Object.keys(fields({ ...input, description: "d" }, "M1"))).toContain("order_description")
    })
})

describe("sepayCheckoutSignature", () => {
    it("is the base64 HMAC-SHA256 of the comma-joined field=value pairs", async () => {
        const { signature } = await subject()

        expect(signature({ a: "1", b: "2" }, "k")).toBe(createHmac("sha256", "k").update("a=1,b=2").digest("base64"))
    })
})
