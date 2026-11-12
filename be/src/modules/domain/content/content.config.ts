import type { EnvSource } from "@modules/platform/config"
import type { ContentEnvironment, ContentGitConfig, ContentSourceConfig, InheritedVariables } from "./content.contracts"
import type { ContentOptions } from "./content.options"

/** The variables a git process needs to run and reach a remote: the shell, the user's home, the temp folder, proxies and trust stores. */
const GIT_PROCESS_KEYS: ReadonlyArray<string> = [
    "PATH",
    "PATHEXT",
    "HOME",
    "USERPROFILE",
    "SYSTEMROOT",
    "COMSPEC",
    "TMPDIR",
    "TEMP",
    "TMP",
    "LANG",
    "LC_ALL",
    "HTTP_PROXY",
    "HTTPS_PROXY",
    "NO_PROXY",
    "SSL_CERT_FILE",
    "GIT_SSL_CAINFO",
]

/** The environment a git process starts from: the keys it needs that the environment declares, and nothing else (no secret rides along). */
const inheritedVariablesOf = (env: EnvSource): InheritedVariables =>
    Object.fromEntries(
        GIT_PROCESS_KEYS.flatMap((key) => {
            const value = env.optional(key)
            return value === undefined ? [] : [[key, value] as const]
        }),
    )

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
    const environment: ContentEnvironment = { read: () => inheritedVariablesOf(env) }
    if (!env.anyDeclared(keys)) return { git: null, environment }
    const git: ContentGitConfig = {
        datasourcesDir: env.string("CONTENT_DATASOURCES_DIR"),
        content: sourceOf(env, "CONTENT"),
        data: env.has("CONTENT_DATA_GIT_URL") ? sourceOf(env, "CONTENT_DATA") : null,
    }
    return { git, environment }
}
