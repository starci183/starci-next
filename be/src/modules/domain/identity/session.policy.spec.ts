import { Test } from "@nestjs/testing"
import { validateIdentityLifetimes } from "./session.policy"
import { IdentityErrorCode } from "./errors/identity.error"
import {
    IDENTITY_SESSION_COOKIE,
    pkceChallenge,
    randomReference,
    referenceDigest,
    validReference,
} from "./session.policy"
import { readIdentityCookie } from "./session-http.policy"

const POLICY: unique symbol = Symbol("identity.session-policy")
const policies = {
    pkceChallenge,
    randomReference,
    referenceDigest,
    validReference,
    readIdentityCookie,
    validateIdentityLifetimes,
}
describe("session policy", () => {
    let subject: typeof policies
    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: POLICY, useFactory: () => policies }],
        }).compile()
        subject = moduleRef.get<typeof policies>(POLICY)
    })
    it("admits recorded positive lifetimes and refuses nonpositive tunables", () => {
        expect(subject.validateIdentityLifetimes({ sessionMaxSeconds: 28800, transactionTtlSeconds: 300 })).toEqual({
            sessionMaxSeconds: 28800,
            transactionTtlSeconds: 300,
        })
        expect(() => subject.validateIdentityLifetimes({ sessionMaxSeconds: 0, transactionTtlSeconds: 300 })).toThrow(
            IdentityErrorCode.SessionUnavailable,
        )
        expect(() =>
            subject.validateIdentityLifetimes({ sessionMaxSeconds: 28800, transactionTtlSeconds: -1 }),
        ).toThrow(IdentityErrorCode.SessionUnavailable)
    })
    it("mints bounded cryptographic references and hashes the standard S256 vector", () => {
        expect(subject.validReference(subject.randomReference())).toBe(true)
        expect(subject.pkceChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).toBe(
            "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
        )
        expect(subject.referenceDigest("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad")
    })
    it.each([
        undefined,
        "",
        "foreign=value",
        `${IDENTITY_SESSION_COOKIE}=bad`,
        `${IDENTITY_SESSION_COOKIE}=${"a".repeat(43)}; ${IDENTITY_SESSION_COOKIE}=${"b".repeat(43)}`,
    ])("refuses missing, malformed and duplicate cookies", (header) => {
        expect(subject.readIdentityCookie(header, IDENTITY_SESSION_COOKIE)).toBeUndefined()
    })
    it("reads only the exact unencoded host cookie among other cookies", () => {
        const reference = "a".repeat(43)
        const header = `other=value; ${IDENTITY_SESSION_COOKIE}=${reference}; another=value`
        expect(subject.readIdentityCookie(header, IDENTITY_SESSION_COOKIE)).toBe(reference)
    })
})
