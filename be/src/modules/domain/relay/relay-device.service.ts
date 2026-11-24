import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager, LIST_ROWS_MAX, type sql } from "@modules/platform/database"
import { InjectEntitlementService, type EntitlementService } from "@modules/domain/entitlement"
import { RelayError, RelayErrorCode } from "./errors/relay.error"
import { InjectRelayOptions } from "./relay.decorators"
import type { RelayOptions } from "./relay.options"
import type {
    DevicePairing,
    DevicePrincipal,
    DeviceToken,
    PairingPreview,
    RelayDevice,
    StartPairingInput,
} from "./relay.contracts"
import {
    deviceNameOf,
    deviceTokenShaped,
    normalizedUserCode,
    platformOf,
    relayDigest,
    relaySecret,
    userCodeOf,
} from "./relay-pairing.policy"
import { deviceKeyValid, normalizedPairCode, pairCodeDigestOf, pairCodeOf } from "./relay-lab.policy"
import type { RelayPairCode } from "./relay-lab.contracts"
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
import {
    INSERT_CLAIMED_DEVICE,
    INSERT_PAIR_CODE,
    LOCK_PAIR_CODE,
    PURGE_PAIR_CODES,
    REGISTER_DEVICE_KEY,
    SELECT_DEVICE_KEY,
    USE_PAIR_CODE,
} from "./persistence/relay-lab.sql"

/** How many fresh codes are tried when a digest is already held, before the relay answers unavailable. */
const PAIR_CODE_ATTEMPTS = 5

/** One SQL constant of the relay persistence. */
type SqlText = ReturnType<typeof sql>

@Injectable()
/**
 * The device pairing of the learner relay, the gh-auth-login way: the CLI starts a pairing and polls with its secret
 * device code, the signed-in learner confirms the short user code on the web, and the CLI then takes its own device token
 * once. Codes and tokens are stored only as digests; a device is revocable at any time, and the plan bounds how many a
 * learner holds (Q-R-2).
 */
