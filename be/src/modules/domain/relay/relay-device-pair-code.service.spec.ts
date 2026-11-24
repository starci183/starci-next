import { generateKeyPairSync } from "node:crypto"
import { FakeClock, fakeTransaction, mock, mockEntityManager } from "@starci/jest-preset"
import type { FakeTransaction, MockOf } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { ENTITLEMENT_SERVICE, type EntitlementService } from "@modules/domain/entitlement"
import { RelayErrorCode } from "./errors/relay.error"
import { RELAY_OPTIONS } from "./relay.decorators"
import { RelayDeviceService } from "./relay-device.service"
import { pairCodeDigestOf } from "./relay-lab.policy"
import { relayDigest } from "./relay-pairing.policy"
import { COUNT_PAIRED, LOCK_LEARNER_DEVICES } from "./persistence/relay.sql"
import {
    INSERT_CLAIMED_DEVICE,
    INSERT_PAIR_CODE,
    LOCK_PAIR_CODE,
    PURGE_PAIR_CODES,
    REGISTER_DEVICE_KEY,
    SELECT_DEVICE_KEY,
    USE_PAIR_CODE,
} from "./persistence/relay-lab.sql"

const NOW = "2026-11-25T02:00:00.000Z"
const EXPIRES = "2026-11-25T02:10:00.000Z"
const LEARNER = "b8099f0e-58c7-4685-8292-f3a49ec994b1"
const DEVICE = "11111111-1111-4111-8111-111111111111"
const CODE_ROW = "22222222-2222-4222-8222-222222222222"
const OPTIONS = {
    verifyUrl: "https://app.example/devices",
    pairingTtlSeconds: 600,
    premiumDeviceLimit: 2,
    freeDeviceLimit: 1,
}

interface World {
    readonly service: RelayDeviceService
    readonly entitlement: MockOf<EntitlementService>
    readonly tx: FakeTransaction
}

