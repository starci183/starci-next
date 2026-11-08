import { Test } from "@nestjs/testing"
import { FakeClock, mockEntityManager } from "@starci/jest-preset"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { NotificationErrorCode } from "./errors/notification.error"
import { NotificationInboxService } from "./notification-inbox.service"
import { encodedCursor } from "./notification-cursor.policy"
import type { CountRow, NotificationRow } from "./persistence/notification.rows"
import {
    COUNT_UNREAD_NOTIFICATIONS,
    MARK_ALL_NOTIFICATIONS_READ,
    MARK_NOTIFICATIONS_READ,
    SELECT_NOTIFICATION_PAGE,
} from "./persistence/notification.sql"

const LEARNER = "20000000-0000-4000-8000-000000000001"
const NOW = new Date("2026-11-11T03:00:00.000Z")
const FIRST = "30000000-0000-4000-8000-000000000001"
const SECOND = "30000000-0000-4000-8000-000000000002"
const THIRD = "30000000-0000-4000-8000-000000000003"

const rowOf = (id: string, at: string, overrides: Partial<NotificationRow> = {}): NotificationRow => ({
    id,
    kind: "premium.activated",
    params: { until: "2026-12-11T03:00:00.000Z", plan: "monthly" },
    link: "/premium",
    created_at: new Date(at),
    read_at: null,
    ...overrides,
})

const viewOf = (id: string, createdAt: string, isRead: boolean) => ({
    id,
    kind: "premium.activated",
    params: [
        { key: "plan", value: "monthly" },
        { key: "until", value: "2026-12-11T03:00:00.000Z" },
    ],
    link: "/premium",
    isRead,
    createdAt,
})

const build = async (page: ReadonlyArray<NotificationRow> = [], unread: ReadonlyArray<CountRow> = [{ total: 0 }]) => {
    const em = mockEntityManager({
        query: [
            [SELECT_NOTIFICATION_PAGE, page],
            [COUNT_UNREAD_NOTIFICATIONS, unread],
            [MARK_NOTIFICATIONS_READ, [{ total: 2 }]],
            [MARK_ALL_NOTIFICATIONS_READ, [{ total: 5 }]],
        ],
    })
    const moduleRef = await Test.createTestingModule({
        providers: [
            NotificationInboxService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
        ],
    }).compile()
    return { service: moduleRef.get(NotificationInboxService), em }
}

describe("NotificationInboxService page", () => {
    it("answers the first page with the default limit, the unread count and no next cursor on the last page", async () => {
        const { service, em } = await build(
            [rowOf(SECOND, "2026-11-10T00:00:00.000Z"), rowOf(FIRST, "2026-11-09T00:00:00.000Z", { read_at: NOW })],
            [{ total: 1 }],
        )

        const page = await service.page(LEARNER, {})

        expect(em.query).toHaveBeenCalledWith(SELECT_NOTIFICATION_PAGE, [LEARNER, null, null, 21])
        expect(page).toEqual({
            items: [viewOf(SECOND, "2026-11-10T00:00:00.000Z", false), viewOf(FIRST, "2026-11-09T00:00:00.000Z", true)],
            unreadCount: 1,
            next: null,
        })
    })

    it("keeps the limit rows, hands out the cursor of the last one and reads the next page after it", async () => {
        const rows = [
            rowOf(THIRD, "2026-11-10T00:00:00.000Z"),
            rowOf(SECOND, "2026-11-09T00:00:00.000Z"),
            rowOf(FIRST, "2026-11-08T00:00:00.000Z"),
        ]
        const { service, em } = await build(rows)

        const page = await service.page(LEARNER, { limit: 2 })
        const next = page.next ?? ""
        await service.page(LEARNER, { after: next, limit: 2 })

        expect(page.items.map((item) => item.id)).toEqual([THIRD, SECOND])
        expect(next).toBe(encodedCursor({ createdAt: "2026-11-09T00:00:00.000Z", id: SECOND }))
        expect(em.query).toHaveBeenLastCalledWith(COUNT_UNREAD_NOTIFICATIONS, [LEARNER])
        expect(em.query).toHaveBeenCalledWith(SELECT_NOTIFICATION_PAGE, [
            LEARNER,
            "2026-11-09T00:00:00.000Z",
            SECOND,
            3,
        ])
    })
})

describe("NotificationInboxService page limits and cursors", () => {
    it("clamps the limit to the maximum", async () => {
        const { service, em } = await build()

        await service.page(LEARNER, { limit: 500 })

        expect(em.query).toHaveBeenCalledWith(SELECT_NOTIFICATION_PAGE, [LEARNER, null, null, 51])
    })

    it("reads a null cursor as the first page", async () => {
        const { service, em } = await build()

        await service.page(LEARNER, { after: null, limit: null })

        expect(em.query).toHaveBeenCalledWith(SELECT_NOTIFICATION_PAGE, [LEARNER, null, null, 21])
    })

    it("refuses a cursor it did not hand out and reads nothing", async () => {
        const { service, em } = await build()

        await expect(service.page(LEARNER, { after: "not-a-cursor" })).rejects.toMatchObject({
            code: NotificationErrorCode.CursorInvalid,
        })

        expect(em.query).not.toHaveBeenCalled()
    })

    it("counts zero unread when the count answers no row", async () => {
        const { service } = await build([], [])

        await expect(service.page(LEARNER, {})).resolves.toEqual({ items: [], unreadCount: 0, next: null })
    })
})

describe("NotificationInboxService markRead", () => {
    it("marks the named ids of the learner read at the clock instant and answers how many changed", async () => {
        const { service, em } = await build()

        await expect(service.markRead(LEARNER, { ids: [FIRST, SECOND] })).resolves.toBe(2)

        expect(em.query).toHaveBeenCalledWith(MARK_NOTIFICATIONS_READ, [LEARNER, [FIRST, SECOND], NOW])
    })

    it("marks every unread notification of the learner when all is true", async () => {
        const { service, em } = await build()

        await expect(service.markRead(LEARNER, { all: true })).resolves.toBe(5)

        expect(em.query).toHaveBeenCalledWith(MARK_ALL_NOTIFICATIONS_READ, [LEARNER, NOW])
    })

    it("answers zero when the statement answers no row", async () => {
        const { service, em } = await build()
        em.query.mockResolvedValue([])

        await expect(service.markRead(LEARNER, { all: true })).resolves.toBe(0)
    })

    it.each([
        ["neither ids nor all", {}],
        ["an empty list of ids", { ids: [] }],
        ["all false without ids", { all: false }],
        ["both ids and all", { ids: [FIRST], all: true }],
        ["an id that is not a uuid", { ids: ["not-a-uuid"] }],
    ])("refuses %s and writes nothing", async (_case, mark) => {
        const { service, em } = await build()

        await expect(service.markRead(LEARNER, mark)).rejects.toMatchObject({
            code: NotificationErrorCode.MarkInvalid,
        })

        expect(em.query).not.toHaveBeenCalled()
    })
})
