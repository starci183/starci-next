/** The display locales of a lesson, independent of its programming language. */
export type LessonLocale = "en" | "vi"

/** The programming-language bodies of a lesson, independent of its display locale. */
export type ProgrammingLanguage = "typescript" | "java" | "csharp" | "go"

/** The locales this importer reads. */
export const LESSON_LOCALES: ReadonlyArray<LessonLocale> = ["en", "vi"]

/** The programming languages this importer reads, in the order the Academy numbers them. */
export const PROGRAMMING_LANGUAGES: ReadonlyArray<ProgrammingLanguage> = ["typescript", "java", "csharp", "go"]

/** The fixture directory the settled Academy snapshot ships in, relative to the app root. */
export const DEFAULT_LESSON_FIXTURE = ".starciwork/_resources/fixtures/lessons/academy-rest-semantics-v1"

/** A zero-based UTF-8 byte range of a raw file, end exclusive. */
export interface ByteRange {
    /** The start of this ByteRange. */
    readonly start: number
    /** The end of this ByteRange. */
    readonly end: number
}

/** One heading of an article with its identity, depth, exact text and the byte range of its heading line. */
export interface OutlineEntry extends ByteRange {
    /** The text `section-` plus the numeric heading prefix, stable across locales. */
    readonly id: string
    /** The heading level of the source line (`##` is 2). */
    readonly depth: number
    /** The heading text exactly as the source wrote it, including the numeric prefix. */
    readonly text: string
}

/** What a protected span of an interview answer holds. */
export type ProtectedKind = "interviewerPoints" | "sampleAnswer"

/** A byte range of an article that is withheld from every public projection. */
export interface ProtectedRange extends ByteRange {
    /** The kind of this ProtectedRange. */
    readonly kind: ProtectedKind
}

/** One original interview question: its public prompt range and the protected child ranges that follow it. */
export interface InterviewQuestionIndex {
    /** The id of this InterviewQuestionIndex. */
    readonly id: string
    /** The prompt start of this InterviewQuestionIndex. */
    readonly promptStart: number
    /** The prompt end of this InterviewQuestionIndex. */
    readonly promptEnd: number
    /** The protected ranges of this InterviewQuestionIndex. */
    readonly protectedRanges: ReadonlyArray<ProtectedRange>
}

/** The byte indexes of one article body, derived from the raw file and checked against the manifest. */
export interface ArticleIndex {
    /** The article of this ArticleIndex. */
    readonly article: ByteRange
    /** The section1 of this ArticleIndex. */
    readonly section1: ByteRange
    /** The outline of this ArticleIndex. */
    readonly outline: ReadonlyArray<OutlineEntry>
    /** The protected ranges of this ArticleIndex. */
    readonly protectedRanges: ReadonlyArray<ProtectedRange>
    /** The interview questions of this ArticleIndex. */
    readonly interviewQuestions: ReadonlyArray<InterviewQuestionIndex>
    /** The public article ranges of this ArticleIndex. */
    readonly publicArticleRanges: ReadonlyArray<ByteRange>
}

/** The lesson metadata of one locale, read from the Academy metadata file. */
export interface LessonMetadata {
    /** The title of this LessonMetadata. */
    readonly title: string
    /** The description of this LessonMetadata. */
    readonly description: string
    /** The minutes read of this LessonMetadata. */
    readonly minutesRead: number
    /** The is premium of this LessonMetadata. */
    readonly isPremium: boolean
    /** The verified at of this LessonMetadata. */
    readonly verifiedAt: string | null
}

/** The difficulty names of the Academy challenges. */
export type ChallengeDifficulty = "easy" | "medium" | "hard" | "insane"

/** The public requirement of one challenge for one programming language. */
export interface ChallengeRequirement {
    /** The title of this ChallengeRequirement. */
    readonly title: string
    /** The body of this ChallengeRequirement. */
    readonly body: string
}

/** The public part of one challenge definition in one locale; scores, steps and outputs are excluded. */
export interface ChallengeDefinition {
    /** The title of this ChallengeDefinition. */
    readonly title: string
    /** The description of this ChallengeDefinition. */
    readonly description: string
    /** The difficulty of this ChallengeDefinition. */
    readonly difficulty: ChallengeDifficulty
    /** The requirements of this ChallengeDefinition. */
    readonly requirements: Readonly<Record<ProgrammingLanguage, ReadonlyArray<ChallengeRequirement>>>
    /** The prerequisites of this ChallengeDefinition. */
    readonly prerequisites: Readonly<Record<ProgrammingLanguage, ReadonlyArray<string>>>
}

