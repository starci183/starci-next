import { isRecord } from "@modules/platform/primitives"
import type { CheckFlow, FlowVerdict } from "./check-flow.contracts"
import type { FlowClock } from "./check-flow.port"
import { FakeLearnerApp, GOOD_APP, type FakeAppFlags } from "./check-flow-fake-app.testing"
import { FetchFlowTransport } from "./check-flow-fetch.client"
import { LocalFlowSink } from "./check-flow-local-sink.adapter"
import { CheckFlowRunner } from "./check-flow-run.service"

/** One cheat of a fixture: a fake app with one wrong behaviour, and the reason the flow must fail with. */
export interface CheatFixture {
    /** What the cheat is. */
    readonly name: string
    /** The flags that differ from the good app. */
    readonly app: Partial<FakeAppFlags>
    /** The reason code the flow must fail with. */
    readonly fails: string
}

/** The fixtures a probe or e2e flow carries: what the learner declares, the good app, and the cheats. */
export interface FlowFixtures {
    /** The declared endpoint. */
    readonly endpoint: string | null
    /** The declared sample body. */
    readonly sample: string | null
    /** The flags of the good app over the defaults. */
    readonly good: Partial<FakeAppFlags>
    /** The cheats; a behaviour flow needs at least one. */
    readonly cheats: ReadonlyArray<CheatFixture>
}

const flagsOf = (raw: unknown): Partial<FakeAppFlags> => {
    if (raw === undefined || raw === null) return {}
    if (!isRecord(raw)) throw new Error("fixture app must be a map of flags")
    const unknown = Object.keys(raw).filter((key) => !(key in GOOD_APP))
    if (unknown.length > 0) throw new Error(`unknown fake app flags ${unknown.join(", ")}`)
    return raw as Partial<FakeAppFlags>
}

/** The fixtures of a document, read strictly: an unknown flag or a cheat without its reason is an error. */
export const fixturesOf = (document: unknown): FlowFixtures => {
    const raw = isRecord(document) ? document["fixtures"] : undefined
    if (!isRecord(raw)) throw new Error("the document has no fixtures")
    const cheats = Array.isArray(raw["cheats"]) ? raw["cheats"] : []
    return {
        endpoint: typeof raw["endpoint"] === "string" ? raw["endpoint"] : null,
        sample: typeof raw["sample"] === "string" ? raw["sample"] : null,
        good: flagsOf(raw["good"]),
        cheats: cheats.map((cheat: unknown) => {
            if (!isRecord(cheat) || typeof cheat["name"] !== "string" || typeof cheat["fails"] !== "string") {
                throw new Error("a cheat needs name, app and fails")
            }
            return { name: cheat["name"], app: flagsOf(cheat["app"]), fails: cheat["fails"] }
        }),
    }
}

/** A clock whose waits pass at once: the fake app delivers its events before it answers, so no wait needs real time. */
const instantClock: FlowClock = {
    now: () => performance.now(),
    sleep: () => new Promise((resolve) => setImmediate(resolve)),
}

/** Runs a flow once against a fresh fake app with the flags, and stops the app and the sink afterwards. */
export const runAgainstFakeApp = async (
    flow: CheckFlow,
    fixtures: FlowFixtures,
    flags: Partial<FakeAppFlags>,
): Promise<FlowVerdict> => {
    const app = new FakeLearnerApp({ ...GOOD_APP, ...fixtures.good, ...flags })
    const sink = new LocalFlowSink()
    const base = await app.start()
    try {
        const runner = new CheckFlowRunner({
            transport: new FetchFlowTransport({ timeoutMs: 5_000, maxBytes: 65_536 }),
            sink,
            clock: instantClock,
        })
        return await runner.run(flow, {
            base,
            endpoint: fixtures.endpoint,
            sample: fixtures.sample,
            runId: `fixture-${flow.id}`,
        })
    } finally {
        await sink.stop()
        await app.stop()
    }
}
