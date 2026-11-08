import type { ContentEnvironment, ContentGitConfig } from "./content.contracts"

/** Options of the content capability. */
export interface ContentOptions {
    /** Whether this capability is available app-wide. */
    readonly isGlobal?: boolean
    /** The git mount the environment declares, or null when it declares none (a sync then needs local directories). */
    readonly git: ContentGitConfig | null
    /** The environment the git processes start from. */
    readonly environment: ContentEnvironment
}
