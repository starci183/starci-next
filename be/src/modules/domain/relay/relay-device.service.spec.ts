import { FakeClock, fakeTransaction, mock, mockEntityManager } from "@starci/jest-preset"
import type { FakeTransaction, MockOf } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { ENTITLEMENT_SERVICE, type EntitlementService } from "@modules/domain/entitlement"
import { RelayErrorCode } from "./errors/relay.error"
import { RELAY_OPTIONS } from "./relay.decorators"
import { RelayDeviceService } from "./relay-device.service"
import { relayDigest } from "./relay-pairing.policy"
import type { RelayDeviceRow } from "./persistence/relay.rows"
import {
    CLEAR_PRESENCE,
    CONFIRM_PAIRING,
    COUNT_PAIRED,
    INSERT_PAIRING,
    ISSUE_TOKEN,
    LOCK_BY_DEVICE_CODE,
    LOCK_LEARNER_DEVICES,
    REVOKE_DEVICE,
    SELECT_DEVICES,
    SELECT_PENDING_BY_USER_CODE,
    SET_PRESENCE,
    TOUCH_BY_TOKEN,
} from "./persistence/relay.sql"

const NOW = "2026-11-09T02:00:00.000Z"
const LATER = "2026-11-09T02:10:00.000Z"
const LEARNER = "b8099f0e-58c7-4685-8292-f3a49ec994b1"
const DEVICE = "11111111-1111-4111-8111-111111111111"
const DEVICE_CODE = "d".repeat(43)
const TOKEN = "t".repeat(43)
const OPTIONS = {
    verifyUrl: "https://app.example/devices",
    pairingTtlSeconds: 600,
    premiumDeviceLimit: 2,
    freeDeviceLimit: 1,
}

const rowOf = (overrides?: Partial<RelayDeviceRow>): RelayDeviceRow => ({
    device_id: DEVICE,
    learner_id: LEARNER,
    name: "Laptop",
    platform: "linux",
    status: "active",
    expires_at: new Date(LATER),
    confirmed_at: new Date(NOW),
    last_seen_at: new Date(NOW),
    online_since: new Date(NOW),
    ...overrides,
})

interface World {
    readonly service: RelayDeviceService
    readonly entitlement: MockOf<EntitlementService>
    readonly tx: FakeTransaction
}

const world = async (query: ReadonlyArray<readonly [string, unknown]> = []): Promise<World> => {
    const tx = fakeTransaction(mockEntityManager({ query: [...query] }))
    const entitlement = mock<EntitlementService>()
    const moduleRef = await Test.createTestingModule({
        providers: [
            RelayDeviceService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: tx.em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: ENTITLEMENT_SERVICE, useValue: entitlement },
            { provide: RELAY_OPTIONS, useValue: OPTIONS },
        ],
    }).compile()
    return { service: moduleRef.get(RelayDeviceService), entitlement, tx }
}

