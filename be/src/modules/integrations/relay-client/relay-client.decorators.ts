import { HTTP_CLIENT, type HttpClient } from "@modules/platform/http"
import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { RelayClientModuleOptions } from "./relay-client.options"
import type { RelayClientPort } from "./relay-client.port"
import type { TerminalPort } from "./relay-client.contracts"

/** Injection token of the relay client. */
export const RELAY_CLIENT: unique symbol = Symbol("integrations.relay-client.client")

/** Injection token of the validated relay client module options. */
export const RELAY_CLIENT_OPTIONS: unique symbol = Symbol("integrations.relay-client.options")

/** Injection token of the terminal this process runs in. */
export const RELAY_TERMINAL: unique symbol = Symbol("integrations.relay-client.terminal")

/** Injects the relay client. Parameter type: RelayClientPort. */
export const InjectRelayClient = (): TypedParameterDecorator<RelayClientPort> => injector<RelayClientPort>(RELAY_CLIENT)

/** Injects the validated relay client module options. Parameter type: RelayClientModuleOptions. */
export const InjectRelayClientOptions = (): TypedParameterDecorator<RelayClientModuleOptions> =>
    injector<RelayClientModuleOptions>(RELAY_CLIENT_OPTIONS)

/** Injects the terminal of this process. Parameter type: TerminalPort. */
export const InjectRelayTerminal = (): TypedParameterDecorator<TerminalPort> => injector<TerminalPort>(RELAY_TERMINAL)

/** Injects the bounded outbound HTTP port the platform provides. Parameter type: HttpClient. */
export const InjectRelayClientHttp = (): TypedParameterDecorator<HttpClient> => injector<HttpClient>(HTTP_CLIENT)

/** Injection token of the id that correlates every call this process makes to StarCi. */
export const RELAY_CORRELATION: unique symbol = Symbol("integrations.relay-client.correlation")

/** Injects the correlation id of this process. Parameter type: string. */
export const InjectRelayCorrelation = (): TypedParameterDecorator<string> => injector<string>(RELAY_CORRELATION)
