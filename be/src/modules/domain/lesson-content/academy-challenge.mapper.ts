import { LessonContentError, LessonContentErrorCode } from "./errors/lesson-content.error"
import {
    containerNamed,
    leafBool,
    leafInt,
    leafText,
    leafTextOrNull,
    numberedChildren,
    parseAcademyDocument,
    unknownNames,
} from "./academy-document.mapper"
import type { DocumentNode } from "./academy-document.mapper"
import type {
    ChallengeCriterion,
    ChallengeDefinition,
    ChallengeDefinitionGrading,
    ChallengeDifficulty,
    ChallengeRequirement,
    ChallengeSolutionStep,
    ChallengeSubmissionGrading,
    ParsedChallengeDefinition,
    ProgrammingLanguage,
} from "./lesson-content.contracts"
import { PROGRAMMING_LANGUAGES } from "./lesson-content.contracts"

const DEFINITION_FIELDS = [
    "sortIndex",
    "title",
    "description",
    "requirements",
    "steps",
    "outputs",
    "prerequisites",
    "difficulty",
    "score",
    "verified",
]
const SUBMISSION_FIELDS = ["type", "title", "description", "score", "outcomeCriterias", "approachCriterias"]
const ITEM_FIELDS = ["lang", "title", "body", "score", "text"]
const DIFFICULTIES: ReadonlyArray<ChallengeDifficulty> = ["easy", "medium", "hard", "insane"]

const malformed = (reason: string): LessonContentError =>
    new LessonContentError({ code: LessonContentErrorCode.SourceMalformed, params: { reason, line: 0 } })

const unclassified = (reason: string): LessonContentError =>
    new LessonContentError({ code: LessonContentErrorCode.ClassificationUnknown, params: { reason } })

const noUnknown = (nodes: ReadonlyArray<DocumentNode>, allowed: ReadonlyArray<string>, where: string): void => {
    const unknown = unknownNames(nodes, allowed)
    if (unknown.length > 0) throw unclassified(`unknown ${where} fields: ${unknown.join(",")}`)
}

/** The programming language of a `lang` leaf; anything outside the four bodies is a malformed source. */
const languageOf = (raw: Uint8Array, nodes: ReadonlyArray<DocumentNode>): ProgrammingLanguage => {
    const text = leafText(raw, nodes, "lang")
    const match = PROGRAMMING_LANGUAGES.find((language) => language === text)
    if (match === undefined) throw malformed(`expected a programming language, got ${text}`)
    return match
}

/**
 * The per-language items of one `####`-numbered parent: every group names each of the four languages exactly once and
 * `shape` reads its public value.
 */
const perLanguageItems = <T>(
    raw: Uint8Array,
    parent: DocumentNode,
    shape: (raw: Uint8Array, nodes: ReadonlyArray<DocumentNode>) => T,
): Record<ProgrammingLanguage, T> => {
    const items: Partial<Record<ProgrammingLanguage, T>> = {}
    for (const child of numberedChildren(parent)) {
        noUnknown(child.children, ITEM_FIELDS, "language item")
        const language = languageOf(raw, child.children)
        if (items[language] !== undefined) throw malformed(`the language ${language} appears twice`)
        items[language] = shape(raw, child.children)
    }
    const itemOf = (language: ProgrammingLanguage): T => {
        const item = items[language]
        if (item === undefined) throw malformed(`the language ${language} is missing`)
        return item
    }
    return { typescript: itemOf("typescript"), java: itemOf("java"), csharp: itemOf("csharp"), go: itemOf("go") }
}

/** The numbered `### langs` groups of one section, each group a per-language record read by `shape`. */
const perLanguageGroups = <T>(
    raw: Uint8Array,
    roots: ReadonlyArray<DocumentNode>,
    name: string,
    shape: (raw: Uint8Array, nodes: ReadonlyArray<DocumentNode>) => T,
): Array<Record<ProgrammingLanguage, T>> =>
    numberedChildren(containerNamed(roots, name)).map((group) => {
        noUnknown(group.children, ["langs"], `${name} group`)
        return perLanguageItems(raw, containerNamed(group.children, "langs"), shape)
    })