describe("RelayDeviceService start and preview", () => {
    it("opens a pairing with a secret device code stored only as its digest and a short user code", async () => {
        const { service, tx } = await world([[INSERT_PAIRING, []]])

        const pairing = await service.start({ deviceName: "  Laptop ", platform: "Linux" })

        expect(pairing.userCode).toMatch(/^[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/u)
        expect(pairing.deviceCode).toMatch(/^[A-Za-z0-9_-]{43}$/u)
        expect(pairing).toMatchObject({ verifyUrl: OPTIONS.verifyUrl, expiresAt: LATER })
        expect(tx.em.query).toHaveBeenCalledWith(INSERT_PAIRING, [
            relayDigest(pairing.deviceCode),
            pairing.userCode,
            "Laptop",
            "linux",
            new Date(LATER),
            new Date(NOW),
        ])
    })

    it.each([
        ["an empty name", { deviceName: " ", platform: "linux" }],
        ["a name with a control character", { deviceName: "a\u0007b", platform: "linux" }],
        ["a name too long", { deviceName: "n".repeat(61), platform: "linux" }],
        ["an unknown platform", { deviceName: "Laptop", platform: "beos" }],
    ])("refuses %s before storing anything", async (_case, input) => {
        const { service, tx } = await world()

        await expect(service.start(input)).rejects.toMatchObject({ code: RelayErrorCode.PairingInvalid })
        expect(tx.em.query).not.toHaveBeenCalled()
    })

    it("answers the relay unavailable when the store fails", async () => {
        const { service, tx } = await world()
        tx.em.query.mockRejectedValue(new Error("down"))

        await expect(service.start({ deviceName: "Laptop", platform: "macos" })).rejects.toMatchObject({
            code: RelayErrorCode.Unavailable,
        })
    })

    it("previews a pending pairing by its typed code, any case and with or without the dash", async () => {
        const { service, tx } = await world([[SELECT_PENDING_BY_USER_CODE, [rowOf({ status: "pending" })]]])

        await expect(service.preview("abcd efgh")).resolves.toEqual({
            name: "Laptop",
            platform: "linux",
            expiresAt: LATER,
        })
        expect(tx.em.query).toHaveBeenCalledWith(SELECT_PENDING_BY_USER_CODE, ["ABCD-EFGH", new Date(NOW)])
    })

    it.each(["short", "ABCD-EFG0", "ABCD-EFGH-1"])("finds no pairing for the code %s", async (code) => {
        const { service } = await world([[SELECT_PENDING_BY_USER_CODE, []]])

        await expect(service.preview(code)).rejects.toMatchObject({ code: RelayErrorCode.CodeNotFound })
    })

    it("finds no pairing for a well-formed code nothing pends under", async () => {
        const { service } = await world([[SELECT_PENDING_BY_USER_CODE, []]])

        await expect(service.preview("ABCD-EFGH")).rejects.toMatchObject({ code: RelayErrorCode.CodeNotFound })
    })
})

describe("RelayDeviceService confirm", () => {
    const confirmQueries = (paired: number, confirmed: ReadonlyArray<RelayDeviceRow>) =>
        [
            [LOCK_LEARNER_DEVICES, [{ locked: "" }]],
            [SELECT_PENDING_BY_USER_CODE, [rowOf({ status: "pending", learner_id: null })]],
            [COUNT_PAIRED, [{ n: paired }]],
            [CONFIRM_PAIRING, confirmed],
        ] as const

    it("confirms a pending pairing for a free learner under the free limit", async () => {
        const { service, entitlement, tx } = await world(
            confirmQueries(0, [rowOf({ status: "confirmed", last_seen_at: null, online_since: null })]),
        )
        entitlement.isPremium.mockResolvedValue(false)

        await expect(service.confirm(LEARNER, "abcd-efgh")).resolves.toEqual({
            id: DEVICE,
            name: "Laptop",
            platform: "linux",
            pairedAt: NOW,
            lastSeenAt: null,
            online: false,
        })
        expect(tx.em.query).toHaveBeenCalledWith(LOCK_LEARNER_DEVICES, [LEARNER])
        expect(tx.em.query).toHaveBeenCalledWith(CONFIRM_PAIRING, ["ABCD-EFGH", LEARNER, new Date(NOW)])
    })

    it("refuses a free learner's second device and admits a Premium learner's", async () => {
        const free = await world(confirmQueries(1, []))
        free.entitlement.isPremium.mockResolvedValue(false)
        await expect(free.service.confirm(LEARNER, "ABCD-EFGH")).rejects.toMatchObject({
            code: RelayErrorCode.DeviceLimit,
        })

        const premium = await world(confirmQueries(1, [rowOf({ status: "confirmed" })]))
        premium.entitlement.isPremium.mockResolvedValue(true)
        await expect(premium.service.confirm(LEARNER, "ABCD-EFGH")).resolves.toMatchObject({ id: DEVICE, online: true })
    })

    it("refuses a Premium learner at the Premium limit", async () => {
        const { service, entitlement } = await world(confirmQueries(2, []))
        entitlement.isPremium.mockResolvedValue(true)

        await expect(service.confirm(LEARNER, "ABCD-EFGH")).rejects.toMatchObject({ code: RelayErrorCode.DeviceLimit })
    })

    it("finds no pairing for an unknown code before counting, and when the confirm loses the race", async () => {
        const unknown = await world([
            [LOCK_LEARNER_DEVICES, [{ locked: "" }]],
            [SELECT_PENDING_BY_USER_CODE, []],
        ])
        unknown.entitlement.isPremium.mockResolvedValue(false)
        await expect(unknown.service.confirm(LEARNER, "ABCD-EFGH")).rejects.toMatchObject({
            code: RelayErrorCode.CodeNotFound,
        })
        expect(unknown.tx.em.query).not.toHaveBeenCalledWith(COUNT_PAIRED, expect.any(Array))

        const { service, entitlement } = await world([
            [LOCK_LEARNER_DEVICES, [{ locked: "" }]],
            [SELECT_PENDING_BY_USER_CODE, [rowOf({ status: "pending", learner_id: null })]],
            [COUNT_PAIRED, []],
            [CONFIRM_PAIRING, []],
        ])
        entitlement.isPremium.mockResolvedValue(false)

        await expect(service.confirm(LEARNER, "ABCD-EFGH")).rejects.toMatchObject({ code: RelayErrorCode.CodeNotFound })
    })
})

describe("RelayDeviceService token", () => {
    const tokenOf = (row: RelayDeviceRow | null): Promise<World> =>
        world([
            [LOCK_BY_DEVICE_CODE, row === null ? [] : [row]],
            [ISSUE_TOKEN, [{ device_id: DEVICE }]],
        ])

    it("issues the token of a confirmed pairing once, storing only its digest", async () => {
        const { service, tx } = await tokenOf(rowOf({ status: "confirmed" }))

        const { deviceToken } = await service.token(DEVICE_CODE)

        expect(deviceToken).toMatch(/^[A-Za-z0-9_-]{43}$/u)
        expect(tx.em.query).toHaveBeenCalledWith(LOCK_BY_DEVICE_CODE, [relayDigest(DEVICE_CODE)])
        expect(tx.em.query).toHaveBeenCalledWith(ISSUE_TOKEN, [DEVICE, relayDigest(deviceToken), new Date(NOW)])
    })

    it.each<[string, RelayDeviceRow | null, RelayErrorCode]>([
        ["an unknown code", null, RelayErrorCode.CodeNotFound],
        ["a pending pairing", rowOf({ status: "pending", learner_id: null }), RelayErrorCode.Pending],
        ["a token already taken", rowOf({ status: "active" }), RelayErrorCode.CodeNotFound],
        ["a lapsed pairing", rowOf({ status: "confirmed", expires_at: new Date(NOW) }), RelayErrorCode.CodeNotFound],
        ["a revoked device", rowOf({ status: "revoked" }), RelayErrorCode.DeviceRevoked],
    ])("refuses %s", async (_case, row, code) => {
        const { service, tx } = await tokenOf(row)

        await expect(service.token(DEVICE_CODE)).rejects.toMatchObject({ code })
        expect(tx.em.query).not.toHaveBeenCalledWith(ISSUE_TOKEN, expect.any(Array))
    })
})

describe("RelayDeviceService authenticate, devices and revoke", () => {
    it("proves a device token as its learner and device, touching its last contact", async () => {
        const { service, tx } = await world([[TOUCH_BY_TOKEN, [rowOf()]]])

        await expect(service.authenticate(TOKEN)).resolves.toEqual({ learnerId: LEARNER, deviceId: DEVICE })
        expect(tx.em.query).toHaveBeenCalledWith(TOUCH_BY_TOKEN, [relayDigest(TOKEN), new Date(NOW)])
    })

    it("admits a device token for the relay app with its learner's Premium state now", async () => {
        const { service, entitlement } = await world([[TOUCH_BY_TOKEN, [rowOf()]]])
        entitlement.isPremium.mockResolvedValue(true)

        await expect(service.admit(TOKEN)).resolves.toEqual({ learnerId: LEARNER, deviceId: DEVICE, premium: true })
        expect(entitlement.isPremium).toHaveBeenCalledWith(LEARNER)
    })

    it("refuses a malformed, unknown or revoked token without telling them apart", async () => {
        const unknown = await world([[TOUCH_BY_TOKEN, []]])

        await expect(unknown.service.authenticate("not-a-token")).rejects.toMatchObject({
            code: RelayErrorCode.DeviceRevoked,
        })
        expect(unknown.tx.em.query).not.toHaveBeenCalled()
        await expect(unknown.service.authenticate(TOKEN)).rejects.toMatchObject({ code: RelayErrorCode.DeviceRevoked })
    })

    it("lists the learner's devices with their online state", async () => {
        const quiet = rowOf({
            device_id: "22222222-2222-4222-8222-222222222222",
            last_seen_at: new Date("2026-11-09T01:00:00.000Z"),
            online_since: null,
        })
        const unconfirmed = rowOf({ confirmed_at: null, last_seen_at: null, online_since: null })
        const { service, tx } = await world([[SELECT_DEVICES, [rowOf(), quiet, unconfirmed]]])

        const devices = await service.devices(LEARNER)

        expect(devices.map((device) => device.online)).toEqual([true, false, false])
        expect(devices[2]?.pairedAt).toBe(NOW)
        expect(tx.em.query).toHaveBeenCalledWith(SELECT_DEVICES, [LEARNER, 500])
    })

    it("opens and closes a device's socket presence, and clears every presence at boot", async () => {
        const { service, tx } = await world([
            [SET_PRESENCE, [{ device_id: DEVICE }]],
            [CLEAR_PRESENCE, [{ n: 2 }]],
        ])

        await service.presence(DEVICE, true)
        await service.presence(DEVICE, false)
        await service.clearPresence()

        expect(tx.em.query.mock.calls.map(([statement, params]) => [statement, params])).toEqual([
            [SET_PRESENCE, [DEVICE, true, new Date(NOW)]],
            [SET_PRESENCE, [DEVICE, false, new Date(NOW)]],
            [CLEAR_PRESENCE, [new Date(NOW)]],
        ])
    })

    it("revokes one device of the learner, and finds no foreign or unknown one", async () => {
        const owned = await world([[REVOKE_DEVICE, [{ device_id: DEVICE }]]])
        await expect(owned.service.revoke(LEARNER, DEVICE)).resolves.toBe(DEVICE)
        expect(owned.tx.em.query).toHaveBeenCalledWith(REVOKE_DEVICE, [DEVICE, LEARNER, new Date(NOW)])

        const foreign = await world([[REVOKE_DEVICE, []]])
        await expect(foreign.service.revoke(LEARNER, DEVICE)).rejects.toMatchObject({
            code: RelayErrorCode.DeviceNotFound,
        })
    })
})
