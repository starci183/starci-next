import { Test } from "@nestjs/testing"
import { NotificationError, NotificationErrorCode } from "./errors/notification.error"
import { decodedCursor, encodedCursor } from "./notification-cursor.policy"

const CURSOR = { createdAt: "2026-11-09T00:00:00.000Z", id: "30000000-0000-4000-8000-000000000002" }

const CURSOR_POLICY: unique symbol = Symbol("notification.cursor-policy")

const textOf = (text: string): string => Buffer.from(text, "utf8").toString("base64url")

const build = async () => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: CURSOR_POLICY, useFactory: () => ({ decodedCursor, encodedCursor }) }],
    }).compile()
    return moduleRef.get<{ decodedCursor: typeof decodedCursor; encodedCursor: typeof encodedCursor }>(CURSOR_POLICY)
}

describe("the notification cursor", () => {
    it("reads back the cursor it wrote", async () => {
        const policy = await build()

        expect(policy.decodedCursor(policy.encodedCursor(CURSOR))).toEqual(CURSOR)
    })

    it.each([
        ["text that is no cursor", "not-a-cursor"],
        ["an empty text", ""],
        ["an instant without milliseconds", textOf("2026-11-09T00:00:00Z|30000000-0000-4000-8000-000000000002")],
        ["an instant that is no date", textOf("2026-13-45T00:00:00.000Z|30000000-0000-4000-8000-000000000002")],
        ["an id that is no uuid", textOf("2026-11-09T00:00:00.000Z|x")],
        ["a third part", textOf("2026-11-09T00:00:00.000Z|30000000-0000-4000-8000-000000000002|x")],
    ])("refuses %s", async (_case, text) => {
        const policy = await build()

        expect(() => policy.decodedCursor(text)).toThrow(
            new NotificationError({ code: NotificationErrorCode.CursorInvalid }),
        )
    })
})
