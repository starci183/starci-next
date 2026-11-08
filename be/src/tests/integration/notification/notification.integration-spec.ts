import { fakeIds } from "@starci/jest-preset"
import { NotificationInboxService, NotificationService } from "@modules/domain/notification"
import { PurchaseService } from "@modules/domain/purchase"
import { WEBHOOK_SEPAY_SECRET, sepayIpnOf } from "../../fixtures/builders/webhook.builder"
import { commerceLedgerOf } from "../../fixtures/builders/commerce-ledger.builder"
import { premiumWorldModule } from "../../world/premium-world.options"
import { useTestWorld } from "../../world/use-test-world"

/** One page of the inbox and one item of it, as the inbox service answers them. */
type InboxPage = Awaited<ReturnType<NotificationInboxService["page"]>>

/** Newest first: the creation instant descending, then the id descending, the order the page promises. */
const isNewestFirst = (items: InboxPage["items"]): boolean =>
    items.every((item, index) => {
        const before = items[index - 1]
        return (
            before === undefined ||
            before.createdAt > item.createdAt ||
            (before.createdAt === item.createdAt && before.id > item.id)
        )
    })

/**
 * The producer of the notification capability (integration): the real services over the real primary database. It proves
 * a verified Premium grant tells the learner once, and that a refused notification stores nothing and never rejects.
 */
describe("the notification producer (integration)", () => {
    const world = useTestWorld({ modules: [premiumWorldModule] })
    const notifications = (): NotificationService => world.resolve(NotificationService)
    const inbox = (): NotificationInboxService => world.resolve(NotificationInboxService)
    const ledger = commerceLedgerOf(() => world.db.primary, 5)
    const ids = fakeIds("a07f0001")

    it("tells the learner Premium is active after a verified grant, once, with the plan, the new end and the link", async () => {
        const { learnerId, orderCode } = await ledger.pendingOn("sepay")
        const deliver = (): Promise<unknown> =>
            world.resolve(PurchaseService).recordSepayDelivery({
                rawBody: Buffer.from(JSON.stringify(sepayIpnOf({ orderCode, reference: "ref-notified" }))),
                secretKey: WEBHOOK_SEPAY_SECRET,
            })

        await deliver()
        await deliver()
        const page = await inbox().page(learnerId, {})

        expect(page.items).toHaveLength(1)
        expect(page.items[0]).toMatchObject({
            kind: "premium.activated",
            params: [
                { key: "plan", value: "monthly" },
                { key: "until", value: await ledger.premiumOf(learnerId) },
            ],
            link: "/premium",
            isRead: false,
        })
        expect(page).toMatchObject({ unreadCount: 1, next: null })
    })

    it("stores nothing and does not reject for a link outside the app", async () => {
        const learner = ids.next()

        await expect(
            notifications().notify(learner, "premium.activated", { plan: "monthly" }, "https://evil.test"),
        ).resolves.toBeUndefined()

        expect(await inbox().page(learner, {})).toEqual({ items: [], unreadCount: 0, next: null })
    })
})

/**
 * The inbox of the notification capability (integration): it pages newest first by cursor with the unread count, lets only
 * the owner mark a notification read, and refuses a malformed mark or cursor.
 */
describe("the notification inbox (integration)", () => {
    const world = useTestWorld({ modules: [premiumWorldModule] })
    const notifications = (): NotificationService => world.resolve(NotificationService)
    const inbox = (): NotificationInboxService => world.resolve(NotificationInboxService)
    const ids = fakeIds("a07f0002")

    it("pages newest first by cursor without a gap or a repeat, and counts every unread notification", async () => {
        const learner = ids.next()
        await Promise.all([1, 2, 3].map((count) => notifications().notify(learner, "review.due", { count }, "/review")))

        const first = await inbox().page(learner, { limit: 2 })
        const second = await inbox().page(learner, { limit: 2, after: first.next })
        const all = [...first.items, ...second.items]

        expect(first.items).toHaveLength(2)
        expect(first.next).not.toBeNull()
        expect(second.items).toHaveLength(1)
        expect(second.next).toBeNull()
        expect(new Set(all.map((item) => item.params[0]?.value))).toEqual(new Set(["1", "2", "3"]))
        expect(isNewestFirst(all)).toBe(true)
        expect(first.unreadCount).toBe(3)
    })

    it("marks only the owner's notifications read: by ids, then all, and a repeat changes nothing", async () => {
        const owner = ids.next()
        const stranger = ids.next()
        await notifications().notify(owner, "experience.verified", { item: "a" })
        await notifications().notify(owner, "experience.returned", { item: "b" }, "/experience")
        await notifications().notify(owner, "review.due", { count: 4 })
        await notifications().notify(stranger, "review.due", { count: 9 })
        const ownerItems = (await inbox().page(owner, {})).items
        const strangerItems = (await inbox().page(stranger, {})).items

        const foreign = await inbox().markRead(owner, { ids: strangerItems.map((item) => item.id) })
        const named = await inbox().markRead(owner, { ids: ownerItems.slice(0, 1).map((item) => item.id) })
        const again = await inbox().markRead(owner, { ids: ownerItems.slice(0, 1).map((item) => item.id) })
        const rest = await inbox().markRead(owner, { all: true })
        const after = await inbox().page(owner, {})

        expect([foreign, named, again, rest]).toEqual([0, 1, 0, 2])
        expect(after.unreadCount).toBe(0)
        expect(after.items.every((item) => item.isRead)).toBe(true)
        expect((await inbox().page(stranger, {})).unreadCount).toBe(1)
    })

    it("refuses a mark that names neither ids nor all, and a cursor it did not hand out", async () => {
        const learner = ids.next()

        await expect(inbox().markRead(learner, {})).rejects.toMatchObject({ code: "NOTIFICATION_MARK_INVALID" })
        await expect(inbox().page(learner, { after: "garbage" })).rejects.toMatchObject({
            code: "NOTIFICATION_CURSOR_INVALID",
        })
    })
})
