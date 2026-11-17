import { Test } from "@nestjs/testing"
import { ProfileError, ProfileErrorCode } from "./errors/profile.error"
import {
    assertAvatar,
    avatarKeyOf,
    contentTypeOf,
    displayNameOf,
    ownsAvatarKey,
    profileSettingsOf,
} from "./profile-avatar.policy"

/** The functions under test, provided the way Nest provides them so the spec builds its subject from a testing module. */
const SUBJECT = { assertAvatar, avatarKeyOf, contentTypeOf, displayNameOf, ownsAvatarKey, profileSettingsOf }

/** The token the testing module provides the functions under. */
const SUBJECT_TOKEN: unique symbol = Symbol("profile.avatar-policy")

/** Builds the functions under test from a testing module. */
const loadSubject = async (): Promise<typeof SUBJECT> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: SUBJECT_TOKEN, useFactory: () => SUBJECT }],
    }).compile()
    return moduleRef.get<typeof SUBJECT>(SUBJECT_TOKEN)
}

/** The code of the profile error a call throws, or undefined when it throws none. */
const codeOf = (run: () => unknown): string | undefined => {
    try {
        run()
    } catch (error) {
        return error instanceof ProfileError ? error.code : undefined
    }
    return undefined
}

const LEARNER = "20000000-0000-4000-8000-000000000004"
const NONCE = "30000000-0000-4000-8000-000000000001"

describe("profileSettingsOf", () => {
    it("defaults to 2 MiB, the three image types, 60 characters and five minutes", async () => {
        const { profileSettingsOf: settingsOf } = await loadSubject()

        expect(settingsOf({})).toEqual({
            avatarMaxBytes: 2 * 1024 * 1024,
            avatarContentTypes: ["image/png", "image/jpeg", "image/webp"],
            nameMax: 60,
            uploadTtlSeconds: 300,
        })
    })

    it("drops a type the profile cannot name an extension for", async () => {
        const { profileSettingsOf: settingsOf } = await loadSubject()

        expect(
            settingsOf({ avatarContentTypes: ["image/png", "image/svg+xml", "text/html"] }).avatarContentTypes,
        ).toEqual(["image/png"])
    })
})

describe("assertAvatar", () => {
    it("admits an image of an allowed type within the limit, whatever the case and parameters of the type", async () => {
        const { assertAvatar: assert, profileSettingsOf: settingsOf } = await loadSubject()
        const settings = settingsOf({ avatarMaxBytes: 1000 })

        expect(() => assert(settings, "IMAGE/PNG; charset=binary", 1000)).not.toThrow()
    })

    it("refuses a type outside the list", async () => {
        const { assertAvatar: assert, profileSettingsOf: settingsOf } = await loadSubject()

        expect(codeOf(() => assert(settingsOf({}), "image/gif", 10))).toBe(ProfileErrorCode.AvatarTypeNotAllowed)
        expect(codeOf(() => assert(settingsOf({}), "text/html", 10))).toBe(ProfileErrorCode.AvatarTypeNotAllowed)
    })

    it("refuses a size that is zero, fractional, negative or above the limit", async () => {
        const { assertAvatar: assert, profileSettingsOf: settingsOf } = await loadSubject()
        const settings = settingsOf({ avatarMaxBytes: 1000 })

        for (const size of [0, -5, 1.5, 1001, Number.NaN]) {
            expect(codeOf(() => assert(settings, "image/png", size))).toBe(ProfileErrorCode.AvatarTooLarge)
        }
    })
})

describe("avatar keys", () => {
    it("lays the key out as avatars/<learner>/<nonce>.<ext> with the extension of the type", async () => {
        const { avatarKeyOf: keyOf } = await loadSubject()

        expect(keyOf(LEARNER, "image/jpeg", NONCE)).toBe(`avatars/${LEARNER}/${NONCE}.jpg`)
        expect(keyOf(LEARNER, "image/webp", NONCE)).toBe(`avatars/${LEARNER}/${NONCE}.webp`)
        expect(keyOf(LEARNER, "image/png", NONCE)).toBe(`avatars/${LEARNER}/${NONCE}.png`)
    })

    it("owns only a generated key under the learner own folder", async () => {
        const { avatarKeyOf: keyOf, ownsAvatarKey: owns } = await loadSubject()
        const key = keyOf(LEARNER, "image/png", NONCE)

        expect(owns(LEARNER, key)).toBe(true)
        expect(owns("20000000-0000-4000-8000-000000000005", key)).toBe(false)
        expect(owns(LEARNER, `avatars/${LEARNER}/../other/${NONCE}.png`)).toBe(false)
        expect(owns(LEARNER, `avatars/${LEARNER}/${NONCE}.exe`)).toBe(false)
        expect(owns(LEARNER, `avatars/${LEARNER}/nested/${NONCE}.png`)).toBe(false)
        expect(owns(LEARNER, `other/${LEARNER}/${NONCE}.png`)).toBe(false)
    })
})

describe("displayNameOf", () => {
    it("trims a name and clears on an empty or null one", async () => {
        const { displayNameOf: nameOf, profileSettingsOf: settingsOf } = await loadSubject()
        const settings = settingsOf({})

        expect(nameOf(settings, "  Nguy\u1ec5n An  ")).toBe("Nguy\u1ec5n An")
        expect(nameOf(settings, "   ")).toBeNull()
        expect(nameOf(settings, null)).toBeNull()
    })

    it("refuses a name that is too long or holds a control character, counting characters not bytes", async () => {
        const { displayNameOf: nameOf, profileSettingsOf: settingsOf } = await loadSubject()
        const settings = settingsOf({ nameMax: 5 })

        expect(nameOf(settings, "\u0103\u0103\u0103\u0103\u0103")).toBe("\u0103\u0103\u0103\u0103\u0103")
        expect(codeOf(() => nameOf(settings, "\u0103\u0103\u0103\u0103\u0103\u0103"))).toBe(
            ProfileErrorCode.NameInvalid,
        )
        expect(codeOf(() => nameOf(settings, "a\nb"))).toBe(ProfileErrorCode.NameInvalid)
    })
})
