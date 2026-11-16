import { Test } from "@nestjs/testing"
import { FakeClock, builder, fakeIds, mock, mockEntityManager } from "@starci/jest-preset"
import { PathService } from "@modules/domain/path"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { IDS } from "@modules/platform/ids"
import { LOGGER, type Logger } from "@modules/platform/logging"
import { ProfileErrorCode } from "./errors/profile.error"
import { PROFILE_OPTIONS } from "./profile.decorators"
import { PROFILE_AVATAR_STORE, type AvatarStorePort } from "./profile-store.port"
import { ProfileLogEvent } from "./profile.log-events"
import type { ProfileOptions } from "./profile.options"
import type { ProfileRow } from "./persistence/profile.rows"
import { CLEAR_AVATAR, SELECT_PROFILE, UPSERT_AVATAR, UPSERT_NAME } from "./persistence/profile.sql"
import { ProfileService } from "./profile.service"
import { UnconfiguredAvatarStoreClient } from "./unconfigured-avatar-store.client"

const LEARNER = "20000000-0000-4000-8000-000000000006"
const NONCE = "00000000-0000-4000-8000-000000000001"
const NOW = new Date("2026-11-17T03:00:00.000Z")
const OWN_KEY = `avatars/${LEARNER}/${NONCE}.png`
const OLD_KEY = `avatars/${LEARNER}/30000000-0000-4000-8000-000000000003.jpg`

const build = async (row: ProfileRow | null = null, options: ProfileOptions = {}) => {
    const em = mockEntityManager({
        query: [
            [SELECT_PROFILE, row === null ? [] : [row]],
            [UPSERT_NAME, []],
            [UPSERT_AVATAR, []],
            [CLEAR_AVATAR, []],
        ],
    })
    const store = mock<AvatarStorePort>()
    const paths = mock<PathService>()
    const logger = mock<Logger>()
    store.presignRead.mockResolvedValue("https://store.example/read")
    store.presignUpload.mockResolvedValue({
        url: "https://store.example/put",
        headers: { "Content-Type": "image/png", "Content-Length": "100" },
        expiresAt: "2026-11-17T03:05:00.000Z",
    })
    store.head.mockResolvedValue({ size: 100, contentType: "image/png" })
    store.remove.mockResolvedValue(undefined)
    paths.active.mockResolvedValue(null)
    const moduleRef = await Test.createTestingModule({
        providers: [
            ProfileService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: IDS, useValue: fakeIds() },
            { provide: LOGGER, useValue: logger },
            { provide: PROFILE_AVATAR_STORE, useValue: store },
            { provide: PROFILE_OPTIONS, useValue: builder<ProfileOptions>({})(options) },
            { provide: PathService, useValue: paths },
        ],
    }).compile()
    return { service: moduleRef.get(ProfileService), em, store, paths, logger }
}

const rowOf = (overrides: Partial<ProfileRow> = {}): ProfileRow => ({
    display_name: null,
    avatar_key: null,
    avatar_content_type: null,
    avatar_size: null,
    avatar_updated_at: null,
    ...overrides,
})

describe("ProfileService read", () => {
    it("shows no name and no avatar for a learner with no row, with the limits the browser checks", async () => {
        const { service } = await build()

        const profile = await service.read(LEARNER, "vi")

        expect(profile).toEqual({
            displayName: null,
            avatarUrl: null,
            avatarUpdatedAt: null,
            goal: null,
            limits: { maxBytes: 2 * 1024 * 1024, contentTypes: ["image/png", "image/jpeg", "image/webp"], nameMax: 60 },
        })
    })

    it("shows the name, a signed address of the avatar and the goal path", async () => {
        const { service, paths, store } = await build(
            rowOf({
                display_name: "An",
                avatar_key: OWN_KEY,
                avatar_content_type: "image/png",
                avatar_size: 100,
                avatar_updated_at: NOW.toISOString(),
            }),
        )
        paths.active.mockResolvedValue({ pathId: "ai-engineer", title: "AI engineer", next: [] })

        const profile = await service.read(LEARNER, "en")

        expect(profile).toMatchObject({
            displayName: "An",
            avatarUrl: "https://store.example/read",
            goal: { pathId: "ai-engineer", title: "AI engineer" },
        })
        expect(store.presignRead).toHaveBeenCalledWith(OWN_KEY)
        expect(paths.active).toHaveBeenCalledWith(LEARNER, "en")
    })

    it("shows no avatar and logs when the store cannot sign a read, and still answers", async () => {
        const { service, store, logger } = await build(
            rowOf({ avatar_key: OWN_KEY, avatar_content_type: "image/png", avatar_size: 100 }),
        )
        const cause = new Error("store down")
        store.presignRead.mockRejectedValue(cause)

        const profile = await service.read(LEARNER, "vi")

        expect(profile.avatarUrl).toBeNull()
        expect(logger.error).toHaveBeenCalledWith(ProfileLogEvent.AvatarReadFailed, cause, { key: OWN_KEY })
    })
})

describe("ProfileService setDisplayName", () => {
    it("stores a trimmed name at the clock time", async () => {
        const { service, em } = await build()

        await service.setDisplayName(LEARNER, "  An  ", "vi")

        expect(em.query).toHaveBeenCalledWith(UPSERT_NAME, [LEARNER, "An", NOW])
    })

    it("clears the name on an empty one and refuses an invalid one before writing", async () => {
        const { service, em } = await build()

        await service.setDisplayName(LEARNER, "", "vi")
        await expect(service.setDisplayName(LEARNER, "x".repeat(61), "vi")).rejects.toMatchObject({
            code: ProfileErrorCode.NameInvalid,
        })

        expect(em.query).toHaveBeenCalledWith(UPSERT_NAME, [LEARNER, null, NOW])
        expect(em.query.mock.calls.filter(([query]) => query === UPSERT_NAME)).toHaveLength(1)
    })
})