const world = async (query: ReadonlyArray<readonly [string, unknown]> = []): Promise<World> => {
    const tx = fakeTransaction(mockEntityManager({ query: [...query] }))
    const entitlement = mock<EntitlementService>()
    entitlement.isPremium.mockResolvedValue(false)
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

describe("RelayDeviceService issuePairCode", () => {
    it("issues six digits valid ten minutes, stores only their digest and drops the learner's earlier codes first", async () => {
        const { service, tx } = await world([
            [PURGE_PAIR_CODES, []],
            [INSERT_PAIR_CODE, [{ id: CODE_ROW }]],
        ])

        const issued = await service.issuePairCode(LEARNER)

        expect(issued.code).toMatch(/^\d{6}$/u)
        expect(issued.expiresAt).toBe(EXPIRES)
        expect(tx.em.query).toHaveBeenNthCalledWith(1, PURGE_PAIR_CODES, [LEARNER, new Date(NOW)])
        expect(tx.em.query).toHaveBeenNthCalledWith(2, INSERT_PAIR_CODE, [
            pairCodeDigestOf(issued.code),
            LEARNER,
            new Date(NOW),
            new Date(EXPIRES),
        ])
        const stored = tx.em.query.mock.calls.flatMap((call) => call.slice(1).flat())
        expect(stored).not.toContain(issued.code)
    })

    it("draws another code when the digest is already held, and gives up unavailable after five", async () => {
        const retried = await world([
            [PURGE_PAIR_CODES, []],
            [INSERT_PAIR_CODE, []],
            [INSERT_PAIR_CODE, [{ id: CODE_ROW }]],
        ])
        await expect(retried.service.issuePairCode(LEARNER)).resolves.toMatchObject({ expiresAt: EXPIRES })
        expect(retried.tx.em.query.mock.calls.filter((call) => call[0] === INSERT_PAIR_CODE)).toHaveLength(2)

        const exhausted = await world([
            [PURGE_PAIR_CODES, []],
            [INSERT_PAIR_CODE, []],
        ])
        await expect(exhausted.service.issuePairCode(LEARNER)).rejects.toMatchObject({
            code: RelayErrorCode.Unavailable,
        })
        expect(exhausted.tx.em.query.mock.calls.filter((call) => call[0] === INSERT_PAIR_CODE)).toHaveLength(5)
    })
})

describe("RelayDeviceService claimPairCode", () => {
    const claimQueries = (paired: number) =>
        [
            [LOCK_PAIR_CODE, [{ id: CODE_ROW, learner_id: LEARNER }]],
            [LOCK_LEARNER_DEVICES, [{ locked: "" }]],
            [COUNT_PAIRED, [{ n: paired }]],
            [USE_PAIR_CODE, [{ id: CODE_ROW }]],
            [INSERT_CLAIMED_DEVICE, [{ device_id: DEVICE }]],
        ] as const

    it("spends the code and creates the device in one transaction, handing back a token stored only as its digest", async () => {
        const { service, tx } = await world(claimQueries(0))

        const { deviceToken } = await service.claimPairCode("123 456", " Laptop ", "Linux")

        expect(deviceToken).toMatch(/^[A-Za-z0-9_-]{43}$/u)
        expect(tx.em.query).toHaveBeenCalledWith(LOCK_PAIR_CODE, [pairCodeDigestOf("123456"), new Date(NOW)])
        expect(tx.em.query).toHaveBeenCalledWith(USE_PAIR_CODE, [CODE_ROW, new Date(NOW)])
        const insert = tx.em.query.mock.calls.find((call) => call[0] === INSERT_CLAIMED_DEVICE)
        expect(insert?.[1]).toEqual([
            LEARNER,
            "Laptop",
            "linux",
            expect.stringMatching(/^[0-9a-f]{64}$/u),
            expect.stringMatching(/^[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/u),
            relayDigest(deviceToken),
            new Date(NOW),
        ])
        expect(tx.commits).toBe(1)
    })

    it("finds nothing for a code that is unknown, lapsed or already used: the same answer, and nothing written", async () => {
        const { service, tx } = await world([[LOCK_PAIR_CODE, []]])

        await expect(service.claimPairCode("123456", "Laptop", "linux")).rejects.toMatchObject({
            code: RelayErrorCode.PairCodeNotFound,
        })
        expect(tx.rollbacks).toBe(1)
        expect(tx.em.query).not.toHaveBeenCalledWith(USE_PAIR_CODE, expect.anything())
        expect(tx.em.query).not.toHaveBeenCalledWith(INSERT_CLAIMED_DEVICE, expect.anything())
    })

    it("lets the second claim of the same code fail once the first spent it", async () => {
        const { service } = await world([
            [LOCK_PAIR_CODE, [{ id: CODE_ROW, learner_id: LEARNER }]],
            [LOCK_PAIR_CODE, []],
            [LOCK_LEARNER_DEVICES, [{ locked: "" }]],
            [COUNT_PAIRED, [{ n: 0 }]],
            [USE_PAIR_CODE, [{ id: CODE_ROW }]],
            [INSERT_CLAIMED_DEVICE, [{ device_id: DEVICE }]],
        ])

        await expect(service.claimPairCode("123456", "Laptop", "linux")).resolves.toHaveProperty("deviceToken")
        await expect(service.claimPairCode("123456", "Laptop", "linux")).rejects.toMatchObject({
            code: RelayErrorCode.PairCodeNotFound,
        })
    })

    it("keeps the code when the learner is at the device limit", async () => {
        const { service, tx } = await world(claimQueries(1))

        await expect(service.claimPairCode("123456", "Laptop", "linux")).rejects.toMatchObject({
            code: RelayErrorCode.DeviceLimit,
        })
        expect(tx.em.query).not.toHaveBeenCalledWith(USE_PAIR_CODE, expect.anything())
        expect(tx.rollbacks).toBe(1)
    })

    it("admits a second device of a Premium learner", async () => {
        const { service, entitlement } = await world(claimQueries(1))
        entitlement.isPremium.mockResolvedValue(true)

        await expect(service.claimPairCode("123456", "Laptop", "windows")).resolves.toHaveProperty("deviceToken")
    })

    it.each(["12345", "1234567", "12a456", ""])(
        "finds no code for the typed %j without touching the store",
        async (typed) => {
            const { service, tx } = await world()

            await expect(service.claimPairCode(typed, "Laptop", "linux")).rejects.toMatchObject({
                code: RelayErrorCode.PairCodeNotFound,
            })
            expect(tx.em.query).not.toHaveBeenCalled()
        },
    )

    it.each([
        ["a name too long", "n".repeat(61), "linux"],
        ["an empty name", " ", "linux"],
        ["an unknown platform", "Laptop", "beos"],
    ])("refuses %s before the code is touched", async (_case, name, platform) => {
        const { service, tx } = await world()

        await expect(service.claimPairCode("123456", name, platform)).rejects.toMatchObject({
            code: RelayErrorCode.PairingInvalid,
        })
        expect(tx.em.query).not.toHaveBeenCalled()
    })
})

describe("RelayDeviceService registerKey", () => {
    const KEY = generateKeyPairSync("ed25519").publicKey.export({ type: "spki", format: "der" }).toString("base64")
    const OTHER_KEY = generateKeyPairSync("ed25519")
        .publicKey.export({ type: "spki", format: "der" })
        .toString("base64")

    it("registers the key of a device that holds none", async () => {
        const { service, tx } = await world([[REGISTER_DEVICE_KEY, [{ device_id: DEVICE }]]])

        await expect(service.registerKey(DEVICE, KEY)).resolves.toBeUndefined()
        expect(tx.em.query).toHaveBeenCalledWith(REGISTER_DEVICE_KEY, [DEVICE, KEY])
    })

    it("answers done for the same key again and refuses a different key until the device is paired again", async () => {
        const same = await world([
            [REGISTER_DEVICE_KEY, []],
            [SELECT_DEVICE_KEY, [{ public_key: KEY }]],
        ])
        await expect(same.service.registerKey(DEVICE, KEY)).resolves.toBeUndefined()

        const other = await world([
            [REGISTER_DEVICE_KEY, []],
            [SELECT_DEVICE_KEY, [{ public_key: KEY }]],
        ])
        await expect(other.service.registerKey(DEVICE, OTHER_KEY)).rejects.toMatchObject({
            code: RelayErrorCode.DeviceKeyLocked,
        })
    })

    it("refuses a text that is not an Ed25519 public key before touching the store", async () => {
        const { service, tx } = await world()

        await expect(service.registerKey(DEVICE, "AAAA")).rejects.toMatchObject({
            code: RelayErrorCode.DeviceKeyInvalid,
        })
        expect(tx.em.query).not.toHaveBeenCalled()
    })

    it("treats a revoked device, which holds no row, as revoked", async () => {
        const { service } = await world([
            [REGISTER_DEVICE_KEY, []],
            [SELECT_DEVICE_KEY, []],
        ])

        await expect(service.registerKey(DEVICE, KEY)).rejects.toMatchObject({ code: RelayErrorCode.DeviceRevoked })
    })
})
