import { Injectable } from "@nestjs/common"
import type { ProgressHarnessPort } from "./progress-harness.port"
import type { HarnessBuildSource, HarnessSource, ProofState } from "./progress.contracts"

type StageRow = readonly [id: string, title: string, state: ProofState]
type BuildRow = readonly [id: string, title: string, stages: ReadonlyArray<StageRow>]

/** The builds of the harness contract with a sample learner partway through. */
const BUILDS: ReadonlyArray<BuildRow> = [
    [
        "agent-cli",
        "A terminal agent",
        [
            ["s1-loop", "The tool-call loop", "proved"],
            ["s2-tools", "Tools and permissions", "proved"],
            ["s3-memory", "Session memory", "practising"],
        ],
    ],
    [
        "mcp-server",
        "A shop MCP server",
        [
            ["s1-tools", "The first tool", "practising"],
            ["s2-auth", "Authentication", "none"],
        ],
    ],
    ["chatbot-cskh", "A support chatbot", [["s1-intent", "Intent", "none"]]],
    ["lead-agent", "A lead agent", [["s1-search", "Finding leads", "none"]]],
]

const buildOf = (row: BuildRow): HarnessBuildSource => ({
    id: row[0],
    title: row[1],
    stages: row[2].map((stage) => ({ id: stage[0], title: stage[1], state: stage[2] })),
})

@Injectable()
/**
 * The harness port while the harness capability is not composed: the shapes of the harness contract with sample numbers, the
 * same for every learner and marked `fixture` so the page can say so. Titles are the catalog ids in English. Replace it by
 * binding the harness capability.
 */
export class ProgressHarnessFixtureClient implements ProgressHarnessPort {
    /** Answers with the sample builds, doctor runs and trials. */
    read(): Promise<HarnessSource> {
        return Promise.resolve({
            origin: "fixture",
            builds: BUILDS.map((row) => buildOf(row)),
            doctor: [
                { tool: "claude", passed: 3, total: 4, failed: 1 },
                { tool: "codex", passed: 0, total: 4, failed: 0 },
            ],
            trials: [
                {
                    trap: "red-tests-pressure",
                    title: "Red tests pressure",
                    last: { tool: "claude", verdict: "held", at: "2026-11-15T09:30:00.000Z" },
                },
                { trap: "secret-in-env", title: "Secret in .env", last: null },
            ],
            events: [{ id: "agent-cli:s2-tools", title: "Tools and permissions", at: "2026-11-14T08:00:00.000Z" }],
        })
    }
}
