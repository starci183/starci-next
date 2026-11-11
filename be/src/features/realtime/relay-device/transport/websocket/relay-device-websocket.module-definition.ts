import { defineConfigurableModule } from "@starci/nest-kit"
import type { RelayDeviceWebsocketOptions } from "./relay-device-websocket.options"

/** The configurable-module base of the relay-device websocket module. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<RelayDeviceWebsocketOptions>()
