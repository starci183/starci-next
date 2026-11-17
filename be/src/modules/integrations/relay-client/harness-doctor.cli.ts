import { readFileSync } from "node:fs"
import { parse } from "yaml"
import {
    CheckFlowRunner,
    parseCheckFlow,
    systemFlowClock,
    type CheckFlow,
    type FlowPorts,
} from "@modules/platform/check-flow"
import { HARNESS_PROBE_SCHEMA, localPlugins, probeFlowOf, type LocalPlugins } from "@modules/platform/check-flow-local"
import { isRecord } from "@modules/platform/primitives"
import {
    HARNESS_TOOLS,
    type DoctorOptions,
    type DoctorProbeResult,
    type DoctorResult,
    type HarnessIo,
    type HarnessTool,
} from "./harness-trial.contracts"
import { harnessContentOf } from "./harness-content.cli"
import { localizedOf } from "./harness-trap.policy"
import { uploadHarness } from "./harness-upload.cli"
import { probeFilesIn } from "./harness-workspace.adapter"

/** What the interpreter is given to talk to the world: nothing, since a doctor probe has no request step. */
const PORTS: FlowPorts = {
    transport: { send: () => Promise.resolve({ ok: false, error: "target-refused" }) },
    sink: null,
    clock: systemFlowClock,
}

/** One probe file, read: the flow, or why it is invalid, and the texts the learner reads. */
interface ProbeFile {
    readonly id: string
    readonly title: string
    readonly fix: string
    readonly flow: CheckFlow | null
    readonly issues: ReadonlyArray<string>
    readonly commands: ReadonlyArray<string>
    readonly local: LocalPlugins
}

const probeFileOf = (
    io: HarnessIo,
    tool: HarnessTool,
    name: string,
    path: string,
    project: string,
    lang: string,
): ProbeFile => {
    const local = localPlugins(io.proc, { project, home: io.home, env: io.processEnv })
    const fallback = name.replace(/\.ya?ml$/u, "")
    const invalid = (issues: ReadonlyArray<string>, doc?: Record<string, unknown>): ProbeFile => ({
        id: typeof doc?.["id"] === "string" ? doc["id"] : fallback,
        title: localizedOf(doc?.["title"], lang) || fallback,
        fix: localizedOf(doc?.["fix"], lang),
        flow: null,
        issues,
        commands: [],
        local,
    })
    let doc: unknown
    try {
        doc = parse(readFileSync(path, "utf8")) as unknown
    } catch (cause) {
        return invalid([cause instanceof Error ? (cause.message.split("\n")[0] ?? "not YAML") : "not YAML"])
    }
    if (!isRecord(doc)) return invalid(["the file must be a map"])
    const id = typeof doc["id"] === "string" ? doc["id"] : fallback
    const issues: Array<string> = []
    if (doc["schema"] !== HARNESS_PROBE_SCHEMA) issues.push(`schema must be ${HARNESS_PROBE_SCHEMA}`)
    if (doc["tool"] !== tool) issues.push(`tool must be ${tool}`)
    const flow = isRecord(doc["check"]) ? probeFlowOf(id, doc["check"]) : null
    if (flow === null) issues.push("check must hold exactly one of file, json, toml, env, command, hook, git")
    const parsed = flow === null ? null : parseCheckFlow(flow, undefined, local.plugins)
    if (parsed !== null && !parsed.ok) parsed.issues.forEach((issue) => issues.push(`${issue.at}: ${issue.message}`))
    if (issues.length > 0 || parsed === null || !parsed.ok) return invalid(issues, doc)
    const commands = parsed.flow.steps.flatMap((step) =>
        step.action.kind === "plugin"
            ? (local.plugins
                  .find((plugin) => plugin.key === (step.action as { key: string }).key)
                  ?.commands?.(step.action.params) ?? [])
            : [],
    )
    return {
        id,
        title: localizedOf(doc["title"], lang) || id,
        fix: localizedOf(doc["fix"], lang),
        flow: parsed.flow,
        issues: [],
        commands,
        local,
    }
}

const runProbe = async (io: HarnessIo, probe: ProbeFile): Promise<DoctorProbeResult> => {
    if (probe.flow === null)
        return {
            id: probe.id,
            status: "invalid",
            reason: "invalid-probe",
            why: probe.issues.slice(0, 3).join("; ").slice(0, 300),
        }
    try {
        const verdict = await new CheckFlowRunner(PORTS, probe.local.plugins).run(probe.flow, {
            base: "http://localhost",
            endpoint: null,
            sample: null,
            runId: io.ids(),
        })
        if (verdict.status === "passed") return { id: probe.id, status: "passed" }
        return {
            id: probe.id,
            status: verdict.status === "failed" ? "failed" : "skipped",
            reason: verdict.reason,
            why: verdict.status === "failed" ? probe.local.why() : verdict.reason,
        }
    } catch (cause) {
        return {
            id: probe.id,
            status: "failed",
            reason: "probe-error",
            why: String(cause instanceof Error ? cause.message : cause).slice(0, 160),
        }
    }
}