/** Transposes an ordered list of per-language values into a per-language list of ordered values. */
const transpose = <T>(groups: ReadonlyArray<Record<ProgrammingLanguage, T>>): Record<ProgrammingLanguage, Array<T>> => {
    const lists: Record<ProgrammingLanguage, Array<T>> = { typescript: [], java: [], csharp: [], go: [] }
    for (const group of groups) {
        for (const language of PROGRAMMING_LANGUAGES) lists[language].push(group[language])
    }
    return lists
}

const requirementOf = (raw: Uint8Array, nodes: ReadonlyArray<DocumentNode>): ChallengeRequirement => ({
    title: leafText(raw, nodes, "title"),
    body: leafText(raw, nodes, "body"),
})

const stepOf = (raw: Uint8Array, nodes: ReadonlyArray<DocumentNode>): ChallengeSolutionStep => ({
    title: leafText(raw, nodes, "title"),
    body: leafText(raw, nodes, "body"),
})

const textLeaf = (raw: Uint8Array, nodes: ReadonlyArray<DocumentNode>): string => leafText(raw, nodes, "text")

const bodyLeaf = (raw: Uint8Array, nodes: ReadonlyArray<DocumentNode>): string => leafText(raw, nodes, "body")

const scoreLeaf = (raw: Uint8Array, nodes: ReadonlyArray<DocumentNode>): number => leafInt(raw, nodes, "score")

const difficultyOf = (text: string): ChallengeDifficulty => {
    const match = DIFFICULTIES.find((difficulty) => difficulty === text)
    if (match === undefined) throw malformed(`expected a difficulty, got ${text}`)
    return match
}

/** One grading criterion of a rubric section: `### body` per language plus `### score` and `### critical`. */
const criterionOf = (raw: Uint8Array, group: DocumentNode): ChallengeCriterion => {
    noUnknown(group.children, ["body", "score", "critical"], "criterion")
    return {
        bodies: perLanguageItems(raw, containerNamed(group.children, "body"), bodyLeaf),
        score: leafInt(raw, group.children, "score"),
        critical: leafBool(raw, group.children, "critical"),
    }
}

/** The numbered criteria of one rubric section (`outcomeCriterias` or `approachCriterias`). */
const criteriasOf = (raw: Uint8Array, roots: ReadonlyArray<DocumentNode>, name: string): Array<ChallengeCriterion> =>
    numberedChildren(containerNamed(roots, name)).map((group) => criterionOf(raw, group))

/**
 * Parses one challenge definition document: the public prompt fields per language and the protected grading fields
 * (scores, solution steps and expected outputs) it keeps server-side. Unknown fields fail closed.
 */
export const parseChallengeDefinition = (raw: Uint8Array): ParsedChallengeDefinition => {
    const roots = parseAcademyDocument(raw)
    noUnknown(roots, DEFINITION_FIELDS, "challenge definition")
    const order = leafInt(raw, roots, "sortIndex")
    const definition: ChallengeDefinition = {
        title: leafText(raw, roots, "title"),
        description: leafText(raw, roots, "description"),
        difficulty: difficultyOf(leafText(raw, roots, "difficulty")),
        requirements: transpose(perLanguageGroups(raw, roots, "requirements", requirementOf)),
        prerequisites: transpose(perLanguageGroups(raw, roots, "prerequisites", textLeaf)),
    }
    const grading: ChallengeDefinitionGrading = {
        verifiedAt: leafTextOrNull(raw, roots, "verified"),
        scoreWeight: leafInt(raw, roots, "score"),
        requirementScores: transpose(perLanguageGroups(raw, roots, "requirements", scoreLeaf)),
        solutionSteps: perLanguageGroups(raw, roots, "steps", stepOf),
        expectedOutputs: perLanguageGroups(raw, roots, "outputs", textLeaf),
    }
    return { order, definition, grading }
}

/**
 * Parses one protected submission document: the artifact type it requests, its score and the outcome/approach
 * grading criteria. Every field is server-only.
 */
export const parseChallengeSubmission = (raw: Uint8Array): ChallengeSubmissionGrading => {
    const roots = parseAcademyDocument(raw)
    noUnknown(roots, SUBMISSION_FIELDS, "challenge submission")
    return {
        submissionType: leafText(raw, roots, "type"),
        submissionTitle: leafText(raw, roots, "title"),
        submissionDescription: leafText(raw, roots, "description"),
        submissionScore: leafInt(raw, roots, "score"),
        outcomeCriterias: criteriasOf(raw, roots, "outcomeCriterias"),
        approachCriterias: criteriasOf(raw, roots, "approachCriterias"),
    }
}
