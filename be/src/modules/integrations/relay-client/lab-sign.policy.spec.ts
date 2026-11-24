import { canonicalJson, gradeTextOf, newDeviceKey, publicKeyOf, signatureHolds, signText } from "./lab-sign.policy"

const TEST = { id: "a", name: "A", passed: true, durationMs: 3, message: "" }

describe("canonicalJson", () => {
    it("sorts keys at every depth, writes no spaces and leaves array order alone", () => {
        expect(canonicalJson({ b: 1, a: { d: [3, { z: 1, y: 2 }], c: "x y" } })).toBe(
            '{"a":{"c":"x y","d":[3,{"y":2,"z":1}]},"b":1}',
        )
    })

    it("leaves out an undefined member", () => {
        expect(canonicalJson({ a: undefined, b: null })).toBe('{"b":null}')
    })
})

describe("the grade signature", () => {
    const statement = { submissionId: "s-1", nonce: "n-1", commit: "a".repeat(40), tests: [TEST] }

    it("signs the canonical text of submissionId, nonce, commit and tests, in key order", () => {
        expect(gradeTextOf(statement)).toBe(
            `{"commit":"${"a".repeat(40)}","nonce":"n-1","submissionId":"s-1","tests":[{"durationMs":3,"id":"a","message":"","name":"A","passed":true}]}`,
        )
    })

    it("holds with the registered public key and breaks when anything signed changes", () => {
        const key = newDeviceKey()
        const text = gradeTextOf(statement)
        const signature = signText(key.privatePem, text)

        expect(publicKeyOf(key.privatePem)).toBe(key.publicKey)
        expect(signatureHolds(key.publicKey, text, signature)).toBe(true)
        expect(signatureHolds(key.publicKey, gradeTextOf({ ...statement, nonce: "n-2" }), signature)).toBe(false)
        expect(
            signatureHolds(key.publicKey, gradeTextOf({ ...statement, tests: [{ ...TEST, passed: false }] }), signature),
        ).toBe(false)
        expect(signatureHolds(newDeviceKey().publicKey, text, signature)).toBe(false)
    })
})
