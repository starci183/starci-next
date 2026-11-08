import type { InterviewFamily, InterviewTier, Localized } from "./interview.contracts"
import { INTERVIEW_TRACK_TITLES } from "./messages/interview.messages"

/** One outcome track of the learning program and the banks it draws from; a pattern ends in `/*` or names one bank. */
export interface TrackDefinition {
    /** The track id, the outcome path id of the learning program. */
    readonly id: string
    /** The title per locale. */
    readonly titles: Localized<string>
    /** The technical bank patterns, for every tier unless `tierPools` names the tier. */
    readonly technical: ReadonlyArray<string>
    /** The technical bank patterns of a tier that differ from `technical`. */
    readonly tierPools?: Readonly<Partial<Record<InterviewTier, ReadonlyArray<string>>>>
    /** The behavioural bank patterns. */
    readonly behavioral: ReadonlyArray<string>
    /** The tiers the track offers; every tier when absent. */
    readonly tiers?: ReadonlyArray<InterviewTier>
}

/** Which pool of banks the tracks draw from. */
export type PoolMode = "mvp" | "widened"

const FULLSTACK = "0-fullstack-mastery"
const SYSTEM_DESIGN = "1-system-design-mastery"
const DEVOPS = "2-devops-mastery"
const BEHAVIORAL: ReadonlyArray<string> = ["eq/*"]
const FRAMEWORK = `${FULLSTACK}/0-framework-foundation`
const AI_LLM = `${FULLSTACK}/20-ai-llm-integration`

/** The tracks other than the Fullstack one; they do not change between the MVP and the widened pool. */
const OTHER_TRACKS: ReadonlyArray<TrackDefinition> = [
    {
        id: "devops-sre",
        titles: INTERVIEW_TRACK_TITLES["devops-sre"],
        technical: [`${DEVOPS}/*`],
        behavioral: BEHAVIORAL,
    },
    {
        id: "system-design-senior",
        titles: INTERVIEW_TRACK_TITLES["system-design-senior"],
        technical: [`${SYSTEM_DESIGN}/*`],
        behavioral: BEHAVIORAL,
        tiers: ["middle", "senior"],
    },
    {
        id: "ai-engineer",
        titles: INTERVIEW_TRACK_TITLES["ai-engineer"],
        technical: [AI_LLM],
        behavioral: BEHAVIORAL,
    },
    {
        id: "founder",
        titles: INTERVIEW_TRACK_TITLES["founder"],
        technical: [AI_LLM, `${FULLSTACK}/22-payment-integration`],
        behavioral: ["eq/2-situational", "eq/3-culture"],
    },
]

/**
 * The MVP pool (Q-MI-1): a junior Fullstack learner draws by tier across the first three Fullstack banks, a middle or senior
 * learner from the framework foundation bank alone, because only those banks are calibrated and published first.
 */
const MVP_FULLSTACK: TrackDefinition = {
    id: "backend-fullstack",
    titles: INTERVIEW_TRACK_TITLES["backend-fullstack"],
    technical: [FRAMEWORK],
    tierPools: {
        junior: [
            FRAMEWORK,
            `${FULLSTACK}/1-database-integration-and-caching`,
            `${FULLSTACK}/2-rest-api-design-and-documentation`,
        ],
    },
    behavioral: BEHAVIORAL,
}

/** The widened pool: every Fullstack bank, once the teacher's calibration sample agrees with the grader. */
const WIDENED_FULLSTACK: TrackDefinition = { ...MVP_FULLSTACK, technical: [`${FULLSTACK}/*`], tierPools: {} }

/** The tracks of a pool mode. */
export const tracksOf = (mode: PoolMode): ReadonlyArray<TrackDefinition> => [
    mode === "mvp" ? MVP_FULLSTACK : WIDENED_FULLSTACK,
    ...OTHER_TRACKS,
]

/** Whether a bank id matches one pattern: an exact id, or a `<prefix>/*` for every bank below the prefix. */
export const matchesBank = (pattern: string, bankId: string): boolean =>
    pattern.endsWith("/*") ? bankId.startsWith(pattern.slice(0, -1)) : pattern === bankId

/** The bank patterns a track draws from for one family and tier. */
export const patternsOf = (
    track: TrackDefinition,
    family: InterviewFamily,
    tier: InterviewTier,
): ReadonlyArray<string> => (family === "behavioral" ? track.behavioral : (track.tierPools?.[tier] ?? track.technical))

/** Whether a bank belongs to a track's pool for a family and tier. */
export const inPool = (track: TrackDefinition, family: InterviewFamily, tier: InterviewTier, bankId: string): boolean =>
    patternsOf(track, family, tier).some((pattern) => matchesBank(pattern, bankId))

/** Whether a track offers a tier. */
export const offersTier = (track: TrackDefinition, tier: InterviewTier): boolean =>
    track.tiers === undefined || track.tiers.includes(tier)

/** Whether a bank belongs to a track at any tier, for the options. */
export const inTrack = (track: TrackDefinition, family: InterviewFamily, bankId: string): boolean => {
    const patterns =
        family === "behavioral"
            ? track.behavioral
            : [...track.technical, ...Object.values(track.tierPools ?? {}).flat()]
    return patterns.some((pattern) => matchesBank(pattern, bankId))
}

/** The `LIKE` patterns of the banks a track draws from at one tier, for the database to narrow the pool. */
export const likePatternsOf = (track: TrackDefinition, tier: InterviewTier): ReadonlyArray<string> =>
    [...patternsOf(track, "technical", tier), ...patternsOf(track, "behavioral", tier)].map((pattern) =>
        pattern.endsWith("/*") ? `${pattern.slice(0, -1)}%` : pattern,
    )
