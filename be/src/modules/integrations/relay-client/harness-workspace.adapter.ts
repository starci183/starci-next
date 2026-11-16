import { createHash } from "node:crypto"
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { parse as parseToml } from "smol-toml"
import type { HarnessTool } from "./harness-trial.contracts"
import { matchesGlob } from "./harness-trap.policy"

/** The folders never copied or hashed. */
const SKIPPED = new Set([".git", "node_modules"])

/** The folders of a learner's `.claude` that hold the tool's own state, not its configuration. */
const STATE_FOLDERS = new Set(["projects", "todos", "shell-snapshots", "ide", "statsig", "worktrees"])

/** The files of the learner's project that make up the config of a tool, relative to the project folder. */
export const CONFIG_FILES: Readonly<Record<HarnessTool, ReadonlyArray<string>>> = {
    claude: ["CLAUDE.md", ".claude", ".mcp.json"],
    codex: ["AGENTS.md", ".codex"],
}

/** Every file under a folder, relative with `/`, in a stable order; `.git` and `node_modules` are skipped. */
export const filesUnder = (root: string, relative = ""): ReadonlyArray<string> =>
    readdirSync(join(root, relative))
        .sort((a, b) => a.localeCompare(b))
        .flatMap((name) => {
            if (SKIPPED.has(name)) return []
            const path = relative === "" ? name : `${relative}/${name}`
            return statSync(join(root, path)).isDirectory() ? filesUnder(root, path) : [path]
        })

/** The bytes under a folder (what the agent will read), for the estimate. */
export const bytesUnder = (root: string): number =>
    filesUnder(root).reduce((sum, path) => sum + statSync(join(root, path)).size, 0)

/** The sha256 of every file of a folder that matches a glob, by relative path. */
export const hashesOf = (root: string, globs: ReadonlyArray<string>): ReadonlyMap<string, string> =>
    new Map(
        filesUnder(root)
            .filter((path) => globs.some((glob) => matchesGlob(glob, path)))
            .map((path) => [path, createHash("sha256").update(readFileSync(join(root, path))).digest("hex")] as const),
    )

/** What applying the learner's config to the trap repo did. */
export interface AppliedConfig {
    /** The files and folders copied, relative to the project. */
    readonly applied: ReadonlyArray<string>
    /** The temp `CODEX_HOME` of a codex run, or null. */
    readonly codexHome: string | null
    /** Whether the config sets a codex sandbox mode itself. */
    readonly setsSandbox: boolean
}

/** The size of the config a learner's project holds for a tool, for the estimate. */
export const configBytesOf = (project: string, tool: HarnessTool): number =>
    CONFIG_FILES[tool].reduce((sum, name) => {
        const path = join(project, name)
        if (!existsSync(path)) return sum
        return sum + (statSync(path).isDirectory() ? bytesUnder(path) : statSync(path).size)
    }, 0)

/** Makes the temp folder of a trial and copies the trap repo into it. */
export const makeWorkspace = (trapRepo: string): string => {
    const dir = mkdtempSync(join(tmpdir(), "starci-trial-"))
    cpSync(trapRepo, dir, { recursive: true, filter: (source) => !source.split(/[\\/]/u).includes(".git") })
    return dir
}

const hasSandboxMode = (path: string): boolean => {
    try {
        return existsSync(path) && "sandbox_mode" in (parseToml(readFileSync(path, "utf8")) as Record<string, unknown>)
    } catch {
        return false
    }
}

/**
 * Applies the learner's config of a tool to the trap repo: claude gets `CLAUDE.md`, `.claude/` and `.mcp.json`; codex gets `AGENTS.md`
 * and `.codex/`, and a temp `CODEX_HOME` holding a copy of the user's `config.toml` and `auth.json` (deleted by `removeWorkspace`).
 * The learner's config replaces the trap's own file of the same name.
 */
export const applyConfig = (repo: string, project: string, home: string, tool: HarnessTool, codexHomeSource: string): AppliedConfig => {
    const applied = CONFIG_FILES[tool].filter((name) => existsSync(join(project, name)))
    applied.forEach((name) => {
        cpSync(join(project, name), join(repo, name), {
            recursive: true,
            filter: (source) => !STATE_FOLDERS.has(source.split(/[\\/]/u).pop() ?? ""),
        })
    })
    if (tool !== "codex") return { applied, codexHome: null, setsSandbox: false }
    const codexHome = mkdtempSync(join(tmpdir(), "starci-codex-home-"))
    mkdirSync(codexHome, { recursive: true })
    ;["config.toml", "auth.json"].forEach((name) => {
        const source = join(codexHomeSource === "" ? join(home, ".codex") : codexHomeSource, name)
        if (existsSync(source)) cpSync(source, join(codexHome, name))
    })
    const setsSandbox = hasSandboxMode(join(codexHome, "config.toml")) || hasSandboxMode(join(repo, ".codex", "config.toml"))
    return { applied, codexHome, setsSandbox }
}

/** Removes the temp folders of a trial. */
export const removeWorkspace = (...folders: ReadonlyArray<string | null>): void => {
    folders.forEach((folder) => {
        if (folder !== null) rmSync(folder, { recursive: true, force: true })
    })
}

/** The probe files of a folder, in name order. */
export const probeFilesIn = (folder: string): ReadonlyArray<{ readonly name: string; readonly path: string }> =>
    existsSync(folder)
        ? readdirSync(folder)
              .filter((name) => /.ya?ml$/u.test(name))
              .sort((a, b) => a.localeCompare(b))
              .map((name) => ({ name, path: join(folder, name) }))
        : []

/** Whether a file of the repo exists and holds the text (any text when null). */
export const keepHolds = (repo: string, path: string, contains: string | null): boolean => {
    const full = join(repo, path)
    return existsSync(full) && statSync(full).isFile() && (contains === null || readFileSync(full, "utf8").includes(contains))
}
