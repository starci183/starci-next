import type { EnvSource } from "@modules/platform/config"
import type { ContentEnvironment, ContentGitConfig, ContentSourceConfig } from "./content.contracts"
import type { ContentOptions } from "./content.options"

const sourceOf = (env: EnvSource, prefix: string): ContentSourceConfig => ({
    url: env.url(`${prefix}_GIT_URL`),
    ref: env.optional(`${prefix}_GIT_REF`) ?? null,
    token: env.has(`${prefix}_GIT_TOKEN`) ? env.secret(`${prefix}_GIT_TOKEN`) : null,
})

/**
 * Reads the git mount an environment declares. `CONTENT_GIT_URL` (with optional `CONTENT_GIT_REF`, a branch, tag or pinned sha, and
 * the sealed secret `CONTENT_GIT_TOKEN`) names the content repository; `CONTENT_DATA_GIT_URL`, `CONTENT_DATA_GIT_REF` and
 * `CONTENT_DATA_GIT_TOKEN` name the teacher's data repository; `CONTENT_DATASOURCES_DIR` is where versioned snapshots live. With
 * none of them the capability composes without a git mount and a sync needs local directories; with some, the rest are required.
 */
export const parseContentConfig = (env: EnvSource): Pick<ContentOptions, "environment" | "git"> => {
    const keys = ["CONTENT_GIT_URL", "CONTENT_DATA_GIT_URL", "CONTENT_DATASOURCES_DIR"]
    const environment: ContentEnvironment = { read: () => env.inherited() }
    if (!env.anyDeclared(keys)) return { git: null, environment }
    const git: ContentGitConfig = {
        datasourcesDir: env.string("CONTENT_DATASOURCES_DIR"),
        content: sourceOf(env, "CONTENT"),
        data: env.has("CONTENT_DATA_GIT_URL") ? sourceOf(env, "CONTENT_DATA") : null,
    }
    return { git, environment }
}
