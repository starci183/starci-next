import { Test } from "@nestjs/testing"
import { NotificationError, NotificationErrorCode } from "./errors/notification.error"
import { isUuid, markTarget, pageLimit, preparedNotification } from "./notification-input.policy"

const ID = "30000000-0000-4000-8000-000000000001"

const INPUT_POLICY: unique symbol = Symbol("notification.input-policy")

const build = async () => {
    const moduleRef = await Test.createTestingModule({
        providers: [
            { provide: INPUT_POLICY, useFactory: () => ({ isUuid, markTarget, pageLimit, preparedNotification }) },
        ],
    }).compile()
    return moduleRef.get<{
        isUuid: typeof isUuid
        markTarget: typeof markTarget
        pageLimit: typeof pageLimit
        preparedNotification: typeof preparedNotification
    }>(INPUT_POLICY)
}

const refused = (code: NotificationErrorCode): NotificationError => new NotificationError({ code })

describe("preparedNotification", () => {
    it("stores the params as text and the link as given", async () => {
        const policy = await build()

        expect(policy.preparedNotification("premium.activated", { plan: "monthly", days: 30 }, "/premium")).toEqual({
            params: { plan: "monthly", days: "30" },
            link: "/premium",
        })
    })

    it("stores a null link and no params when none are given", async () => {
        const policy = await build()

        expect(policy.preparedNotification("review.due", {}, undefined)).toEqual({ params: {}, link: null })
    })

    it("accepts the root path and a path with a query", async () => {
        const policy = await build()

        expect(policy.preparedNotification("review.due", {}, "/").link).toBe("/")
        expect(policy.preparedNotification("review.due", {}, "/experience?item=a-b").link).toBe("/experience?item=a-b")
    })

    it("refuses a kind outside the closed list", async () => {
        const policy = await build()

        expect(() => policy.preparedNotification("order.shipped", {}, undefined)).toThrow(
            refused(NotificationErrorCode.KindUnknown),
        )
    })

    it.each([
        ["more than eight params", Object.fromEntries(Array.from({ length: 9 }, (_, index) => [`k${index}`, "v"]))],
        ["a key that starts with a capital", { Plan: "x" }],
        ["a key with a dash", { "a-b": "x" }],
        ["a key longer than forty characters", { [`a${"b".repeat(40)}`]: "x" }],
        ["a value longer than two hundred characters", { plan: "x".repeat(201) }],
        ["a number that is not finite", { count: Number.POSITIVE_INFINITY }],
        ["a number that is not a number", { count: Number.NaN }],
    ])("refuses %s", async (_case, params) => {
        const policy = await build()

        expect(() => policy.preparedNotification("review.due", params, undefined)).toThrow(
            refused(NotificationErrorCode.ParamsInvalid),
        )
    })

    it.each([
        ["no leading slash", "premium"],
        ["a scheme", "https://evil.test/x"],
        ["a protocol-relative address", "//evil.test"],
        ["a backslash first", "/\\evil.test"],
        ["a backslash later", "/a\\b"],
        ["whitespace", "/a b"],
        ["an empty text", ""],
        ["more than two hundred characters", `/${"a".repeat(200)}`],
    ])("refuses a link with %s", async (_case, link) => {
        const policy = await build()

        expect(() => policy.preparedNotification("review.due", {}, link)).toThrow(
            refused(NotificationErrorCode.LinkInvalid),
        )
    })
})

describe("pageLimit", () => {
    it.each([
        ["none", undefined, 20],
        ["null", null, 20],
        ["not finite", Number.NaN, 20],
        ["zero", 0, 1],
        ["negative", -4, 1],
        ["fractional", 7.9, 7],
        ["the maximum", 50, 50],
        ["above the maximum", 51, 50],
    ])("answers for %s", async (_case, limit, expected) => {
        const policy = await build()

        expect(policy.pageLimit(limit)).toBe(expected)
    })
})

describe("markTarget", () => {
    it("answers the ids named", async () => {
        const policy = await build()

        expect(policy.markTarget({ ids: [ID] })).toEqual([ID])
    })

    it("answers null for all", async () => {
        const policy = await build()

        expect(policy.markTarget({ all: true })).toBeNull()
        expect(policy.markTarget({ all: true, ids: [] })).toBeNull()
    })

    it.each([
        ["neither", {}],
        ["all false and no ids", { all: false, ids: null }],
        ["both", { all: true, ids: [ID] }],
        ["more than a hundred ids", { ids: Array.from({ length: 101 }, () => ID) }],
        ["an id that is no uuid", { ids: ["x"] }],
    ])("refuses %s", async (_case, mark) => {
        const policy = await build()

        expect(() => policy.markTarget(mark)).toThrow(refused(NotificationErrorCode.MarkInvalid))
    })
})

describe("isUuid", () => {
    it("tells a uuid from other text", async () => {
        const policy = await build()

        expect(policy.isUuid(ID)).toBe(true)
        expect(policy.isUuid(ID.toUpperCase())).toBe(true)
        expect(policy.isUuid("nope")).toBe(false)
    })
})