/** One guided solution step of a challenge in one programming language; reveal-only. */
export interface ChallengeSolutionStep {
    /** The title of this ChallengeSolutionStep. */
    readonly title: string
    /** The body of this ChallengeSolutionStep. */
    readonly body: string
}

/** One grading criterion of a challenge: the per-language body plus its score weight and critical flag. */
export interface ChallengeCriterion {
    /** The bodies of this ChallengeCriterion. */
    readonly bodies: Readonly<Record<ProgrammingLanguage, string>>
    /** The score of this ChallengeCriterion. */
    readonly score: number
    /** The critical of this ChallengeCriterion. */
    readonly critical: boolean
}

/** The protected part a challenge definition carries, kept server-only with the submission document. */
export interface ChallengeDefinitionGrading {
    /** The verified at of this ChallengeDefinitionGrading. */
    readonly verifiedAt: string | null
    /** The score weight of this ChallengeDefinitionGrading. */
    readonly scoreWeight: number
    /** The requirement scores of this ChallengeDefinitionGrading. */
    readonly requirementScores: Readonly<Record<ProgrammingLanguage, ReadonlyArray<number>>>
    /** The solution steps of this ChallengeDefinitionGrading. */
    readonly solutionSteps: ReadonlyArray<Readonly<Record<ProgrammingLanguage, ChallengeSolutionStep>>>
    /** The expected outputs of this ChallengeDefinitionGrading. */
    readonly expectedOutputs: ReadonlyArray<Readonly<Record<ProgrammingLanguage, string>>>
}

/** The protected part a challenge submission document carries: the artifact it requests and its rubric. */
export interface ChallengeSubmissionGrading {
    /** The submission type of this ChallengeSubmissionGrading. */
    readonly submissionType: string
    /** The submission title of this ChallengeSubmissionGrading. */
    readonly submissionTitle: string
    /** The submission description of this ChallengeSubmissionGrading. */
    readonly submissionDescription: string
    /** The submission score of this ChallengeSubmissionGrading. */
    readonly submissionScore: number
    /** The outcome criterias of this ChallengeSubmissionGrading. */
    readonly outcomeCriterias: ReadonlyArray<ChallengeCriterion>
    /** The approach criterias of this ChallengeSubmissionGrading. */
    readonly approachCriterias: ReadonlyArray<ChallengeCriterion>
}

/** The outcome of parsing one challenge definition document: its order, its public prompt and its grading fields. */
export interface ParsedChallengeDefinition {
    /** The order of this ParsedChallengeDefinition. */
    readonly order: number
    /** The definition of this ParsedChallengeDefinition. */
    readonly definition: ChallengeDefinition
    /** The grading of this ParsedChallengeDefinition. */
    readonly grading: ChallengeDefinitionGrading
}

/** The server-only grading of one challenge in one locale: the rubric fields plus the raw submission document. */
export interface ChallengeGrading extends ChallengeDefinitionGrading, ChallengeSubmissionGrading {
    /** The sha256 of this ChallengeGrading. */
    readonly sha256: string
    /** The raw of this ChallengeGrading. */
    readonly raw: string
}

/** A server-side published lesson variant: the raw body bytes with the indexes derived from them. */
export interface PublishedVariant {
    /** The raw of this PublishedVariant. */
    readonly raw: Uint8Array
    /** The index of this PublishedVariant. */
    readonly index: ArticleIndex
    /** The sha256 of this PublishedVariant. */
    readonly sha256: string
}

/** One published challenge: its ordered id and public definitions by locale. */
export interface PublishedChallenge {
    /** The id of this PublishedChallenge. */
    readonly id: string
    /** The order of this PublishedChallenge. */
    readonly order: number
    /** The definitions of this PublishedChallenge. */
    readonly definitions: Readonly<Record<LessonLocale, ChallengeDefinition>>
}

/** An immutable published version of one lesson; stays on the server and is only read through projections. */
export interface PublishedLesson {
    /** The content id of this PublishedLesson. */
    readonly contentId: string
    /** The version of this PublishedLesson. */
    readonly version: string
    /** The source hash of this PublishedLesson. */
    readonly sourceHash: string
    /** The metadata of this PublishedLesson. */
    readonly metadata: Readonly<Record<LessonLocale, LessonMetadata>>
    /** The variants of this PublishedLesson. */
    readonly variants: Readonly<Record<string, PublishedVariant>>
    /** The challenges of this PublishedLesson. */
    readonly challenges: ReadonlyArray<PublishedChallenge>
}

