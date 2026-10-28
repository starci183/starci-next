import { createHmac } from "node:crypto"
import { Test } from "@nestjs/testing"
import {
    payosCanonicalData,
    payosSignatureValid,
    payosTransactionOf,
    payosWebhookOf,
} from "./payos-confirmation.policy"

const CHECKSUM = "spec-checksum-key"
const POLICY: unique symbol = Symbol("payos.confirmation-policy")

const subject = async (): Promise<{
    readonly canonicalData: typeof payosCanonicalData
    readonly signatureValid: typeof payosSignatureValid
    readonly transactionOf: typeof payosTransactionOf
    readonly webhookOf: typeof payosWebhookOf
}> => {
    const moduleRef = await Test.createTestingModule({
        providers: [
            {
                provide: POLICY,
                useFactory: () => ({
                    canonicalData: payosCanonicalData,
                    signatureValid: payosSignatureValid,
                    transactionOf: payosTransactionOf,
                    webhookOf: payosWebhookOf,
                }),
            },
        ],
    }).compile()
    return moduleRef.get(POLICY)
}

describe("payosCanonicalData", () => {
    it("joins sorted keys as key=value the way the provider's own signer serializes values", async () => {
        const { canonicalData } = await subject()
        const data = {
            z: null,
            a: "null",
            b: { q: 9, p: 8 },
            g: 5n,
            h: (): number => 0,
            m: [{ y: 2, x: 1 }],
            n: 5,
            s: "txt",
            t: true,
            u: undefined,
            v: "undefined",
        }

        expect(canonicalData(data)).toBe(
            'a=&b={"p":8,"q":9}&g=5&h=&m=[{"x":1,"y":2}]&n=5&s=txt&t=true&u=&v=&z=',
        )
    })
})

describe("payosSignatureValid", () => {
    const data = { orderCode: 1, amount: 100 }
    const signature = "6d5d8b3a40b3d94f6d1f3f3b0e1d7f6c5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d"

    it("is true only for the checksum-key signature of the canonical data", async () => {
        const { signatureValid } = await subject()
        const signed = createHmac("sha256", CHECKSUM).update("amount=100&orderCode=1", "utf8").digest("hex")

        expect(signature.length).toBe(64)
        expect(signatureValid(data, signed, CHECKSUM)).toBe(true)
        expect(signatureValid(data, signed.toUpperCase(), CHECKSUM)).toBe(true)
        expect(signatureValid(data, signature, CHECKSUM)).toBe(false)
        expect(signatureValid(data, "ff", CHECKSUM)).toBe(false)
    })
})

describe("payosWebhookOf", () => {
    const webhook = { code: "00", success: true, data: { orderCode: 1 }, signature: "sig" }

    it("is null unless the body is a record with a readable envelope", async () => {
        const { webhookOf } = await subject()

        expect(webhookOf(null)).toBeNull()
        expect(webhookOf("x")).toBeNull()
        expect(webhookOf({ ...webhook, code: 0 })).toBeNull()
        expect(webhookOf({ ...webhook, success: "yes" })).toBeNull()
        expect(webhookOf({ ...webhook, data: [1] })).toBeNull()
        expect(webhookOf({ ...webhook, signature: 1 })).toBeNull()
    })

    it("reads a documented webhook envelope", async () => {
        const { webhookOf } = await subject()

        expect(webhookOf(webhook)).toEqual(webhook)
    })
})

describe("payosTransactionOf", () => {
    const transaction = { orderCode: 42, amount: 1000, reference: "FT1" }

    it.each([
        ["orderCode", "42"],
        ["orderCode", 1.5],
        ["orderCode", 0],
        ["orderCode", -1],
        ["amount", "1000"],
        ["amount", Number.NaN],
        ["amount", 0],
        ["amount", -1],
        ["reference", 1],
        ["reference", ""],
    ] as const)("is null when %s is %s", async (field, value) => {
        const { transactionOf } = await subject()

        expect(transactionOf({ ...transaction, [field]: value })).toBeNull()
    })

    it("reads the transfer facts of a verified data object", async () => {
        const { transactionOf } = await subject()

        expect(transactionOf(transaction)).toEqual(transaction)
    })
})
