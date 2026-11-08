import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { ProbeReply, ProbeSendRequest } from "./probe.contracts"

/**
 * The probe transport: sends one request to a learner's deployed address and answers the response or why there is none. It never
 * throws, follows no redirect, keeps no cookie, reaches only public addresses (checked at connection time) and caps the time and the
 * bytes it reads.
 */
export interface ProbeTransport {
    /** Sends the request. */
    send(request: ProbeSendRequest): Promise<ProbeReply>
    /** True when the host name resolves, and every address it resolves to is public; a name that does not resolve is not. */
    isPublicHost(hostname: string): Promise<boolean>
}

/** Token of the probe transport. */
export const PROBE_TRANSPORT: unique symbol = Symbol("integrations.probe.transport")

/** Injects the probe transport. Parameter type: ProbeTransport. */
export const InjectProbeTransport = (): TypedParameterDecorator<ProbeTransport> =>
    injector<ProbeTransport>(PROBE_TRANSPORT)
