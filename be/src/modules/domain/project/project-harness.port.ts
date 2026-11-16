import { injector, type TypedParameterDecorator } from "@modules/platform/composition"

/** One e2e result a signed CI run reports for a harness build stage. */
export interface CiHarnessResult {
    /** The harness build id. */
    readonly build: string
    /** The stage id. */
    readonly stage: string
    /** The e2e test id. */
    readonly e2e: string
    /** Whether it passed. */
    readonly passed: boolean
}

/** What a recorded CI run tells the harness: the project and its learner, the run, and whether GitHub attested it. */
export interface HarnessCiRun {
    /** The project that posted the run. */
    readonly projectId: string
    /** The learner who owns the project. */
    readonly learnerId: string
    /** The CI run id. */
    readonly runId: string
    /** The commit it tested. */
    readonly commit: string
    /** Whether GitHub attested the run (OIDC); a signed-only run is practice and the harness records nothing. */
    readonly attested: boolean
    /** The harness results of the run. */
    readonly results: ReadonlyArray<CiHarnessResult>
}

/**
 * The port through which a recorded CI run reaches the harness capability (stage e2e proof of /harness builds). The project
 * capability owns the signed delivery and the attestation; the harness decides which results of an attested run count. Until the
 * app binds the harness, `NoHarnessClient` ignores the results.
 */
export interface ProjectHarnessPort {
    /** Hands the harness results of one recorded run over. */
    recordRun(run: HarnessCiRun): Promise<void>
}

/** Token of the harness port. */
export const PROJECT_HARNESS: unique symbol = Symbol("domain.project.harness")

/** Injects the harness port. Parameter type: ProjectHarnessPort. */
export const InjectProjectHarness = (): TypedParameterDecorator<ProjectHarnessPort> =>
    injector<ProjectHarnessPort>(PROJECT_HARNESS)
