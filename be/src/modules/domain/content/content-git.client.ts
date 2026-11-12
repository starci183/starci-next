import { createHash } from "node:crypto"
import { execFile } from "node:child_process"
import { access, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { promisify } from "node:util"
import { ContentError, ContentErrorCode } from "./errors/content.error"
import type { ContentEnvironment, InheritedVariables, SnapshotManifest } from "./content.contracts"
import type { ContentGitReader, MaterializeParams, MaterializedSnapshot } from "./content-git.port"

const run = promisify(execFile)

const GIT_BUFFER = 256 * 1024 * 1024

const exists = (path: string): Promise<boolean> =>
    access(path).then(
        () => true,
        () => false,
    )

/** The repository URL without any credential, for the manifest and the log. */
export const bareUrlOf = (url: string): string => {
    if (!URL.canParse(url)) return url
    const parsed = new URL(url)
    parsed.username = ""
    parsed.password = ""
    return parsed.toString()
}

/** Orders names by code unit, the order of a default sort, so a hash over them does not depend on the locale. */
const byCodeUnit = (a: string, b: string): number => Number(a > b) - Number(a < b)

const environmentOf = (inherited: InheritedVariables, params: MaterializeParams): NodeJS.ProcessEnv => {
    const base: NodeJS.ProcessEnv = { ...inherited, GIT_TERMINAL_PROMPT: "0" }
    const token = params.config.token
    if (token === null) return base
    const basic = Buffer.from(`x-access-token:${token.reveal()}`).toString("base64")
    return {
        ...base,
        GIT_CONFIG_COUNT: "1",
        GIT_CONFIG_KEY_0: "http.extraHeader",
        GIT_CONFIG_VALUE_0: `Authorization: Basic ${basic}`,
    }
}

const git = async (args: ReadonlyArray<string>, env: NodeJS.ProcessEnv, cwd?: string): Promise<string> => {
    const { stdout } = await run("git", [...args], { env, cwd, maxBuffer: GIT_BUFFER, windowsHide: true })
    return stdout.trim()
}

const step = async <T>(params: MaterializeParams, name: string, action: () => Promise<T>): Promise<T> => {
    try {
        return await action()
    } catch (cause) {
        throw new ContentError({
            code: ContentErrorCode.PullFailed,
            params: { source: params.source, step: name },
            cause,
        })
    }
}

const materialize = async (inherited: InheritedVariables, params: MaterializeParams): Promise<MaterializedSnapshot> => {
    const { source, config, datasourcesDir } = params
    const env = environmentOf(inherited, params)
    const mirror = join(datasourcesDir, ".mirror", source)
    await mkdir(join(datasourcesDir, ".mirror"), { recursive: true })
    if (await exists(join(mirror, "HEAD"))) {
        await step(params, "fetch", () =>
            git(
                [
                    "--git-dir",
                    mirror,
                    "fetch",
                    "--quiet",
                    "--prune",
                    "--force",
                    "origin",
                    "+refs/heads/*:refs/heads/*",
                    "+refs/tags/*:refs/tags/*",
                ],
                env,
            ),
        )
    } else {
        await step(params, "clone", () => git(["clone", "--bare", "--quiet", config.url, mirror], env))
    }
    const ref = config.ref ?? "HEAD"
    const sha = await step(params, "resolve", () =>
        git(["--git-dir", mirror, "rev-parse", "--verify", `${ref}^{commit}`], env),
    )
    const directory = join(datasourcesDir, sha)
    const snapshot = { source, sha, directory }
    if (await exists(join(directory, "manifest.json"))) return { snapshot, created: false }
    const staging = join(datasourcesDir, `.staging-${sha}-${process.pid}`)
    const index = `${staging}.index`
    await rm(staging, { recursive: true, force: true })
    await mkdir(staging, { recursive: true })
    await step(params, "checkout", () =>
        git(["--git-dir", mirror, "--work-tree", staging, "checkout", "--force", sha, "--", "."], {
            ...env,
            GIT_INDEX_FILE: index,
        }),
    )
    const manifest: SnapshotManifest = {
        schema: "starci-next/datasource-snapshot@1",
        source,
        url: bareUrlOf(config.url),
        ref,
        sha,
        fetchedAt: params.now,
    }
    await writeFile(join(staging, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`)
    await rm(index, { force: true })
    await rm(directory, { recursive: true, force: true })
    await rename(staging, directory)
    return { snapshot, created: true }
}

const treeHashOf = async (directory: string, env: NodeJS.ProcessEnv): Promise<string> => {
    const listed = await git(["ls-files", "-z", "--cached", "--others", "--exclude-standard"], env, directory)
    const names = listed
        .split("\0")
        .filter((name) => name !== "")
        .sort(byCodeUnit)
    const files = await Promise.all(
        names.map((name) =>
            readFile(join(directory, name)).then(
                (bytes) => ({ name, bytes }),
                () => ({ name, bytes: Buffer.alloc(0) }),
            ),
        ),
    )
    const hash = createHash("sha256")
    for (const { name, bytes } of files) hash.update(`${name}\0`).update(bytes).update("\0")
    return hash.digest("hex").slice(0, 8)
}

const labelOf = async (directory: string, env: NodeJS.ProcessEnv): Promise<string> => {
    const head = await git(["rev-parse", "--short=9", "HEAD"], env, directory)
    const dirty = await git(["status", "--porcelain"], env, directory)
    return dirty === "" ? head : `${head}-dirty-${await treeHashOf(directory, env)}`
}

/**
 * Pulls git repositories with the git binary: a bare mirror per repository, and one directory per commit. `inherited` is the
 * environment the git processes start from.
 */
export const contentGitOf = (environment: ContentEnvironment): ContentGitReader => {
    const inherited = environment.read()
    return {
        materialize: (params) => materialize(inherited, params),
        fingerprint: (directory) =>
            labelOf(directory, { ...inherited, GIT_TERMINAL_PROMPT: "0" }).then(
                (label) => label,
                () => "local",
            ),
    }
}
