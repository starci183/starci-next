import { Test } from "@nestjs/testing"
import { FakeClock, mock, mockEntityManager } from "@starci/jest-preset"
import { ExperienceReadService } from "@modules/domain/career"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { DomainError } from "@modules/platform/errors"
import { ProfileError, ProfileErrorCode } from "./errors/profile.error"
import type { CvRow, PublicCvRow } from "./persistence/profile.rows"
import { SELECT_CV, SELECT_PUBLIC_CV, SET_CV_PUBLIC, UPSERT_CV_SLUG } from "./persistence/profile.sql"
import { ProfileCvService } from "./profile-cv.service"
import { ProfileService } from "./profile.service"

const LEARNER = "20000000-0000-4000-8000-000000000006"
const NOW = new Date("2026-11-18T03:00:00.000Z")

const rowOf = (overrides: Partial<CvRow> = {}): CvRow => ({
    cv_slug: "nguyen-van-a",
    cv_public: false,
    display_name: null,
    account_name: null,
    ...overrides,
})

/** The code PostgreSQL gives a unique violation, as a spec double of the driver error. */
enum DriverCode {
    Unique = "23505",
}

/** A driver error of a unique violation: it carries the code the service reads. */
class DriverError extends DomainError<DriverCode> {}

/** The text a stored parameter holds, or null when it is no text. */
const textOf = (value: unknown): string | null => (typeof value === "string" ? value : null)

/** The slugs other learners hold, and the row of this learner while the service works. */
interface World {
    readonly held?: CvRow | null
    readonly taken?: ReadonlyArray<string>
    readonly publicRow?: PublicCvRow | null
}

const build = async (world: World = {}) => {
    let stored: CvRow | null = world.held ?? null
    const em = mockEntityManager({ query: [[SET_CV_PUBLIC, []]] })
    em.query.mockImplementation((query: string, params?: ReadonlyArray<unknown>) => {
        if (query === SELECT_CV) return Promise.resolve(stored === null ? [] : [stored])
        if (query === SELECT_PUBLIC_CV)
            return Promise.resolve(world.publicRow === undefined || world.publicRow === null ? [] : [world.publicRow])
        if (query === SET_CV_PUBLIC && stored !== null) {
            stored = { ...stored, cv_public: params?.[1] === true }
            return Promise.resolve([])
        }
        if (query === UPSERT_CV_SLUG) {
            const slug = textOf(params?.[1]) ?? ""
            if (stored?.cv_slug === undefined || stored.cv_slug === null) {
                if (world.taken?.includes(slug) === true)
                    return Promise.reject(new DriverError({ code: DriverCode.Unique }))
                stored = {
                    ...(stored ?? rowOf({ cv_slug: null })),
                    cv_slug: slug,
                    account_name: textOf(params?.[2]),
                }
            }
            return Promise.resolve([])
        }
        return Promise.resolve([])
    })
    const experience = mock<ExperienceReadService>()
    experience.verifiedItems.mockResolvedValue([
        { itemId: "i1", itemType: "t", part: "essentials", subject: "s", projectId: null, signedAt: "x" },
        { itemId: "i2", itemType: "t", part: "practice", subject: "s", projectId: null, signedAt: "x" },
    ])
    experience.publicLines.mockResolvedValue([
        { line: "Line one", part: "essentials", verificationCode: "AAAA-BBBB", signedAt: "2026-11-01T00:00:00.000Z" },
        { line: "Line two", part: "practice", verificationCode: "CCCC-DDDD", signedAt: "2026-11-02T00:00:00.000Z" },
    ])
    const profiles = mock<ProfileService>()
    profiles.avatarUrlOf.mockResolvedValue("https://store.example/avatar")
    const moduleRef = await Test.createTestingModule({
        providers: [
            ProfileCvService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: ProfileService, useValue: profiles },
            { provide: ExperienceReadService, useValue: experience },
        ],
    }).compile()
    return { service: moduleRef.get(ProfileCvService), em, experience, profiles }
}

const link = (accountName: string | null = "Nguy\u1ec5n V\u0103n A") => ({ learnerId: LEARNER, accountName })

