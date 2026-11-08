import { RelayDeviceEntity } from "./entities/relay-device.entity"
import { RelayEventEntity } from "./entities/relay-event.entity"
import { InitRelay1797700000002 } from "./migrations/1797700000002-init-relay"
import { RelayEvents1797700000003 } from "./migrations/1797700000003-relay-events"

/** The entities of the relay capability. */
export const relayEntities: Array<typeof RelayDeviceEntity | typeof RelayEventEntity> = [
    RelayDeviceEntity,
    RelayEventEntity,
]

/** The migrations of the relay capability, in the order they run. */
export const relayMigrations: Array<typeof InitRelay1797700000002 | typeof RelayEvents1797700000003> = [
    InitRelay1797700000002,
    RelayEvents1797700000003,
]
