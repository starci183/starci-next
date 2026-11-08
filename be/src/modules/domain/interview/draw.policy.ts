import type { InterviewFamily, InterviewTier, SessionQuestion } from "./interview.contracts"

/** A published question the draw may pick. */
export interface DrawCandidate {
    /** The question id. */
    readonly questionId: string
    /** The bank id. */
    readonly bankId: string
    /** The live bank version. */
    readonly bankVersion: string
    /** The family. */
    readonly family: InterviewFamily
    /** The tier. */
    readonly tier: InterviewTier
    /** Whether the teacher marked it Premium. */
    readonly isPremium: boolean
    /** The code languages the question has bodies in. */
    readonly bodyLanguages: ReadonlyArray<string>
}

/** What a draw asks. */
export interface DrawParams {
    /** The questions of the track's pool. */
    readonly candidates: ReadonlyArray<DrawCandidate>
    /** The tier. */
    readonly tier: InterviewTier
    /** True for a free session, which draws only questions the teacher left free. */
    readonly free: boolean
    /** The code language asked, or null. */
    readonly language: string | null
    /** How many questions. */
    readonly length: number
    /** Question ids to prefer not to repeat (the learner's recent sessions). */
    readonly avoid: ReadonlySet<string>
    /** A text that makes the draw repeatable. */
    readonly seed: string
}

const AGNOSTIC = "agnostic"

/** The 32-bit FNV-1a hash of a text. */
const hashOf = (text: string): number =>
    [...text].reduce((hash, char) => Math.imul(hash ^ (char.codePointAt(0) ?? 0), 16_777_619) >>> 0, 2_166_136_261)

/** The code language of a question's body for the language asked, or null when the question has none to give. */
export const bodyLanguageOf = (bodyLanguages: ReadonlyArray<string>, language: string | null): string | null => {
    if (language !== null && bodyLanguages.includes(language)) return language
    if (bodyLanguages.includes(AGNOSTIC)) return AGNOSTIC
    return language === null ? (bodyLanguages[0] ?? null) : null
}

/** A candidate with the code language of the body it will be asked in. */
interface Usable {
    readonly candidate: DrawCandidate
    readonly bodyLanguage: string
}

/** Picks `count` questions, preferring the ones not to avoid and spreading them over the banks, in a repeatable order. */
const pickFrom = (pool: ReadonlyArray<Usable>, count: number, params: DrawParams): ReadonlyArray<Usable> => {
    const seen = (entry: Usable): number => Number(params.avoid.has(entry.candidate.questionId))
    const ordered = [...pool].sort(
        (a, b) =>
            seen(a) - seen(b) ||
            hashOf(`${params.seed}|${a.candidate.questionId}`) - hashOf(`${params.seed}|${b.candidate.questionId}`),
    )
    const picked: Array<Usable> = []
    const perBank = new Map<string, number>()
    while (picked.length < count) {
        const rest = ordered.filter((entry) => !picked.includes(entry))
        const lowest = Math.min(...rest.map((entry) => seen(entry)))
        const unseen = rest.filter((entry) => seen(entry) === lowest)
        const [first, ...others] = unseen
        if (first === undefined) break
        const next = others.reduce(
            (best, entry) =>
                (perBank.get(entry.candidate.bankId) ?? 0) < (perBank.get(best.candidate.bankId) ?? 0) ? entry : best,
            first,
        )
        picked.push(next)
        perBank.set(next.candidate.bankId, (perBank.get(next.candidate.bankId) ?? 0) + 1)
    }
    return picked
}

/**
 * Draws the questions of a session: technical ones first, then one behavioural question last, the way a real loop mixes them. A free
 * session takes only questions the teacher left free; a question with no body in the language asked (and none agnostic) is out.
 * Answers null when the pool holds too few questions of a family.
 */
export const drawQuestions = (params: DrawParams): ReadonlyArray<SessionQuestion> | null => {
    const usable = params.candidates.flatMap((candidate): Array<Usable> => {
        const bodyLanguage = bodyLanguageOf(candidate.bodyLanguages, params.language)
        const allowed = candidate.tier === params.tier && (!params.free || !candidate.isPremium)
        return allowed && bodyLanguage !== null ? [{ candidate, bodyLanguage }] : []
    })
    const of = (family: InterviewFamily): ReadonlyArray<Usable> =>
        usable.filter((entry) => entry.candidate.family === family)
    const technicalCount = Math.max(1, params.length - 1)
    const technical = of("technical")
    const behavioral = of("behavioral")
    if (technical.length < technicalCount || behavioral.length < 1) return null
    return [...pickFrom(technical, technicalCount, params), ...pickFrom(behavioral, 1, params)].map(
        ({ candidate, bodyLanguage }, position) => ({
            position,
            questionId: candidate.questionId,
            bankId: candidate.bankId,
            bankVersion: candidate.bankVersion,
            bodyLanguage,
            family: candidate.family,
        }),
    )
}