describe("ProfileCvService link", () => {
    it("makes the slug once from the account name, private by default, with the count of verified lines", async () => {
        const { service, em } = await build()

        await expect(service.link(link())).resolves.toEqual({
            slug: "nguyen-van-a",
            path: "/cv/nguyen-van-a",
            isPublic: false,
            verifiedCount: 2,
        })
        expect(em.query).toHaveBeenCalledWith(UPSERT_CV_SLUG, [LEARNER, "nguyen-van-a", "Nguy\u1ec5n V\u0103n A", NOW])
    })

    it("makes the slug from the display name when the learner chose one", async () => {
        const { service } = await build({ held: rowOf({ cv_slug: null, display_name: "Jane Doe" }) })

        await expect(service.link(link())).resolves.toMatchObject({ slug: "jane-doe" })
    })

    it("adds a numeric suffix while another learner holds the slug", async () => {
        const { service } = await build({ taken: ["nguyen-van-a", "nguyen-van-a-2"] })

        await expect(service.link(link())).resolves.toMatchObject({ slug: "nguyen-van-a-3" })
    })

    it("keeps the slug it made and does not make another when the name changes", async () => {
        const { service, em } = await build({ held: rowOf({ account_name: "Old Name" }) })

        await expect(service.link(link("New Name"))).resolves.toMatchObject({ slug: "nguyen-van-a" })

        expect(em.query).toHaveBeenCalledWith(UPSERT_CV_SLUG, [LEARNER, "nguyen-van-a", "New Name", NOW])
    })

    it("stops with the error of the database when it is not a taken slug", async () => {
        const { service, em } = await build()
        em.query.mockImplementation((query: string) =>
            query === UPSERT_CV_SLUG
                ? Promise.reject(new ProfileError({ code: ProfileErrorCode.AvatarUnavailable }))
                : Promise.resolve([]),
        )

        await expect(service.link(link())).rejects.toMatchObject({ code: ProfileErrorCode.AvatarUnavailable })
    })

    it("gives up after the suffixes it tries when every slug is taken", async () => {
        const { service, em } = await build()
        em.query.mockImplementation((query: string) =>
            query === UPSERT_CV_SLUG
                ? Promise.reject(new DriverError({ code: DriverCode.Unique }))
                : Promise.resolve([]),
        )

        await expect(service.link(link())).rejects.toMatchObject({ code: ProfileErrorCode.CvNotFound })
    })
})

describe("ProfileCvService setVisibility", () => {
    it("makes the CV public and answers the link", async () => {
        const { service, em } = await build({ held: rowOf() })

        await expect(service.setVisibility({ ...link(), isPublic: true })).resolves.toMatchObject({
            slug: "nguyen-van-a",
            isPublic: true,
        })
        expect(em.query).toHaveBeenCalledWith(SET_CV_PUBLIC, [LEARNER, true, NOW])
    })

    it("makes the slug first for a learner who never asked for the link, then switches the CV", async () => {
        const { service } = await build()

        await expect(service.setVisibility({ ...link(), isPublic: true })).resolves.toMatchObject({
            slug: "nguyen-van-a",
            isPublic: true,
        })
    })

    it("makes a public CV private again", async () => {
        const { service } = await build({ held: rowOf({ cv_public: true }) })

        await expect(service.setVisibility({ ...link(), isPublic: false })).resolves.toMatchObject({ isPublic: false })
    })
})

describe("ProfileCvService publicCv", () => {
    const publicRow: PublicCvRow = {
        learner_id: LEARNER,
        display_name: "Jane Doe",
        account_name: "jdoe",
        avatar_key: `avatars/${LEARNER}/a.png`,
        cv_slug: "jane-doe",
    }

    it("answers the display name, the avatar and the lines the learner shows, with nothing else of the learner", async () => {
        const { service, experience } = await build({ publicRow })

        const cv = await service.publicCv({ slug: "jane-doe", locale: "en" })

        expect(cv).toEqual({
            displayName: "Jane Doe",
            avatarUrl: "https://store.example/avatar",
            lines: [
                {
                    line: "Line one",
                    source: "essentials",
                    verificationCode: "AAAA-BBBB",
                    signedAt: "2026-11-01T00:00:00.000Z",
                },
                {
                    line: "Line two",
                    source: "practice",
                    verificationCode: "CCCC-DDDD",
                    signedAt: "2026-11-02T00:00:00.000Z",
                },
            ],
        })
        expect(experience.publicLines).toHaveBeenCalledWith(LEARNER, "en")
        expect(JSON.stringify(cv)).not.toContain(LEARNER)
    })

    it("shows the account name without a display name, and the slug without either, and no avatar without one", async () => {
        const named = await build({ publicRow: { ...publicRow, display_name: null, avatar_key: null } })
        const bare = await build({ publicRow: { ...publicRow, display_name: null, account_name: null } })

        await expect(named.service.publicCv({ slug: "jane-doe", locale: "vi" })).resolves.toMatchObject({
            displayName: "jdoe",
            avatarUrl: null,
        })
        await expect(bare.service.publicCv({ slug: "jane-doe", locale: "vi" })).resolves.toMatchObject({
            displayName: "jane-doe",
        })
        expect(named.profiles.avatarUrlOf).not.toHaveBeenCalled()
    })

    it("refuses a private or unknown CV with the not found code and reads no line", async () => {
        const { service, experience } = await build()

        await expect(service.publicCv({ slug: "nobody", locale: "en" })).rejects.toMatchObject({
            code: ProfileErrorCode.CvNotFound,
        })

        expect(experience.publicLines).not.toHaveBeenCalled()
    })
})
