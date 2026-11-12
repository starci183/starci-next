import type { DynamicModule, Type } from "@nestjs/common"
import { RelayDeviceWebsocketModule } from "@features/realtime/relay-device"

/** The realtime transports of the app: the push-only device socket of the learner relay, over the hub the platform area composes. */
export const realtimeModules = (): Array<Type<unknown> | DynamicModule> => [RelayDeviceWebsocketModule.register({})]