/** The server-only text of one original interview question. */
export interface InterviewGrading {
    /** The item id of this InterviewGrading. */
    readonly itemId: string
    /** The interviewer points of this InterviewGrading. */
    readonly interviewerPoints: string
    /** The sample answer of this InterviewGrading. */
    readonly sampleAnswer: string
}

/** Everything withheld from public projections for one lesson version; read only by the coach. */
export interface ProtectedGrading {
    /** The content id of this ProtectedGrading. */
    readonly contentId: string
    /** The version of this ProtectedGrading. */
    readonly version: string
    /** The interviews of this ProtectedGrading. */
    readonly interviews: Readonly<Record<string, ReadonlyArray<InterviewGrading>>>
    /** The challenges of this ProtectedGrading. */
    readonly challenges: Readonly<Record<string, ChallengeGrading>>
}

/** One interview item's interviewer points, without its protected sample answer. */
export interface CoachInterviewPoints {
    /** The stable item id of this CoachInterviewPoints. */
    readonly itemId: string
    /** The interviewer points used to grade this item. */
    readonly interviewerPoints: string
}

/** One criterion from a challenge rubric in the selected programming language. */
export interface CoachChallengeCriterion {
    /** The rubric body for the selected programming language. */
    readonly body: string
    /** The score weight of this criterion. */
    readonly score: number
    /** Whether this criterion is critical. */
    readonly critical: boolean
}

/** The grading rubric of one challenge, with only the selected locale and language's criteria. */
export interface CoachChallengeRubric {
    /** The source challenge id. */
    readonly challengeId: string
    /** The required submission type. */
    readonly submissionType: string
    /** The requested submission title. */
    readonly submissionTitle: string
    /** The requested submission description. */
    readonly submissionDescription: string
    /** The maximum score for the requested submission. */
    readonly submissionScore: number
    /** Criteria describing the required outcome. */
    readonly outcomeCriteria: ReadonlyArray<CoachChallengeCriterion>
    /** Criteria describing the acceptable approach. */
    readonly approachCriteria: ReadonlyArray<CoachChallengeCriterion>
}

/** Protected grading the coach may use for one published variant; contains no sample answers or source documents. */
export interface CoachGrading {
    /** The lesson content id. */
    readonly contentId: string
    /** The immutable lesson version. */
    readonly version: string
    /** The selected display locale. */
    readonly locale: LessonLocale
    /** The selected programming language. */
    readonly programmingLanguage: ProgrammingLanguage
    /** The interviewer points for each interview prompt in this variant. */
    readonly interviewPoints: ReadonlyArray<CoachInterviewPoints>
    /** The rubric for each challenge in the selected locale and language. */
    readonly challenges: ReadonlyArray<CoachChallengeRubric>
}

/** Whether the learner may read the whole article or only its first section. */
export type LessonAccess = "allowed" | "locked"

/** One public interview prompt of the lesson; the server issues `promptVersion`. */
export interface StepPrompt {
    /** The step id of this StepPrompt. */
    readonly stepId: string
    /** The item id of this StepPrompt. */
    readonly itemId: string
    /** The prompt version of this StepPrompt. */
    readonly promptVersion: string
    /** The kind of this StepPrompt. */
    readonly kind: string
    /** The prompt of this StepPrompt. */
    readonly prompt: string
    /** The required fields of this StepPrompt. */
    readonly requiredFields: ReadonlyArray<string>
}

/** The public challenge prompt in one language: source title, description, difficulty, requirement and prerequisite. */
export interface ChallengePrompt {
    /** The id of this ChallengePrompt. */
    readonly id: string
    /** The title of this ChallengePrompt. */
    readonly title: string
    /** The description of this ChallengePrompt. */
    readonly description: string
    /** The difficulty of this ChallengePrompt. */
    readonly difficulty: ChallengeDifficulty
    /** The requirements of this ChallengePrompt. */
    readonly requirements: ReadonlyArray<ChallengeRequirement>
    /** The prerequisites of this ChallengePrompt. */
    readonly prerequisites: ReadonlyArray<string>
}

