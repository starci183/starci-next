import { RelayDeviceEntity } from "./relay-device.entity"
import { RelayEventEntity } from "./relay-event.entity"

export { RelayDeviceEntity, RelayEventEntity }

/** The entities of the relay capability, named in PRIMARY_ENTITIES of platform/database/entities.ts. */
export const relayEntities: ReadonlyArray<new () => object> = [RelayDeviceEntity, RelayEventEntity]