describe("ProfileService requestAvatarUpload", () => {
    it("signs an upload that fixes the type and the exact size under the learner own key", async () => {
        const { service, store } = await build()

        const upload = await service.requestAvatarUpload({ learnerId: LEARNER, contentType: "image/png", size: 100 })

        expect(store.presignUpload).toHaveBeenCalledWith(OWN_KEY, {
            contentType: "image/png",
            contentLength: 100,
            expiresIn: 300,
        })
        expect(upload).toMatchObject({ key: OWN_KEY, method: "PUT", url: "https://store.example/put" })
        expect(upload.headers).toEqual([
            { name: "Content-Type", value: "image/png" },
            { name: "Content-Length", value: "100" },
        ])
    })

    it("refuses a type or a size outside the limits before anything is signed", async () => {
        const { service, store } = await build(null, { avatarMaxBytes: 500 })

        await expect(
            service.requestAvatarUpload({ learnerId: LEARNER, contentType: "image/gif", size: 100 }),
        ).rejects.toMatchObject({
            code: ProfileErrorCode.AvatarTypeNotAllowed,
        })
        await expect(
            service.requestAvatarUpload({ learnerId: LEARNER, contentType: "image/png", size: 501 }),
        ).rejects.toMatchObject({
            code: ProfileErrorCode.AvatarTooLarge,
        })
        expect(store.presignUpload).not.toHaveBeenCalled()
    })
})

describe("ProfileService confirmAvatar", () => {
    const confirm = { learnerId: LEARNER, key: OWN_KEY, contentType: "image/png", size: 100, locale: "vi" as const }

    it("stores the key the store holds, and deletes the previous avatar", async () => {
        const { service, em, store } = await build(
            rowOf({ avatar_key: OLD_KEY, avatar_content_type: "image/jpeg", avatar_size: 9 }),
        )

        await service.confirmAvatar(confirm)

        expect(em.query).toHaveBeenCalledWith(UPSERT_AVATAR, [LEARNER, OWN_KEY, "image/png", 100, NOW])
        expect(store.remove).toHaveBeenCalledWith(OLD_KEY)
    })

    it("refuses a key that is not the learner own without asking the store", async () => {
        const { service, store, em } = await build()

        await expect(
            service.confirmAvatar({ ...confirm, key: `avatars/20000000-0000-4000-8000-000000000007/${NONCE}.png` }),
        ).rejects.toMatchObject({
            code: ProfileErrorCode.AvatarKeyInvalid,
        })
        expect(store.head).not.toHaveBeenCalled()
        expect(em.query).not.toHaveBeenCalled()
    })

    it("refuses an object the store does not hold", async () => {
        const { service, store } = await build()
        store.head.mockResolvedValue(null)

        await expect(service.confirmAvatar(confirm)).rejects.toMatchObject({ code: ProfileErrorCode.AvatarNotUploaded })
    })

    it("deletes and refuses an object whose size or type differs from what was asked", async () => {
        const { service, store, em } = await build()
        store.head.mockResolvedValue({ size: 101, contentType: "image/png" })

        await expect(service.confirmAvatar(confirm)).rejects.toMatchObject({ code: ProfileErrorCode.AvatarNotUploaded })

        expect(store.remove).toHaveBeenCalledWith(OWN_KEY)
        expect(em.query).not.toHaveBeenCalledWith(UPSERT_AVATAR, expect.anything())
    })

    it("keeps the new avatar and logs when the previous object cannot be deleted", async () => {
        const { service, store, logger } = await build(
            rowOf({ avatar_key: OLD_KEY, avatar_content_type: "image/jpeg", avatar_size: 9 }),
        )
        const cause = new Error("delete failed")
        store.remove.mockRejectedValue(cause)

        await expect(service.confirmAvatar(confirm)).resolves.toBeDefined()

        expect(logger.error).toHaveBeenCalledWith(ProfileLogEvent.AvatarRemoveFailed, cause, { key: OLD_KEY })
    })

    it("does not delete the object when the learner confirms the avatar they already have", async () => {
        const { service, store } = await build(
            rowOf({ avatar_key: OWN_KEY, avatar_content_type: "image/png", avatar_size: 100 }),
        )

        await service.confirmAvatar(confirm)

        expect(store.remove).not.toHaveBeenCalled()
    })
})

describe("ProfileService removeAvatar", () => {
    it("clears the key and deletes the object", async () => {
        const { service, em, store } = await build(
            rowOf({ avatar_key: OWN_KEY, avatar_content_type: "image/png", avatar_size: 100 }),
        )

        await service.removeAvatar(LEARNER, "vi")

        expect(em.query).toHaveBeenCalledWith(CLEAR_AVATAR, [LEARNER, NOW])
        expect(store.remove).toHaveBeenCalledWith(OWN_KEY)
    })

    it("deletes nothing for a learner with no avatar", async () => {
        const { service, store } = await build()

        await service.removeAvatar(LEARNER, "vi")

        expect(store.remove).not.toHaveBeenCalled()
    })
})

describe("UnconfiguredAvatarStoreClient", () => {
    it("refuses an upload and a check, shows no address and deletes nothing", async () => {
        const client = new UnconfiguredAvatarStoreClient()

        await expect(client.presignUpload()).rejects.toMatchObject({ code: ProfileErrorCode.AvatarUnavailable })
        await expect(client.head()).rejects.toMatchObject({ code: ProfileErrorCode.AvatarUnavailable })
        await expect(client.presignRead()).resolves.toBeNull()
        await expect(client.remove()).resolves.toBeUndefined()
    })
})
