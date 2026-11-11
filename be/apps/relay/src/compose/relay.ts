import type { DynamicModule } from "@nestjs/common"
import { RelayFeedGraphqlModule } from "@features/api/relay-feed"
import { RelayDeviceWebsocketModule } from "@features/realtime/relay-device"
import {
    ENTITLEMENT_ERROR_KINDS,
    ENTITLEMENT_MESSAGES,
    EntitlementModule,
    entitlementEntities,
} from "@modules/domain/entitlement"
import { RELAY_ERROR_KINDS, RELAY_MESSAGES, RelayFeedModule, RelayModule, relayEntities } from "@modules/domain/relay"
import type { DatabaseConnectionOptions } from "@modules/platform/database"
import type { ErrorKind } from "@modules/platform/errors"
import type { MessageBundle } from "@modules/platform/i18n"
import type { RelayAppOptions } from "../relay.options"

/** The relay area: device auth and the feed, the upload doors and the push-only device socket. */
export const relayModules = (options: RelayAppOptions): Array<DynamicModule> => [
    EntitlementModule.register({ isGlobal: true }),
    RelayModule.register({ isGlobal: true, ...options.relay }),
    RelayFeedModule.register({ isGlobal: true, ...options.relay }),
    RelayFeedGraphqlModule.register({}),
    RelayDeviceWebsocketModule.register({}),
]

/** The error kind tables of the relay area. */
export const relayAreaErrorKinds: ReadonlyArray<Readonly<Record<string, ErrorKind>>> = [
    ENTITLEMENT_ERROR_KINDS,
    RELAY_ERROR_KINDS,
]

/** The message bundles of the relay area. */
export const relayAreaMessages: ReadonlyArray<MessageBundle> = [ENTITLEMENT_MESSAGES, RELAY_MESSAGES]

/** The entities the relay area reads and writes. */
export const relayAreaEntities: DatabaseConnectionOptions["entities"] = [...entitlementEntities, ...relayEntities]
