import { parse } from "yaml"
import type { FlowParse, FlowPlugin } from "./check-flow.contracts"
import { parseCheckFlow } from "./check-flow.schema"

/** The info string of the fenced block that holds an e2e flow inside its markdown file. */
export const FLOW_FENCE = "starci-flow"

const FENCE = /^```ya?ml[ \t]+starci-flow[ \t]*\r?\n([\s\S]*?)\r?\n```/mu

const parsed = (text: string): { ok: true; value: unknown } | { ok: false; message: string } => {
    try {
        return { ok: true, value: parse(text) as unknown }
    } catch (cause) {
        return { ok: false, message: cause instanceof Error ? (cause.message.split("\n")[0] ?? "") : "not YAML" }
    }
}

/** A flow from a YAML document (a probe file: its other keys, label, fixtures and the rest, are not the flow's). */
export const flowOfYaml = (text: string, plugins: ReadonlyArray<FlowPlugin> = []): FlowParse => {
    const document = parsed(text)
    return document.ok
        ? parseCheckFlow(document.value, undefined, plugins)
        : { ok: false, issues: [{ at: "", message: document.message }] }
}

/**
 * A flow from an e2e markdown file: the prose is for the learner, and the one fenced block ```` ```yaml starci-flow ```` holds the
 * flow, in the same language as a probe.
 */
export const flowOfMarkdown = (text: string, plugins: ReadonlyArray<FlowPlugin> = []): FlowParse => {
    const block = FENCE.exec(text)
    if (block === null) return { ok: false, issues: [{ at: "", message: `has no \`\`\`yaml ${FLOW_FENCE} block` }] }
    return flowOfYaml(String(block[1]), plugins)
}
