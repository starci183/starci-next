import { RelayDeviceEntity } from "./relay-device.entity"
import { RelayEventEntity } from "./relay-event.entity"
import { RelayLabEventEntity } from "./relay-lab-event.entity"
import { RelayLabStateEntity } from "./relay-lab-state.entity"
import { RelayLabSubmissionEntity } from "./relay-lab-submission.entity"
import { RelayPairCodeEntity } from "./relay-pair-code.entity"

export {
    RelayDeviceEntity,
    RelayEventEntity,
    RelayLabEventEntity,
    RelayLabStateEntity,
    RelayLabSubmissionEntity,
    RelayPairCodeEntity,
}

/** The entities of the relay capability, named in PRIMARY_ENTITIES of platform/database/entities.ts. */
export const relayEntities: ReadonlyArray<new () => object> = [
    RelayDeviceEntity,
    RelayEventEntity,
    RelayLabEventEntity,
    RelayLabStateEntity,
    RelayLabSubmissionEntity,
    RelayPairCodeEntity,
]
