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
    RelayAdmission,
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

    /** Proves a device token for the relay app and answers its learner's Premium state now (the relay's internal door). */
    async admit(deviceToken: string): Promise<RelayAdmission> {
        const device = await this.authenticate(deviceToken)
        return { ...device, premium: await this.entitlement.isPremium(device.learnerId) }
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
