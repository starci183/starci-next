import type { HarnessLocale, HarnessTool } from "@modules/domain/harness"

/** What a harness read that takes only the locale is asked. */
export interface HarnessLocaleRequest {
    /** The locale of the texts. */
    readonly locale: HarnessLocale
}

/** What the build query is asked. */
export interface HarnessBuildRequest extends HarnessLocaleRequest {
    /** The build id. */
    readonly id: string
}

/** What the guides query is asked. */
export interface HarnessGuidesRequest extends HarnessLocaleRequest {
    /** The tool. */
    readonly tool: HarnessTool
}

/** What the guide query is asked. */
export interface HarnessGuideRequest extends HarnessGuidesRequest {
    /** The guide slug. */
    readonly slug: string
}

/** What the doc query is asked. */
export interface HarnessDocRequest extends HarnessLocaleRequest {
    /** The doc slug. */
    readonly slug: string
}

/** What the doctor query is asked. */
export type HarnessDoctorRequest = HarnessGuidesRequest

/** What the trials query is asked. */
export interface HarnessTrialsRequest extends HarnessLocaleRequest {
    /** One tool, or null for every trap. */
    readonly tool: HarnessTool | null
}

/** What binding a build to a project is asked. */
export interface BindHarnessBuildRequest {
    /** The build. */
    readonly buildId: string
    /** The learner agent project whose CI proves it. */
    readonly projectId: string
}
