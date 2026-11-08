/**
 * The probe transport (integration): the one place that opens a connection to a learner's deployed address. `ProbeTransport.send`
 * answers a response or the reason there is none, and reaches public addresses only: the name is resolved by the transport itself,
 * every address it resolves to must be public (`isPublicAddress`), and the socket connects to one of them, so a name that changes
 * its answer cannot slip an internal address through. No redirect is followed, and the time and the bytes read are capped.
 */
export { InjectProbeTransport, PROBE_TRANSPORT } from "./probe.port"
export { isPublicAddress } from "./probe-address.policy"
export { ProbeModule } from "./probe.module"
export { PROBE_ERROR_KINDS } from "./errors/probe.error"
export { PROBE_MESSAGES } from "./messages/probe.messages"
export type { ProbeTransport } from "./probe.port"
export type { ProbeReply } from "./probe.contracts"
