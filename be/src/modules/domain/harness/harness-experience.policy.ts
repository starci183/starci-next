import type { ProduceExperienceParams } from "@modules/domain/career"
import type { HarnessProofRow } from "./harness.contracts"
import type { StoredBuild } from "./harness-progress.policy"

/** The catalog item a proved build grants. */
export const HARNESS_BUILD_ITEM = "harness.build-proved"

/** The newest attested result of every e2e of one build, keyed by stage and e2e id. */
const newestOf = (build: StoredBuild, proofs: ReadonlyArray<HarnessProofRow>): ReadonlyMap<string, HarnessProofRow> =>
    new Map(
        proofs
            .filter((row) => row.buildId === build.id)
            .map((row) => [`${row.stageId}\u0000${row.e2eId}`, row] as const),
    )

/** Whether every e2e of every stage of the build has a newest attested result that passed. */
export const isBuildProved = (build: StoredBuild, proofs: ReadonlyArray<HarnessProofRow>): boolean => {
    const newest = newestOf(build, proofs)
    return (
        build.stages.length > 0 &&
        build.stages.every((stage) => stage.e2e.every((id) => newest.get(`${stage.id}\u0000${id}`)?.passed === true))
    )
}

/**
 * The CV line of a proved build, handed to the experience engine: every e2e of every stage passed in a CI run GitHub attested,
 * so the evidence is one signed-ci entry per run, and the slots (build title, stage count, the newest run) come from the build
 * and the proof only. The grade passes only when the build is proved, so a partial build produces nothing.
 */
export const buildExperienceOf = (
    learnerId: string,
    projectId: string,
    build: StoredBuild,
    proofs: ReadonlyArray<HarnessProofRow>,
): ProduceExperienceParams | null => {
    if (!isBuildProved(build, proofs)) return null
    const newest = newestOf(build, proofs)
    const rows = build.stages.flatMap((stage) => stage.e2e.flatMap((id) => newest.get(`${stage.id}\u0000${id}`) ?? []))
    const runs = new Map(rows.map((row) => [row.runId, row] as const))
    const last = [...rows].sort((a, b) => b.at.localeCompare(a.at))[0]
    const ci = last === undefined ? "-" : `#${last.runId} (${(last.commit ?? "").slice(0, 7)})`
    return {
        learnerId,
        itemType: HARNESS_BUILD_ITEM,
        subject: build.id,
        projectId,
        evidence: [...runs.values()].map((row) => ({
            kind: "ci-run",
            ref: row.runId,
            proofForm: "signed-ci" as const,
            at: row.at,
        })),
        slotValues: {
            vi: { build: build.title.vi, stages: String(build.stages.length), ci },
            en: { build: build.title.en, stages: String(build.stages.length), ci },
        },
        grade: {
            result: "pass",
            criteria: build.stages.map((stage) => ({
                criterion: stage.title.vi,
                level: 2,
                evidenceQuote: `e2e: ${stage.e2e.join(", ")}`.slice(0, 300),
            })),
        },
    }
}
