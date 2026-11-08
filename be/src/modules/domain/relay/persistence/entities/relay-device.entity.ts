import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("relay_devices")
/** One learner machine paired with the relay: pending, confirmed by the learner, holding its token, or revoked. */
export class RelayDeviceEntity {
    /** The device id. */
    @PrimaryColumn({ name: "device_id", type: "uuid" })
    deviceId!: string

    /** The learner who confirmed the pairing; null while it is pending. */
    @Column({ name: "learner_id", type: "uuid", nullable: true })
    learnerId!: string | null

    /** The device name the CLI reported. */
    @Column({ name: "name", type: "text" })
    name!: string

    /** The device platform: windows, macos or linux. */
    @Column({ name: "platform", type: "text" })
    platform!: string

    /** The digest of the secret device code the CLI exchanges for its token. */
    @Column({ name: "device_code_digest", type: "varchar", length: 64 })
    deviceCodeDigest!: string

    /** The short code the learner types on the web. */
    @Column({ name: "user_code", type: "varchar", length: 9 })
    userCode!: string

    /** pending, confirmed, active or revoked. */
    @Column({ name: "status", type: "text" })
    status!: string

    /** The digest of the device token once issued; cleared on revoke. */
    @Column({ name: "token_digest", type: "varchar", length: 64, nullable: true })
    tokenDigest!: string | null

    /** The instant the pairing opened. */
    @Column({ name: "created_at", type: "timestamptz" })
    createdAt!: Date

    /** The instant the pending pairing lapses. */
    @Column({ name: "expires_at", type: "timestamptz" })
    expiresAt!: Date

    /** The instant the learner confirmed. */
    @Column({ name: "confirmed_at", type: "timestamptz", nullable: true })
    confirmedAt!: Date | null

    /** The instant the relay last heard from the device. */
    @Column({ name: "last_seen_at", type: "timestamptz", nullable: true })
    lastSeenAt!: Date | null

    /** The instant its socket opened, while it is open; null when no socket is open. */
    @Column({ name: "online_since", type: "timestamptz", nullable: true })
    onlineSince!: Date | null

    /** The instant the learner revoked it. */
    @Column({ name: "revoked_at", type: "timestamptz", nullable: true })
    revokedAt!: Date | null
}