export class RelayDeviceService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectEntitlementService() private readonly entitlement: EntitlementService,
        @InjectRelayOptions() private readonly options: RelayOptions,
    ) {}

    /** Opens a pairing for a CLI; a name or platform outside its bounds is refused before anything is stored. */
    async start(input: StartPairingInput): Promise<DevicePairing> {
        const name = deviceNameOf(input.deviceName)
        const platform = platformOf(input.platform)
        if (name === null || platform === null) throw new RelayError({ code: RelayErrorCode.PairingInvalid })
        const now = this.clock.now()
        const expiresAt = new Date(now.getTime() + this.options.pairingTtlSeconds * 1000)
        const deviceCode = relaySecret()
        const userCode = userCodeOf()
        await this.write(INSERT_PAIRING, [relayDigest(deviceCode), userCode, name, platform, expiresAt, now])
        return { deviceCode, userCode, verifyUrl: this.options.verifyUrl, expiresAt: expiresAt.toISOString() }
    }

    /** What the learner sees about a live pending pairing before confirming it; anything else is not found. */
    async preview(userCode: string): Promise<PairingPreview> {
        const rows: Array<RelayDeviceRow> = await this.read(SELECT_PENDING_BY_USER_CODE, [
            this.userCodeOrRefuse(userCode),
            this.clock.now(),
        ])
        const row = rows[0]
        if (!row) throw new RelayError({ code: RelayErrorCode.CodeNotFound })
        return { name: row.name, platform: row.platform, expiresAt: row.expires_at.toISOString() }
    }

    /**
     * Confirms a live pending pairing for the signed-in learner, within the plan's device limit; an unknown or lapsed code
     * is not found whatever the count, and concurrent confirmations of one learner are serialized, so the limit holds.
     */
    async confirm(learnerId: string, userCode: string): Promise<RelayDevice> {
        const code = this.userCodeOrRefuse(userCode)
        const limit = (await this.entitlement.isPremium(learnerId))
            ? this.options.premiumDeviceLimit
            : this.options.freeDeviceLimit
        const now = this.clock.now()
        const confirmed = await this.entityManager.transaction(async (manager): Promise<RelayDeviceRow | undefined> => {
            await manager.query(LOCK_LEARNER_DEVICES, [learnerId])
            const pending: Array<RelayDeviceRow> = await manager.query(SELECT_PENDING_BY_USER_CODE, [code, now])
            if (!pending[0]) return undefined
            const counted: Array<{ n: number }> = await manager.query(COUNT_PAIRED, [learnerId])
            if ((counted[0]?.n ?? 0) >= limit) throw new RelayError({ code: RelayErrorCode.DeviceLimit })
            const rows: Array<RelayDeviceRow> = await manager.query(CONFIRM_PAIRING, [code, learnerId, now])
            return rows[0]
        })
        if (confirmed === undefined) throw new RelayError({ code: RelayErrorCode.CodeNotFound })
        return this.deviceOf(confirmed, now)
    }

    /**
     * Exchanges the CLI's device code for its device token, once: pending answers RELAY_PENDING, a token already taken or
     * an unknown or lapsed code answers RELAY_CODE_NOT_FOUND, and a revoked device RELAY_DEVICE_REVOKED.
     */
    async token(deviceCode: string): Promise<DeviceToken> {
        const now = this.clock.now()
        const deviceToken = relaySecret()
        await this.entityManager.transaction(async (manager): Promise<void> => {
            const rows: Array<RelayDeviceRow> = await manager.query(LOCK_BY_DEVICE_CODE, [relayDigest(deviceCode)])
            const row = rows[0]
            if (!row) throw new RelayError({ code: RelayErrorCode.CodeNotFound })
            if (row.status === "revoked") throw new RelayError({ code: RelayErrorCode.DeviceRevoked })
            if (row.status === "active" || row.expires_at <= now)
                throw new RelayError({ code: RelayErrorCode.CodeNotFound })
            if (row.status === "pending") throw new RelayError({ code: RelayErrorCode.Pending })
            await manager.query(ISSUE_TOKEN, [row.device_id, relayDigest(deviceToken), now])
        })
        return { deviceToken }
    }

    /** The device a bearer device token proves, touching its last contact; an unknown or revoked token is refused. */
    async authenticate(deviceToken: string): Promise<DevicePrincipal> {
        if (!deviceTokenShaped(deviceToken)) throw new RelayError({ code: RelayErrorCode.DeviceRevoked })
        const rows: Array<RelayDeviceRow> = await this.read(TOUCH_BY_TOKEN, [
            relayDigest(deviceToken),
            this.clock.now(),
        ])
        const row = rows[0]
        if (!row?.learner_id) throw new RelayError({ code: RelayErrorCode.DeviceRevoked })
        return { learnerId: row.learner_id, deviceId: row.device_id }
    }

    /** Opens or closes the socket presence of a device; a revoked device is left alone. */
    async presence(deviceId: string, isOpen: boolean): Promise<void> {
        await this.write(SET_PRESENCE, [deviceId, isOpen, this.clock.now()])
    }

    /** Closes every presence a previous relay process left open, at boot. */
    async clearPresence(): Promise<void> {
        await this.write(CLEAR_PRESENCE, [this.clock.now()])
    }

    /** The learner's paired devices, newest first, each with its online state. */
    async devices(learnerId: string): Promise<ReadonlyArray<RelayDevice>> {
        const rows: Array<RelayDeviceRow> = await this.read(SELECT_DEVICES, [learnerId, LIST_ROWS_MAX])
        const now = this.clock.now()
        return rows.map((row) => this.deviceOf(row, now))
    }

    /** Revokes one of the learner's devices; its token stops working at once. A foreign or unknown id is not found. */
    async revoke(learnerId: string, deviceId: string): Promise<string> {
        const rows: Array<{ device_id: string }> = await this.read(REVOKE_DEVICE, [
            deviceId,
            learnerId,
            this.clock.now(),
        ])
        const row = rows[0]
        if (!row) throw new RelayError({ code: RelayErrorCode.DeviceNotFound })
        return row.device_id
    }

    /**
     * Issues a six-digit pairing code for the signed-in learner, valid for `pairingTtlSeconds` (ten minutes) and for one use. Only its
     * digest is stored, and the learner's earlier codes are dropped, so one code is live per learner.
     */
    async issuePairCode(learnerId: string): Promise<RelayPairCode> {
        const now = this.clock.now()
        const expiresAt = new Date(now.getTime() + this.options.pairingTtlSeconds * 1000)
        await this.write(PURGE_PAIR_CODES, [learnerId, now])
        for (let attempt = 0; attempt < PAIR_CODE_ATTEMPTS; attempt += 1) {
            const code = pairCodeOf()
            const stored: Array<{ id: string }> = await this.read(INSERT_PAIR_CODE, [
                pairCodeDigestOf(code),
                learnerId,
                now,
                expiresAt,
            ])
            if (stored[0]) return { code, expiresAt: expiresAt.toISOString() }
        }
        throw new RelayError({ code: RelayErrorCode.Unavailable })
    }

    /**
     * Exchanges a six-digit pairing code for a new active device and its token, once: the code is spent in the same transaction that
     * creates the device, within the learner's device limit. An unknown, lapsed or used code is RELAY_PAIR_CODE_NOT_FOUND, the three
     * indistinguishable; a name or platform outside its bounds is refused before the code is touched.
     */
    async claimPairCode(code: string, deviceName: string, platform: string): Promise<DeviceToken> {
        const name = deviceNameOf(deviceName)
        const kind = platformOf(platform)
        if (name === null || kind === null) throw new RelayError({ code: RelayErrorCode.PairingInvalid })
        const digits = normalizedPairCode(code)
        if (digits === null) throw new RelayError({ code: RelayErrorCode.PairCodeNotFound })
        const now = this.clock.now()
        const deviceToken = relaySecret()
        await this.entityManager.transaction(async (manager): Promise<void> => {
            const rows: Array<{ id: string; learner_id: string }> = await manager.query(LOCK_PAIR_CODE, [
                pairCodeDigestOf(digits),
                now,
            ])
            const row = rows[0]
            if (!row) throw new RelayError({ code: RelayErrorCode.PairCodeNotFound })
            const limit = (await this.entitlement.isPremium(row.learner_id))
                ? this.options.premiumDeviceLimit
                : this.options.freeDeviceLimit
            await manager.query(LOCK_LEARNER_DEVICES, [row.learner_id])
            const counted: Array<{ n: number }> = await manager.query(COUNT_PAIRED, [row.learner_id])
            if ((counted[0]?.n ?? 0) >= limit) throw new RelayError({ code: RelayErrorCode.DeviceLimit })
            await manager.query(USE_PAIR_CODE, [row.id, now])
            await manager.query(INSERT_CLAIMED_DEVICE, [
                row.learner_id,
                name,
                kind,
                relayDigest(relaySecret()),
                userCodeOf(),
                relayDigest(deviceToken),
                now,
            ])
        })
        return { deviceToken }
    }

    /**
     * Registers the base64 SPKI Ed25519 public key the device signs grading results with. The key is set once: the same key again
     * answers as done, a different one is RELAY_DEVICE_KEY_LOCKED (a new key needs a new pairing, which is a new device).
     */
    async registerKey(deviceId: string, publicKey: string): Promise<void> {
        if (!deviceKeyValid(publicKey)) throw new RelayError({ code: RelayErrorCode.DeviceKeyInvalid })
        const set: Array<{ device_id: string }> = await this.read(REGISTER_DEVICE_KEY, [deviceId, publicKey])
        if (set[0]) return
        const held: Array<{ public_key: string | null }> = await this.read(SELECT_DEVICE_KEY, [deviceId])
        if (held[0]?.public_key === publicKey) return
        throw new RelayError({
            code: held[0] === undefined ? RelayErrorCode.DeviceRevoked : RelayErrorCode.DeviceKeyLocked,
        })
    }

    /** The stored form of a typed user code; a code that cannot be one is not found. */
    private userCodeOrRefuse(userCode: string): string {
        const code = normalizedUserCode(userCode)
        if (code === null) throw new RelayError({ code: RelayErrorCode.CodeNotFound })
        return code
    }

    /** One device of the list, online only while its relay socket is open. */
    private deviceOf(row: RelayDeviceRow, now: Date): RelayDevice {
        const lastSeen = row.last_seen_at
        return {
            id: row.device_id,
            name: row.name,
            platform: row.platform,
            pairedAt: (row.confirmed_at ?? now).toISOString(),
            lastSeenAt: lastSeen === null ? null : lastSeen.toISOString(),
            online: row.online_since !== null,
        }
    }

    /** Runs one statement; a failed read or write answers the relay unavailable. */
    private read<T>(statement: SqlText, params: ReadonlyArray<unknown>): Promise<T> {
        return this.entityManager.query(statement, [...params]).catch((cause: unknown) => {
            throw new RelayError({ code: RelayErrorCode.Unavailable, cause })
        })
    }

    /** Runs one write; a failed write answers the relay unavailable. */
    private async write(statement: SqlText, params: ReadonlyArray<unknown>): Promise<void> {
        await this.read(statement, params)
    }
}
