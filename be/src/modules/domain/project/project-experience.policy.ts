import type { ExperienceEvidence, ExperienceGrade, ProduceExperienceParams, SlotValues } from "@modules/domain/career"
import {
    PROOF_SOURCES,
    type AgentTrack,
    type EvidenceRow,
    type MilestoneDefinition,
    type ProjectKind,
} from "./project.contracts"
import { conceptOf } from "./project-catalog.policy"

/** The tool each agent track names in a CV line. */
export const TRACK_LABELS: Readonly<Record<AgentTrack, string>> = {
    claude: "Claude Code",
    openclaw: "OpenClaw",
    hermes: "Hermes Agent",
}

/** The facts of a project a CV line is drafted from: all of them are declared by the learner and checked by StarCi evidence. */
export interface ExperienceSubject {
    /** The learner. */
    readonly learnerId: string
    /** The project. */
    readonly projectId: string
    /** The project name. */
    readonly name: string
    /** The stack line. */
    readonly stack: string
    /** App or agent. */
    readonly kind: ProjectKind
    /** The agent track, or null. */
    readonly track: AgentTrack | null
    /** The deployed address, or null. */
    readonly deployedUrl: string | null
}

/** What the CV line of a proved milestone is drafted from. */
export interface MilestoneExperienceInput {
    /** The project and its learner. */
    readonly subject: ExperienceSubject
    /** The milestone. */
    readonly milestone: MilestoneDefinition
    /** The latest results of the milestone's concepts. */
    readonly rows: ReadonlyArray<EvidenceRow>
    /** When the line is drafted. */
    readonly at: Date
}

/** What the CV line of a probed deployment is drafted from. */
export interface DeployedExperienceInput {
    /** The project and its learner. */
    readonly subject: ExperienceSubject
    /** The probe run that proves it. */
    readonly runId: string
    /** The deployed address. */
    readonly url: string
    /** When the run ended. */
    readonly at: Date
}

const AGENT_BUILT = "projects.agent-built"
const AI_CODING = "projects.ai-coding-mindset"
const MILESTONE = "projects.milestone"
const DEPLOYED = "projects.deployed"

/** The catalog item a proved milestone grants: the coding-agent and agent-build milestones have their own lines. */
export const itemTypeOfMilestone = (milestoneId: string, kind: ProjectKind): string => {
    if (milestoneId === "ai-coding-mindset") return AI_CODING
    return milestoneId === "agent-mindset" && kind === "agent" ? AGENT_BUILT : MILESTONE
}

const bothLocales = (valueOf: (locale: "vi" | "en") => Readonly<Record<string, string>>): SlotValues => ({
    vi: valueOf("vi"),
    en: valueOf("en"),
})

const evidenceOf = (rows: ReadonlyArray<EvidenceRow>): ReadonlyArray<ExperienceEvidence> => {
    const proof = rows.filter((row) => row.passed && PROOF_SOURCES.includes(row.source))
    const runs = new Map(
        proof.flatMap((row) =>
            row.source === "ai"
                ? []
                : [
                      [
                          `${row.source}:${row.runId}`,
                          { kind: row.source === "ci" ? "ci-run" : "probe-run", ref: row.runId, at: row.at },
                      ] as const,
                  ],
        ),
    )
    const reads = proof.filter((row) => row.source === "ai")
    return [
        ...[...runs.entries()].map(([key, run]) => ({
            kind: run.kind,
            ref: run.ref,
            proofForm: key.startsWith("ci:") ? ("signed-ci" as const) : ("server-probe" as const),
            at: run.at.toISOString(),
        })),
        ...reads.map((row) => ({
            kind: "code-read",
            ref: row.conceptId,
            proofForm: "graded-session" as const,
            at: row.at.toISOString(),
        })),
    ]
}

/**
 * The CV line of a proved milestone, handed to the experience engine: every concept of the milestone proved by StarCi evidence (a
 * signed CI run, a server probe, the AI teacher's read), the slots filled from the declared project and the proof only, never from
 * what a learner typed into a field. The line says "in CI", so the grade passes only when at least one signed CI run is among the proof.
 */
export const milestoneExperienceOf = (input: MilestoneExperienceInput): ProduceExperienceParams => {
    const { subject, milestone, rows } = input
    const itemType = itemTypeOfMilestone(milestone.id, subject.kind)
    const evidence = evidenceOf(rows)
    const ciRow = rows.find((row) => row.passed && row.source === "ci")
    const tool = TRACK_LABELS[subject.track ?? "claude"]
    const criteria = milestone.concepts.map((id) => {
        const definition = conceptOf(id)
        const proof = rows.find((row) => row.conceptId === id && row.passed && PROOF_SOURCES.includes(row.source))
        return {
            criterion: definition?.label.vi ?? id,
            level: proof === undefined ? 0 : 2,
            evidenceQuote: proof === undefined ? "" : `${proof.slot}: ${proof.ref}`.slice(0, 300),
        }
    })
    const passed =
        criteria.every((criterion) => criterion.level === 2) && evidence.some((item) => item.proofForm === "signed-ci")
    const grade: ExperienceGrade = { result: passed ? "pass" : "fail", criteria }
    const labels = (locale: "vi" | "en"): string =>
        milestone.concepts.map((id) => conceptOf(id)?.label[locale] ?? id).join(", ")
    const ci = ciRow === undefined ? "-" : `#${ciRow.runId} (${(ciRow.commitSha ?? "").slice(0, 7)})`
    const slotValues = bothLocales((locale) =>
        itemType === MILESTONE
            ? { project: subject.name, stack: subject.stack, concepts: labels(locale), ci }
            : { project: subject.name, tool },
    )
    return {
        learnerId: subject.learnerId,
        itemType,
        subject: `${milestone.id}@${subject.projectId}`,
        projectId: subject.projectId,
        evidence,
        slotValues,
        grade,
    }
}

/** The CV line of a deployment that passed the StarCi probes: the address and the probe run that proves it. */
export const deployedExperienceOf = (input: DeployedExperienceInput): ProduceExperienceParams => ({
    learnerId: input.subject.learnerId,
    itemType: DEPLOYED,
    subject: `deployed@${input.subject.projectId}`,
    projectId: input.subject.projectId,
    evidence: [{ kind: "probe-run", ref: input.runId, proofForm: "server-probe", at: input.at.toISOString() }],
    slotValues: bothLocales(() => ({ project: input.subject.name, url: input.url })),
    grade: {
        result: "pass",
        criteria: [{ criterion: "health and readiness", level: 2, evidenceQuote: input.url.slice(0, 300) }],
    },
})
