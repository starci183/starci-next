import { Test } from "@nestjs/testing"
import { IDENTITY_LOGIN_COOKIE, IDENTITY_SESSION_COOKIE } from "./session.policy"
import { callbackRedirect, deleteIdentityCookie, issueIdentityCookie, readIdentityCookie } from "./session-http.policy"

const POLICY: unique symbol = Symbol("identity.session-http-policy")
const policy = { callbackRedirect, deleteIdentityCookie, issueIdentityCookie, readIdentityCookie }
const REFERENCE = "A".repeat(43)

describe("session http policy", () => {
    let subject: typeof policy
    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: POLICY, useFactory: () => policy }],
        }).compile()
        subject = moduleRef.get<typeof policy>(POLICY)
    })

    it("issues and deletes a host-only cookie with matching attributes", () => {
        expect(subject.issueIdentityCookie("name", REFERENCE, 60)).toBe(
            `name=${REFERENCE}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=60`,
        )
        expect(subject.deleteIdentityCookie("name")).toBe(
            "name=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
        )
    })

    it("reads one exact well-formed cookie and refuses a missing, duplicate or malformed one", () => {
        expect(subject.readIdentityCookie(`a=1; name=${REFERENCE}`, "name")).toBe(REFERENCE)
        expect(subject.readIdentityCookie(undefined, "name")).toBeUndefined()
        expect(subject.readIdentityCookie(`name=${REFERENCE}; name=${REFERENCE}`, "name")).toBeUndefined()
        expect(subject.readIdentityCookie("name=short", "name")).toBeUndefined()
    })

    it("maps a successful callback to the success url and a session cookie", () => {
        const view = subject.callbackRedirect({ kind: "success", reference: REFERENCE, maxAgeSeconds: 30 })
        expect(view.url).toBe("/sign-in?auth=success")
        expect(view.cookies).toEqual([
            subject.deleteIdentityCookie(IDENTITY_LOGIN_COOKIE),
            subject.issueIdentityCookie(IDENTITY_SESSION_COOKIE, REFERENCE, 30),
        ])
        expect(view).not.toHaveProperty("cause")
    })

    it("maps a failed callback to the error url, cleared cookies and its internal cause", () => {
        const cause = new Error("provider")
        const view = subject.callbackRedirect({ kind: "error", cause })
        expect(view.url).toBe("/sign-in?auth=error")
        expect(view.cookies).toEqual([
            subject.deleteIdentityCookie(IDENTITY_LOGIN_COOKIE),
            subject.deleteIdentityCookie(IDENTITY_SESSION_COOKIE),
        ])
        expect(view.cause).toBe(cause)
    })
})
