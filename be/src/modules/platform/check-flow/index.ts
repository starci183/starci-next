/**
 * The check-flow language (platform): one declarative language for the server probes and the CLI's e2e flows, and one interpreter
 * both run. A flow is data (steps of HTTP requests with templates, fan-out, waits and a sink, captures, and assertions on status,
 * headers, JSON paths, counts and timing); adding a probe or an e2e flow is a YAML file in the content repository, never code.
 * Only the primitives live here: `parseCheckFlow` checks a document whole, `CheckFlowRunner` runs it through the ports the host
 * binds (the server's guarded probe client and public sink, or the CLI's local transport and sink).
 */
export type {
    AssertOp,
    CheckFlow,
    FlowAssertion,
    FlowCaps,
    FlowInputs,
    FlowIssue,
    FlowParse,
    FlowPlugin,
    FlowPluginContext,
    FlowResponse,
    FlowStatus,
    FlowStep,
    FlowVerdict,
} from "./check-flow.contracts"
export { ASSERT_OPS, CHECK_FLOW_SCHEMA, FLOW_CAPS, PROBE_HEADER, READ_METHODS } from "./check-flow.contracts"
export type {
    FlowClock,
    FlowPorts,
    FlowSink,
    FlowTransport,
    FlowWireReply,
    FlowWireRequest,
    OpenedSink,
    SinkEvent,
} from "./check-flow.port"
export { FLOW_INPUTS, FLOW_NEEDS, flowTotalsOf, parseCheckFlow } from "./check-flow.schema"
export { FLOW_FENCE, flowOfMarkdown, flowOfYaml } from "./check-flow-document.policy"
export { CheckFlowRunner, endpointOf } from "./check-flow-run.service"
export { FetchFlowTransport, systemFlowClock } from "./check-flow-fetch.client"
export { LocalFlowSink, SINK_EVENT_BYTES_MAX, SINK_EVENTS_MAX } from "./check-flow-local-sink.adapter"
