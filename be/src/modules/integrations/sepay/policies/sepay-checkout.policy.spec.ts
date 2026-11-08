import { createHmac } from "node:crypto"
import { Test } from "@nestjs/testing"
import {
    SEPAY_SIGNED_FIELDS,
    sepayCheckoutFields,
    sepayCheckoutPayable,
    sepayCheckoutSignature,
    sepaySigningText,
} from "./sepay-checkout.policy"
import type { SepayCheckoutInput } from "../sepay.contracts"

const POLICY: unique symbol = Symbol("sepay.checkout-policy")

const input: SepayCheckoutInput = {
    orderCode: "SUB_1",
    amount: 1000,
    description: "Premium",
    successUrl: "https://app.example/ok",
    errorUrl: "https://app.example/error",
    cancelUrl: "https://app.example/cancel",
}

/**
 * The example of SePay's create-order page (developer.sepay.vn, cong-thanh-toan/API/don-hang/form-thanh-toan): its form
 * values, and the signing text the page prints for them, character for character. The page publishes no signature value,
 * so the vector is the signing text, and the signature is the documented base64 HMAC-SHA256 of exactly that text.
 */
const DOCUMENTED_EXAMPLE: SepayCheckoutInput = {
    orderCode: "INV_20231201_001",
    amount: 100000,
    description: "Payment for order #12345",
    successUrl: "https://yoursite.com/payment/success",
    errorUrl: "https://yoursite.com/payment/error",
    cancelUrl: "https://yoursite.com/payment/cancel",
}
const DOCUMENTED_SIGNING_TEXT =
    "order_amount=100000,merchant=MERCHANT_123,currency=VND,operation=PURCHASE," +
    "order_description=Payment for order #12345,order_invoice_number=INV_20231201_001," +
    "success_url=https://yoursite.com/payment/success,error_url=https://yoursite.com/payment/error," +
    "cancel_url=https://yoursite.com/payment/cancel"

const subject = async (): Promise<{
    readonly payable: typeof sepayCheckoutPayable
    readonly fields: typeof sepayCheckoutFields
    readonly text: typeof sepaySigningText
    readonly signature: typeof sepayCheckoutSignature
}> => {
    const moduleRef = await Test.createTestingModule({
        providers: [
            {
                provide: POLICY,
                useFactory: () => ({
                    payable: sepayCheckoutPayable,
                    fields: sepayCheckoutFields,
                    text: sepaySigningText,
                    signature: sepayCheckoutSignature,
                }),
            },
        ],
    }).compile()
    return moduleRef.get(POLICY)
}

describe("sepayCheckoutPayable", () => {
    it("accepts a named order with a description, a positive whole amount and three http(s) return addresses", async () => {
        const { payable } = await subject()

        expect(payable(input)).toBe(true)
        expect(payable({ ...input, successUrl: "http://localhost:3000/ok" })).toBe(true)
    })

    it.each([
        ["orderCode", ""],
        ["description", " "],
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
    it("lists the signed fields in the specification's fixed order", () => {
        expect(SEPAY_SIGNED_FIELDS).toEqual([
            "order_amount",
            "merchant",
            "currency",
            "operation",
            "order_description",
            "order_invoice_number",
            "customer_id",
            "payment_method",
            "success_url",
            "error_url",
            "cancel_url",
        ])
    })

    it("builds the form fields in the documented order, leaving out the fields this rail never sends", async () => {
        const { fields } = await subject()

        expect(Object.keys(fields(input, "M1"))).toEqual([
            "order_amount",
            "merchant",
            "currency",
            "operation",
            "order_description",
            "order_invoice_number",
            "success_url",
            "error_url",
            "cancel_url",
        ])
    })
})

describe("sepaySigningText", () => {
    it("is the documented example's signing text for the documented example's values", async () => {
        const { fields, text } = await subject()

        expect(text(fields(DOCUMENTED_EXAMPLE, "MERCHANT_123"))).toBe(DOCUMENTED_SIGNING_TEXT)
    })

    it("follows the specification's order whatever order the fields arrive in, and skips empty, 0 and '0' values", async () => {
        const { text } = await subject()

        expect(
            text({
                cancel_url: "c",
                customer_id: "",
                payment_method: "0",
                merchant: "m",
                order_amount: "5",
                extra: "x",
            }),
        ).toBe("order_amount=5,merchant=m,cancel_url=c")
    })
})

describe("sepayCheckoutSignature", () => {
    it("is the base64 HMAC-SHA256 of the documented signing text", async () => {
        const { fields, signature } = await subject()

        expect(signature(fields(DOCUMENTED_EXAMPLE, "MERCHANT_123"), "k")).toBe(
            createHmac("sha256", "k").update(DOCUMENTED_SIGNING_TEXT, "utf8").digest("base64"),
        )
    })
})
