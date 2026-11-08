import { Test } from "@nestjs/testing"
import {
    deviceNameOf,
    deviceTokenShaped,
    normalizedUserCode,
    platformOf,
    relayDigest,
    relaySecret,
    userCodeOf,
} from "./relay-pairing.policy"

const POLICY: unique symbol = Symbol("spec.relay-pairing-policy")
const policy = { deviceNameOf, deviceTokenShaped, normalizedUserCode, platformOf, relayDigest, relaySecret, userCodeOf }

const build = async (): Promise<typeof policy> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: POLICY, useFactory: () => policy }],
    }).compile()
    return moduleRef.get(POLICY)
}

describe("relay pairing policy", () => {
    it("mints 256-bit secrets that differ and are shaped like a device token, and digests them one way", async () => {
        const { relaySecret: secret, relayDigest: digest, deviceTokenShaped: shaped } = await build()

        const first = secret()

        expect(first).not.toBe(secret())
        expect(shaped(first)).toBe(true)
        expect(digest(first)).toMatch(/^[0-9a-f]{64}$/)
        expect(digest(first)).toBe(digest(first))
        expect(digest(first)).not.toBe(first)
    })

    it("refuses text that is not shaped like a device token", async () => {
        const { deviceTokenShaped: shaped } = await build()

        expect(shaped("short")).toBe(false)
        expect(shaped(`${"a".repeat(42)}!`)).toBe(false)
    })

    it("makes user codes of two unambiguous halves that normalise to themselves", async () => {
        const { userCodeOf: code, normalizedUserCode: normalized } = await build()

        const made = code()

        expect(made).toMatch(/^[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/)
        expect(normalized(made)).toBe(made)
    })

    it("restores a typed user code: upper case, spaces and dash tolerated", async () => {
        const { normalizedUserCode: normalized } = await build()

        expect(normalized(" abcd efgh ")).toBe("ABCD-EFGH")
        expect(normalized("abcd-efgh")).toBe("ABCD-EFGH")
    })

    it.each([
        ["too short", "ABC-DEFG"],
        ["too long", "ABCDE-FGHJK"],
        ["a character outside the alphabet", "ABCD-EFG0"],
    ])("rejects a user code that is %s", async (_case, typed) => {
        const { normalizedUserCode: normalized } = await build()

        expect(normalized(typed)).toBeNull()
    })

    it("trims a device name and rejects an empty, long or control-character one", async () => {
        const { deviceNameOf: nameOf } = await build()

        expect(nameOf("  Work laptop  ")).toBe("Work laptop")
        expect(nameOf("   ")).toBeNull()
        expect(nameOf("x".repeat(61))).toBeNull()
        expect(nameOf("x".repeat(60))).toBe("x".repeat(60))
        expect(nameOf("bad\nname")).toBeNull()
        expect(nameOf("bad\u007fname")).toBeNull()
    })

    it("knows the three platforms in any case and nothing else", async () => {
        const { platformOf: platform } = await build()

        expect(platform("Windows")).toBe("windows")
        expect(platform("MACOS")).toBe("macos")
        expect(platform("linux")).toBe("linux")
        expect(platform("plan9")).toBeNull()
    })
})
