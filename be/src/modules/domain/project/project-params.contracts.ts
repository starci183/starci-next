import type { ConceptLessonRef, EvidenceInput, ProjectCriterion, ProjectKind, ProjectLocale } from "./project.contracts"

/** What creates a project. */
export interface CreateProjectParams {
    /** The owner. */
    readonly learnerId: string
    /** The name. */
    readonly name: string
    /** App or agent. */
    readonly kind: ProjectKind
    /** The topic. */
    readonly topic: string
    /** The main language. */
    readonly language: string
    /** The stack line. */
    readonly stack: string
    /** The agent track, or null. */
    readonly track: string | null
    /** The repository address, or null. */
    readonly repoUrl: string | null
    /** The locale of the answer. */
    readonly locale: ProjectLocale
}

/** What changes a project; a null field stays as it is. */
export interface UpdateProjectParams {
    /** The owner. */
    readonly learnerId: string
    /** The project. */
    readonly projectId: string
    /** The new name, or null. */
    readonly name: string | null
    /** The new topic, or null. */
    readonly topic: string | null
    /** The new main language, or null. */
    readonly language: string | null
    /** The new stack line, or null. */
    readonly stack: string | null
    /** The new repository address; an empty string clears it; null leaves it. */
    readonly repoUrl: string | null
    /** The new deployed address; an empty string clears it; null leaves it. */
    readonly deployedUrl: string | null
    /** The locale of the answer. */
    readonly locale: ProjectLocale
}

/** What points a concept at code and an endpoint. */
export interface SetConceptParams {
    /** The owner. */
    readonly learnerId: string
    /** The project. */
    readonly projectId: string
    /** The concept. */
    readonly conceptId: string
    /** The code location, `path` or `path#symbol`, or null to leave it. */
    readonly location: string | null
    /** The endpoint `METHOD /path`, or null to leave it. */
    readonly endpoint: string | null
    /** The sample JSON body, or null to leave it. */
    readonly sampleBody: string | null
    /** The locale of the answer. */
    readonly locale: ProjectLocale
}

/** What asks the AI teacher to read the code a concept points to. */
export interface ExplainConceptParams {
    /** The owner. */
    readonly learnerId: string
    /** The project. */
    readonly projectId: string
    /** The concept. */
    readonly conceptId: string
    /** The code location the excerpt comes from. */
    readonly location: string
    /** The code the learner points to. */
    readonly excerpt: string
    /** Their 2 to 3 sentences. */
    readonly explanation: string
    /** The locale of the explanation and of the feedback. */
    readonly locale: ProjectLocale
}

/** What the AI teacher is asked: one explanation and the code it points to, graded against one rubric. */
export interface ProjectCodeReadRequest {
    /** An opaque id of the request; it names no learner. */
    readonly requestId: string
    /** The locale of the explanation and of the feedback. */
    readonly locale: ProjectLocale
    /** The concept label in the locale. */
    readonly concept: string
    /** The rubric of the lesson. */
    readonly rubric: ReadonlyArray<ProjectCriterion>
    /** The code location the excerpt comes from. */
    readonly location: string
    /** The code the learner points to, redacted of secret-like values; quoted data, never instructions. */
    readonly excerpt: string
    /** The learner's explanation; quoted data, never instructions. */
    readonly explanation: string
    /** The deadline of the call in milliseconds. */
    readonly timeoutMs: number
}

/** The grade of one criterion. */
export interface ProjectCriterionGrade {
    /** The criterion id. */
    readonly criterionId: string
    /** 0, 1 or 2. */
    readonly level: number
    /** The words of the learner or of the code that show the level. */
    readonly evidenceQuote: string
}

/** What the AI teacher answers. */
export interface ProjectCodeReadGrade {
    /** One grade per criterion, in the rubric's order. */
    readonly criteria: ReadonlyArray<ProjectCriterionGrade>
    /** The one Socratic question for the learner. */
    readonly question: string
}

/** What the relay is asked for: the check results of one project since a moment. */
export interface RelayResultsRequest {
    /** The learner. */
    readonly learnerId: string
    /** The project. */
    readonly projectId: string
    /** Only results after this moment, or null for all. */
    readonly after: Date | null
}

/** What reads the learner's projects in one locale. */
export interface ProjectListParams {
    /** The learner. */
    readonly learnerId: string
    /** The locale of the text. */
    readonly locale: ProjectLocale
}