const lineOf = (probe: ProbeFile, result: DoctorProbeResult): ReadonlyArray<string> => {
    const head = `  ${result.status.padEnd(7)} ${result.id}  ${probe.title}`
    if (result.status === "passed") return [head]
    const hint = result.status === "failed" && probe.fix !== "" ? [`          Fix: ${probe.fix}`] : []
    return [head, ...(result.why === undefined ? [] : [`          ${result.why}`]), ...hint]
}

const toolsOf = (tool: string | undefined): ReadonlyArray<HarnessTool> | null => {
    if (tool === undefined) return HARNESS_TOOLS
    return (HARNESS_TOOLS as ReadonlyArray<string>).includes(tool) ? [tool as HarnessTool] : null
}

/**
 * `starci-next harness doctor [--tool claude|codex]`: runs the doctor probes of the content (`raw/harness/doctor/<tool>/*.yaml`, each
 * one check of the check-flow language's local primitives) against this machine and the project in the current folder. Every command
 * a probe runs is shown first and needs a yes. Exit code 1 when a probe failed or is invalid.
 */
export const doctorCommand = async (io: HarnessIo, options: DoctorOptions, cwd: string): Promise<number> => {
    const tools = toolsOf(options.tool)
    if (tools === null) {
        io.err(`Unknown tool ${options.tool ?? ""}. Use claude or codex.`)
        return 1
    }
    const lang = options.lang === "vi" ? "vi" : "en"
    const log = options.json ? io.err : io.out
    const plan: Array<{ readonly tool: HarnessTool; readonly probes: ReadonlyArray<ProbeFile> }> = []
    const cleanups: Array<() => void> = []
    try {
        for (const tool of tools) {
            const content = await harnessContentOf(io, { kind: "doctor", tool }, options.from)
            if (content === null) return 1
            cleanups.push(content.cleanup)
            const folder = content.probesDir(tool)
            const files = folder === null ? [] : probeFilesIn(folder)
            if (files.length === 0) log(`No doctor probes for ${tool}.`)
            plan.push({ tool, probes: files.map((file) => probeFileOf(io, tool, file.name, file.path, cwd, lang)) })
        }
        if (plan.every((entry) => entry.probes.length === 0)) {
            io.err("No doctor probes found.")
            return 1
        }
        const commands = [...new Set(plan.flatMap((entry) => entry.probes.flatMap((probe) => probe.commands)))]
        if (commands.length > 0) {
            log("The probes will run these on this machine:")
            commands.forEach((command) => log(`  ${command}`))
            if (!options.yes && !(await io.confirm("Run them?"))) {
                log("Nothing was run.")
                return 1
            }
        }
        const results: Array<DoctorResult> = []
        for (const entry of plan) {
            const probes: Array<DoctorProbeResult> = []
            log(`${entry.tool}:`)
            for (const probe of entry.probes) {
                const result = await runProbe(io, probe)
                probes.push(result)
                lineOf(probe, result).forEach((line) => log(line))
            }
            const count = (status: DoctorProbeResult["status"]): number =>
                probes.filter((probe) => probe.status === status).length
            results.push({
                kind: "harness-doctor",
                tool: entry.tool,
                probes,
                summary: {
                    passed: count("passed"),
                    failed: count("failed"),
                    skipped: count("skipped"),
                    invalid: count("invalid"),
                },
            })
        }
        if (options.json) results.forEach((result) => io.out(JSON.stringify(result)))
        else
            results.forEach((result) =>
                log(
                    `${result.tool}: ${result.summary.passed} passed, ${result.summary.failed} failed, ${result.summary.skipped} skipped, ${result.summary.invalid} invalid.`,
                ),
            )
        if (!options.noUpload) {
            const inputs = results.flatMap((result) =>
                result.probes.map((probe) => ({
                    kind: "harness-doctor",
                    tool: result.tool,
                    probe: probe.id,
                    status: probe.status,
                    ...(probe.reason === undefined ? {} : { reason: probe.reason }),
                })),
            )
            io.err(await uploadHarness(io, inputs))
        }
        return results.some((result) => result.summary.failed + result.summary.invalid > 0) ? 1 : 0
    } finally {
        cleanups.forEach((cleanup) => cleanup())
    }
}
