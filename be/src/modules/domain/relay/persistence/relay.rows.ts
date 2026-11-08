import type { RelayPlatform } from "../relay.contracts"

/** The states a device row moves through: pending until the learner confirms, confirmed until the token is taken. */
export type RelayDeviceStatus = "pending" | "confirmed" | "active" | "revoked"

/** One device row as the relay queries return it. */
export interface RelayDeviceRow {
    /** Device id. */
    device_id: string
    /** The learner who confirmed the pairing, or null while it is pending. */
    learner_id: string | null
    /** Device name. */
    name: string
    /** Device platform. */
    platform: RelayPlatform
    /** Lifecycle state. */
    status: RelayDeviceStatus
    /** Pairing expiry. */
    expires_at: Date
    /** Confirmation instant. */
    confirmed_at: Date | null
    /** Last socket or upload activity. */
    last_seen_at: Date | null
    /** When its open socket connected, or null when none is open. */
    online_since: Date | null
}