/** The explicit allowlist projection a learner may read; never carries grading material. */
export interface PublicLesson {
    /** The id of this PublicLesson. */
    readonly id: string
    /** The version of this PublicLesson. */
    readonly version: string
    /** The locale of this PublicLesson. */
    readonly locale: LessonLocale
    /** The programming language of this PublicLesson. */
    readonly programmingLanguage: ProgrammingLanguage
    /** The title of this PublicLesson. */
    readonly title: string
    /** The description of this PublicLesson. */
    readonly description: string
    /** The minutes read of this PublicLesson. */
    readonly minutesRead: number
    /** The is premium of this PublicLesson. */
    readonly isPremium: boolean
    /** The verified at of this PublicLesson. */
    readonly verifiedAt: string | null
    /** The available locales of this PublicLesson. */
    readonly availableLocales: ReadonlyArray<LessonLocale>
    /** The programming languages of this PublicLesson. */
    readonly programmingLanguages: ReadonlyArray<ProgrammingLanguage>
    /** The access of this PublicLesson. */
    readonly access: LessonAccess
    /** The outline of this PublicLesson. */
    readonly outline: ReadonlyArray<OutlineEntry>
    /** The article of this PublicLesson. */
    readonly article: string
    /** The step prompts of this PublicLesson. */
    readonly stepPrompts: ReadonlyArray<StepPrompt>
    /** The challenge prompts of this PublicLesson. */
    readonly challengePrompts: ReadonlyArray<ChallengePrompt>
}

/** What a learner who answered an interview question may see about it. */
export interface InterviewReveal {
    /** The item id of this InterviewReveal. */
    readonly itemId: string
    /** The interviewer points of this InterviewReveal. */
    readonly interviewerPoints: string
    /** The sample answer of this InterviewReveal. */
    readonly sampleAnswer: string
}

/** The parameters of an Academy snapshot import. */
export interface ImportLessonsParams {
    /** The fixture directory that holds the versioned `manifest.json` and its referenced original files; the settled fixture when undefined. */
    readonly fixtureDir: string | undefined
}

/** The parameters of a public read. */
export interface ReadLessonParams {
    /** The content id of this ReadLessonParams. */
    readonly contentId: string
    /** The version of this ReadLessonParams. */
    readonly version?: string
    /** The locale of this ReadLessonParams. */
    readonly locale: LessonLocale
    /** The programming language of this ReadLessonParams. */
    readonly programmingLanguage: ProgrammingLanguage
    /** The access of this ReadLessonParams. */
    readonly access: LessonAccess
}

/** The parameters of a per-item interview reveal; the coach passes the items the learner has persisted an answer for. */
export interface RevealInterviewParams {
    /** The content id of this RevealInterviewParams. */
    readonly contentId: string
    /** The version of this RevealInterviewParams. */
    readonly version: string
    /** The programming language of this RevealInterviewParams. */
    readonly programmingLanguage: ProgrammingLanguage
    /** The locale of this RevealInterviewParams. */
    readonly locale: LessonLocale
    /** The item id of this RevealInterviewParams. */
    readonly itemId: string
    /** The answered item ids of this RevealInterviewParams. */
    readonly answeredItemIds: ReadonlyArray<string>
}

/** The selector for protected coach grading of one published lesson variant. */
export interface GradingForParams {
    /** The content id of this GradingForParams. */
    readonly contentId: string
    /** The immutable version of this GradingForParams. */
    readonly version: string
    /** The locale of this GradingForParams. */
    readonly locale: LessonLocale
    /** The programming language of this GradingForParams. */
    readonly programmingLanguage: ProgrammingLanguage
}

/** What an import reports: counts, version and hashes, never answer keys. */
export interface ImportReport {
    /** The content id of this ImportReport. */
    readonly contentId: string
    /** The version of this ImportReport. */
    readonly version: string
    /** The status of this ImportReport. */
    readonly status: "published" | "unchanged"
    /** The source hash of this ImportReport. */
    readonly sourceHash: string
    /** The variants of this ImportReport. */
    readonly variants: number
    /** The locales of this ImportReport. */
    readonly locales: number
    /** The challenges of this ImportReport. */
    readonly challenges: number
    /** The protected interview items of this ImportReport. */
    readonly protectedInterviewItems: number
    /** The file hashes of this ImportReport. */
    readonly fileHashes: Readonly<Record<string, string>>
}

/** The store key of a variant. */
export const variantKey = (programmingLanguage: ProgrammingLanguage, locale: LessonLocale): string =>
    `${programmingLanguage}:${locale}`

/** The store key of one challenge grading record: the challenge id plus the locale it was written in. */
export const challengeKey = (challengeId: string, locale: LessonLocale): string => `${challengeId}:${locale}`