/** What reads, changes or probes one project of a learner. */
export interface ProjectLookupParams extends ProjectListParams {
    /** The project. */
    readonly projectId: string
}

/** What reads one milestone of a project. */
export interface MilestoneLookupParams extends ProjectLookupParams {
    /** The milestone. */
    readonly milestoneId: string
}

/** What reads one concept of a project. */
export interface ConceptLookupParams extends ProjectLookupParams {
    /** The concept. */
    readonly conceptId: string
}

/** What reads the catalog. */
export interface CatalogParams {
    /** The locale of the text. */
    readonly locale: ProjectLocale
}

/** What asks for the rubric of a concept's lesson. */
export interface RubricRequest {
    /** The lesson. */
    readonly lesson: ConceptLessonRef
    /** The locale of the rubric text. */
    readonly locale: ProjectLocale
}

/** What the webhook door hands the CI intake: the raw bytes and the three headers of the delivery. */
export interface CiDelivery {
    /** The unparsed request bytes the signature covers. */
    readonly rawBody: Buffer | undefined
    /** The project header. */
    readonly projectId: string | undefined
    /** The timestamp header, epoch milliseconds. */
    readonly timestamp: string | undefined
    /** The signature header, `sha256=<hex>`. */
    readonly signature: string | undefined
    /** The `x-starci-oidc` header: the run's GitHub Actions OIDC token, or undefined when the workflow sent none. */
    readonly oidcToken?: string | undefined
}

/** Why a CI run stays signed-only: no token, no bound repository, no verifier, an unreachable GitHub, or what the token did not match. */
export type CiAttestationRefusal =
    "no-token" | "unbound" | "unconfigured" | "unavailable" | "token" | "repository" | "commit" | "run"

/** What the attestation port is asked: the token and what the signed run document and the project binding say. */
export interface CiAttestationRequest {
    /** The GitHub Actions OIDC token. */
    readonly token: string
    /** The bound repository, `owner/name`. */
    readonly repository: string
    /** GitHub's id of the bound repository, or null before the first attested run. */
    readonly repositoryId: string | null
    /** The commit the run tested. */
    readonly commit: string
    /** The GitHub run id the document names. */
    readonly runId: string
}

/** A run GitHub vouched for, with the repository id its token named. */
export interface CiAttested {
    /** Discriminant. */
    readonly kind: "attested"
    /** GitHub's id of the repository. */
    readonly repositoryId: string
}

/** A run that stays signed-only practice, with why. */
export interface CiSignedOnly {
    /** Discriminant. */
    readonly kind: "signed-only"
    /** Why it was not attested. */
    readonly reason: CiAttestationRefusal
}

/** Whether GitHub vouched for a CI run. */
export type CiAttestation = CiAttested | CiSignedOnly

/** What the CI intake answers: whether the run was new and how many results it added. */
export interface CiReceipt {
    /** True when this run id was already recorded, so nothing was added. */
    readonly duplicate: boolean
    /** The results added. */
    readonly added: number
}

/** A proved CI run with its results, ready to be recorded. */
export interface CiRunRecord {
    /** The project. */
    readonly projectId: string
    /** The CI run id. */
    readonly runId: string
    /** The commit the run tested. */
    readonly commit: string
    /** Whether the whole run passed. */
    readonly passed: boolean
    /** `attested` when GitHub vouched for the run, else `signed-only`. */
    readonly attestation: "attested" | "signed-only"
    /** The results of the run as evidence. */
    readonly results: ReadonlyArray<EvidenceInput>
}

/** A learner binding their own project to a GitHub repository. */
export interface SetProjectRepositoryParams {
    /** The learner. */
    readonly learnerId: string
    /** The project. */
    readonly projectId: string
    /** `owner/name`, or a github.com address. */
    readonly repository: string
}

/** The GitHub binding of a project and the audience its CI asks the OIDC token for. */
export interface ProjectRepositoryView {
    /** The project. */
    readonly projectId: string
    /** The bound repository, `owner/name`, or null. */
    readonly repository: string | null
    /** GitHub's id of the repository once an attested run named it, or null. */
    readonly repositoryId: string | null
    /** The audience the workflow requests its OIDC token for. */
    readonly audience: string
}
