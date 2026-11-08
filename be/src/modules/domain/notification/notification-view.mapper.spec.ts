import { Test } from "@nestjs/testing"
import { toNotificationView } from "./notification-view.mapper"

const VIEW_MAPPER: unique symbol = Symbol("notification.view-mapper")

const build = async (): Promise<typeof toNotificationView> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: VIEW_MAPPER, useFactory: () => toNotificationView }],
    }).compile()
    return moduleRef.get<typeof toNotificationView>(VIEW_MAPPER)
}

describe("toNotificationView", () => {
    it("orders the params by key, answers the instants as ISO text and read as a flag", async () => {
        const view = (await build())({
            id: "30000000-0000-4000-8000-000000000001",
            kind: "review.due",
            params: { count: "3", azimuth: "x", bar: "y" },
            link: null,
            created_at: new Date("2026-11-10T00:00:00.000Z"),
            read_at: new Date("2026-11-11T00:00:00.000Z"),
        })

        expect(view).toEqual({
            id: "30000000-0000-4000-8000-000000000001",
            kind: "review.due",
            params: [
                { key: "azimuth", value: "x" },
                { key: "bar", value: "y" },
                { key: "count", value: "3" },
            ],
            link: null,
            isRead: true,
            createdAt: "2026-11-10T00:00:00.000Z",
        })
    })

    it("answers unread for a notification never read", async () => {
        const view = (await build())({
            id: "30000000-0000-4000-8000-000000000001",
            kind: "premium.activated",
            params: {},
            link: "/premium",
            created_at: new Date("2026-11-10T00:00:00.000Z"),
            read_at: null,
        })

        expect(view).toMatchObject({ isRead: false, link: "/premium", params: [] })
    })
})
